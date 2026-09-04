// Carte de partage — rendue en <canvas> côté client, aucune dépendance
// externe. Les couleurs sont lues directement sur document.documentElement :
// useAppliedTheme() les y a déjà posées en oklch(), que <canvas> sait
// interpréter nativement comme fillStyle/strokeStyle dans les navigateurs
// modernes — pas besoin de dupliquer la dérivation de couleur ici, juste de
// lire ce qui est déjà à l'écran.
//
// Refonte (prompt "Refonte de la carte de partage") :
// - Phase 1 — trois formats au choix, chacun avec sa PROPRE composition
//   plutôt qu'un simple redimensionnement du carré d'origine (voir
//   composeSquare/Portrait/Landscape ci-dessous).
// - Phase 2 — contenu personnalisable (ShareCardContent, voir
//   shareCardContent.ts) : chaque bloc (chiffre clé, compétences,
//   certificats, signature, QR) se dessine ou non selon ce qui est coché,
//   empilé dans un ordre fixe par drawContentStack(). Le QR est importé
//   DYNAMIQUEMENT (import() à l'intérieur de la fonction, jamais en tête de
//   fichier) : un import statique de qrcode-generator ferait fuiter cette
//   dépendance dans le chunk public (ActionBar.tsx génère des cartes sur la
//   page publique) — voir l'incident déjà rencontré et corrigé lors de la
//   Phase QR code de la personnalisation avancée, qui a établi cette règle.
// - Phase 5 — quatrième format "carte de visite" (composeBusinessCard),
//   contenu FIXE (jamais piloté par ShareCardContent, voir plus bas) et
//   fond volontairement sobre (drawFlatBackground) : seul format où la
//   fidélité totale au thème de la Phase 4 s'efface sciemment devant la
//   lisibilité à l'impression/pièce jointe, comme demandé par le prompt.
import type { Profile, PhotoTreatment, ShapeLanguage, SignatureStyle } from '@/types'
import type { ShareCardContent } from './shareCardContent'
import { sortedHoldings, yearsOfExperience, initials } from './deriveStats'
import { guillochePaths, GUILLOCHE_EXTENT } from './svg/guilloche'
import { rosettePaths, ROSETTE_EXTENT } from './svg/rosette'
import { resolveVisualFamily } from './theme/visualFamily'
import { FONT_DUOS, type FontDuoDefinition } from './theme/fontDuos'
import { resolveAppearanceBackground, resolveAppearanceFontDuo, resolveAppearanceSignatureStyle } from './theme/resolveAppearance'
import { resolveAppearanceShape } from './theme/shape'
import { deriveSurfaceTokens } from './theme/deriveSurfaces'
import { oklchToHex, hexToRgb } from './theme/color'
import { photoFilterCss, LUMINANCE_WEIGHTS } from './theme/photoTreatment'
import { ECLAT_ARC_ORANGE, ECLAT_ARC_RED, ECLAT_ARC_VIOLET, ECLAT_OPACITY, isEclatVariant } from './theme/eclatGradients'
import { slugify } from './slug'
import { VOCABULARY } from './vocabulary'

// Rayons de "cadre" (Phase 4 — langage de forme) pour les éléments
// rectangulaires de la carte (le cadre du QR, pour l'instant, seul élément
// encadré du gabarit) — valeurs propres au canvas, pas une conversion
// littérale de shapeTokens (pensées pour l'échelle web) : 'pill' doit
// produire un rectangle totalement arrondi quelle que soit sa taille, donc
// toujours clampé à la moitié du plus petit côté au moment du dessin.
const CANVAS_SHAPE_RADIUS: Record<ShapeLanguage, number> = { sharp: 8, soft: 28, pill: 9999 }

export type ShareCardFormat = 'square' | 'portrait' | 'landscape' | 'business'

export const SHARE_CARD_DIMENSIONS: Record<ShareCardFormat, { width: number; height: number }> = {
  square: { width: 1080, height: 1080 },
  portrait: { width: 1080, height: 1920 },
  landscape: { width: 1600, height: 900 },
  // Proche d'un ratio de carte de visite standard (85×55mm ≈ 1.55:1).
  business: { width: 1050, height: 600 },
}

// Dupliquée depuis qrcode.ts (pas importée en valeur) — voir le commentaire
// en tête de fichier sur l'import dynamique.
const QUIET_ZONE_MODULES = 4

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
// disponible plutôt que de le laisser déborder — les noms et listes de
// compétences sont de longueur imprévisible, saisis par l'utilisateur.
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

// Pour un texte trop long (poste + lieu, notamment) : essaie d'abord de
// tenir sur UNE ligne sans descendre sous `minSingleLineSize` (un plancher
// pensé pour rester lisible, pas la taille minimale absolue) ; si ça ne
// suffit toujours pas, répartit plutôt sur plusieurs lignes à une taille
// confortable (`preferredSize`, réduite seulement si une ligne répartie ne
// tient toujours pas) — préfère revenir à la ligne plutôt que réduire la
// police jusqu'à l'illisible (bug repéré à l'usage : un texte long finissait
// écrasé sur une seule ligne à peine lisible plutôt que sur deux lignes
// nettes). Ne coupe jamais un mot (voir wrapTokens).
function fitOrWrapLine(
  ctx: CanvasRenderingContext2D,
  text: string,
  family: string,
  weight: number,
  preferredSize: number,
  minSingleLineSize: number,
  maxWidth: number,
): { lines: string[]; size: number } {
  let size = preferredSize
  ctx.font = `${weight} ${size}px "${family}"`
  while (size > minSingleLineSize && ctx.measureText(text).width > maxWidth) {
    size -= 2
    ctx.font = `${weight} ${size}px "${family}"`
  }
  if (ctx.measureText(text).width <= maxWidth) {
    return { lines: [text], size }
  }

  const words = text.split(' ')
  size = preferredSize
  let lines: string[]
  for (;;) {
    ctx.font = `${weight} ${size}px "${family}"`
    lines = wrapTokens(ctx, words, ' ', ctx.font, maxWidth)
    const longest = Math.max(...lines.map((line) => ctx.measureText(line).width))
    if (longest <= maxWidth || size <= minSingleLineSize) break
    size -= 2
  }
  return { lines, size }
}

