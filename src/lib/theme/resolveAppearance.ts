// Résout l'AppearanceConfig actif (Galerie ou Personnalisé) vers un fond
// concret (refonte v2, Phase 2) — le seul endroit qui sache lire les deux
// branches de l'union, pour que le reste de l'app manipule une couleur de
// fond ordinaire plutôt que de re-brancher un if/else 'gallery'/'custom'
// partout où le fond est nécessaire.
import type { AppearanceConfig, FontDuoId, HeaderLayout } from '@/types'
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

export type ResolvedAnimation = {
  kind: AnimatedBackgroundKind | null
  // Le réglage brut de l'utilisateur (interrupteur "Fond animé"), avant prise
  // en compte de prefers-reduced-motion et de la visibilité de l'onglet — ces
  // deux derniers gates vivent dans useBackgroundAnimation, pas ici, car ce
  // sont des états runtime (hooks React), pas dérivables d'AppearanceConfig.
  enabled: boolean
}

// Fond animé génératif (refonte v2, Phase 6) — axe exclusif à la Galerie : le
// mode Personnalisé n'a pas d'équivalent (le prompt ne le prévoit que pour
// "3-4 thèmes" nommés, pas pour un fond libre).
export function resolveAppearanceAnimation(appearance: AppearanceConfig): ResolvedAnimation {
  if (appearance.kind !== 'gallery') return { kind: null, enabled: false }
  const kind = GALLERY_THEMES[appearance.themeId].animationKind
  return { kind, enabled: kind !== null && appearance.animatedBackground }
}
