import { useEffect, useRef, useState } from 'react'
import type { Profile } from '@/types'
import { getProfileStore, ProfileStoreError } from './index'

export type SaveStatus = 'idle' | 'saved' | 'error'

// Remplace l'ancien useDraftAutosave (clé localStorage ledger:draft,
// déconnectée du store) : ce que l'éditeur enregistre doit passer par
// ProfileStore, sinon publish() (Phase 4) n'a aucune garantie de voir le
// contenu réellement tapé — exactement le bug que ça a d'abord provoqué.
export function useProfileStoreAutosave(value: Profile, delay = 500) {
  const [status, setStatus] = useState<SaveStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const isFirstRun = useRef(true)

  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false
      return
    }
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(async () => {
      try {
        const store = await getProfileStore()
        await store.save(value)
        setStatus('saved')
        setError(null)
      } catch (e) {
        setStatus('error')
        setError(e instanceof ProfileStoreError ? e.message : "L'enregistrement a échoué.")
      }
    }, delay)
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(value), delay])

  return { status, error }
}
