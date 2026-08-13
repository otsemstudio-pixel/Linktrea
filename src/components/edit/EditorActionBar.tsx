import { BarChart3, Eye, Share2, FileDown, History } from 'lucide-react'
import { useCoachmarkTarget } from '@/lib/coachmark/CoachmarkContext'

const STORAGE_MODE = import.meta.env.VITE_STORAGE_MODE === 'supabase' ? 'supabase' : 'local'

type Props = {
  onPreview: () => void
  onShare: () => void
  onDownloadCv: () => void
  onStats: () => void
  onHistory: () => void
}

export default function EditorActionBar({ onPreview, onShare, onDownloadCv, onStats, onHistory }: Props) {
  // Cible "preview-mobile" du tuto (voir steps.ts) — voir DesktopPreviewPanel.tsx
  // pour la cible alternative "preview-desktop", jamais visible en même temps.
  const previewTargetRef = useCoachmarkTarget('preview-mobile')

  return (
    <div className="fixed bottom-0 inset-x-0 border-t border-ink-raised bg-ink/95 backdrop-blur-sm pb-[env(safe-area-inset-bottom)]">
      <div
        className={`grid gap-1 p-2 lg:mx-auto lg:max-w-[1400px] lg:px-8 ${STORAGE_MODE === 'supabase' ? 'grid-cols-5 lg:grid-cols-4' : 'grid-cols-3 lg:grid-cols-2'}`}
      >
        {/* Redondant en desktop : l'aperçu est déjà visible en direct dans le panneau de droite. */}
        <button
          ref={previewTargetRef}
          type="button"
          onClick={onPreview}
          className="lg:hidden min-h-11 flex flex-col items-center justify-center gap-0.5 rounded-md text-xs text-muted focus-visible:outline-2 focus-visible:outline-accent"
        >
          <Eye size={16} aria-hidden="true" />
          Aperçu
        </button>
        {/* Action principale du parcours (Phase 5) : c'est le partage du profil
            qui est le but final, pas l'aperçu ni l'export — seul bouton mis
            en avant à l'accent. Renommé "Partager" (correctif "bouton Lien") :
            ouvre la publication si le profil n'est pas encore publié, sinon
            le lien public réel à copier — plus jamais un lien encodé généré
            à part. */}
        <button
          type="button"
          onClick={onShare}
          className="min-h-11 flex flex-col items-center justify-center gap-0.5 rounded-md bg-accent-subtle text-accent text-xs font-medium focus-visible:outline-2 focus-visible:outline-accent"
        >
          <Share2 size={16} aria-hidden="true" />
          Partager
        </button>
        {/* CV PDF (prompt dédié) — visibilité de premier plan voulue, contrairement
            à l'export JSON, discret dans la zone Compte (AccountSection.tsx) :
            c'est un document que l'utilisateur envoie réellement à un
            recruteur, pas une sauvegarde technique. */}
        <button
          type="button"
          onClick={onDownloadCv}
          className="min-h-11 flex flex-col items-center justify-center gap-0.5 rounded-md text-xs text-muted focus-visible:outline-2 focus-visible:outline-accent"
        >
          <FileDown size={16} aria-hidden="true" />
          CV
        </button>
        {/* Dashboard de statistiques (Phase 3) — remplace "Importer" à cet
            emplacement (retour utilisateur). Réservé au mode Supabase : les
            compteurs de vues/clics n'existent pas en stockage local. */}
        {STORAGE_MODE === 'supabase' && (
          <button
            type="button"
            onClick={onStats}
            className="min-h-11 flex flex-col items-center justify-center gap-0.5 rounded-md text-xs text-muted focus-visible:outline-2 focus-visible:outline-accent"
          >
            <BarChart3 size={16} aria-hidden="true" />
            Statistiques
          </button>
        )}
        {/* Historique des versions (doc "Complétude, historique, publication
            différée", Phase 2) — même garde Supabase que Statistiques : la
            table profile_history n'existe pas en stockage local. */}
        {STORAGE_MODE === 'supabase' && (
          <button
            type="button"
            onClick={onHistory}
            className="min-h-11 flex flex-col items-center justify-center gap-0.5 rounded-md text-xs text-muted focus-visible:outline-2 focus-visible:outline-accent"
          >
            <History size={16} aria-hidden="true" />
            Historique
          </button>
        )}
      </div>
    </div>
  )
}
