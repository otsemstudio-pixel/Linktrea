// Aides pour le système de thème à deux niveaux (refonte v2, Phase 1) —
// valeurs par défaut et libellés d'affichage, séparés du composant éditeur
// pour rester testables indépendamment de React.
import type { AppearanceConfig, ThemeConfig, CustomThemeSettings, ButtonStyle, HeaderLayout, ShapeLanguage, SignatureStyle } from '@/types'
import { bestTextOn } from './color'
import { GALLERY_THEMES } from './galleryThemes'
import { resolveAppearanceBackground } from './resolveAppearance'
import { deriveSurfaceTokens, oklchToHex } from './deriveSurfaces'
import { ECLAT_ARC_ORANGE, ECLAT_ARC_RED, ECLAT_ARC_VIOLET } from './eclatGradients'

export const BUTTON_STYLE_LABELS: Record<ButtonStyle, string> = {
  solid: 'Plein',
  outline: 'Contouré',
  elevated: 'Élevé',
}

export const HEADER_LAYOUT_LABELS: Record<HeaderLayout, string> = {
  classic: 'Classique',
  banner: 'Bandeau',
  seal: 'Sceau',
}

export const SHAPE_LANGUAGE_LABELS: Record<ShapeLanguage, string> = {
  sharp: 'Net',
  soft: 'Doux',
  pill: 'Pilule',
}

export const SIGNATURE_STYLE_LABELS: Record<SignatureStyle, string> = {
  plain: 'Simple',
  stamp: 'Tampon',
}

// Prérempli le mode Personnalisé à partir du thème quitté plutôt que de
// rouvrir sur des valeurs neutres — "l'utilisateur ajuste plutôt que repart
// de zéro" (prompt v2, Niveau 2). Fond, duo, style de boutons et layout
// d'en-tête viennent tous réellement du thème de la Galerie quitté (Phases
// 2-5) ; le texte de page/titres est dérivé de CE fond pour rester lisible
// (pas de couleur claire recopiée telle quelle sur le fond clair de "Titre",
// par exemple), et buttonTextColor du buttonColor effectivement utilisé
// (l'accent), pas d'une valeur figée qui supposerait un accent toujours clair.
export function customSettingsFromTheme(appearance: AppearanceConfig, theme: ThemeConfig): CustomThemeSettings {
  if (appearance.kind === 'custom') return appearance.settings

  const themeMeta = GALLERY_THEMES[appearance.themeId]
  const background = resolveAppearanceBackground(appearance).hex
  const textHex = oklchToHex(deriveSurfaceTokens(background).fg)
  // Repris du thème "Éclat" quitté (palette + variante), même principe
  // "ajuster plutôt que repartir de zéro" que le reste de cette fonction —
  // les 4 autres thèmes animés de la Galerie n'ont pas de palette à
  // récupérer (leur animation ne repose pas sur une teinte : guilloche,
  // bruit, respiration), donc rien à en reprendre ici.
  const wasEclat = appearance.themeId === 'eclat'

  return {
    background,
    buttonColor: theme.accent,
    buttonTextColor: bestTextOn(theme.accent),
    pageTextColor: textHex,
    headingColor: textHex,
    pageFontDuo: themeMeta.fontDuo,
    headingFontFamily: null,
    buttonStyle: themeMeta.buttonStyle,
    headerLayout: themeMeta.headerLayout,
    shape: themeMeta.shape,
    signatureStyle: themeMeta.signatureStyle,
    animatedBackground: wasEclat && appearance.animatedBackground,
    animatedColors: [ECLAT_ARC_ORANGE, ECLAT_ARC_RED, ECLAT_ARC_VIOLET],
    animationStyle: wasEclat ? appearance.eclatVariant : 'braise',
  }
}
