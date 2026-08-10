// Résolution du langage de forme (personnalisation avancée, Phase 1) — même
// schéma à deux étapes que cardStyle.ts : resolveAppearanceShape() lit
// l'AppearanceConfig actif (fixé par thème en Galerie, libre en
// Personnalisé), shapeTokens() traduit le résultat en valeurs CSS.
import type { AppearanceConfig, ShapeLanguage } from '@/types'
import { GALLERY_THEMES } from './galleryThemes'

export function resolveAppearanceShape(appearance: AppearanceConfig): ShapeLanguage {
  if (appearance.kind === 'gallery') return GALLERY_THEMES[appearance.themeId].shape
  return appearance.settings.shape
}

export type ShapeTokens = {
  base: string
  sm: string
  md: string
  lg: string
}

// Pas de calc() dérivant sm/md/lg d'une seule --radius-base : 'pill' saute à
// 9999px sur les éléments courts (boutons, champs) tout en gardant les
// cartes à une valeur finie (24px) — un facteur unique appliqué à une seule
// base ne peut pas produire ces deux résultats à la fois. Trois valeurs
// explicites par langage plutôt qu'une dérivation mathématique. --radius-base
// reste exposée comme alias (= md) pour un élément isolé qui n'a pas besoin
// de distinguer les paliers.
const SHAPE_TOKENS: Record<ShapeLanguage, ShapeTokens> = {
  sharp: { base: '2px', sm: '2px', md: '2px', lg: '2px' },
  soft: { base: '12px', sm: '8px', md: '12px', lg: '16px' },
  pill: { base: '24px', sm: '9999px', md: '24px', lg: '24px' },
}

export function shapeTokens(shape: ShapeLanguage): ShapeTokens {
  return SHAPE_TOKENS[shape]
}
