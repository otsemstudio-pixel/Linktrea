// Résout l'AppearanceConfig actif (Galerie ou Personnalisé) vers un fond
// concret (refonte v2, Phase 2) — le seul endroit qui sache lire les deux
// branches de l'union, pour que le reste de l'app manipule une couleur de
// fond ordinaire plutôt que de re-brancher un if/else 'gallery'/'custom'
// partout où le fond est nécessaire.
import type { AppearanceConfig, FontDuoId, HeaderLayout, SignatureStyle, PlatformIconStyle } from '@/types'
import { hexToOklch } from './color'
import { GALLERY_THEMES } from './galleryThemes'
import type { BackgroundTreatment, AnimatedBackgroundKind } from './galleryThemes'

export type ResolvedBackground = {
  // Couleur de référence pour toute la dérivation OKLCH (surfaces, texte,
  // contraste) — pour un dégradé, c'est la teinte "from".
  hex: string
  isLight: boolean
  treatment: BackgroundTreatment
}

export function resolveAppearanceBackground(appearance: AppearanceConfig): ResolvedBackground {
  const treatment: BackgroundTreatment =
    appearance.kind === 'gallery'
      ? GALLERY_THEMES[appearance.themeId].background
      : { kind: 'flat', base: appearance.settings.background }

  const hex = treatment.kind === 'gradient' ? treatment.from : treatment.base
  const isLight = hexToOklch(hex).l > 0.5

  return { hex, isLight, treatment }
}

export type ResolvedFontDuo = {
  pageFontDuo: FontDuoId
  // null = pas de police de titre indépendante — voir le prompt v2 : les
  // thèmes de la Galerie ne proposent pas ce réglage (l'utilisateur choisit
  // un nom, pas des réglages), seul le mode Personnalisé peut le renseigner.
  headingFontFamily: string | null
}

export function resolveAppearanceFontDuo(appearance: AppearanceConfig): ResolvedFontDuo {
  if (appearance.kind === 'gallery') {
    return { pageFontDuo: GALLERY_THEMES[appearance.themeId].fontDuo, headingFontFamily: null }
  }
  return {
    pageFontDuo: appearance.settings.pageFontDuo,
    headingFontFamily: appearance.settings.headingFontFamily,
  }
}

// Layout de la zone photo + identité (refonte v2, Phase 5) — chaque thème de
// la Galerie en fixe un par défaut, le mode Personnalisé choisit librement
// parmi les trois (voir IdentityHeader.tsx).
export function resolveAppearanceHeaderLayout(appearance: AppearanceConfig): HeaderLayout {
  if (appearance.kind === 'gallery') return GALLERY_THEMES[appearance.themeId].headerLayout
  return appearance.settings.headerLayout
}

// Variante de signature (personnalisation avancée, Phase 4) — même logique
// à deux niveaux que le layout d'en-tête ci-dessus.
export function resolveAppearanceSignatureStyle(appearance: AppearanceConfig): SignatureStyle {
  if (appearance.kind === 'gallery') return GALLERY_THEMES[appearance.themeId].signatureStyle
  return appearance.settings.signatureStyle
}

// Style des icônes de plateformes (prompt "Icônes de plateformes...",
// Partie 1) — même logique à deux niveaux que le layout d'en-tête et la
// signature ci-dessus.
export function resolveAppearancePlatformIconStyle(appearance: AppearanceConfig): PlatformIconStyle {
  if (appearance.kind === 'gallery') return GALLERY_THEMES[appearance.themeId].platformIconStyle
  return appearance.settings.platformIconStyle
}

export type ResolvedAnimation = {
  kind: AnimatedBackgroundKind | null
  // Le réglage brut de l'utilisateur (interrupteur "Fond animé"), avant prise
  // en compte de prefers-reduced-motion et de la visibilité de l'onglet — ces
  // deux derniers gates vivent dans useBackgroundAnimation, pas ici, car ce
  // sont des états runtime (hooks React), pas dérivables d'AppearanceConfig.
  enabled: boolean
  // Palette libre (fond animé, mode Personnalisé — voir
  // CustomThemeSettings.animatedColors) — présente uniquement dans ce cas ;
  // undefined pour toute la Galerie, y compris Éclat, dont la palette fixe
  // vit dans eclatGradients.ts (ECLAT_GRADIENT), jamais ici.
  colors?: [string, string, string]
}

// Fond animé génératif (refonte v2, Phase 6) — 5 thèmes de la Galerie en
// déclarent un (voir GALLERY_THEMES[id].animationKind), fixé par le thème
// (palette et forme non modifiables), sauf "Éclat" (prompt dédié) : seul
// thème dont la variante d'animation est choisie librement par la personne
// (voir EclatVariant) — animationKind vaut ici juste la variante par défaut
// ('braise'), utile pour que l'interrupteur "Fond animé" générique
// (AppearanceSection.tsx) sache que ce thème EN A un, mais la variante
// réellement affichée vient d'appearance.eclatVariant.
//
// Le mode Personnalisé (refonte "fond animé personnalisé") a un équivalent
// séparé : CustomThemeSettings.animatedBackground, avec sa propre palette
// (animatedColors) ET son propre style d'animation (animationStyle, un des
// 5 mêmes EclatVariant réutilisés comme catalogue de MOUVEMENTS — voir le
// commentaire sur ce champ dans src/types/profile.ts). Ce n'est jamais
// "Éclat" : la palette est libre, jamais orange/rouge/violet imposé.
export function resolveAppearanceAnimation(appearance: AppearanceConfig): ResolvedAnimation {
  if (appearance.kind !== 'gallery') {
    if (appearance.settings.animatedBackground) {
      return { kind: appearance.settings.animationStyle, enabled: true, colors: appearance.settings.animatedColors }
    }
    return { kind: null, enabled: false }
  }
  const meta = GALLERY_THEMES[appearance.themeId]
  const kind = appearance.themeId === 'eclat' ? appearance.eclatVariant : meta.animationKind
  return { kind, enabled: meta.animationKind !== null && appearance.animatedBackground }
}
