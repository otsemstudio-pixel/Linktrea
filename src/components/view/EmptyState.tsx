import { Link } from 'react-router-dom'

// "Un état vide dit ce qu'il faut faire, il ne s'excuse pas" (plan Phase 3).
export default function EmptyState() {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center gap-4 px-6 text-center bg-ink text-paper font-sans">
      <p className="text-label uppercase tracking-label text-muted">Ledger</p>
      <h1 className="text-2xl font-semibold">Aucun profil pour le moment</h1>
      <p className="text-sm text-muted max-w-xs">
        Créez votre profil pour obtenir votre relevé et le lien à partager.
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
