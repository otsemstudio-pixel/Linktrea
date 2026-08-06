// Génère l'image OpenGraph de repli (Phase 6) dans public/og-default.png.
// Un profil individuel n'a pas d'image dynamique fiable : og:image doit être
// une URL http(s) réelle, pas un data: URI (voir la photo stockée dans le
// profil) — la plupart des robots de partage (Facebook, LinkedIn, Slack,
// WhatsApp) rejettent silencieusement un data: URI. Cette image statique,
// générique mais de marque, est donc utilisée pour TOUS les profils, à
// défaut de pouvoir générer une image par profil sans rendu serveur (hors
// périmètre, site 100% frontend — voir useDocumentMeta.ts).
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const outDir = path.join(root, 'public')
mkdirSync(outDir, { recursive: true })

function fontDataUri(pkg, weight) {
  const file = path.join(root, `node_modules/@fontsource/${pkg}/files/${pkg}-latin-${weight}-normal.woff2`)
  return `data:font/woff2;base64,${readFileSync(file).toString('base64')}`
}

// Même formule que src/lib/svg/guilloche.ts (dupliquée volontairement ici :
// ce script tourne en dehors du bundle Vite, pas d'alias @/ disponible, et
// c'est un script de génération ponctuelle, pas du code d'exécution partagé).
function hypotrochoidPath({ R, r, d, cycles }, stepsPerCycle = 24) {
  const steps = cycles * stepsPerCycle
  const totalT = Math.PI * 2 * cycles
  const points = []
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * totalT
    const x = (R - r) * Math.cos(t) + d * Math.cos(((R - r) / r) * t)
    const y = (R - r) * Math.sin(t) - d * Math.sin(((R - r) / r) * t)
    points.push(`${x.toFixed(1)},${y.toFixed(1)}`)
  }
  return `M${points.join('L')}`
}
const CURVES = [
  { R: 100, r: 39, d: 63, cycles: 5 },
  { R: 100, r: 31, d: 52, cycles: 7 },
]
const guillochePaths = CURVES.map((c) => hypotrochoidPath(c))

const WIDTH = 1200
const HEIGHT = 630
const interTightBold = fontDataUri('inter-tight', 700)
const interTightRegular = fontDataUri('inter-tight', 400)
const jetbrainsMono = fontDataUri('jetbrains-mono', 500)

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
  @font-face { font-family: 'Title'; src: url('${interTightBold}') format('woff2'); font-weight: 700; }
  @font-face { font-family: 'Body'; src: url('${interTightRegular}') format('woff2'); font-weight: 400; }
  @font-face { font-family: 'Mono'; src: url('${jetbrainsMono}') format('woff2'); font-weight: 500; }
  html, body { margin: 0; padding: 0; background: #0d0e0c; }
  .card {
    width: ${WIDTH}px; height: ${HEIGHT}px; position: relative; overflow: hidden;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    background:
      radial-gradient(ellipse 900px 500px at 50% 0%, rgba(228,169,60,0.10), transparent 60%),
      #0d0e0c;
  }
  svg.pattern { position: absolute; inset: 0; opacity: 0.07; }
  .mark {
    width: 84px; height: 84px; border-radius: 999px; border: 3px solid #e4a93c;
    display: flex; align-items: center; justify-content: center; margin-bottom: 28px;
  }
  .mark span { font-family: 'Mono', monospace; font-size: 34px; color: #e4a93c; font-weight: 500; }
  h1 { font-family: 'Title', sans-serif; font-size: 64px; color: #e7e8e7; margin: 0; letter-spacing: -0.01em; }
  p { font-family: 'Body', sans-serif; font-size: 26px; color: #7a7b79; margin: 18px 0 0; max-width: 640px; text-align: center; }
</style></head><body>
  <div class="card">
    <svg class="pattern" viewBox="-100 -100 200 200" preserveAspectRatio="xMidYMid slice">
      ${guillochePaths.map((d) => `<path d="${d}" fill="none" stroke="#e4a93c" stroke-width="0.35" />`).join('')}
    </svg>
    <div class="mark"><span>L</span></div>
    <h1>Ledger</h1>
    <p>Portefeuille professionnel présenté façon relevé financier.</p>
  </div>
</body></html>`

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: WIDTH, height: HEIGHT }, deviceScaleFactor: 2 })
await page.setContent(html)
await page.waitForTimeout(150)
const outPath = path.join(outDir, 'og-default.png')
await page.screenshot({ path: outPath })
await browser.close()
console.log(`✓ ${outPath}`)
