import { Link } from 'react-router-dom'

// Distinct de EmptyState (aucun profil du tout, sur /) : ici quelqu'un a
// visité un lien précis dont le slug n'existe pas ou n'est plus publié —
// le message doit parler de CE lien, pas d'un vide générique.
export default function PublicProfileNotFound() {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center gap-4 px-6 text-center bg-ink text-paper font-sans">
      <p className="text-label uppercase tracking-label text-muted">Ledger</p>
      <h1 className="text-2xl font-semibold">Ce profil n'existe pas</h1>
      <p className="text-sm text-muted max-w-xs">
        Ce lien est introuvable, ou n'est plus publié par son propriétaire.
      </p>
      <Link
        to="/edit"
        className="min-h-11 px-5 inline-flex items-center rounded-md bg-accent text-ink font-medium text-sm active:scale-[0.98] transition-transform focus-visible:outline-2 focus-visible:outline-paper focus-visible:-outline-offset-2"
      >
        Créer mon profil
      </Link>
    </div>
  )
}
