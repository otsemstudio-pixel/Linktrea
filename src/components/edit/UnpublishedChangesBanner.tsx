import { Check } from 'lucide-react'
import { usePublishDiffStatus } from './usePublishDiffStatus'
import type { SaveStatus } from '@/lib/store/useProfileStoreAutosave'

type Props = {
  saveStatus: SaveStatus
}

// Indication de statut de publication (prompt "Publication automatique
// universelle") — remplace le badge "Modifications non publiées" et le
// bouton "Publier les modifications" : toute modification d'un profil déjà
// publié se synchronise désormais automatiquement (voir sync_auto_publish()
// côté base), il n'y a plus rien à publier manuellement une fois la
// première publication faite. Rien avant celle-ci (publishedAt null) : la
// toute première publication reste un geste explicite, déjà géré par
// PublishSection.tsx, pas un cas que cette indication doit dupliquer.
export default function UnpublishedChangesBanner({ saveStatus }: Props) {
  const { loading, publishedAt } = usePublishDiffStatus(saveStatus)

  if (loading || publishedAt === null) return null

  return (
    <div className="px-4 py-2.5 lg:px-5 lg:rounded-lg bg-ink-raised/60 border-b border-ink-raised lg:border lg:mb-4 flex items-center gap-2">
      <Check size={14} className="text-muted shrink-0" aria-hidden="true" />
      <p className="text-xs text-muted">Publié — tes modifications sont visibles immédiatement.</p>
    </div>
  )
}
