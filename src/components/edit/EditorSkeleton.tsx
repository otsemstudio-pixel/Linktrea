// Squelette pendant le chargement du profil depuis le store (Phase 4) —
// reprend la forme des sections repliées de l'éditeur plutôt qu'un
// indicateur générique. Les libellés eux-mêmes sont connus à l'avance (ce
// sont les titres des sections, pas des données) donc affichés directement ;
// seule la zone "Identité" (photo + champs) simule un contenu qui charge.
const SECTION_TITLES = ['Identité', 'Publier', 'Positions', 'Compétences', 'Certificats', 'Réseaux', 'Apparence']

export default function EditorSkeleton() {
  return (
    <div className="min-h-dvh bg-ink text-paper font-sans pb-24 lg:pb-10" aria-hidden="true">
      <div className="lg:mx-auto lg:max-w-[1400px] lg:px-8 lg:pt-8">
        <header className="px-4 py-4 flex justify-between items-center border-b border-ink-raised lg:border lg:rounded-lg lg:px-5 lg:mb-4">
          <h1 className="font-medium">Éditeur</h1>
        </header>

        <main className="lg:border lg:rounded-lg">
          <section className="border-b border-ink-raised">
            <div className="min-h-11 flex items-center px-4 py-3">
              <span className="font-medium">Identité</span>
            </div>
            <div className="px-4 pb-5">
              <div className="flex items-center gap-3 mb-5">
                <div className="skeleton size-16 rounded-full" />
                <div className="skeleton h-11 w-32 rounded-md" />
              </div>
              <div className="skeleton h-11 rounded-md mb-4" />
              <div className="skeleton h-11 rounded-md mb-4" />
              <div className="skeleton h-20 rounded-md mb-4" />
            </div>
          </section>

          {SECTION_TITLES.slice(1).map((title) => (
            <section key={title} className="border-b border-ink-raised">
              <div className="min-h-11 flex items-center px-4 py-3">
                <span className="font-medium">{title}</span>
              </div>
            </section>
          ))}
        </main>
      </div>
    </div>
  )
}