async function ensureFontsLoaded(titleFamily: string, monoFamily: string): Promise<void> {
  await Promise.all([
    document.fonts.load(`700 56px "${titleFamily}"`),
    document.fonts.load(`400 28px "${titleFamily}"`),
    document.fonts.load(`600 140px "${monoFamily}"`),
    document.fonts.load(`400 26px "${monoFamily}"`),
    document.fonts.load(`italic 400 26px "${monoFamily}"`),
  ])
  await document.fonts.ready
}

type CardColors = { bg: string; surface1: string; fg: string; muted: string; accent: string }

function readCardColors(): CardColors {
  return {
    bg: readThemeColor('--surface-0', '#0d0e0c'),
    surface1: readThemeColor('--surface-1', '#181917'),
    fg: readThemeColor('--fg', '#e7e8e7'),
    muted: readThemeColor('--fg-muted', '#7a7b79'),
    accent: readThemeColor('--accent', '#e4a93c'),
  }
}

// --- Primitives de dessin réutilisées par les trois compositions ---------
// Paramétrées en position/taille plutôt que fixées au centre d'un carré
// 1080×1080 (l'ancienne approche) : c'est ce qui permet à chaque format de
// placer l'identité et le contenu où sa propre proportion l'exige, sans
// dupliquer la logique de dessin elle-même.

// Guillochis statique, à la couleur de titre du thème et à faible opacité —
// mêmes valeurs que le fond "texture" réel (AppliedBackgroundLayer.tsx :
// text-paper, opacity-[0.05]), pas la version accent/0.08 que ce fichier
// dessinait avant sur TOUTES les cartes sans distinction. La carte doit
// reflèter ce que CE thème affiche vraiment — un thème à fond plat ou en
// dégradé n'a aucun guillochis sur la page publique, sa carte non plus.
function drawGuillocheTexture(ctx: CanvasRenderingContext2D, colors: CardColors, width: number, height: number, domain: Profile['domain']): void {
  const family = resolveVisualFamily(domain)
  const paths = family === 'protocole' ? rosettePaths() : guillochePaths()
  const extent = family === 'protocole' ? ROSETTE_EXTENT : GUILLOCHE_EXTENT
  ctx.save()
  ctx.globalAlpha = 0.05
  ctx.strokeStyle = colors.fg
  ctx.lineWidth = 2.2
  ctx.translate(width / 2, height / 2)
  const radius = Math.max(width, height) / 2
  const scale = (radius / extent) * 1.15
  ctx.scale(scale, scale)
  for (const d of paths) {
    ctx.stroke(new Path2D(d))
  }
  ctx.restore()
}

// Capture FIGÉE d'un arc chromatique animé (jamais l'animation elle-même
// dans un export statique, comme spécifié) — sans quoi une carte "Éclat", ou
// une carte Personnalisé à fond animé, ne se distinguerait pas d'un thème à
// simple dégradé/aplat sombre (GALLERY_THEMES.eclat.background n'est qu'une
// base sombre pour la dérivation de surfaces, pas le calque vif qui fait
// l'identité visuelle du thème sur la page réelle — voir
// EclatBackgroundLayer.tsx ; même chose pour CustomThemeSettings.animatedBackground).
// Une seule interprétation du dégradé, quelle que soit la variante,
// plutôt que de reproduire exactement la forme de chacune : le but d'une
// capture figée est de représenter le CARACTÈRE chromatique de l'arc, pas
// l'animation qu'il n'y a plus lieu de rejouer.
function drawChromaticArcOverlay(ctx: CanvasRenderingContext2D, colors: [string, string, string], opacity: number, width: number, height: number): void {
  const gradient = ctx.createLinearGradient(0, 0, width, height)
  gradient.addColorStop(0, colors[0])
  gradient.addColorStop(0.5, colors[1])
  gradient.addColorStop(1, colors[2])
  ctx.save()
  ctx.globalAlpha = opacity
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)
  ctx.restore()
}

function drawBackground(ctx: CanvasRenderingContext2D, profile: Profile, colors: CardColors, width: number, height: number): void {
  // Reflète le vrai traitement du thème actif (aplat, dégradé ou texture),
  // pas seulement --surface-0. Pour aplat et texture, --surface-0 EST déjà
  // la couleur de base exacte (deriveSurfaceTokens ne la modifie pas), donc
  // `bg` suffit ; seul le dégradé (Bourse, Lingot, Rente, Éclat...) a besoin
  // d'un vrai gradient canvas.
  const appearance = profile.appearance
  const backgroundTreatment = resolveAppearanceBackground(appearance).treatment
  if (backgroundTreatment.kind === 'gradient') {
    const gradient = ctx.createLinearGradient(0, 0, 0, height)
    gradient.addColorStop(0, backgroundTreatment.from)
    gradient.addColorStop(1, backgroundTreatment.to)
    ctx.fillStyle = gradient
  } else {
    ctx.fillStyle = colors.bg
  }
  ctx.fillRect(0, 0, width, height)

  const eclatVariant = appearance.kind === 'gallery' && appearance.themeId === 'eclat' ? appearance.eclatVariant : null
  if (eclatVariant && isEclatVariant(eclatVariant)) {
    drawChromaticArcOverlay(ctx, [ECLAT_ARC_ORANGE, ECLAT_ARC_RED, ECLAT_ARC_VIOLET], ECLAT_OPACITY[eclatVariant], width, height)
  } else if (appearance.kind === 'custom' && appearance.settings.animatedBackground) {
    drawChromaticArcOverlay(ctx, appearance.settings.animatedColors, ECLAT_OPACITY[appearance.settings.animationStyle], width, height)
  } else if (backgroundTreatment.kind === 'texture') {
    drawGuillocheTexture(ctx, colors, width, height, profile.domain)
  }
}

// Fond de la carte de visite (Phase 5) — SEULE composition qui n'appelle pas
// drawBackground() ci-dessus : le prompt demande explicitement un aplat
// clair ou très sombre, jamais le dégradé/la texture/la capture Éclat du
// thème actif, pour privilégier la lisibilité à l'impression et en pièce
// jointe email sur la fidélité totale (Phase 4). colors.bg reste néanmoins
// dérivé du thème (--surface-0, déjà un ton UNI par construction — voir
// deriveSurfaceTokens) : pas une couleur codée en dur, juste le seul
// ingrédient du thème compatible avec "sobre".
function drawFlatBackground(ctx: CanvasRenderingContext2D, colors: CardColors, width: number, height: number): void {
  ctx.fillStyle = colors.bg
  ctx.fillRect(0, 0, width, height)
}

