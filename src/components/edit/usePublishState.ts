import { useEffect, useRef, useState } from 'react'
import { getProfileStore, ProfileStoreError } from '@/lib/store'
import type { SlugAvailability } from '@/lib/store/ProfileStore'
import { slugify, isValidSlugFormat } from '@/lib/slug'

const CHECK_DEBOUNCE_MS = 400
const MAX_SUGGESTION_ATTEMPTS = 30

export type CheckStatus = 'idle' | 'checking' | SlugAvailability

// Toute la logique d'état de la section "Publier" : chargement du statut,
// proposition automatique de slug, vérification de disponibilité débattue
// (debounce 400ms), publier/dépublier. PublishSection.tsx ne fait que
// l'afficher — permet de rester sous ~150 lignes par fichier.
export function usePublishState(fullName: string) {
  const [loadingStatus, setLoadingStatus] = useState(true)
  const [slugInput, setSlugInput] = useState('')
  const [savedSlug, setSavedSlug] = useState<string | null>(null)
  const [isPublished, setIsPublished] = useState(false)
  const [checkStatus, setCheckStatus] = useState<CheckStatus>('idle')
  const [actionPending, setActionPending] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [actionMessage, setActionMessage] = useState<string | null>(null)

  const checkRequestId = useRef(0)
  const suggestedOnce = useRef(false)

  // Statut actuel (slug + publication), une fois au montage.
  useEffect(() => {
    let cancelled = false
    getProfileStore()
      .then((store) => store.getPublishStatus())
      .then((status) => {
        if (cancelled) return
        setSavedSlug(status?.slug ?? null)
        setSlugInput(status?.slug ?? '')
        setIsPublished(status?.isPublished ?? false)
      })
      .catch(() => {
        // Statut non chargé : le champ reste vide, on n'empêche pas de
        // proposer un slug pour autant — pas bloquant.
      })
      .finally(() => {
        if (!cancelled) setLoadingStatus(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  // Proposition automatique à partir du nom — seulement si rien n'est
  // encore publié et que le champ est vide au moment où le nom apparaît.
  useEffect(() => {
    if (loadingStatus || suggestedOnce.current || savedSlug || slugInput || !fullName) return
    suggestedOnce.current = true
    let cancelled = false

    async function suggest() {
      const store = await getProfileStore()
      const base = slugify(fullName)
      const candidateBase = base.length >= 3 ? base : 'membre'
      for (let i = 0; i < MAX_SUGGESTION_ATTEMPTS; i++) {
        const candidate = i === 0 ? candidateBase : `${candidateBase}-${i + 1}`
        if (candidate.length > 32) break
        const availability = await store.checkSlugAvailability(candidate)
        if (cancelled) return
        if (availability === 'available') {
          setSlugInput(candidate)
          return
        }
      }
    }
    suggest()
    return () => {
      cancelled = true
    }
  }, [loadingStatus, savedSlug, slugInput, fullName])

  // Vérification de disponibilité en direct, débounce 400ms.
  useEffect(() => {
    if (!slugInput) {
      setCheckStatus('idle')
      return
    }
    if (!isValidSlugFormat(slugInput)) {
      setCheckStatus('invalid')
      return
    }
    setCheckStatus('checking')
    const requestId = ++checkRequestId.current
    const timer = setTimeout(async () => {
      try {
        const store = await getProfileStore()
        const result = await store.checkSlugAvailability(slugInput)
        if (checkRequestId.current === requestId) setCheckStatus(result)
      } catch {
        if (checkRequestId.current === requestId) setCheckStatus('invalid')
      }
    }, CHECK_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [slugInput])

  async function publish() {
    setActionPending(true)
    setActionError(null)
    setActionMessage(null)
    try {
      const store = await getProfileStore()
      const result = await store.publish(slugInput)
      if (result.ok) {
        setSavedSlug(slugInput)
        setIsPublished(true)
        setActionMessage('Profil publié.')
      } else if (result.reason === 'taken') {
        setActionError('Ce lien est déjà pris. Choisis-en un autre.')
      } else {
        setActionError('Ce format de lien n’est pas valide.')
      }
    } catch (e) {
      setActionError(e instanceof ProfileStoreError ? e.message : 'La publication a échoué. Réessaie dans un instant.')
    } finally {
      setActionPending(false)
    }
  }

  async function unpublish() {
    setActionPending(true)
    setActionError(null)
    setActionMessage(null)
    try {
      const store = await getProfileStore()
      await store.unpublish()
      setIsPublished(false)
      setActionMessage('Profil dépublié. Il reste modifiable, mais n’est plus visible publiquement.')
    } catch (e) {
      setActionError(e instanceof ProfileStoreError ? e.message : 'La dépublication a échoué. Réessaie dans un instant.')
    } finally {
      setActionPending(false)
    }
  }

  return {
    slugInput,
    setSlugInput,
    savedSlug,
    isPublished,
    checkStatus,
    actionPending,
    actionError,
    actionMessage,
    publish,
    unpublish,
  }
}
