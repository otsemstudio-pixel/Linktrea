import type { Profile } from '@/types'

export function createEmptyProfile(): Profile {
  return {
    domain: 'finance',
    identity: {
      fullName: '',
      headline: '',
      location: '',
      bio: '',
      photo: null,
      photoTreatment: 'none',
      photoVignette: false,
      availability: 'closed',
      signature: '',
    },
    positions: [],
    holdings: [],
    certificates: [],
    tickers: [],
    theme: {
      background: 'graphite',
      accent: '#E4A93C',
      fontDuo: 'suisse',
      motion: 'full',
    },
    // Thème nommé "Ledger" par défaut — voir AppearanceConfig (refonte v2,
    // Phase 1) : structure seule pour l'instant, ne pilote pas encore le
    // rendu (voir le commentaire sur ThemeConfig dans src/types/profile.ts).
    appearance: {
      kind: 'gallery',
      themeId: 'ledger',
      animatedBackground: false,
      eclatVariant: 'braise',
      motion: 'full',
    },
  }
}
