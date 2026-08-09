// Carte de partage 1080×1080 (Phase 6) — rendue en <canvas> côté client,
// aucune dépendance externe. Les couleurs sont lues directement sur
// document.documentElement : useAppliedTheme() les y a déjà posées en
// oklch(), que <canvas> sait interpréter nativement comme fillStyle/
// strokeStyle dans les navigateurs modernes — pas besoin de dupliquer la
// dérivation de couleur ici, juste de lire ce qui est déjà à l'écran.
import type { Profile } from '@/types'
import { sortedHoldings, yearsOfExperience, initials } from './deriveStats'
import { guillochePaths, GUILLOCHE_EXTENT } from './svg/guilloche'
import { FONT_DUOS } from './theme/fontDuos'
import { resolveAppearanceBackground, resolveAppearanceFontDuo } from './theme/resolveAppearance'
import { slugify } from './slug'
import { VOCABULARY } from './vocabulary'

const SIZE = 1080
const MARGIN = 90
const MAX_TEXT_WIDTH = SIZE - MARGIN * 2

function readThemeColor(name: string, fallback: string): string {
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return value || fallback
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('image load failed'))
    img.src = src
  })
}

// Réduit la taille de police jusqu'à ce que le texte tienne dans la largeur
// disponible plutôt que de le laisser déborder du carré — les noms et listes
// de compétences sont de longueur imprévisible, saisis par l'utilisateur.
function fitFontSize(
  ctx: CanvasRenderingContext2D,
  text: string,
  family: string,
  weight: number,
  startSize: number,
  minSize: number,
  maxWidth: number,
): number {
  let size = startSize
  while (size > minSize) {
    ctx.font = `${weight} ${size}px "${family}"`
    if (ctx.measureText(text).width <= maxWidth) break
    size -= 2
  }
  return size
}

async function ensureFontsLoaded(titleFamily: string, monoFamily: string): Promise<void> {
  await Promise.all([
    document.fonts.load(`700 56px "${titleFamily}"`),
    document.fonts.load(`400 28px "${titleFamily}"`),
    document.fonts.load(`600 140px "${monoFamily}"`),
    document.fonts.load(`400 26px "${monoFamily}"`),
  ])
  await document.fonts.ready
}

