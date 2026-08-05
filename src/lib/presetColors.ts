import type { ThemePreset } from '@/types'

// Miroir JS des valeurs de src/styles/tokens.css — nécessaire ici car ces
// usages (favicon dynamique, aperçu des presets avant activation) doivent
// lire une couleur AVANT que [data-preset] ne soit appliqué au DOM, donc
// avant que la variable CSS ne soit disponible.
export const PRESET_COLORS: Record<ThemePreset, { ink: string; paper: string; accent: string }> = {
  terminal: { ink: '#0d0e0c', paper: '#edeae3', accent: '#e4a93c' },
  ledger: { ink: '#0b0f14', paper: '#e8e4d9', accent: '#c9a24b' },
  vault: { ink: '#0e1113', paper: '#e4e7e6', accent: '#6fa8c7' },
  tape: { ink: '#0f0d0a', paper: '#f0ead6', accent: '#3f9c93' },
}
