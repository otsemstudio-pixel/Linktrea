import { useEffect, useState } from 'react'
import { getMyProfileStats, getMyLinkClicks, type DailyViews, type LinkClickTotal } from '@/lib/stats'

type State =
  | { status: 'loading' }
  | { status: 'ready'; views: DailyViews[]; links: LinkClickTotal[] }
  | { status: 'error' }

// Se contente de charger à son propre montage — c'est à l'appelant de ne
// monter ce hook (via le composant qui l'utilise) qu'au moment voulu. Voir
// StatsOverlay.tsx : son contenu n'est rendu qu'une fois le panneau ouvert
// (AnimatePresence), donc ces deux appels ne partent jamais au chargement
// initial de /edit.
export function useProfileStats(): State {
  const [state, setState] = useState<State>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false

    Promise.all([getMyProfileStats(), getMyLinkClicks()])
      .then(([views, links]) => {
        if (!cancelled) setState({ status: 'ready', views, links })
      })
      .catch(() => {
        if (!cancelled) setState({ status: 'error' })
      })

    return () => {
      cancelled = true
    }
  }, [])

  return state
}
