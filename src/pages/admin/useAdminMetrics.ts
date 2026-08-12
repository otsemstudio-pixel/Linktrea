import { useEffect, useState } from 'react'
import {
  getAdminSignupTrend,
  getAdminPublishStats,
  getAdminThemePopularity,
  getAdminEngagementTrend,
  getAdminDomainDistribution,
  type SignupTrendPoint,
  type PublishStats,
  type ThemePopularity,
  type EngagementTrendPoint,
  type DomainDistribution,
} from '@/lib/admin'

export type PeriodDays = 30 | 90 | 180

type State =
  | { status: 'loading' }
  | {
      status: 'ready'
      signupTrend: SignupTrendPoint[]
      publishStats: PublishStats
      themePopularity: ThemePopularity[]
      engagementTrend: EngagementTrendPoint[]
      domainDistribution: DomainDistribution[]
    }
  | { status: 'error' }

// Un seul aller-retour groupé plutôt que cinq hooks séparés — publishStats/
// themePopularity/domainDistribution ne dépendent pas de `days` et se
// refont donc inutilement à chaque changement de période, mais c'est un
// outil interne à faible trafic : la simplicité l'emporte largement sur
// l'économie de deux appels réseau.
export function useAdminMetrics(days: PeriodDays): State {
  const [state, setState] = useState<State>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false
    setState({ status: 'loading' })

    Promise.all([
      getAdminSignupTrend(days),
      getAdminPublishStats(),
      getAdminThemePopularity(),
      getAdminEngagementTrend(days),
      getAdminDomainDistribution(),
    ])
      .then(([signupTrend, publishStats, themePopularity, engagementTrend, domainDistribution]) => {
        if (!cancelled) {
          setState({ status: 'ready', signupTrend, publishStats, themePopularity, engagementTrend, domainDistribution })
        }
      })
      .catch(() => {
        if (!cancelled) setState({ status: 'error' })
      })

    return () => {
      cancelled = true
    }
  }, [days])

  return state
}
