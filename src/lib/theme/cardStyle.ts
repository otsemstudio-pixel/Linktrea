// Résolution du style de boutons/cartes (refonte v2, Phase 4) — un axe de
// variation indépendant du fond (voir le prompt) : Plein / Contouré / Élevé.
// Deux étapes, comme pour le fond (resolveAppearance.ts) et la typographie
// (resolveAppearanceFontDuo) :
// 1) resolveAppearanceCardStyle() lit l'AppearanceConfig actif — un thème de
//    la Galerie fixe seulement la FORME, sa couleur reste l'accent partagé
//    (aucun réglage de couleur de bouton indépendant pour la Galerie) ; le
//    mode Personnalisé a ses trois réglages entièrement indépendants.
// 2) styleTokens() traduit style + couleurs en valeurs CSS concrètes.
import type { AppearanceConfig, ButtonStyle } from '@/types'
import { bestTextOn } from './color'
import { GALLERY_THEMES } from './galleryThemes'

export type ResolvedCardStyle = {
  buttonStyle: ButtonStyle
  buttonColor: string
  buttonTextColor: string
}

export function resolveAppearanceCardStyle(appearance: AppearanceConfig, accent: string): ResolvedCardStyle {
  if (appearance.kind === 'gallery') {
    return {
      buttonStyle: GALLERY_THEMES[appearance.themeId].buttonStyle,
      buttonColor: accent,
      buttonTextColor: bestTextOn(accent),
    }
  }
  return {
    buttonStyle: appearance.settings.buttonStyle,
    buttonColor: appearance.settings.buttonColor,
    buttonTextColor: appearance.settings.buttonTextColor,
  }
}

export type StyleTokens = {
  background: string
  foreground: string
  foregroundMuted: string
  borderColor: string
  borderWidth: string
  boxShadow: string
}

const ELEVATED_SHADOW = '0 6px 20px -6px color-mix(in oklch, black 45%, transparent)'

// `fallbackText`/`fallbackTextMuted` distinguent deux usages du même style :
// - pour une CARTE dense en contenu (positions, certificats, réseaux), le
//   texte reste la couleur ambiante du thème quand le fond de la carte ne
//   change pas (Contouré, Élevé) — seul Plein, qui colore réellement le
//   fond, doit basculer le texte pour rester lisible.
// - pour un BOUTON au sens strict (une seule ligne, ex. le lien "Contacter"),
//   « texte à la même couleur » du prompt s'applique aussi à Contouré et
//   Élevé : on passe alors buttonColor comme repli plutôt que le texte
//   ambiant. Voir les deux appels dans useAppliedTheme.ts.
export function styleTokens(
  style: ButtonStyle,
  buttonColor: string,
  buttonTextColor: string,
  elevatedSurfaceCss: string,
  fallbackText: string,
  fallbackTextMuted: string,
): StyleTokens {
  if (style === 'solid') {
    return {
      background: buttonColor,
      foreground: buttonTextColor,
      foregroundMuted: `color-mix(in oklch, ${buttonTextColor} 65%, transparent)`,
      borderColor: 'transparent',
      borderWidth: '0px',
      boxShadow: 'none',
    }
  }
  if (style === 'outline') {
    return {
      background: 'transparent',
      foreground: fallbackText,
      foregroundMuted: fallbackTextMuted,
      borderColor: buttonColor,
      borderWidth: '1.5px',
      boxShadow: 'none',
    }
  }
  return {
    background: elevatedSurfaceCss,
    foreground: fallbackText,
    foregroundMuted: fallbackTextMuted,
    borderColor: 'transparent',
    borderWidth: '0px',
    boxShadow: ELEVATED_SHADOW,
  }
}
