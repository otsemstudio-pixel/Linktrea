import type { Profile } from '@/types'

export function createEmptyProfile(): Profile {
  return {
    identity: {
      fullName: '',
      headline: '',
      location: '',
      bio: '',
      photo: null,
      availability: 'closed',
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
  }
}
