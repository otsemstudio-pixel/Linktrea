import type { TickerPlatform } from '@/types'

// Symboles courts façon ticker boursier — depuis le prompt "Icônes de
// plateformes..." (Partie 1), plus qu'un simple repli visuel : PlatformIcon.tsx
// utilise désormais de vraies icônes de marque (Simple Icons) pour la
// plupart des plateformes, ce tableau ne sert plus qu'à LinkedIn (absent de
// Simple Icons, voir platformIcons.ts) et au badge compact du dashboard de
// statistiques (StatsOverlay.tsx), où un symbole texte reste plus lisible
// qu'une icône minuscule.
export const PLATFORM_SYMBOLS: Record<TickerPlatform, string> = {
  linkedin: 'LNKD',
  github: 'GTHB',
  x: 'X',
  behance: 'BHNC',
  instagram: 'INST',
  tiktok: 'TKTK',
  youtube: 'YT',
  email: 'MAIL',
  website: 'WEB',
}
