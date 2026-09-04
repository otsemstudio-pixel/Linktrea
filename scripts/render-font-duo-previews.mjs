// Génère un aperçu PNG statique par duo typographique (refonte design
// Phase 2) dans public/theme/duo-previews/. Le sélecteur de l'éditeur
// affiche ces images plutôt que du texte rendu en direct dans les 14
// polices — voir la contrainte du prompt : "ne charge pas les 14 paires
// pour afficher le sélecteur". Playwright n'est qu'un outil de dev ici (déjà
// utilisé ponctuellement dans ce projet, jamais une dépendance permanente) :
// à relancer seulement si un duo change de police ou de weight de preview.
import { chromium } from 'playwright'
import { readFileSync, mkdirSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const outDir = path.join(root, 'public/theme/duo-previews')
mkdirSync(outDir, { recursive: true })

function fontFile(pkg, weight) {
  return path.join(root, `node_modules/@fontsource/${pkg}/files/${pkg}-latin-${weight}-normal.woff2`)
}

function toDataUri(filePath) {
  return `data:font/woff2;base64,${readFileSync(filePath).toString('base64')}`
}

// id, nom affiché, échantillon mono, police titre (fichier+poids d'aperçu), police mono (fichier+poids d'aperçu)
const DUOS = [
  { id: 'institutionnel', name: 'Institutionnel', sample: '01 234 567,89', title: fontFile('source-serif-4', 700), mono: fontFile('ibm-plex-mono', 400) },
  { id: 'terminal', name: 'Terminal', sample: '01 234 567,89', title: fontFile('martian-mono', 700), mono: fontFile('jetbrains-mono', 400) },
  { id: 'editorial', name: 'Éditorial', sample: '01 234 567,89', title: fontFile('newsreader', 700), mono: fontFile('ibm-plex-mono', 400) },
  { id: 'suisse', name: 'Suisse', sample: '01 234 567,89', title: fontFile('inter-tight', 700), mono: fontFile('jetbrains-mono', 400) },
  { id: 'brut', name: 'Brut', sample: '01 234 567,89', title: fontFile('archivo', 900), mono: fontFile('courier-prime', 700) },
  { id: 'classique', name: 'Classique', sample: '01 234 567,89', title: fontFile('lora', 700), mono: fontFile('dm-mono', 500) },
  { id: 'technique', name: 'Technique', sample: '01 234 567,89', title: fontFile('ibm-plex-sans', 700), mono: fontFile('ibm-plex-mono', 400) },
  { id: 'moderne', name: 'Moderne', sample: '01 234 567,89', title: fontFile('geist', 700), mono: fontFile('jetbrains-mono', 400) },
  { id: 'compact', name: 'Compact', sample: '01 234 567,89', title: fontFile('barlow-condensed', 700), mono: fontFile('dm-mono', 500) },
  { id: 'elegant', name: 'Élégant', sample: '01 234 567,89', title: fontFile('playfair-display', 900), mono: fontFile('dm-mono', 500) },
  { id: 'journal', name: 'Journal', sample: '01 234 567,89', title: fontFile('bitter', 700), mono: fontFile('courier-prime', 700) },
  { id: 'machine', name: 'Machine', sample: '01 234 567,89', title: fontFile('big-shoulders', 900), mono: fontFile('courier-prime', 700) },
  { id: 'geometrique', name: 'Géométrique', sample: '01 234 567,89', title: fontFile('poppins', 700), mono: fontFile('space-mono', 700) },
  { id: 'humaniste', name: 'Humaniste', sample: '01 234 567,89', title: fontFile('work-sans', 700), mono: fontFile('dm-mono', 500) },
  { id: 'chancellerie', name: 'Chancellerie', sample: '01 234 567,89', title: fontFile('eb-garamond', 700), mono: fontFile('dm-mono', 500) },
]

const WIDTH = 280
const HEIGHT = 72

function pageHtml({ name, sample, title, mono }) {
  const titleUri = toDataUri(title)
  const monoUri = toDataUri(mono)
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    @font-face { font-family: 'PreviewTitle'; src: url('${titleUri}') format('woff2'); }
    @font-face { font-family: 'PreviewMono'; src: url('${monoUri}') format('woff2'); }
    html, body { margin: 0; padding: 0; background: transparent; }
    .wrap {
      width: ${WIDTH}px; height: ${HEIGHT}px; box-sizing: border-box;
      display: flex; flex-direction: column; justify-content: center; gap: 6px;
      padding: 4px 2px;
    }
    .title { font-family: 'PreviewTitle', sans-serif; font-size: 22px; line-height: 1; color: #9a9a94; white-space: nowrap; overflow: hidden; }
    .mono { font-family: 'PreviewMono', monospace; font-size: 13px; line-height: 1; color: #9a9a94; font-variant-numeric: tabular-nums; }
  </style></head><body>
    <div class="wrap"><div class="title">${name}</div><div class="mono">${sample}</div></div>
  </body></html>`
}

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: WIDTH, height: HEIGHT }, deviceScaleFactor: 2 })

for (const duo of DUOS) {
  await page.setContent(pageHtml(duo))
  await page.waitForTimeout(120) // laisse les @font-face data-uri se poser (pas de réseau, mais un tick de layout)
  const el = await page.$('.wrap')
  const outPath = path.join(outDir, `${duo.id}.png`)
  await el.screenshot({ path: outPath, omitBackground: true })
  console.log(`✓ ${duo.id}.png`)
}

await browser.close()
console.log(`\n${DUOS.length} aperçus écrits dans ${outDir}`)