// Applique le duoton pixel par pixel (interpolation luminance entre darkHex
// et lightHex) sur un <canvas> déjà peint avec la photo — voir le
// commentaire sur LUMINANCE_WEIGHTS dans photoTreatment.ts pour pourquoi ce
// calcul est refait ici plutôt que délégué à ctx.filter (qui ne sait pas
// référencer un filtre SVG url(#id) de façon fiable selon les navigateurs).
function applyDuotonePixels(ctx: CanvasRenderingContext2D, size: number, darkHex: string, lightHex: string): void {
  const imageData = ctx.getImageData(0, 0, size, size)
  const data = imageData.data
  const dark = hexToRgb(darkHex).map((c) => c * 255)
  const light = hexToRgb(lightHex).map((c) => c * 255)
  for (let i = 0; i < data.length; i += 4) {
    const luminance = (LUMINANCE_WEIGHTS.r * data[i] + LUMINANCE_WEIGHTS.g * data[i + 1] + LUMINANCE_WEIGHTS.b * data[i + 2]) / 255
    data[i] = dark[0] + (light[0] - dark[0]) * luminance
    data[i + 1] = dark[1] + (light[1] - dark[1]) * luminance
    data[i + 2] = dark[2] + (light[2] - dark[2]) * luminance
  }
  ctx.putImageData(imageData, 0, 0)
}

// Photo traitée sur un <canvas> hors écran CARRÉ (jamais directement dans le
// médaillon découpé) — getImageData/putImageData ignorent le clip en cours
// et opèrent sur les pixels bruts : appliquer le duoton directement sur le
// canvas principal repeindrait aussi les pixels de FOND dans les coins du
// carré englobant le cercle, hors du médaillon mais dans le rectangle lu.
// Ici, le carré entier est la photo elle-même, rien d'autre à protéger.
async function renderTreatedPhoto(
  img: HTMLImageElement,
  size: number,
  treatment: PhotoTreatment,
  darkHex: string,
  accentHex: string,
): Promise<HTMLCanvasElement> {
  const off = document.createElement('canvas')
  off.width = size
  off.height = size
  const octx = off.getContext('2d')
  if (!octx) return off

  if (treatment !== 'none' && treatment !== 'duotone') {
    const css = photoFilterCss(treatment, '')
    if (css) octx.filter = css
  }
  octx.drawImage(img, 0, 0, size, size)

  if (treatment === 'duotone') {
    applyDuotonePixels(octx, size, darkHex, accentHex)
  }

  return off
}

function drawVignetteOverlay(ctx: CanvasRenderingContext2D, centerX: number, centerY: number, diameter: number): void {
  const radius = diameter / 2
  const gradient = ctx.createRadialGradient(centerX, centerY, radius * 0.45, centerX, centerY, radius)
  gradient.addColorStop(0, 'rgba(0,0,0,0)')
  gradient.addColorStop(1, 'rgba(0,0,0,0.65)')
  ctx.fillStyle = gradient
  ctx.fillRect(centerX - radius, centerY - radius, diameter, diameter)
}

// Ombre du duoton = darkHex (--surface-0 dérivé du fond actif), lumière =
// accentHex — même convention que IdentityHeader.tsx sur la page publique
// ("les tons sombres tirent vers le fond du thème, les tons clairs vers
// l'accent"). Ce sont bien des #rrggbb ici (calculés dans compose() via
// deriveSurfaceTokens + oklchToHex, comme IdentityHeader.tsx), PAS
// colors.bg/colors.accent : ceux-ci sont les oklch(...) déjà posés en CSS
// par useAppliedTheme() (voir readThemeColor), utilisables tels quels comme
// fillStyle/strokeStyle mais pas parsables par hexToRgb().
async function drawMedallion(
  ctx: CanvasRenderingContext2D,
  profile: Profile,
  colors: CardColors,
  duo: FontDuoDefinition,
  centerX: number,
  centerY: number,
  diameter: number,
  darkHex: string,
  accentHex: string,
): Promise<void> {
  ctx.save()
  ctx.beginPath()
  ctx.arc(centerX, centerY, diameter / 2, 0, Math.PI * 2)
  ctx.closePath()
  ctx.clip()
  if (profile.identity.photo) {
    const img = await loadImage(profile.identity.photo)
    const treated = await renderTreatedPhoto(img, diameter, profile.identity.photoTreatment, darkHex, accentHex)
    ctx.drawImage(treated, centerX - diameter / 2, centerY - diameter / 2, diameter, diameter)
    if (profile.identity.photoVignette) {
      drawVignetteOverlay(ctx, centerX, centerY, diameter)
    }
  } else {
    ctx.fillStyle = colors.surface1
    ctx.fillRect(centerX - diameter / 2, centerY - diameter / 2, diameter, diameter)
    ctx.fillStyle = colors.fg
    ctx.font = `600 ${Math.round(diameter * 0.32)}px "${duo.monoFamily}"`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(initials(profile.identity.fullName) || '—', centerX, centerY)
  }
  ctx.restore()

  ctx.beginPath()
  ctx.arc(centerX, centerY, diameter / 2 + 5, 0, Math.PI * 2)
  ctx.strokeStyle = colors.accent
  ctx.lineWidth = 6
  ctx.stroke()
}

// Résultat de drawIdentityText — `bottom` est la baseline de la DERNIÈRE
// ligne réellement dessinée (headline/location incluse si elle a débordé
// sur une seconde ligne), et `headlineSize` la taille de police réellement
// utilisée pour cette ligne (0 si aucune headline/location) — les deux
// permettent aux appelants de calculer un espacement correct avant le
// premier bloc de contenu, plutôt qu'une constante fixe qui suppose une
// headline sur une seule ligne à une taille standard (bug repéré à
// l'usage : un chiffre clé en gros caractères pouvait alors chevaucher une
// headline/location longue).
type IdentityTextResult = { bottom: number; headlineSize: number }

