import { createContext, useContext } from 'react'
import { useReducedMotion } from 'motion/react'
import type { MotionPreference } from '@/types'
import { BACKGROUND_MOTION_PROFILES, type MotionProfile } from './backgroundMotionProfiles'

type MotionPrefs = {
  reduced: boolean
  profile: MotionProfile
}

// Le fond n'est plus l'un de 4 BackgroundId fixes (refonte v2, Phase 2) : le
// caractère de mouvement par thème (autrefois calé sur ces 4 id) n'a plus
// de correspondance évidente et n'est pas repris par le prompt v2 — un seul
// profil de mouvement, jusqu'à ce qu'une phase future en redéfinisse un par
// thème de la Galerie si besoin.
const DEFAULT_MOTION_PROFILE = BACKGROUND_MOTION_PROFILES.graphite

const MotionPrefsContext = createContext<MotionPrefs>({
  reduced: false,
  profile: DEFAULT_MOTION_PROFILE,
})

type ProviderProps = {
  themeMotion: MotionPreference
  children: React.ReactNode
}

export function MotionPrefsProvider({ themeMotion, children }: ProviderProps) {
  const osReduced = useReducedMotion()
  const reduced = Boolean(osReduced) || themeMotion === 'reduced'

  return <MotionPrefsContext.Provider value={{ reduced, profile: DEFAULT_MOTION_PROFILE }}>{children}</MotionPrefsContext.Provider>
}

export function useMotionPrefs(): MotionPrefs {
  return useContext(MotionPrefsContext)
}
