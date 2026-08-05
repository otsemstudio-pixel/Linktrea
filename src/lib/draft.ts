import { useEffect, useRef, useState } from 'react'
import { profileSchema } from './schema'
import type { Profile } from '@/types'

export const DRAFT_STORAGE_KEY = 'ledger:draft'

export function readDraft(): Profile | null {
  try {
    const raw = localStorage.getItem(DRAFT_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    const result = profileSchema.safeParse(parsed)
    return result.success ? result.data : null
  } catch {
    return null
  }
}

export type SaveStatus = 'idle' | 'saved'

// Sauvegarde automatique du brouillon (clé ledger:draft), débounce 500ms.
export function useDraftAutosave(value: Profile, delay = 500): SaveStatus {
  const [status, setStatus] = useState<SaveStatus>('idle')
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const isFirstRun = useRef(true)

  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false
      return
    }
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      try {
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(value))
        setStatus('saved')
      } catch {
        // Stockage indisponible (quota, navigation privée...) — Exporter JSON
        // reste le filet de secours, pas d'interruption du travail en cours.
      }
    }, delay)
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(value), delay])

  return status
}