// Nom + headline centrés horizontalement sur centerX, empilés à partir de y.
function drawIdentityText(
  ctx: CanvasRenderingContext2D,
  profile: Profile,
  colors: CardColors,
  duo: FontDuoDefinition,
  centerX: number,
  y: number,
  maxWidth: number,
  nameSize: { start: number; min: number },
): IdentityTextResult {
  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'

  const name = profile.identity.fullName || 'Nom à renseigner'
  const size = fitFontSize(ctx, name, duo.titleFamily, 700, nameSize.start, nameSize.min, maxWidth)
  ctx.fillStyle = colors.fg
  ctx.font = `700 ${size}px "${duo.titleFamily}"`
  ctx.fillText(name, centerX, y)

  const headline = [profile.identity.headline, profile.identity.location].filter(Boolean).join(' · ')
  if (!headline) return { bottom: y, headlineSize: 0 }

  const firstLineY = y + Math.round(size * 0.75)
  // Poste + lieu réunis par ' · ' peuvent rester trop longs pour une seule
  // ligne lisible — répartis sur deux lignes plutôt qu'écrasés (voir
  // fitOrWrapLine) : 26px est un plancher de LISIBILITÉ avant de préférer
  // le retour à la ligne, pas la taille minimale absolue.
  const { lines, size: headlineSize } = fitOrWrapLine(
    ctx,
    headline,
    duo.titleFamily,
    400,
    Math.round(size * 0.48),
    26,
    maxWidth,
  )
  ctx.fillStyle = colors.muted
  ctx.font = `400 ${headlineSize}px "${duo.titleFamily}"`
  const lineHeight = Math.round(headlineSize * 1.35)
  lines.forEach((line, i) => ctx.fillText(line, centerX, firstLineY + i * lineHeight))

  return { bottom: firstLineY + (lines.length - 1) * lineHeight, headlineSize }
}

// Découpe une liste de textes déjà joints par un séparateur en plusieurs
// lignes tenant chacune dans maxWidth, en ne coupant jamais un texte au
// milieu (le séparateur ne sert de point de coupe qu'entre deux entiers) —
// fitFontSize seul ne suffit pas ici : au-delà d'une taille de police
// plancher (lisibilité), trois compétences un peu longues ne rentrent tout
// simplement pas sur une ligne dans la colonne étroite du format Paysage ;
// mieux vaut les répartir sur deux lignes que les laisser déborder du cadre.
function wrapTokens(ctx: CanvasRenderingContext2D, tokens: string[], separator: string, font: string, maxWidth: number): string[] {
  ctx.font = font
  const lines: string[] = []
  let current = ''
  for (const token of tokens) {
    const candidate = current ? `${current}${separator}${token}` : token
    if (current === '' || ctx.measureText(candidate).width <= maxWidth) {
      current = candidate
    } else {
      lines.push(current)
      current = token
    }
  }
  if (current) lines.push(current)
  return lines
}

// --- Blocs de contenu (refonte carte de partage, Phase 2) -----------------
// Un bloc par option de ShareCardContent, chacun dessiné indépendamment et
// empilé par drawContentStack() ci-dessous — c'est ce qui permet à
// n'importe quelle combinaison de cases cochées de produire une carte
// propre, plutôt que le contenu fixe (chiffre clé + 3 compétences) d'avant.

// Chiffres tabulaires (Phase 4, "typographie cohérente avec le thème") :
// duo.monoFamily est une police réellement monospace, donc chaque glyphe —
// chiffres compris — a déjà une chasse fixe. Rien à activer explicitement
// ici (pas d'équivalent canvas à font-variant-numeric: tabular-nums) : la
// tabularité vient de la police elle-même, pas d'un réglage séparé.
function drawKeyMetricNumber(
  ctx: CanvasRenderingContext2D,
  profile: Profile,
  colors: CardColors,
  duo: FontDuoDefinition,
  centerX: number,
  y: number,
  maxWidth: number,
  metricSize: number,
): number {
  const years = yearsOfExperience(profile.positions)
  const keyMetricUnit = VOCABULARY[profile.domain].keyMetricUnit.toUpperCase()
  const metricText = `${years} ${keyMetricUnit}`
  const fittedSize = fitFontSize(ctx, metricText, duo.monoFamily, 600, metricSize, Math.round(metricSize * 0.5), maxWidth)
  ctx.textAlign = 'center'
  ctx.fillStyle = colors.fg
  ctx.font = `600 ${fittedSize}px "${duo.monoFamily}"`
  ctx.fillText(metricText, centerX, y)
  return y
}

function drawTopSkillsBlock(
  ctx: CanvasRenderingContext2D,
  profile: Profile,
  colors: CardColors,
  duo: FontDuoDefinition,
  centerX: number,
  y: number,
  maxWidth: number,
  fontSize: number,
): number {
  const topHoldings = sortedHoldings(profile.holdings).slice(0, 3)
  if (topHoldings.length === 0) return y

  const font = `500 ${fontSize}px "${duo.monoFamily}"`
  const lines = wrapTokens(ctx, topHoldings.map((h) => h.label), '   ·   ', font, maxWidth)
  ctx.textAlign = 'center'
  ctx.fillStyle = colors.accent
  ctx.font = font
  const lineHeight = fontSize * 1.5
  lines.forEach((line, i) => ctx.fillText(line, centerX, y + i * lineHeight))
  return y + (lines.length - 1) * lineHeight
}

// Jusqu'à 2 certificats (titre + institution), empilés — voir
// ShareCardContent.showCertifications.
function drawCertificationsBlock(
  ctx: CanvasRenderingContext2D,
  profile: Profile,
  colors: CardColors,
  duo: FontDuoDefinition,
  centerX: number,
  y: number,
  maxWidth: number,
): number {
  const certs = profile.certificates.slice(0, 2)
  if (certs.length === 0) return y

  ctx.textAlign = 'center'
  let cursorY = y
  certs.forEach((cert, i) => {
    if (i > 0) cursorY += 56
    const titleSize = fitFontSize(ctx, cert.title, duo.titleFamily, 600, 30, 18, maxWidth)
    ctx.fillStyle = colors.fg
    ctx.font = `600 ${titleSize}px "${duo.titleFamily}"`
    ctx.fillText(cert.title || 'Certificat', centerX, cursorY)
    if (cert.institution) {
      cursorY += Math.round(titleSize * 0.7)
      const instSize = fitFontSize(ctx, cert.institution, duo.monoFamily, 400, 20, 14, maxWidth)
      ctx.fillStyle = colors.muted
      ctx.font = `400 ${instSize}px "${duo.monoFamily}"`
      ctx.fillText(cert.institution, centerX, cursorY)
    }
  })
  return cursorY
}

