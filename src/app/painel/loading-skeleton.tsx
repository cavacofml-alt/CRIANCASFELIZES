/**
 * Mostrado de imediato pelo Next.js enquanto a página seguinte (Server
 * Component) vai buscar dados reais ao Supabase — sem isto, o clique
 * parece "não fazer nada" durante esse instante. Um `loading.tsx` por
 * secção do painel usa isto, o framework trata do resto (Suspense).
 */
export function PainelLoadingSkeleton() {
  return (
    <main className="min-h-screen bg-brand-bg px-4 py-10 dark:bg-brand-bg-dark">
      <div className="mx-auto flex max-w-3xl animate-pulse flex-col gap-8">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-2">
            <div className="h-7 w-48 rounded-full bg-brand-border dark:bg-brand-border-dark" />
            <div className="h-4 w-32 rounded-full bg-brand-border dark:bg-brand-border-dark" />
          </div>
          <div className="h-8 w-16 rounded-full bg-brand-border dark:bg-brand-border-dark" />
        </div>
        <div className="h-9 w-full max-w-md rounded-full bg-brand-border dark:bg-brand-border-dark" />
        <div className="flex flex-col gap-4">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-24 rounded-2xl border border-brand-border bg-brand-surface dark:border-brand-border-dark dark:bg-brand-surface-dark"
            />
          ))}
        </div>
      </div>
    </main>
  );
}
