import { guillochePaths, GUILLOCHE_EXTENT } from '@/lib/svg/guilloche'

type Props = {
  className?: string
}

// Signature visuelle du projet — la même trame de guillochis pour l'en-tête,
// les sceaux de certificats (Phase 3) et les fonds "texture" de la Galerie
// (refonte v2, Phase 2) : un seul tracé, réutilisé à différentes échelles et
// opacités plutôt que dupliqué.
export default function GuillochePattern({ className = 'text-accent opacity-[0.06]' }: Props) {
  const e = GUILLOCHE_EXTENT
  return (
    <svg
      viewBox={`${-e} ${-e} ${e * 2} ${e * 2}`}
      preserveAspectRatio="xMidYMid slice"
      className={`absolute inset-0 size-full ${className}`}
      aria-hidden="true"
    >
      {guillochePaths().map((d, i) => (
        <path key={i} d={d} fill="none" stroke="currentColor" strokeWidth="0.35" />
      ))}
    </svg>
  )
}