// Citation personnelle, en italique entre guillemets français — même
// traitement typographique que SignatureQuote.tsx sur le profil public. Le
// mode 'stamp' (Phase 4 de cette refonte, "Cohérence totale avec le thème
// actif") reproduit exactement ce composant : pivoté -2.5°, encadré d'un
// filet à l'accent, padding autour du texte — pas un style inventé pour la
// carte. `y` reste le curseur habituel (haut du bloc, comme les autres
// blocs de drawContentStack) même en mode tampon, où le texte est en réalité
// centré verticalement DANS la boîte dessinée à partir de ce y — sinon les
// autres blocs empilés après celui-ci se chevaucheraient avec la boîte.
function drawSignatureBlock(
  ctx: CanvasRenderingContext2D,
  profile: Profile,
  colors: CardColors,
  duo: FontDuoDefinition,
  centerX: number,
  y: number,
  maxWidth: number,
  signatureStyle: SignatureStyle,
): number {
  const signature = profile.identity.signature
  if (!signature) return y
  const quote = `« ${signature} »`

  if (signatureStyle === 'stamp') {
    const padX = 34
    const padY = 24
    const size = fitFontSize(ctx, quote, duo.monoFamily, 400, 26, 16, maxWidth - padX * 2)
    ctx.font = `italic 400 ${size}px "${duo.monoFamily}"`
    const textWidth = ctx.measureText(quote).width
    const boxWidth = textWidth + padX * 2
    const boxHeight = size + padY * 2
    const boxTop = y

    ctx.save()
    ctx.translate(centerX, boxTop + boxHeight / 2)
    ctx.rotate((-2.5 * Math.PI) / 180)
    ctx.strokeStyle = colors.accent
    ctx.lineWidth = 2
    ctx.strokeRect(-boxWidth / 2, -boxHeight / 2, boxWidth, boxHeight)
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = colors.fg
    ctx.font = `italic 400 ${size}px "${duo.monoFamily}"`
    ctx.fillText(quote, 0, 0)
    ctx.restore()
    // textBaseline restauré explicitement : les blocs suivants (pied de
    // carte notamment) comptent sur la valeur par défaut 'alphabetic'
    // posée ailleurs, jamais sur 'middle'.
    ctx.textBaseline = 'alphabetic'

    return boxTop + boxHeight
  }

  const size = fitFontSize(ctx, quote, duo.monoFamily, 400, 26, 16, maxWidth)
  ctx.textAlign = 'center'
  ctx.fillStyle = colors.muted
  ctx.font = `italic 400 ${size}px "${duo.monoFamily}"`
  ctx.fillText(quote, centerX, y)
  return y
}

function drawQrModules(ctx: CanvasRenderingContext2D, matrix: boolean[][], moduleColor: string, left: number, top: number, size: number): void {
  const quietTotal = matrix.length + QUIET_ZONE_MODULES * 2
  const cell = size / quietTotal
  ctx.fillStyle = moduleColor
  matrix.forEach((row, r) => {
    row.forEach((dark, c) => {
      if (!dark) return
      ctx.fillRect(left + (c + QUIET_ZONE_MODULES) * cell, top + (r + QUIET_ZONE_MODULES) * cell, cell, cell)
    })
  })
}

const QR_FRAME_PADDING = 28

// Cadre au langage de forme actif (Phase 4) autour du QR — surface1 en fond,
// filet à l'accent, coins radius = CANVAS_SHAPE_RADIUS[shape] clampé à la
// moitié du plus petit côté (Canvas n'a pas d'équivalent natif au
// comportement CSS "pill", qui s'auto-clampe déjà à 50%).
function drawQrFrame(ctx: CanvasRenderingContext2D, colors: CardColors, shape: ShapeLanguage, left: number, top: number, size: number): void {
  const radius = Math.min(CANVAS_SHAPE_RADIUS[shape], size / 2)
  ctx.beginPath()
  ctx.roundRect(left, top, size, size, radius)
  ctx.fillStyle = colors.surface1
  ctx.fill()
  ctx.strokeStyle = colors.accent
  ctx.lineWidth = 4
  ctx.stroke()
}

// QR vers publicUrl, centré sur centerX, dessiné à partir de top — voir le
// commentaire en tête de fichier sur l'import dynamique de qrcode.ts.
// Couleur des modules = colors.fg (le texte de titre du thème) : même choix
// que QrCodeSection.tsx pour le QR autonome, garanti AAA contre surface1 par
// deriveSurfaceTokens, largement suffisant pour rester scannable. `size` est
// désormais la taille du CADRE (boîte + filet), pas seulement le contenu —
// les modules sont dessinés à l'intérieur, réduits de QR_FRAME_PADDING de
// chaque côté.
async function drawQrBlock(
  ctx: CanvasRenderingContext2D,
  colors: CardColors,
  shape: ShapeLanguage,
  centerX: number,
  top: number,
  size: number,
  publicUrl: string,
): Promise<number> {
  const { buildQrMatrix } = await import('./qrcode')
  const matrix = buildQrMatrix(publicUrl)
  const left = centerX - size / 2
  drawQrFrame(ctx, colors, shape, left, top, size)
  const contentSize = size - QR_FRAME_PADDING * 2
  drawQrModules(ctx, matrix, colors.fg, centerX - contentSize / 2, top + QR_FRAME_PADDING, contentSize)
  return top + size
}

// Avant Phase 4, MIN_QR_SIZE (170) bornait directement le contenu du QR ;
// il borne maintenant la taille du CADRE (contenu + 2×QR_FRAME_PADDING), le
// contenu minimal effectif reste donc identique à avant.
const MIN_QR_SIZE = 170 + QR_FRAME_PADDING * 2

