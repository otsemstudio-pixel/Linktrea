import { useEffect, useRef, useState } from 'react'
import { getPublishDiffStatus, publishProfileChanges } from '@/lib/publishDiff'
import type { SaveStatus } from '@/lib/store/useProfileStoreAutosave'

type State = {
  loading: boolean
  hasUnpublishedChanges: boolean
  publishing: boolean
  publishError: string | null
  justPublished: boolean
}

// `saveStatus` (useProfileStoreAutosave, EditPage.tsx) sert de signal de
// rafraîchissement : chaque sauvegarde réussie avance profiles.updated_at
// côté serveur, donc c'est le seul moment où "des modifications non
// publiées" peut redevenir vrai après une publication. Pas de polling —
// juste une re-lecture à chaque transition vers 'saved'.
export function usePublishDiffStatus(saveStatus: SaveStatus) {
  const [state, setState] = useState<State>({
    loading: true,
    hasUnpublishedChanges: false,
    publishing: false,
    publishError: null,
    justPublished: false,
  })
  const lastSaveStatus = useRef<SaveStatus>('idle')

  async function refresh() {
    try {
      const status = await getPublishDiffStatus()
      const has = status?.hasUnpublishedChanges ?? false
      // Une nouvelle modification après une publication réussie doit faire
      // réapparaître le badge, pas laisser le message de succès affiché
      // indéfiniment — justPublished ne reste vrai que tant qu'aucune
      // sauvegarde ultérieure n'a fait repasser hasUnpublishedChanges à true.
      setState((s) => ({ ...s, loading: false, hasUnpublishedChanges: has, justPublished: has ? false : s.justPublished }))
    } catch {
      // Statut non chargé : pas de badge plutôt qu'une erreur visible — ce
      // n'est qu'un encouragement, jamais bloquant (même esprit que
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

  async function publishChanges() {
    setState((s) => ({ ...s, publishing: true, publishError: null }))
    try {
      await publishProfileChanges()
      setState((s) => ({ ...s, publishing: false, hasUnpublishedChanges: false, justPublished: true }))
    } catch {
      setState((s) => ({
        ...s,
        publishing: false,
        publishError: 'La publication des modifications a échoué. Réessaie dans un instant.',
      }))
    }
  }

  return { ...state, publishChanges }
}
