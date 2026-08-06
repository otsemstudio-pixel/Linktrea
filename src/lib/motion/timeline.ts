// Chorégraphie d'arrivée (Phase 4) — délais fixes en secondes, identiques
// pour tous les fonds. Seules durée et easing varient (voir backgroundMotionProfiles).
export const INTRO_TIMELINE = {
  background: 0,
  identity: 0.12,
  counter: 0.28,
  counterDuration: 0.7,
  sparkline: 0.4,
  allocation: 0.56,
  allocationStagger: 0.04,
} as const
