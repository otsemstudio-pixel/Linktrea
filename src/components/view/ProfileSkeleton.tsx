// Squelette de chargement (Phase 4) — reprend la forme exacte du contenu
// final (cercle pour la photo, anneau pour l'allocation, blocs à la bonne
// hauteur pour les cartes) plutôt qu'un indicateur générique. La latence
// Supabase depuis l'Afrique de l'Ouest est réelle ; ce détail donne une
// impression de rapidité même quand le réseau ne l'est pas.
export default function ProfileSkeleton() {
  return (
    <div className="@container min-h-dvh bg-ink font-sans pb-24 @min-[1024px]:pb-10" aria-hidden="true">
      <div className="@min-[1024px]:mx-auto @min-[1024px]:max-w-[1120px] @min-[1024px]:grid @min-[1024px]:grid-cols-[360px_1fr] @min-[1024px]:items-start @min-[1024px]:gap-10 @min-[1024px]:px-10 @min-[1024px]:pt-10">
        <div className="@min-[1024px]:flex @min-[1024px]:flex-col @min-[1024px]:gap-6">
          {/* En-tête */}
          <div className="bg-ink-raised @min-[1024px]:rounded-lg px-6 pt-10 pb-6 flex flex-col items-center">
            <div className="skeleton size-24 rounded-full" />
            <div className="skeleton h-6 w-44 rounded-md mt-4" />
            <div className="skeleton h-3 w-56 rounded-md mt-3" />
            <div className="skeleton h-9 w-40 rounded-full mt-3" />
            <div className="grid grid-cols-4 gap-2 mt-3 w-full max-w-[280px]">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="skeleton aspect-square rounded-lg" />
              ))}
            </div>
          </div>

          {/* Chiffre clé */}
          <div className="px-6 py-4 @min-[1024px]:px-0">
            <div className="rounded-lg border border-ink-raised p-5">
              <div className="skeleton h-3 w-24 rounded" />
              <div className="skeleton h-11 w-28 rounded-md mt-3" />
              <div className="skeleton h-12 rounded-md mt-3" />
            </div>
          </div>
        </div>

        <div className="@min-[1024px]:min-w-0">
          {/* Allocation : anneau, pas un bloc générique */}
          <div className="px-6 py-6 border-t border-ink-raised @min-[1024px]:border-t-0 @min-[1024px]:px-0">
            <div className="skeleton h-3 w-20 rounded mb-4" />
            <div className="flex items-center gap-6">
              <div className="relative size-44 shrink-0">
                {/* Position en style inline, pas en classe Tailwind
                    "absolute" : la règle .skeleton (position: relative,
                    voir index.css) vit hors des couches Tailwind, donc elle
                    l'emporterait sur la couche "utilities" quelle que soit
                    la spécificité — un style inline gagne toujours. */}
                <div className="skeleton rounded-full" style={{ position: 'absolute', inset: 0 }} />
                <div className="absolute inset-[22px] rounded-full bg-ink" />
              </div>
              <div className="flex flex-col gap-3 flex-1">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="skeleton h-4 rounded" />
                ))}
              </div>
            </div>
          </div>

          {/* Positions */}
          <div className="px-6 py-6 border-t border-ink-raised @min-[1024px]:px-0">
            <div className="skeleton h-3 w-40 rounded mb-4" />
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="skeleton h-32 rounded-lg mb-3" />
            ))}
          </div>

          {/* Certificats */}
          <div className="px-6 py-6 border-t border-ink-raised @min-[1024px]:px-0">
            <div className="skeleton h-3 w-28 rounded mb-4" />
            <div className="flex gap-3">
              <div className="skeleton h-32 w-56 rounded-lg shrink-0" />
              <div className="skeleton h-32 w-56 rounded-lg shrink-0" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
