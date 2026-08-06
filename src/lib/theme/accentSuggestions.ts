// 12 accents pré-composés pour ceux qui ne veulent pas chercher dans le
// sélecteur HSL libre (Phase 1). Générés en OKLCH à chroma et clarté
// homogènes (l≈0.6-0.78, c≈0.13-0.18) réparties sur la roue des teintes —
// voir scripts/derive-theme-tokens.mjs pour la formule. Ce sont des points
// de départ : la couleur finale est de toute façon re-vérifiée et ajustée
// pour le contraste au moment de la sélection (voir color.ts).

export type AccentSuggestion = { name: string; hex: string }

export const ACCENT_SUGGESTIONS: AccentSuggestion[] = [
  { name: 'Ambre', hex: '#da950b' },
  { name: 'Or', hex: '#dab33a' },
  { name: 'Cuivre', hex: '#e67339' },
  { name: 'Corail', hex: '#f36451' },
  { name: 'Rose', hex: '#f46a86' },
  { name: 'Mauve', hex: '#c76ac0' },
  { name: 'Violet', hex: '#9769dc' },
  { name: 'Indigo', hex: '#6674de' },
  { name: 'Bleu', hex: '#4393e1' },
  { name: 'Sarcelle', hex: '#00b0b1' },
  { name: 'Émeraude', hex: '#32b36e' },
  { name: 'Olive', hex: '#94aa44' },
]
