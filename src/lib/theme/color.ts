// Conversions couleur sRGB <-> OKLCH et vérification de contraste WCAG.
// Nécessaire car l'accent est maintenant une couleur libre choisie par
// l'utilisateur (Phase 1 de la refonte design) : toute la palette dérivée
// (survol, bordure, fond translucide) et l'ajustement de lisibilité se
// calculent en OKLCH pour rester perceptuellement homogènes quelle que soit
// la teinte de départ. Formules d'après Björn Ottosson (oklab).

export type Oklch = { l: number; c: number; h: number }

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n))
}

function srgbToLinear(c: number): number {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
}

function linearToSrgb(c: number): number {
  const clamped = clamp01(c)
  return clamped <= 0.0031308 ? clamped * 12.92 : 1.055 * Math.pow(clamped, 1 / 2.4) - 0.055
}

export function hexToRgb(hex: string): [number, number, number] {
  const normalized = hex.replace('#', '')
  const r = parseInt(normalized.slice(0, 2), 16) / 255
  const g = parseInt(normalized.slice(2, 4), 16) / 255
  const b = parseInt(normalized.slice(4, 6), 16) / 255
  return [r, g, b]
}

export function rgbToHex([r, g, b]: [number, number, number]): string {
  const toByte = (c: number) => Math.round(clamp01(c) * 255).toString(16).padStart(2, '0')
  return `#${toByte(r)}${toByte(g)}${toByte(b)}`
}

function linearRgbToOklab([r, g, b]: [number, number, number]): [number, number, number] {
  const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b
  const m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b
  const s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b

  const l_ = Math.cbrt(l)
  const m_ = Math.cbrt(m)
  const s_ = Math.cbrt(s)

  return [
    0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_,
    1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_,
    0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_,
  ]
}

function oklabToLinearRgb([L, a, b]: [number, number, number]): [number, number, number] {
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b
  const s_ = L - 0.0894841775 * a - 1.291485548 * b

  const l = l_ * l_ * l_
  const m = m_ * m_ * m_
  const s = s_ * s_ * s_

  return [
    +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ]
}

export function hexToOklch(hex: string): Oklch {
  const rgbLinear = hexToRgb(hex).map(srgbToLinear) as [number, number, number]
  const [L, a, b] = linearRgbToOklab(rgbLinear)
  const c = Math.sqrt(a * a + b * b)
  const h = (Math.atan2(b, a) * 180) / Math.PI
  return { l: L, c, h: h < 0 ? h + 360 : h }
}

export function oklchToHex({ l, c, h }: Oklch): string {
  const hRad = (h * Math.PI) / 180
  const a = c * Math.cos(hRad)
  const b = c * Math.sin(hRad)
  const linear = oklabToLinearRgb([l, a, b])
  return rgbToHex(linear.map(linearToSrgb) as [number, number, number])
}

export function oklchToCss({ l, c, h }: Oklch, alpha = 1): string {
  const alphaPart = alpha < 1 ? ` / ${Math.round(alpha * 100)}%` : ''
  return `oklch(${(l * 100).toFixed(1)}% ${c.toFixed(4)} ${h.toFixed(1)}${alphaPart})`
}

// Luminance relative WCAG (sRGB), distincte de la clarté perceptuelle L
// d'OKLCH — c'est celle-ci, pas l, que le calcul de contraste doit utiliser.
function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map(srgbToLinear)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

export function contrastRatio(hexA: string, hexB: string): number {
  const lA = relativeLuminance(hexA)
  const lB = relativeLuminance(hexB)
  const lighter = Math.max(lA, lB)
  const darker = Math.min(lA, lB)
  return (lighter + 0.05) / (darker + 0.05)
}

export type ContrastResult = { color: Oklch; adjusted: boolean }

/**
 * Ajuste la clarté (l) d'une couleur OKLCH par petits pas jusqu'à ce que son
 * contraste avec `bgHex` atteigne `minRatio`, en conservant teinte et chroma
 * autant que possible. Direction de l'ajustement déterminée par la clarté du
 * fond : on éclaircit l'accent sur fond sombre, on l'assombrit sur fond
 * clair — jamais l'inverse, ce qui produirait une correction visuellement
 * incohérente avec le thème choisi.
 */
export function ensureAccentContrast(accent: Oklch, bgHex: string, minRatio = 4.5): ContrastResult {
  const accentHex = oklchToHex(accent)
  if (contrastRatio(accentHex, bgHex) >= minRatio) {
    return { color: accent, adjusted: false }
  }

  const bgIsLight = relativeLuminance(bgHex) > 0.5
  const step = bgIsLight ? -0.01 : 0.01
  let candidate = { ...accent }

  for (let i = 0; i < 100; i++) {
    candidate = { ...candidate, l: clamp01(candidate.l + step) }
    if (contrastRatio(oklchToHex(candidate), bgHex) >= minRatio) {
      return { color: candidate, adjusted: true }
    }
    if (candidate.l <= 0 || candidate.l >= 1) break
  }

  // Cas limite (chroma trop élevé même à l=0 ou l=1) : on réduit aussi le
  // chroma progressivement, la teinte reste seule garantie inchangée.
  candidate = { ...accent, l: bgIsLight ? 0.15 : 0.9 }
  for (let i = 0; i < 20; i++) {
    if (contrastRatio(oklchToHex(candidate), bgHex) >= minRatio) {
      return { color: candidate, adjusted: true }
    }
    candidate = { ...candidate, c: Math.max(0, candidate.c - 0.01) }
  }
  return { color: candidate, adjusted: true }
}
