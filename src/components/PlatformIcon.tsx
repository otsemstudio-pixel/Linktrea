import { Mail, Globe } from 'lucide-react'
import type { TickerPlatform, PlatformIconStyle } from '@/types'
import { BRAND_ICONS } from '@/lib/platformIcons'
import { PLATFORM_SYMBOLS } from '@/lib/platformSymbols'

type Props = {
  platform: TickerPlatform
  style: PlatformIconStyle
  size?: number
  className?: string
}

// 'accent' résout en var(--accent) directement (déjà posée en CSS par
// useAppliedTheme, voir tokens.css) plutôt qu'un hex calculé et transmis en
// prop — évite de faire porter une couleur de thème en plus du style à
// travers toute la chaîne de composants jusqu'ici.
function resolveColor(style: PlatformIconStyle, brandHex: string | undefined): string {
  if (style === 'brand' && brandHex) return `#${brandHex}`
  if (style === 'white') return '#FFFFFF'
  if (style === 'black') return '#000000'
  return 'var(--accent)'
}

// Système d'icônes fidèles à la marque (prompt "Icônes de plateformes...",
// Partie 1) — voir platformIcons.ts pour la source des tracés (Simple
// Icons) et le sort de LinkedIn (absent de la bibliothèque, reste en
// symbole texte). email/website ne sont pas des marques : pictogramme
// générique Lucide, qui suit quand même le style choisi.
export default function PlatformIcon({ platform, style, size = 18, className }: Props) {
  if (platform === 'linkedin') {
    return <span className={className}>{PLATFORM_SYMBOLS.linkedin}</span>
  }

  const brand = BRAND_ICONS[platform]
  if (brand) {
    const color = resolveColor(style, brand.hex)
    return (
      <svg viewBox="0 0 24 24" width={size} height={size} className={className} aria-hidden="true">
        <path d={brand.path} fill={color} />
      </svg>
    )
  }

  const Icon = platform === 'email' ? Mail : Globe
  if (style === 'brand') {
    // Pas de couleur de marque pour un canal générique — hérite du texte
    // ambiant (comme LinkedIn ci-dessus) plutôt qu'un repli fixe : un repli
    // sur l'accent pouvait se fondre dans un fond de pastille qui EST
    // l'accent (buttonStyle 'solid', voir cardStyle.ts) — bug repéré à
    // l'usage en testant ce composant.
    return <Icon size={size} className={className} aria-hidden="true" />
  }
  return <Icon size={size} color={resolveColor(style, undefined)} className={className} aria-hidden="true" />
}
