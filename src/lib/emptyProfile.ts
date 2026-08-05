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
      preset: 'terminal',
      accent: '#E4A93C',
      motion: 'full',
    },
  }
}
