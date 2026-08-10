// Traitement d'affichage de la photo (personnalisation avancée, Phase 2).
// Le duoton passe par un filtre SVG déclaratif (feColorMatrix +
// feComponentTransfer), pas par Canvas : ça reste purement CSS/SVG, pas de
// rendu bitmap à regénérer à chaque changement d'accent ou de fond.
import type { PhotoTreatment } from '@/types'
import { hexToRgb } from './color'

// Niveaux de gris pondérés par luminance perçue (ITU-R BT.601) avant
// mappage vers les deux couleurs du duoton — une moyenne simple 0.33/0.33/
// 0.33 sous-pondère le vert, qui domine pourtant la perception de clarté ;
// le résultat serait visiblement plus terne que le rendu attendu.
export const GRAYSCALE_MATRIX = '0.299 0.587 0.114 0 0  0.299 0.587 0.114 0 0  0.299 0.587 0.114 0 0  0 0 0 1 0'

export type DuotoneChannels = { r: string; g: string; b: string }

// tableValues d'un feFuncX type="table" à deux entrées : la valeur en 0
// (ombre) devient darkHex, la valeur en 1 (lumière) devient lightHex — le
// dégradé entre les deux est interpolé linéairement par le navigateur.
export function duotoneChannels(darkHex: string, lightHex: string): DuotoneChannels {
  const dark = hexToRgb(darkHex)
  const light = hexToRgb(lightHex)
  return {
    r: `${dark[0]} ${light[0]}`,
    g: `${dark[1]} ${light[1]}`,
    b: `${dark[2]} ${light[2]}`,
  }
}

// undefined plutôt que 'none' : passé directement à style={{ filter }},
// où une propriété absente ne pose aucune règle CSS (le repli 'none' du
// navigateur suffit), contrairement à filter: 'none' qui écrirait une
// règle inutile.
export function photoFilterCss(treatment: PhotoTreatment, duotoneFilterId: string): string | undefined {
  switch (treatment) {
    case 'grayscale':
      return 'grayscale(1)'
    case 'duotone':
      return `url(#${duotoneFilterId})`
    case 'sepia':
      return 'sepia(0.6)'
    case 'high-contrast':
      return 'contrast(1.25) brightness(0.95)'
    case 'muted':
      return 'saturate(0.35)'
    case 'none':
      return undefined
  }
}

// Vignette (correctif "filtres photo étendus") — calque, pas un filtre : un
// radial-gradient transparent au centre / sombre en périphérie, posé
// PAR-DESSUS l'image plutôt que sur elle, pour rester combinable avec
// n'importe lequel des six traitements ci-dessus (voir PhotoTreatment dans
// src/types/profile.ts pour le choix d'en faire un booléen séparé).
export const VIGNETTE_OVERLAY_CSS = 'radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,0.65) 100%)'