// Empile les blocs actifs de ShareCardContent, dans un ordre fixe, à partir
// de startY — chaque bloc avance le curseur d'un espacement proportionnel à
// sa propre taille de police plutôt qu'une constante unique, pour rester
// cohérent quel que soit le format (les tailles varient beaucoup entre
// Paysage et Portrait). Renvoie le y final.
//
// maxBottom borne l'espace disponible (le haut du pied de carte) : le QR
// n'est PAS dessiné à sizes.qr fixe — il se redimensionne pour occuper ce
// qu'il reste après les autres blocs actifs, jusqu'à sizes.qr au maximum.
// C'est ce qui évite un chevauchement avec le pied de carte quand plusieurs
// options sont cochées en même temps (resolveShareCardContent limite déjà
// le NOMBRE d'éléments actifs par format, mais un simple compte ne suffit
// pas à garantir que ça tient en pixels — le QR, bien plus grand que les
// autres blocs, a besoin de cette marge de manœuvre en plus).
async function drawContentStack(
  ctx: CanvasRenderingContext2D,
  profile: Profile,
  colors: CardColors,
  duo: FontDuoDefinition,
  content: ShareCardContent,
  publicUrl: string | undefined,
  centerX: number,
  startY: number,
  maxWidth: number,
  maxBottom: number,
  sizes: { metric: number; skills: number; qr: number },
  shape: ShapeLanguage,
  signatureStyle: SignatureStyle,
): Promise<number> {
  let y = startY
  let first = true
  // Le tout premier bloc actif recevait auparavant un gap de ZÉRO (sur
  // l'idée que l'appelant aurait déjà laissé assez de place avant startY) —
  // en pratique, l'ascendant d'une grosse police (le chiffre clé, jusqu'à
  // 170px) déborde largement au-dessus de sa propre baseline et chevauchait
  // le texte identité juste au-dessus (bug repéré à l'usage, sur les trois
  // formats). Le gap prévu pour CE bloc s'applique donc toujours, y compris
  // pour le premier.
  const gap = (base: number) => {
    y += base
    first = false
  }

  if (content.showKeyMetric) {
    gap(Math.round(sizes.metric * 0.9))
    y = drawKeyMetricNumber(ctx, profile, colors, duo, centerX, y, maxWidth, sizes.metric)
  }
  if (content.showTopSkills) {
    gap(Math.round(sizes.metric * 0.44))
    y = drawTopSkillsBlock(ctx, profile, colors, duo, centerX, y, maxWidth, sizes.skills)
  }
  if (content.showCertifications) {
    gap(60)
    y = drawCertificationsBlock(ctx, profile, colors, duo, centerX, y, maxWidth)
  }
  if (content.showSignature) {
    gap(56)
    y = drawSignatureBlock(ctx, profile, colors, duo, centerX, y, maxWidth, signatureStyle)
  }
  if (content.showQrCode && publicUrl) {
    const qrGap = first ? 0 : 50
    const available = maxBottom - (y + qrGap)
    // En dessous de la taille plancher, mieux vaut omettre le QR que le
    // dessiner en chevauchant le pied de carte — resolveShareCardContent()
    // limite déjà le nombre d'options actives par format, mais une simple
    // limite de compte ne garantit pas que ça tient en pixels (les
    // certificats, en particulier, ont une hauteur assez variable selon la
    // longueur des intitulés) ; ce garde-fou reste le dernier rempart.
    if (available >= MIN_QR_SIZE) {
      y += qrGap
      first = false
      const qrSize = Math.min(sizes.qr, available)
      y = await drawQrBlock(ctx, colors, shape, centerX, y, qrSize, publicUrl)
    }
  }

  return y
}

// Marque "LINKTREA" + URL, centrées sur centerX, ancrées par le BAS (baselineY
// = position de la ligne d'URL, la marque vient au-dessus) — plus pratique
// pour caler un pied de carte à une distance fixe du bord bas, quel que soit
// ce qu'il y a au-dessus.
function drawFooter(
  ctx: CanvasRenderingContext2D,
  colors: CardColors,
  duo: FontDuoDefinition,
  centerX: number,
  baselineY: number,
  maxWidth: number,
  urlText: string,
): void {
  ctx.textAlign = 'center'
  ctx.fillStyle = colors.accent
  ctx.font = `600 22px "${duo.monoFamily}"`
  ctx.fillText('LINKTREA', centerX, baselineY - 48)

  const urlSize = fitFontSize(ctx, urlText, duo.monoFamily, 400, 26, 16, maxWidth)
  ctx.fillStyle = colors.muted
  ctx.font = `400 ${urlSize}px "${duo.monoFamily}"`
  ctx.fillText(urlText, centerX, baselineY)
}

