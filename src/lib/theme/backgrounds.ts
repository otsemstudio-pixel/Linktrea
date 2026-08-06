// Les 4 fonds de la refonte design (Phase 1). Remplacent les 4 presets
// figés : ici seul le fond est prédéfini, l'accent reste libre (voir
// accentSuggestions.ts et color.ts). `isLight` pilote la direction de
// l'ajustement de contraste de l'accent choisi par l'utilisateur — on
// assombrit sur fond clair, on éclaircit sur fond sombre, jamais l'inverse.
import type { BackgroundId } from '@/types'

export type BackgroundDefinition = {
  id: BackgroundId
  label: string
  character: string
  base: string
  isLight: boolean
}

export const BACKGROUNDS: Record<BackgroundId, BackgroundDefinition> = {
  graphite: { id: 'graphite', label: 'Graphite', character: 'Chaud, sobre, par défaut', base: '#0D0E0C', isLight: false },
  encre: { id: 'encre', label: 'Encre', character: 'Bleu nuit, institutionnel', base: '#0A0F1A', isLight: false },
  papier: { id: 'papier', label: 'Papier', character: 'Clair, relevé imprimé', base: '#EDE8DE', isLight: true },
  onyx: { id: 'onyx', label: 'Onyx', character: 'Noir absolu, contraste maximal', base: '#000000', isLight: false },
}

export const BACKGROUND_IDS = Object.keys(BACKGROUNDS) as BackgroundId[]
