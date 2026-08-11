// Valeurs CSS des cinq variantes du thème "Éclat" — dégradé de base (fixe,
// couvre déjà l'arc orange → rouge → violet spatialement, stop par stop) +
// opacité de repère (contrôle "vif" vs "assourdi" vs "très subtil") +
// classe d'animation (voir index.css pour les @keyframes). Séparé de
// galleryThemes.ts pour ne pas alourdir ce fichier de littéraux CSS.
import type { EclatVariant } from '@/types'

// Les trois teintes de l'arc, exportées séparément des chaînes CSS
// ci-dessous — réutilisées telles quelles par shareCard.ts (refonte carte
// de partage, Phase 4) pour construire un dégradé <canvas> équivalent :
// une carte est un export statique, jamais l'animation elle-même, mais son
// fond doit rester identifiable comme "Éclat" plutôt que de retomber sur le
// dégradé sombre de base (voir GALLERY_THEMES.eclat.background), qui à lui
// seul ne distingue pas ce thème des autres thèmes à dégradé sombre.
export const ECLAT_ARC_ORANGE = '#FF7A1A'
export const ECLAT_ARC_RED = '#E4322C'
export const ECLAT_ARC_VIOLET = '#7A2EBF'

export const ECLAT_GRADIENT: Record<EclatVariant, string> = {
  braise: 'radial-gradient(circle at 50% 50%, #FF7A1A 0%, #E4322C 45%, #7A2EBF 100%)',
  maree: 'linear-gradient(115deg, #FF7A1A 0%, #E4322C 30%, #7A2EBF 60%, #FF7A1A 100%)',
  crepuscule: 'linear-gradient(135deg, #FF7A1A 0%, #E4322C 50%, #7A2EBF 100%)',
  eclipse: 'conic-gradient(from 0deg at 50% 50%, #FF7A1A 0%, #E4322C 33%, #7A2EBF 66%, #FF7A1A 100%)',
  nebuleuse: 'linear-gradient(160deg, #FF7A1A 0%, #E4322C 50%, #7A2EBF 100%)',
}

// Même forme de dégradé que ECLAT_GRADIENT ci-dessus (formes, angles, stops
// identiques), mais avec une palette de 3 couleurs libre — réutilisé par le
// fond animé du mode Personnalisé (voir CustomThemeSettings.animatedColors
// dans src/types/profile.ts), qui reprend la mécanique d'Éclat sans imposer
// sa palette. ECLAT_GRADIENT reste la version figée sur la palette de la
// Galerie, non dérivée de cette fonction, pour ne rien risquer sur le thème
// existant.
export function buildAnimatedGradient(variant: EclatVariant, colors: [string, string, string]): string {
  const [c1, c2, c3] = colors
  switch (variant) {
    case 'braise':
      return `radial-gradient(circle at 50% 50%, ${c1} 0%, ${c2} 45%, ${c3} 100%)`
    case 'maree':
      return `linear-gradient(115deg, ${c1} 0%, ${c2} 30%, ${c3} 60%, ${c1} 100%)`
    case 'crepuscule':
      return `linear-gradient(135deg, ${c1} 0%, ${c2} 50%, ${c3} 100%)`
    case 'eclipse':
      return `conic-gradient(from 0deg at 50% 50%, ${c1} 0%, ${c2} 33%, ${c3} 66%, ${c1} 100%)`
    case 'nebuleuse':
      return `linear-gradient(160deg, ${c1} 0%, ${c2} 50%, ${c3} 100%)`
  }
}

// "Vif, saturation pleine" (Braise/Marée) → "assourdi" (Crépuscule/Éclipse)
// → "très subtil, faible opacité" (Nébuleuse) — l'opacité du calque contre
// le fond sombre fixe suffit à porter cette distinction, sans avoir besoin
// d'un filter: saturate() séparé par variante.
export const ECLAT_OPACITY: Record<EclatVariant, number> = {
  braise: 0.92,
  maree: 0.85,
  crepuscule: 0.55,
  eclipse: 0.4,
  nebuleuse: 0.18,
}

// Deux propriétés qui bougent nécessitent une marge de débordement pour ne
// jamais laisser un coin découvert pendant l'animation (pulse qui rétrécit,
// glissement, rotation) — Crépuscule/Nébuleuse restent immobiles, inset-0
// suffit.
export const ECLAT_NEEDS_OVERSCAN: Record<EclatVariant, boolean> = {
  braise: true,
  maree: true,
  crepuscule: false,
  eclipse: true,
  nebuleuse: false,
}

export const ECLAT_ANIMATION_CLASS: Record<EclatVariant, string> = {
  braise: 'animate-eclat-braise',
  maree: 'animate-eclat-maree',
  crepuscule: 'animate-eclat-crepuscule',
  eclipse: 'animate-eclat-eclipse',
  nebuleuse: 'animate-eclat-nebuleuse',
}

export function isEclatVariant(value: string): value is EclatVariant {
  return value in ECLAT_GRADIENT
}