export async function generateShareCard(profile: Profile): Promise<Blob> {
  const canvas = document.createElement('canvas')
  canvas.width = SIZE
  canvas.height = SIZE
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error("Le navigateur ne permet pas de générer la carte.")

  const bg = readThemeColor('--surface-0', '#0d0e0c')
  const surface1 = readThemeColor('--surface-1', '#181917')
  const fg = readThemeColor('--fg', '#e7e8e7')
  const muted = readThemeColor('--fg-muted', '#7a7b79')
  const accent = readThemeColor('--accent', '#e4a93c')

  // Le duo réellement affiché dépend du thème (Galerie ou Personnalisé), pas
  // de l'ancien champ plat theme.fontDuo — voir resolveAppearanceFontDuo,
  // même source que useAppliedTheme, pour que la carte exportée corresponde
  // exactement à ce que le visiteur voit sur la page.
  const duo = FONT_DUOS[resolveAppearanceFontDuo(profile.appearance).pageFontDuo]
  await ensureFontsLoaded(duo.titleFamily, duo.monoFamily)

  // Fond — reflète le vrai traitement du thème actif (Phase 2 : aplat,
  // dégradé ou texture), pas seulement --surface-0. Pour aplat et texture,
  // --surface-0 EST déjà la couleur de base exacte (deriveSurfaceTokens ne
  // la modifie pas), donc `bg` suffit ; seul le dégradé (Bourse, Lingot,
  // Rente) a besoin d'un vrai gradient canvas — sinon la carte exportée
  // pour ces thèmes affichait un aplat sans rapport avec la page.
  const backgroundTreatment = resolveAppearanceBackground(profile.appearance).treatment
  if (backgroundTreatment.kind === 'gradient') {
    const gradient = ctx.createLinearGradient(0, 0, 0, SIZE)
    gradient.addColorStop(0, backgroundTreatment.from)
    gradient.addColorStop(1, backgroundTreatment.to)
    ctx.fillStyle = gradient
  } else {
    ctx.fillStyle = bg
  }
  ctx.fillRect(0, 0, SIZE, SIZE)

  // Guillochis — même signature visuelle que l'en-tête et les sceaux
  // (Phase 3), à peine plus marquée ici puisque la carte EST le document,
  // pas un simple fond de page.
  ctx.save()
  ctx.globalAlpha = 0.08
  ctx.strokeStyle = accent
  ctx.lineWidth = 2.2
  ctx.translate(SIZE / 2, SIZE / 2)
  const guillocheScale = (SIZE / 2 / GUILLOCHE_EXTENT) * 1.15
  ctx.scale(guillocheScale, guillocheScale)
  for (const d of guillochePaths()) {
    ctx.stroke(new Path2D(d))
  }
  ctx.restore()

  // Médaillon
  const photoDiameter = 220
  const photoTop = 130
  const photoCenterX = SIZE / 2
  const photoCenterY = photoTop + photoDiameter / 2

  ctx.save()
  ctx.beginPath()
  ctx.arc(photoCenterX, photoCenterY, photoDiameter / 2, 0, Math.PI * 2)
  ctx.closePath()
  ctx.clip()
  if (profile.identity.photo) {
    const img = await loadImage(profile.identity.photo)
    ctx.drawImage(img, photoCenterX - photoDiameter / 2, photoTop, photoDiameter, photoDiameter)
  } else {
    ctx.fillStyle = surface1
    ctx.fillRect(photoCenterX - photoDiameter / 2, photoTop, photoDiameter, photoDiameter)
    ctx.fillStyle = fg
    ctx.font = `600 72px "${duo.monoFamily}"`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(initials(profile.identity.fullName) || '—', photoCenterX, photoCenterY)
  }
  ctx.restore()

  ctx.beginPath()
  ctx.arc(photoCenterX, photoCenterY, photoDiameter / 2 + 5, 0, Math.PI * 2)
  ctx.strokeStyle = accent
  ctx.lineWidth = 6
  ctx.stroke()

  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'
  let y = photoTop + photoDiameter + 78

  // Nom
  const name = profile.identity.fullName || 'Nom à renseigner'
  const nameSize = fitFontSize(ctx, name, duo.titleFamily, 700, 58, 34, MAX_TEXT_WIDTH)
  ctx.fillStyle = fg
  ctx.font = `700 ${nameSize}px "${duo.titleFamily}"`
  ctx.fillText(name, SIZE / 2, y)

  // Headline · localisation
  const headline = [profile.identity.headline, profile.identity.location].filter(Boolean).join(' · ')
  if (headline) {
    y += 44
    const headlineSize = fitFontSize(ctx, headline, duo.titleFamily, 400, 28, 20, MAX_TEXT_WIDTH)
    ctx.fillStyle = muted
    ctx.font = `400 ${headlineSize}px "${duo.titleFamily}"`
    ctx.fillText(headline, SIZE / 2, y)
  }

  // Chiffre clé
  y += 150
  const years = yearsOfExperience(profile.positions)
  const keyMetricUnit = VOCABULARY[profile.domain].keyMetricUnit.toUpperCase()
  ctx.fillStyle = fg
  ctx.font = `600 140px "${duo.monoFamily}"`
  ctx.fillText(`${years} ${keyMetricUnit}`, SIZE / 2, y)

  // Trois compétences principales
  const topHoldings = sortedHoldings(profile.holdings).slice(0, 3)
  if (topHoldings.length > 0) {
    y += 86
    const compsText = topHoldings.map((h) => h.label).join('   ·   ')
    const compsSize = fitFontSize(ctx, compsText, duo.monoFamily, 500, 30, 18, MAX_TEXT_WIDTH)
    ctx.fillStyle = accent
    ctx.font = `500 ${compsSize}px "${duo.monoFamily}"`
    ctx.fillText(compsText, SIZE / 2, y)
  }

  // Filet horizontal façon relevé de compte, pour occuper intentionnellement
  // l'espace entre le contenu et le pied de carte plutôt que le laisser vide.
  ctx.strokeStyle = surface1
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(SIZE / 2 - 120, SIZE - 170)
  ctx.lineTo(SIZE / 2 + 120, SIZE - 170)
  ctx.stroke()

  // Petite marque "LEDGER" au-dessus de l'URL : une carte qui circule sans
  // dire ce qui l'a produite ne fait connaître personne — voir la raison
  // d'être de cette carte dans le prompt ("c'est ce qui fera connaître le
  // produit").
  ctx.fillStyle = accent
  ctx.font = `600 22px "${duo.monoFamily}"`
  ctx.fillText('LEDGER', SIZE / 2, SIZE - 118)

  // URL en pied de carte
  const urlText = window.location.href.replace(/^https?:\/\//, '')
  const urlSize = fitFontSize(ctx, urlText, duo.monoFamily, 400, 26, 16, MAX_TEXT_WIDTH)
  ctx.fillStyle = muted
  ctx.font = `400 ${urlSize}px "${duo.monoFamily}"`
  ctx.fillText(urlText, SIZE / 2, SIZE - 70)

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('toBlob a échoué'))), 'image/png')
  })
}

export async function downloadShareCard(profile: Profile): Promise<void> {
  const blob = await generateShareCard(profile)
  const objectUrl = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = objectUrl
  a.download = `ledger-${slugify(profile.identity.fullName) || 'profil'}.png`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(objectUrl)
}
