// Les 14 duos typographiques (refonte design Phase 2). Ce fichier ne charge
// AUCUNE police — uniquement les métadonnées nécessaires au sélecteur
// (nom, intention, aperçu statique). Le chargement réel d'un duo se fait via
// loadFontDuo.ts, séparé exprès : importer fontDuos.ts pour afficher le
// sélecteur ne doit jamais tirer les polices des 14 paires dans le bundle.

import type { FontDuoId } from '@/types'

export type FontDuoDefinition = {
  id: FontDuoId
  name: string
  character: string
  // Familles + repli système métriquement proche, prêts à composer une
  // valeur font-family CSS complète : `'${titleFamily}', ${titleFallback}`.
  titleFamily: string
  titleFallback: string
  monoFamily: string
  monoFallback: string
}

const SERIF_FALLBACK = "Georgia, 'Times New Roman', serif"
const SANS_FALLBACK = "-apple-system, 'Segoe UI', Roboto, sans-serif"
const CONDENSED_FALLBACK = "'Arial Narrow', sans-serif"
const MONO_FALLBACK = "ui-monospace, 'SFMono-Regular', Consolas, 'Liberation Mono', monospace"
const TYPEWRITER_FALLBACK = "'Courier New', monospace"

export const FONT_DUOS: Record<FontDuoId, FontDuoDefinition> = {
  institutionnel: {
    id: 'institutionnel',
    name: 'Institutionnel',
    character: 'Sérif formel, façon document officiel',
    titleFamily: 'Source Serif 4',
    titleFallback: SERIF_FALLBACK,
    monoFamily: 'IBM Plex Mono',
    monoFallback: MONO_FALLBACK,
  },
  terminal: {
    id: 'terminal',
    name: 'Terminal',
    character: 'Tout en mono, écran de commande',
    titleFamily: 'Martian Mono',
    titleFallback: MONO_FALLBACK,
    monoFamily: 'JetBrains Mono',
    monoFallback: MONO_FALLBACK,
  },
  editorial: {
    id: 'editorial',
    name: 'Éditorial',
    character: 'Sérif de magazine, chaleureux',
    titleFamily: 'Newsreader',
    titleFallback: SERIF_FALLBACK,
    monoFamily: 'IBM Plex Mono',
    monoFallback: MONO_FALLBACK,
  },
  suisse: {
    id: 'suisse',
    name: 'Suisse',
    character: 'Grotesque international, neutre',
    titleFamily: 'Inter Tight',
    titleFallback: SANS_FALLBACK,
    monoFamily: 'JetBrains Mono',
    monoFallback: MONO_FALLBACK,
  },
  brut: {
    id: 'brut',
    name: 'Brut',
    character: 'Grotesque noir, brutaliste',
    titleFamily: 'Archivo',
    titleFallback: SANS_FALLBACK,
    monoFamily: 'Courier Prime',
    monoFallback: TYPEWRITER_FALLBACK,
  },
  classique: {
    id: 'classique',
    name: 'Classique',
    character: 'Sérif littéraire, calligraphique',
    titleFamily: 'Lora',
    titleFallback: SERIF_FALLBACK,
    monoFamily: 'DM Mono',
    monoFallback: MONO_FALLBACK,
  },
  technique: {
    id: 'technique',
    name: 'Technique',
    character: 'Sans ingénierie, précis',
    titleFamily: 'IBM Plex Sans',
    titleFallback: SANS_FALLBACK,
    monoFamily: 'IBM Plex Mono',
    monoFallback: MONO_FALLBACK,
  },
  moderne: {
    id: 'moderne',
    name: 'Moderne',
    character: 'Sans géométrique-humaniste, épuré',
    titleFamily: 'Geist',
    titleFallback: SANS_FALLBACK,
    monoFamily: 'JetBrains Mono',
    monoFallback: MONO_FALLBACK,
  },
  compact: {
    id: 'compact',
    name: 'Compact',
    character: 'Condensé, dense et efficace',
    titleFamily: 'Barlow Condensed',
    titleFallback: CONDENSED_FALLBACK,
    monoFamily: 'DM Mono',
    monoFallback: MONO_FALLBACK,
  },
  elegant: {
    id: 'elegant',
    name: 'Élégant',
    character: 'Didone à fort contraste, raffiné',
    titleFamily: 'Playfair Display',
    titleFallback: SERIF_FALLBACK,
    monoFamily: 'DM Mono',
    monoFallback: MONO_FALLBACK,
  },
  journal: {
    id: 'journal',
    name: 'Journal',
    character: 'Sérif de presse, lisible en colonnes',
    titleFamily: 'Bitter',
    titleFallback: SERIF_FALLBACK,
    monoFamily: 'Courier Prime',
    monoFallback: TYPEWRITER_FALLBACK,
  },
  machine: {
    id: 'machine',
    name: 'Machine',
    character: 'Display industriel, haute et serrée',
    titleFamily: 'Big Shoulders',
    titleFallback: CONDENSED_FALLBACK,
    monoFamily: 'Courier Prime',
    monoFallback: TYPEWRITER_FALLBACK,
  },
  geometrique: {
    id: 'geometrique',
    name: 'Géométrique',
    character: 'Sans construit au compas',
    titleFamily: 'Poppins',
    titleFallback: SANS_FALLBACK,
    monoFamily: 'Space Mono',
    monoFallback: MONO_FALLBACK,
  },
  humaniste: {
    id: 'humaniste',
    name: 'Humaniste',
    character: 'Sans organique, chaleureux',
    titleFamily: 'Work Sans',
    titleFallback: SANS_FALLBACK,
    monoFamily: 'DM Mono',
    monoFallback: MONO_FALLBACK,
  },
}

export const FONT_DUO_IDS = Object.keys(FONT_DUOS) as FontDuoId[]
