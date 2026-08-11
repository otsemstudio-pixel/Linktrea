// Icônes de plateformes fidèles à la marque (prompt "Icônes de plateformes
// et collage d'URL auto-détecté", Partie 1) — tracés SVG et couleurs de
// marque officielles depuis Simple Icons (CC0), plutôt que redessinés à la
// main. Un seul point d'entrée pour toute l'appli (voir PlatformIcon.tsx) :
// isole la dépendance à ce fichier, plutôt que de laisser chaque composant
// importer `simple-icons` lui-même.
//
// Import nommé depuis 'simple-icons' (pas 'simple-icons/icons', dépréciée à
// partir de la v17) — seules les icônes des plateformes réellement
// supportées sont importées, jamais le paquet entier : Rollup élague le
// reste au build (voir le commentaire de vérification dans le prompt, poids
// mesuré avant/après).
//
// LinkedIn n'existe PAS dans Simple Icons — retiré de la bibliothèque à la
// demande de LinkedIn (litige de marque). Reste sur le symbole texte
// existant (voir platformSymbols.ts) plutôt qu'un tracé reconstitué à la
// main, seule exception à ce système (décision utilisateur explicite).
import { siGithub, siX, siBehance, siInstagram, siTiktok, siYoutube } from 'simple-icons'
import type { TickerPlatform } from '@/types'

export type BrandIconData = {
  path: string
  // Hex SANS le # (format natif de simple-icons) — voir resolvePlatformIconColor.
  hex: string
}

// Partial : linkedin/email/website n'ont délibérément pas d'entrée ici (pas
// des marques, ou marque absente du paquet — voir PlatformIcon.tsx pour
// leurs pictogrammes de repli).
export const BRAND_ICONS: Partial<Record<TickerPlatform, BrandIconData>> = {
  github: { path: siGithub.path, hex: siGithub.hex },
  x: { path: siX.path, hex: siX.hex },
  behance: { path: siBehance.path, hex: siBehance.hex },
  instagram: { path: siInstagram.path, hex: siInstagram.hex },
  tiktok: { path: siTiktok.path, hex: siTiktok.hex },
  youtube: { path: siYoutube.path, hex: siYoutube.hex },
}
