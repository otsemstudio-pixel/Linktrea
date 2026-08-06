import { createContext, useContext } from 'react'
import { useReducedMotion } from 'motion/react'
import type { MotionPreference, BackgroundId } from '@/types'
import { BACKGROUND_MOTION_PROFILES, type MotionProfile } from './backgroundMotionProfiles'

type MotionPrefs = {
  reduced: boolean
  profile: MotionProfile
}

const MotionPrefsContext = createContext<MotionPrefs>({
  reduced: false,
  profile: BACKGROUND_MOTION_PROFILES.graphite,
})

type ProviderProps = {
  background: BackgroundId
  themeMotion: MotionPreference
  children: React.ReactNode
}

export function MotionPrefsProvider({ background, themeMotion, children }: ProviderProps) {
  const osReduced = useReducedMotion()
  const reduced = Boolean(osReduced) || themeMotion === 'reduced'
  const profile = BACKGROUND_MOTION_PROFILES[background]

  return <MotionPrefsContext.Provider value={{ reduced, profile }}>{children}</MotionPrefsContext.Provider>
}

export function useMotionPrefs(): MotionPrefs {
  return useContext(MotionPrefsContext)
}
