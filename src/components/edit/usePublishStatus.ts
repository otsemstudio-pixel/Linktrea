import { useEffect, useState } from 'react'
import { getProfileStore } from '@/lib/store'

export type PublishStatusState = {
  savedSlug: string | null
  isPublished: boolean
  // URL publique complète (origin + pathname + #/slug), ou null si le
  // profil n'est pas encore publié — évite de dupliquer cette construction
  // (déjà présente dans PublishSection.tsx et QrCodeSection.tsx) une
  // troisième fois dans chaque composant qui en a besoin.
  publicUrl: string | null
  loading: boolean
}

// Lecture SEULE du statut de publication (slug + isPublished), sans aucun
// des effets de bord de usePublishState.ts (suggestion automatique de slug,
// vérification de disponibilité en direct, publier/dépublier...) — ceux-ci
// n'ont de sens que dans le formulaire "Publier" lui-même. Ce hook sert aux
// endroits qui ont seulement besoin de savoir "quelle est l'URL publique
// actuelle de ce profil" (correctif "modale carte de partage" Partie 2) :
// l'aperçu de l'éditeur (DesktopPreviewPanel, PreviewOverlay), où
// window.location reste sur /edit et ne peut donc jamais servir de source
// pour le QR/lien de partage de ProfileView → ActionBar.
export function usePublishStatus(): PublishStatusState {
  const [savedSlug, setSavedSlug] = useState<string | null>(null)
  const [isPublished, setIsPublished] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    getProfileStore()
      .then((store) => store.getPublishStatus())
      .then((status) => {
        if (cancelled) return
        setSavedSlug(status?.slug ?? null)
        setIsPublished(status?.isPublished ?? false)
      })
      .catch(() => {
        // Statut non chargé : traité comme "pas publié", jamais bloquant.
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const publicUrl = isPublished && savedSlug ? `${window.location.origin}${window.location.pathname}#/${savedSlug}` : null

  return { savedSlug, isPublished, publicUrl, loading }
}
