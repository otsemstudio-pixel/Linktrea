import type { Domain } from '@/types'
import { resolveVisualFamily } from '@/lib/theme/visualFamily'
import { guillochePaths, GUILLOCHE_EXTENT } from '@/lib/svg/guilloche'
import { rosettePaths, ROSETTE_EXTENT } from '@/lib/svg/rosette'

type Props = {
  domain: Domain
  className?: string
}

// Signature visuelle du projet — la même trame pour l'en-tête, les sceaux de
// certificats (Phase 3) et les fonds "texture" de la Galerie (refonte v2,
// Phase 2) : un seul tracé par famille visuelle, réutilisé à différentes
// échelles et opacités plutôt que dupliqué. Le choix du tracé (trame
// entrelacée "marché" ou rosace radiante "protocole") se fait ici, au seul
// endroit qui lit resolveVisualFamily pour ce motif — voir visualFamily.ts.
export default function GuillochePattern({ domain, className = 'text-accent opacity-[0.06]' }: Props) {
  const family = resolveVisualFamily(domain)
  const paths = family === 'protocole' ? rosettePaths() : guillochePaths()
  const e = family === 'protocole' ? ROSETTE_EXTENT : GUILLOCHE_EXTENT
  return (
    <svg
      viewBox={`${-e} ${-e} ${e * 2} ${e * 2}`}
      preserveAspectRatio="xMidYMid slice"
      className={`absolute inset-0 size-full ${className}`}
      aria-hidden="true"
    >
      {paths.map((d, i) => (
        <path key={i} d={d} fill="none" stroke="currentColor" strokeWidth="0.35" />
      ))}
    </svg>
  )
}
