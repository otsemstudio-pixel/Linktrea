import { useEffect, useState } from 'react'
import { getPublishDiffStatus, setAutoPublish } from '@/lib/publishDiff'

// Doc "Publication automatique optionnelle + clarification de l'export",
// Phase 1 — réglage exposé dans la zone Compte (AccountSection.tsx), lu et
// écrit indépendamment du bandeau de l'éditeur (usePublishDiffStatus.ts) :
// les deux affichent la même donnée, mais chacun a besoin de sa propre
// instance (pas de contexte partagé pour un seul booléen).
export function useAutoPublishSetting() {
  const [loading, setLoading] = useState(true)
  const [enabled, setEnabled] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    getPublishDiffStatus()
      .then((status) => {
        if (!cancelled) setEnabled(status?.autoPublish ?? false)
      })
      .catch(() => {
        // Statut non chargé : réglage affiché désactivé plutôt qu'une
        // erreur visible — cohérent avec l'état par défaut réel en base.
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  async function toggle(next: boolean) {
    const previous = enabled
    setEnabled(next) // optimiste — le rendu ne doit pas attendre l'aller-retour réseau
    setPending(true)
    setError(null)
    try {
      await setAutoPublish(next)
    } catch {
      setEnabled(previous) // reviens en arrière si l'écriture a échoué
      setError("Le changement n'a pas pu être enregistré. Réessaie dans un instant.")
    } finally {
      setPending(false)
    }
  }

  return { loading, enabled, pending, error, toggle }
}
