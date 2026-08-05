import { createContext, useContext } from 'react'
import { useReducedMotion } from 'motion/react'
import type { MotionPreference, ThemePreset } from '@/types'
import { PRESET_MOTION_PROFILES, type PresetMotionProfile } from './presetProfiles'

type MotionPrefs = {
  reduced: boolean
  profile: PresetMotionProfile
}

const MotionPrefsContext = createContext<MotionPrefs>({
  reduced: false,
  profile: PRESET_MOTION_PROFILES.terminal,
})

type ProviderProps = {
  preset: ThemePreset
  themeMotion: MotionPreference
  children: React.ReactNode
}

export function MotionPrefsProvider({ preset, themeMotion, children }: ProviderProps) {
  const osReduced = useReducedMotion()
  const reduced = Boolean(osReduced) || themeMotion === 'reduced'
  const profile = PRESET_MOTION_PROFILES[preset]

  return <MotionPrefsContext.Provider value={{ reduced, profile }}>{children}</MotionPrefsContext.Provider>
}

export function useMotionPrefs(): MotionPrefs {
  return useContext(MotionPrefsContext)
}
