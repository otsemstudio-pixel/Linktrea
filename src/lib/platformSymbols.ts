import type { TickerPlatform } from '@/types'

// lucide-react n'expose plus d'icônes de marque (Linkedin, Github, X...) —
// retirées du set pour raisons de droits. On assume ce choix : chaque
// réseau devient un symbole 4-5 lettres à la façon d'un ticker boursier,
// cohérent avec l'élément signature du bandeau.
export const PLATFORM_SYMBOLS: Record<TickerPlatform, string> = {
  linkedin: 'LNKD',
  github: 'GTHB',
  x: 'X',
  behance: 'BHNC',
  instagram: 'INST',
  email: 'MAIL',
  website: 'WEB',
}
