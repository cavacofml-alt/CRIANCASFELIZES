import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { VERSAO_TERMOS_ATUAL } from "@/lib/consentimento";

/** Rotas acessíveis sem sessão iniciada. */
const ROTAS_PUBLICAS = ["/", "/login"];

/** Rota onde se aceita o consentimento — tem de ficar acessível mesmo
 * a quem ainda não aceitou, senão nunca lá chegaria. */
const ROTA_CONSENTIMENTO = "/consentimento";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // getUser() revalida o token no servidor Supabase. Nunca usar
  // getSession() para decidir autorização: o cookie é manipulável pelo
  // cliente, o token verificado não.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const rotaPublica = ROTAS_PUBLICAS.includes(request.nextUrl.pathname);

  if (!user && !rotaPublica) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Com sessão, mas sem ter aceitado a versão atual dos termos: bloqueia
  // tudo menos a própria página de consentimento (e o logout).
  if (
    user &&
    !rotaPublica &&
    request.nextUrl.pathname !== ROTA_CONSENTIMENTO
  ) {
    const { data: aceite } = await supabase
      .from("consentimentos_termos")
      .select("id")
      .eq("versao", VERSAO_TERMOS_ATUAL)
      .maybeSingle();

    if (!aceite) {
      const url = request.nextUrl.clone();
      url.pathname = ROTA_CONSENTIMENTO;
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
