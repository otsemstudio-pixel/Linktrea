// Dérivation des surfaces (élevées, enfoncées, texte, up/down) à partir
// d'UNE SEULE couleur de fond — formule partagée entre les 4 fonds fixes
// des thèmes de la Galerie (calculée une fois par scripts/derive-theme-tokens.mjs)
// et le fond entièrement libre du mode Personnalisé (refonte v2, Phase 2),
// qui doit recalculer ceci en direct à chaque changement de couleur. Un seul
// endroit pour cette formule : la dupliquer aurait fini par diverger.
// Extension explicite (autorisée par allowImportingTsExtensions) : ce
// fichier est importé aussi bien par Vite (bundler, extension facultative)
// que directement par node --experimental-strip-types dans
// scripts/derive-theme-tokens.mjs, qui exige une extension pour résoudre un
// import relatif.
import { hexToOklch, oklchToHex, ensureAccentContrast, type Oklch } from './color.ts'

export type SurfaceTokens = {
  surface0: Oklch
  surface1: Oklch
  surface2: Oklch
  surfaceInset: Oklch
  fg: Oklch
  fgMuted: Oklch
  up: Oklch
  down: Oklch
  isLight: boolean
}

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n))
}

export function deriveSurfaceTokens(baseHex: string): SurfaceTokens {
  const base = hexToOklch(baseHex)
  const isLight = base.l > 0.5
  const nearBlack = base.l < 0.03

  const surface0 = base
  const surface1: Oklch = { ...base, l: nearBlack ? 0.14 : clamp01(base.l + 0.05) }
  const surface2: Oklch = { ...base, l: nearBlack ? 0.25 : clamp01(base.l + 0.105) }
  const surfaceInset: Oklch = { ...base, l: clamp01(base.l - 0.035) }

  // Cible AAA (7:1) pour le texte principal, AA (4.5:1) pour le reste.
  const fg = ensureAccentContrast({ l: isLight ? 0.18 : 0.93, c: base.c * 0.4, h: base.h }, baseHex, 7).color
  const fgMuted = ensureAccentContrast({ l: isLight ? 0.38 : 0.58, c: base.c * 0.6, h: base.h }, baseHex, 4.5).color
  const up = ensureAccentContrast({ l: isLight ? 0.42 : 0.62, c: 0.13, h: 152 }, baseHex, 4.5).color
  const down = ensureAccentContrast({ l: isLight ? 0.45 : 0.65, c: 0.15, h: 27 }, baseHex, 4.5).color

  return { surface0, surface1, surface2, surfaceInset, fg, fgMuted, up, down, isLight }
}

// Pour le mode Personnalisé : le fond est libre mais le texte de page et le
// texte des titres le sont AUSSI (choisis par l'utilisateur, pas dérivés) —
// il faut donc revalider leur contraste contre CE fond précis plutôt que de
// leur substituer le --fg/--fg-muted dérivés ci-dessus, qui ignoreraient le
// choix de l'utilisateur.
export function ensureReadableTextColor(hex: string, backgroundHex: string, minRatio = 4.5) {
  return ensureAccentContrast(hexToOklch(hex), backgroundHex, minRatio)
}

export { oklchToHex }
