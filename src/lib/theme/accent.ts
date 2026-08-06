// Résolution et dérivation de l'accent libre (Phase 1). Deux étapes bien
// séparées :
// 1) resolveAccent() corrige l'accent choisi si son contraste sur le fond
//    actif descend sous 4.5:1 — c'est CE hex-là qui doit être stocké dans
//    theme.accent, jamais la valeur brute. Voir la contrainte du prompt :
//    « l'utilisateur ne doit jamais pouvoir produire un profil illisible ».
// 2) accentCssTokens() dérive les variantes d'usage (survol, bordure, fond
//    translucide) depuis l'accent déjà corrigé.
import type { BackgroundId } from '@/types'
import { hexToOklch, oklchToHex, oklchToCss, ensureAccentContrast, type Oklch } from './color'
import { BACKGROUNDS } from './backgrounds'

export type ResolvedAccent = {
  hex: string
  color: Oklch
  adjusted: boolean
}

export function resolveAccent(accentHex: string, backgroundId: BackgroundId): ResolvedAccent {
  const background = BACKGROUNDS[backgroundId]
  const requested = hexToOklch(accentHex)
  const { color, adjusted } = ensureAccentContrast(requested, background.base, 4.5)
  return { hex: oklchToHex(color), color, adjusted }
}

export type AccentCssTokens = {
  accent: string
  accentHover: string
  accentBorder: string
  accentSubtle: string
}

export function accentCssTokens(color: Oklch, backgroundId: BackgroundId): AccentCssTokens {
  const background = BACKGROUNDS[backgroundId]
  // Le survol s'éloigne du fond pour rester perceptible : plus clair sur
  // fond sombre, plus sombre sur fond clair — même logique directionnelle
  // que ensureAccentContrast.
  const hoverDirection = background.isLight ? -1 : 1
  const hover: Oklch = { ...color, l: Math.min(1, Math.max(0, color.l + hoverDirection * 0.08)) }
  const border: Oklch = { ...color, c: color.c * 0.55 }

  return {
    accent: oklchToCss(color),
    accentHover: oklchToCss(hover),
    accentBorder: oklchToCss(border, 0.55),
    accentSubtle: oklchToCss(color, 0.12),
  }
}

// Nuances pour l'anneau d'allocation (Phase 3) : mêmes teinte et clarté que
// l'accent, seul le chroma descend du plus saturé (le segment principal) au
// plus désaturé — jamais de teintes différentes, ce serait un dégradé
// arc-en-ciel, pas "une nuance dérivée de l'accent".
export function accentAllocationShades(color: Oklch, count: number): string[] {
  if (count <= 0) return []
  if (count === 1) return [oklchToCss(color)]
  return Array.from({ length: count }, (_, i) => {
    const t = i / (count - 1)
    return oklchToCss({ ...color, c: color.c * (1 - t * 0.82) })
  })
}