function displayUrl(publicUrl: string): string {
  return publicUrl.replace(/^https?:\/\//, '')
}

// --- Compositions par format ----------------------------------------------

// Regroupe les quatre valeurs de "cohérence totale avec le thème actif"
// (Phase 4) résolues UNE fois dans compose() — évite de faire porter quatre
// paramètres positionnels supplémentaires à chacune des trois compositions
// et à drawMedallion/drawContentStack.
type ThemeFidelity = { shape: ShapeLanguage; signatureStyle: SignatureStyle; darkHex: string; accentHex: string }

// Carré 1080×1080 — agencement centré, équilibré (même esprit que la
// version initiale de cette carte).
async function composeSquare(
  ctx: CanvasRenderingContext2D,
  profile: Profile,
  colors: CardColors,
  duo: FontDuoDefinition,
  content: ShareCardContent,
  publicUrl: string | undefined,
  fidelity: ThemeFidelity,
): Promise<void> {
  const { width, height } = SHARE_CARD_DIMENSIONS.square
  const maxTextWidth = width - 180
  drawBackground(ctx, profile, colors, width, height)

  const medallionCenterY = 130 + 110
  await drawMedallion(ctx, profile, colors, duo, width / 2, medallionCenterY, 220, fidelity.darkHex, fidelity.accentHex)

  let y = medallionCenterY + 110 + 78
  y = drawIdentityText(ctx, profile, colors, duo, width / 2, y, maxTextWidth, { start: 58, min: 34 }).bottom

  y += 100
  await drawContentStack(
    ctx,
    profile,
    colors,
    duo,
    content,
    publicUrl,
    width / 2,
    y,
    maxTextWidth,
    height - 190,
    { metric: 140, skills: 24, qr: 380 },
    fidelity.shape,
    fidelity.signatureStyle,
  )

  drawFooter(ctx, colors, duo, width / 2, height - 70, maxTextWidth, publicUrl ? displayUrl(publicUrl) : '')
}

// Portrait 1080×1920 (Story/Status) — identité en haut, contenu empilé en
// dessous, URL en pied de carte. Zone de sécurité : ~250px en haut et
// ~350px en bas sans élément essentiel (recouverts par les contrôles
// natifs Instagram/WhatsApp) — le fond/guillochis peut s'y étendre, jamais
// le texte ni le pied de carte.
async function composePortrait(
  ctx: CanvasRenderingContext2D,
  profile: Profile,
  colors: CardColors,
  duo: FontDuoDefinition,
  content: ShareCardContent,
  publicUrl: string | undefined,
  fidelity: ThemeFidelity,
): Promise<void> {
  const { width, height } = SHARE_CARD_DIMENSIONS.portrait
  const maxTextWidth = width - 160
  const SAFE_TOP = 250
  const SAFE_BOTTOM = 350

  drawBackground(ctx, profile, colors, width, height)

  const medallionCenterY = SAFE_TOP + 140
  await drawMedallion(ctx, profile, colors, duo, width / 2, medallionCenterY, 260, fidelity.darkHex, fidelity.accentHex)

  let y = medallionCenterY + 130 + 90
  y = drawIdentityText(ctx, profile, colors, duo, width / 2, y, maxTextWidth, { start: 64, min: 36 }).bottom

  y += 160
  // Filet + pied de carte ancrés à distance fixe du bord bas, à l'intérieur
  // de la zone de sécurité inférieure (jamais dans les 350 derniers px) —
  // calculés AVANT le contenu, pour lui donner la borne basse à respecter.
  const footerBaselineY = height - SAFE_BOTTOM + 40
  await drawContentStack(
    ctx,
    profile,
    colors,
    duo,
    content,
    publicUrl,
    width / 2,
    y,
    maxTextWidth,
    footerBaselineY - 150,
    { metric: 170, skills: 28, qr: 440 },
    fidelity.shape,
    fidelity.signatureStyle,
  )

  ctx.strokeStyle = colors.surface1
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(width / 2 - 130, footerBaselineY - 90)
  ctx.lineTo(width / 2 + 130, footerBaselineY - 90)
  ctx.stroke()

  drawFooter(ctx, colors, duo, width / 2, footerBaselineY, maxTextWidth, publicUrl ? displayUrl(publicUrl) : '')
}

// Paysage 1600×900 (bannière, signature email) — deux colonnes : identité à
// gauche, contenu à droite, plutôt qu'un empilement vertical qui gâcherait
// la largeur disponible.
async function composeLandscape(
  ctx: CanvasRenderingContext2D,
  profile: Profile,
  colors: CardColors,
  duo: FontDuoDefinition,
  content: ShareCardContent,
  publicUrl: string | undefined,
  fidelity: ThemeFidelity,
): Promise<void> {
  const { width, height } = SHARE_CARD_DIMENSIONS.landscape
  drawBackground(ctx, profile, colors, width, height)

  const leftCenterX = width * 0.28
  const leftMaxWidth = width * 0.42
  const rightCenterX = width * 0.74
  const rightMaxWidth = width * 0.4

  const medallionCenterY = height / 2 - 130
  await drawMedallion(ctx, profile, colors, duo, leftCenterX, medallionCenterY, 200, fidelity.darkHex, fidelity.accentHex)

  const leftY = medallionCenterY + 100 + 74
  drawIdentityText(ctx, profile, colors, duo, leftCenterX, leftY, leftMaxWidth, { start: 50, min: 30 })

  // Séparateur vertical entre les deux colonnes — même filet que les autres
  // formats, juste orienté différemment.
  ctx.strokeStyle = colors.surface1
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(width / 2, height * 0.22)
  ctx.lineTo(width / 2, height * 0.78)
  ctx.stroke()

  const rightY = height * 0.3
  await drawContentStack(
    ctx,
    profile,
    colors,
    duo,
    content,
    publicUrl,
    rightCenterX,
    rightY,
    rightMaxWidth,
    height - 130,
    { metric: 110, skills: 18, qr: 260 },
    fidelity.shape,
    fidelity.signatureStyle,
  )

  drawFooter(ctx, colors, duo, width / 2, height - 56, width - 200, publicUrl ? displayUrl(publicUrl) : '')
}

// Carte de visite (Phase 5) — mise en page à deux colonnes alignées à
// GAUCHE, jamais centrée comme les trois autres formats : le repère visuel
// d'une carte de visite classique plutôt que d'un partage réseaux sociaux.
// Contenu FIXE — nom, headline, QR, URL — jamais piloté par
// ShareCardContent (voir le prompt : "contenu fixe et minimal"), donc ce
// format n'a pas de paramètre `content` du tout ; ni médaillon photo ni
// chiffre clé/compétences/certificats/signature, volontairement absents de
// cette liste. Fond : drawFlatBackground, pas drawBackground (voir plus
// haut) — seul écart délibéré à la fidélité totale de la Phase 4.
async function composeBusinessCard(
  ctx: CanvasRenderingContext2D,
  profile: Profile,
  colors: CardColors,
  duo: FontDuoDefinition,
  publicUrl: string | undefined,
  fidelity: ThemeFidelity,
): Promise<void> {
  const { width, height } = SHARE_CARD_DIMENSIONS.business
  const padding = 64
  drawFlatBackground(ctx, colors, width, height)

  const qrSize = height - padding * 2
  const qrCenterX = width - padding - qrSize / 2
  if (publicUrl) {
    await drawQrBlock(ctx, colors, fidelity.shape, qrCenterX, padding, qrSize, publicUrl)
  }

  const leftX = padding
  const leftMaxWidth = qrCenterX - qrSize / 2 - padding - leftX

  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
  const name = profile.identity.fullName || 'Nom à renseigner'
  const nameSize = fitFontSize(ctx, name, duo.titleFamily, 700, 46, 28, leftMaxWidth)
  const nameY = height / 2 - 20
  ctx.fillStyle = colors.fg
  ctx.font = `700 ${nameSize}px "${duo.titleFamily}"`
  ctx.fillText(name, leftX, nameY)

  const headline = [profile.identity.headline, profile.identity.location].filter(Boolean).join(' · ')
  if (headline) {
    const headlineY = nameY + Math.round(nameSize * 0.72)
    // Poste + lieu peuvent rester trop longs pour cette colonne étroite —
    // répartis sur deux lignes plutôt qu'écrasés à peine lisibles (voir
    // fitOrWrapLine ; bug repéré à l'usage : ce texte débordait auparavant
    // dans le cadre du QR).
    const { lines, size: headlineSize } = fitOrWrapLine(
      ctx,
      headline,
      duo.titleFamily,
      400,
      Math.round(nameSize * 0.44),
      20,
      leftMaxWidth,
    )
    ctx.fillStyle = colors.muted
    ctx.font = `400 ${headlineSize}px "${duo.titleFamily}"`
    const lineHeight = Math.round(headlineSize * 1.3)
    lines.forEach((line, i) => ctx.fillText(line, leftX, headlineY + i * lineHeight))
  }

  // Marque + URL ancrées en bas de la colonne gauche — pas drawFooter, pensé
  // pour les trois autres formats centrés sur toute la largeur de la carte.
  const footerY = height - padding
  ctx.fillStyle = colors.accent
  ctx.font = `600 20px "${duo.monoFamily}"`
  ctx.fillText('LINKTREA', leftX, footerY - 30)

  if (publicUrl) {
    const urlText = displayUrl(publicUrl)
    const urlSize = fitFontSize(ctx, urlText, duo.monoFamily, 400, 22, 14, leftMaxWidth)
    ctx.fillStyle = colors.muted
    ctx.font = `400 ${urlSize}px "${duo.monoFamily}"`
    ctx.fillText(urlText, leftX, footerY)
  }
}

async function compose(
  ctx: CanvasRenderingContext2D,
  profile: Profile,
  format: ShareCardFormat,
  content: ShareCardContent,
  publicUrl: string | undefined,
): Promise<void> {
  const colors = readCardColors()
  const duo = FONT_DUOS[resolveAppearanceFontDuo(profile.appearance).pageFontDuo]
  await ensureFontsLoaded(duo.titleFamily, duo.monoFamily)

  // darkHex/accentHex : mêmes valeurs, calculées de la même façon, que
  // IdentityHeader.tsx sur la page publique (voir son commentaire "les tons
  // sombres tirent vers le fond du thème, les tons clairs vers l'accent") —
  // pas colors.bg/colors.accent, qui sont des chaînes oklch() déjà posées en
  // CSS, inutilisables par hexToRgb() pour le duoton pixel par pixel.
  const backgroundHex = resolveAppearanceBackground(profile.appearance).hex
  const fidelity: ThemeFidelity = {
    shape: resolveAppearanceShape(profile.appearance),
    signatureStyle: resolveAppearanceSignatureStyle(profile.appearance),
    darkHex: oklchToHex(deriveSurfaceTokens(backgroundHex).surface0),
    accentHex: profile.theme.accent,
  }

  if (format === 'business') return composeBusinessCard(ctx, profile, colors, duo, publicUrl, fidelity)
  if (format === 'portrait') return composePortrait(ctx, profile, colors, duo, content, publicUrl, fidelity)
  if (format === 'landscape') return composeLandscape(ctx, profile, colors, duo, content, publicUrl, fidelity)
  return composeSquare(ctx, profile, colors, duo, content, publicUrl, fidelity)
}

// publicUrl : requis seulement pour dessiner le bloc QR et l'URL en pied de
// carte (content.showQrCode) — voir resolveShareCardContent(), qui désactive
// déjà showQrCode si le profil n'est pas publié, donc jamais lu quand ça ne
// s'applique pas.
//
// Rend DIRECTEMENT sur le <canvas> fourni, à sa résolution native (celle du
// format, jamais celle — réduite — à laquelle il est affiché à l'écran via
// CSS) — refonte carte de partage, Phase 3 : l'aperçu en direct et
// l'export final doivent être le MÊME rendu, jamais une approximation HTML
// séparée qui pourrait diverger du pipeline <canvas> réel. Ajuste
// canvas.width/height (dimensions du bitmap) sans toucher canvas.style
// (taille d'affichage) — c'est à l'appelant de gérer l'échelle visuelle.
export async function renderShareCardToCanvas(
  canvas: HTMLCanvasElement,
  profile: Profile,
  format: ShareCardFormat,
  content: ShareCardContent,
  publicUrl?: string,
): Promise<void> {
  const { width, height } = SHARE_CARD_DIMENSIONS[format]
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error("Le navigateur ne permet pas de générer la carte.")
  await compose(ctx, profile, format, content, publicUrl)
}

export async function generateShareCard(
  profile: Profile,
  format: ShareCardFormat,
  content: ShareCardContent,
  publicUrl?: string,
): Promise<Blob> {
  const canvas = document.createElement('canvas')
  await renderShareCardToCanvas(canvas, profile, format, content, publicUrl)

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('toBlob a échoué'))), 'image/png')
  })
}

