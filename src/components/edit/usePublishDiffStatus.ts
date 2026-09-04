import { useEffect, useRef, useState } from 'react'
import { getPublishDiffStatus } from '@/lib/publishDiff'
import type { SaveStatus } from '@/lib/store/useProfileStoreAutosave'

type State = {
  loading: boolean
  publishedAt: string | null
}

// `saveStatus` (useProfileStoreAutosave, EditPage.tsx) sert de signal de
// rafraîchissement : une sauvegarde réussie est le seul moment où
// `publishedAt` peut passer de null à une valeur (première publication
// suivie d'une modification) — pas de polling.
export function usePublishDiffStatus(saveStatus: SaveStatus) {
  const [state, setState] = useState<State>({ loading: true, publishedAt: null })
  const lastSaveStatus = useRef<SaveStatus>('idle')

  async function refresh() {
    try {
      const status = await getPublishDiffStatus()
      setState({ loading: false, publishedAt: status?.publishedAt ?? null })
    } catch {
      // Statut non chargé : pas d'indication plutôt qu'une erreur visible —
      // ce n'est qu'un encouragement, jamais bloquant (même esprit que
      // CompletionRing.tsx).
      setState((s) => ({ ...s, loading: false }))
    }
  }

  useEffect(() => {
    void refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (saveStatus === 'saved' && lastSaveStatus.current !== 'saved') void refresh()
    lastSaveStatus.current = saveStatus
  }, [saveStatus])

  return state
}
