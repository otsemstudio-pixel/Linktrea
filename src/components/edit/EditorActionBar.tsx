import { BarChart3, Eye, Link2, Download } from 'lucide-react'
import type { Profile } from '@/types'
import { downloadProfileJson } from '@/lib/exportImport'
import { useCoachmarkTarget } from '@/lib/coachmark/CoachmarkContext'

const STORAGE_MODE = import.meta.env.VITE_STORAGE_MODE === 'supabase' ? 'supabase' : 'local'

type Props = {
  profile: Profile
  onPreview: () => void
  onGenerateLink: () => void
  onStats: () => void
}

export default function EditorActionBar({ profile, onPreview, onGenerateLink, onStats }: Props) {
  // Cible "preview-mobile" du tuto (voir steps.ts) — voir DesktopPreviewPanel.tsx
  // pour la cible alternative "preview-desktop", jamais visible en même temps.
  const previewTargetRef = useCoachmarkTarget('preview-mobile')

  return (
    <div className="fixed bottom-0 inset-x-0 border-t border-ink-raised bg-ink/95 backdrop-blur-sm pb-[env(safe-area-inset-bottom)]">
      <div className="grid grid-cols-4 lg:grid-cols-3 gap-1 p-2 lg:mx-auto lg:max-w-[1400px] lg:px-8">
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
        {/* Action principale du parcours (Phase 5) : c'est le lien partageable
            qui est le but final, pas l'aperçu ni l'export — seul bouton mis
            en avant à l'accent. */}
        <button
          type="button"
          onClick={onGenerateLink}
          className="min-h-11 flex flex-col items-center justify-center gap-0.5 rounded-md bg-accent-subtle text-accent text-xs font-medium focus-visible:outline-2 focus-visible:outline-accent"
        >
          <Link2 size={16} aria-hidden="true" />
          Lien
        </button>
        <button
          type="button"
          onClick={() => downloadProfileJson(profile)}
          className="min-h-11 flex flex-col items-center justify-center gap-0.5 rounded-md text-xs text-muted focus-visible:outline-2 focus-visible:outline-accent"
        >
          <Download size={16} aria-hidden="true" />
          Exporter
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
      </div>
    </div>
  )
}
