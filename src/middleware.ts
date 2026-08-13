import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Todas as rotas exceto ficheiros estáticos, imagens, e os
     * ficheiros públicos da PWA (manifest.json, sw.js — têm de
     * carregar sem autenticação, senão o browser não consegue
     * instalar a app nem registar o service worker).
     */
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