// Exporte un <canvas> DÉJÀ rendu (voir renderShareCardToCanvas) — pas de
// nouveau rendu ici : l'aperçu affiché à l'écran EST le fichier téléchargé,
// au pixel près, jamais une simple approximation qui pourrait diverger.
export function exportCanvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('toBlob a échoué'))), 'image/png')
  })
}

export function downloadCanvasBlob(blob: Blob, fileName: string): void {
  const objectUrl = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = objectUrl
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(objectUrl)
}

export async function downloadShareCard(profile: Profile, format: ShareCardFormat, content: ShareCardContent, publicUrl?: string): Promise<void> {
  const blob = await generateShareCard(profile, format, content, publicUrl)
  downloadCanvasBlob(blob, `linktrea-${slugify(profile.identity.fullName) || 'profil'}-${format}.png`)
}

// --- Carte combinée avec QR — API historique (personnalisation avancée,
// Phase 3) ------------------------------------------------------------
// Conservée pour QrCodeSection.tsx (éditeur, bouton "Carte avec QR"), qui
// appelle déjà buildQrMatrix() lui-même de son côté (il est déjà dans le
// chunk éditeur, aucun risque de fuite) et passe la matrice toute faite —
// redirigée en interne vers le nouveau pipeline (showQrCode seul activé)
// plutôt que dupliquée, maintenant qu'il partage les mêmes primitives.
export async function generateQrCard(profile: Profile, publicUrl: string): Promise<Blob> {
  return generateShareCard(
    profile,
    'square',
    { showKeyMetric: false, showTopSkills: false, showCertifications: false, showSignature: false, showQrCode: true },
    publicUrl,
  )
}

export async function downloadQrCard(profile: Profile, publicUrl: string): Promise<void> {
  const blob = await generateQrCard(profile, publicUrl)
  downloadCanvasBlob(blob, `linktrea-qr-carte-${slugify(profile.identity.fullName) || 'profil'}.png`)
}
