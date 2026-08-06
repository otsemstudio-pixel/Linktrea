// Calcule les tokens CSS des 4 fonds (surfaces, texte, up/down) en OKLCH à
// partir de leur seule couleur de base (voir src/lib/theme/backgrounds.ts)
// et les écrit dans src/styles/tokens.css, entre les marqueurs
// GENERATED BACKGROUNDS. À relancer après toute modification des formules
// de dérivation ci-dessous. Rien n'est fait main : si une valeur doit
// changer, elle se change ici, pas dans le CSS.
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { hexToOklch, oklchToCss, ensureAccentContrast } from '../src/lib/theme/color.ts'
import { BACKGROUNDS, BACKGROUND_IDS } from '../src/lib/theme/backgrounds.ts'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const tokensPath = path.join(__dirname, '../src/styles/tokens.css')

function clamp01(n) {
  return Math.min(1, Math.max(0, n))
}

function deriveBlock(id) {
  const { base: hex, isLight } = BACKGROUNDS[id]
  const base = hexToOklch(hex)
  const nearBlack = base.l < 0.03

  const surface0 = base
  const surface1 = { ...base, l: nearBlack ? 0.14 : clamp01(base.l + 0.05) }
  const surface2 = { ...base, l: nearBlack ? 0.25 : clamp01(base.l + 0.105) }
  const surfaceInset = { ...base, l: clamp01(base.l - 0.035) }

  // Cible AAA (7:1) pour le texte principal, AA (4.5:1) pour le reste —
  // mêmes seuils que l'ancien système de presets, voir tokens.css d'origine.
  const fg = ensureAccentContrast({ l: isLight ? 0.18 : 0.93, c: base.c * 0.4, h: base.h }, hex, 7).color
  const muted = ensureAccentContrast({ l: isLight ? 0.38 : 0.58, c: base.c * 0.6, h: base.h }, hex, 4.5).color
  const up = ensureAccentContrast({ l: isLight ? 0.42 : 0.62, c: 0.13, h: 152 }, hex, 4.5).color
  const down = ensureAccentContrast({ l: isLight ? 0.45 : 0.65, c: 0.15, h: 27 }, hex, 4.5).color

  return `[data-background='${id}'] {
  --surface-0: ${oklchToCss(surface0)};
  --surface-1: ${oklchToCss(surface1)};
  --surface-2: ${oklchToCss(surface2)};
  --surface-inset: ${oklchToCss(surfaceInset)};
  --fg: ${oklchToCss(fg)};
  --fg-muted: ${oklchToCss(muted)};
  --up: ${oklchToCss(up)};
  --down: ${oklchToCss(down)};
}`
}

const generated = BACKGROUND_IDS.map(deriveBlock).join('\n\n')
const block = `/* GENERATED BACKGROUNDS — voir scripts/derive-theme-tokens.mjs, ne pas éditer à la main */\n${generated}\n/* END GENERATED BACKGROUNDS */`

const current = readFileSync(tokensPath, 'utf-8')
const markerPattern = /\/\* GENERATED BACKGROUNDS[\s\S]*?\/\* END GENERATED BACKGROUNDS \*\//

const next = markerPattern.test(current)
  ? current.replace(markerPattern, block)
  : `${current.trimEnd()}\n\n${block}\n`

writeFileSync(tokensPath, next)
console.log(`Tokens des 4 fonds régénérés dans ${tokensPath}`)
