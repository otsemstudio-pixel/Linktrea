import { AlertCircle, Check, Zap } from 'lucide-react'
import { usePublishDiffStatus } from './usePublishDiffStatus'
import type { SaveStatus } from '@/lib/store/useProfileStoreAutosave'

type Props = {
  saveStatus: SaveStatus
}

// Doc "Complétude, historique, publication différée", Phase 3 — jamais
// affiché avant la toute première publication (published_at null = état
// "pas encore publié" existant, déjà géré par PublishSection/ShareProfileModal,
// pas un cas que ce bandeau doit dupliquer) : voir usePublishDiffStatus,
// hasUnpublishedChanges vaut explicitement false tant que publishedAt est
// null.
export default function UnpublishedChangesBanner({ saveStatus }: Props) {
  const { loading, hasUnpublishedChanges, publishing, publishError, justPublished, autoPublish, publishedAt, publishChanges } =
    usePublishDiffStatus(saveStatus)

  if (loading) return null

  // Doc "Publication automatique optionnelle + clarification de l'export",
  // Phase 1 — remplace le badge/bouton par une indication discrète et
  // persistante plutôt que de laisser un bouton "Publier les modifications"
  // qui n'aurait plus d'effet perceptible (le trigger côté serveur maintient
  // déjà published_at collé à updated_at). Seulement une fois déjà publié
  // au moins une fois : la première mise en ligne reste toujours un geste
  // explicite, quel que soit ce réglage.
  if (autoPublish && publishedAt !== null) {
    return (
      <div className="px-4 py-2.5 lg:px-5 lg:rounded-lg bg-ink-raised/60 border-b border-ink-raised lg:border lg:mb-4 flex items-center gap-2">
        <Zap size={14} className="text-muted shrink-0" aria-hidden="true" />
        <p className="text-xs text-muted">Publication automatique activée</p>
      </div>
    )
  }

  if (justPublished) {
    return (
      <div className="px-4 py-2.5 lg:px-5 lg:rounded-lg bg-up/10 border-b border-up/30 lg:border lg:mb-4 flex items-center gap-2">
        <Check size={14} className="text-up shrink-0" aria-hidden="true" />
        <p className="text-xs text-up">Tes modifications sont maintenant visibles publiquement.</p>
      </div>
    )
  }

  if (!hasUnpublishedChanges) return null

  return (
    <div className="px-4 py-2.5 lg:px-5 lg:rounded-lg bg-accent-subtle border-b border-accent/30 lg:border lg:mb-4 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
      <span className="flex items-center gap-2 text-xs text-accent font-medium">
        <AlertCircle size={14} aria-hidden="true" />
        Modifications non publiées
      </span>
      {publishError && <p className="text-xs text-down w-full">{publishError}</p>}
      <button
        type="button"
        onClick={() => void publishChanges()}
        disabled={publishing}
        className="min-h-9 px-3 rounded-md bg-accent text-ink font-medium text-xs disabled:opacity-50 active:scale-[0.98] transition-transform focus-visible:outline-2 focus-visible:outline-paper focus-visible:-outline-offset-2"
      >
        {publishing ? 'Publication…' : 'Publier les modifications'}
      </button>
    </div>
  )
}
