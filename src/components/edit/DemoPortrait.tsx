import { useId, type CSSProperties } from 'react'

type Props = {
  className?: string
  style?: CSSProperties
}

// Portrait neutre de démonstration (personnalisation avancée, Phase 2) —
// SVG inline plutôt qu'un asset bitmap : aucune requête, aucun fichier à
// livrer. Buste stylisé avec un dégradé (pas un aplat) pour que les trois
// traitements restent visuellement distincts même sans photo réelle — un
// aplat uni rendrait grayscale/duoton indiscernables de "Aucun", puisqu'il
// n'y aurait aucune variation de luminance à transformer.
export default function DemoPortrait({ className, style }: Props) {
  const gradientId = useId()
  return (
    <svg viewBox="0 0 100 100" className={className} style={style} role="img" aria-label="Portrait de démonstration">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#D8D2C4" />
          <stop offset="100%" stopColor="#6B655A" />
        </linearGradient>
      </defs>
      <rect width="100" height="100" fill={`url(#${gradientId})`} />
      <circle cx="50" cy="38" r="18" fill="#3A362E" opacity="0.55" />
      <path d="M20 100 C20 70 35 58 50 58 C65 58 80 70 80 100 Z" fill="#3A362E" opacity="0.55" />
    </svg>
  )
}
