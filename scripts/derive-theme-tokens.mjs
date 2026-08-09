// Calcule les tokens CSS des 4 fonds (surfaces, texte, up/down) en OKLCH à
// partir de leur seule couleur de base (voir src/lib/theme/backgrounds.ts)
// et les écrit dans src/styles/tokens.css, entre les marqueurs
// GENERATED BACKGROUNDS. À relancer après toute modification des formules
// de dérivation ci-dessous. Rien n'est fait main : si une valeur doit
// changer, elle se change ici, pas dans le CSS.
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { oklchToCss } from '../src/lib/theme/color.ts'
import { deriveSurfaceTokens } from '../src/lib/theme/deriveSurfaces.ts'
import { BACKGROUNDS, BACKGROUND_IDS } from '../src/lib/theme/backgrounds.ts'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const tokensPath = path.join(__dirname, '../src/styles/tokens.css')

function deriveBlock(id) {
  const { base: hex } = BACKGROUNDS[id]
  const t = deriveSurfaceTokens(hex)

  return `[data-background='${id}'] {
  --surface-0: ${oklchToCss(t.surface0)};
  --surface-1: ${oklchToCss(t.surface1)};
  --surface-2: ${oklchToCss(t.surface2)};
  --surface-inset: ${oklchToCss(t.surfaceInset)};
  --fg: ${oklchToCss(t.fg)};
  --fg-muted: ${oklchToCss(t.fgMuted)};
  --up: ${oklchToCss(t.up)};
  --down: ${oklchToCss(t.down)};
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
