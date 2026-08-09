import type { AnimatedBackgroundKind } from '@/lib/theme/galleryThemes'
import type { ResolvedAnimation } from '@/lib/theme/resolveAppearance'
import { useMotionPrefs } from './MotionPrefsContext'
import { useTabVisible } from './useTabVisible'

export type ActiveAnimation = {
  kind: AnimatedBackgroundKind | null
  // Combine les trois gates non négociables du prompt v2 (Phase 6) en un
  // seul booléen que les composants décoratifs consultent : le réglage
  // utilisateur (ResolvedAnimation.enabled), prefers-reduced-motion /
  // "Réduire les animations" (useMotionPrefs, déjà partagé avec le reste de
  // la page) et la visibilité de l'onglet. Un seul point de calcul pour ne
  // pas répéter cette combinaison dans chaque composant qui anime un fond.
  active: boolean
}

export function useBackgroundAnimation(resolved: ResolvedAnimation): ActiveAnimation {
  const { reduced } = useMotionPrefs()
  const tabVisible = useTabVisible()
  return { kind: resolved.kind, active: resolved.enabled && !reduced && tabVisible }
}
