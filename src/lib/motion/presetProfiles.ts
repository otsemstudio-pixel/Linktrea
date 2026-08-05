import type { ThemePreset } from '@/types'

// Intensité de motion par preset, définie en Phase 2 : la chorégraphie
// (les délais du plan Phase 4) reste fixe, seules la durée et la courbe
// changent pour donner à chaque preset son propre caractère.
export type PresetMotionProfile = {
  durationScale: number
  ease: [number, number, number, number]
}

export const PRESET_MOTION_PROFILES: Record<ThemePreset, PresetMotionProfile> = {
  // Snappy, easeOutExpo — le défaut du plan de design.
  terminal: { durationScale: 1, ease: [0.16, 1, 0.3, 1] },
  // Plus posé : une feuille qu'on tourne, pas un écran qui clignote.
  ledger: { durationScale: 1.15, ease: [0.25, 0.46, 0.45, 0.94] },
  // Mécanique et plus lent : une porte de coffre qui se verrouille.
  vault: { durationScale: 1.3, ease: [0.65, 0, 0.35, 1] },
  // Le plus rapide, cohérent avec le défilement continu du bandeau.
  tape: { durationScale: 0.8, ease: [0.16, 1, 0.3, 1] },
}
