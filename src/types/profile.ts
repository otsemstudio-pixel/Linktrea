// Modèle de données du profil "Ledger". Reflète exactement la structure
// sérialisée dans l'URL (voir src/lib/codec.ts) : tout changement de forme
// ici doit rester rétrocompatible avec les payloads déjà partagés.

export type Availability = 'open' | 'busy' | 'closed'

export type Identity = {
  fullName: string
  headline: string
  location: string
  bio: string
  photo: string | null
  availability: Availability
}

export type Position = {
  id: string
  role: string
  company: string
  startDate: string
  endDate: string | null
  description: string
  highlights: string[]
}

export type Holding = {
  id: string
  label: string
  category: string
  weight: number
  years: number
}

export type Certificate = {
  id: string
  title: string
  institution: string
  year: string
  credentialUrl: string | null
  fileUrl: string | null
}

export type TickerPlatform =
  | 'linkedin'
  | 'github'
  | 'x'
  | 'behance'
  | 'instagram'
  | 'email'
  | 'website'

export type Ticker = {
  id: string
  platform: TickerPlatform
  handle: string
  url: string
}

export type BackgroundId = 'graphite' | 'encre' | 'papier' | 'onyx'
export type FontDuoId =
  | 'institutionnel'
  | 'terminal'
  | 'editorial'
  | 'suisse'
  | 'brut'
  | 'classique'
  | 'technique'
  | 'moderne'
  | 'compact'
  | 'elegant'
  | 'journal'
  | 'machine'
  | 'geometrique'
  | 'humaniste'
export type MotionPreference = 'full' | 'reduced'

export type ThemeConfig = {
  background: BackgroundId
  accent: string
  fontDuo: FontDuoId
  motion: MotionPreference
}

export type Profile = {
  identity: Identity
  positions: Position[]
  holdings: Holding[]
  certificates: Certificate[]
  tickers: Ticker[]
  theme: ThemeConfig
}
