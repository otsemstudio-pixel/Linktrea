import type { BackgroundId } from '@/types'

// Intensité de motion par fond, reprise telle quelle de l'ancien système de
// presets (terminal/ledger/vault/tape) au moment de la refonte design
// Phase 1 — seuls les noms changent, le caractère de chaque profil est
// conservé : la chorégraphie reste fixe, seules durée et courbe varient.
export type MotionProfile = {
  durationScale: number
  ease: [number, number, number, number]
}

export const BACKGROUND_MOTION_PROFILES: Record<BackgroundId, MotionProfile> = {
  // Snappy, easeOutExpo — le défaut, repris de l'ancien "terminal".
  graphite: { durationScale: 1, ease: [0.16, 1, 0.3, 1] },
  // Plus posé : une feuille qu'on tourne, repris de l'ancien "ledger".
  encre: { durationScale: 1.15, ease: [0.25, 0.46, 0.45, 0.94] },
  // Crisp et léger, cohérent avec le caractère "relevé imprimé" du fond.
  papier: { durationScale: 0.85, ease: [0.16, 1, 0.3, 1] },
  // Mécanique et lent : une porte de coffre qui se verrouille, repris de
  // l'ancien "vault" — cohérent avec le contraste maximal du fond.
  onyx: { durationScale: 1.3, ease: [0.65, 0, 0.35, 1] },
}
