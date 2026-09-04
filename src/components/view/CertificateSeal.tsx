import { useId } from 'react'
import type { Domain } from '@/types'
import { resolveVisualFamily } from '@/lib/theme/visualFamily'
import { guillochePaths, sealOutlinePath, GUILLOCHE_EXTENT } from '@/lib/svg/guilloche'
import { laurelWreathLeaves } from '@/lib/svg/rosette'

type Props = {
  domain: Domain
}

// Contour dentelé commun aux deux familles (même silhouette de cachet
// officiel, voir sealOutlinePath) — seul l'intérieur du sceau change de
// famille visuelle : guillochis pour "marché", couronne de lauriers pour
// "protocole" (prompt domaine Diplomatie, Phase 2). currentColor partout :
// la couleur reste un choix de thème, indépendant de la famille (voir
// visualFamily.ts).
export default function CertificateSeal({ domain }: Props) {
  const clipId = useId()
  const family = resolveVisualFamily(domain)

  if (family === 'protocole') {
    const ringR = 12
    const leaves = laurelWreathLeaves(ringR)
    return (
      <svg viewBox="0 0 48 48" className="size-11 shrink-0 text-accent" aria-hidden="true">
        <path d={sealOutlinePath(24, 24, 22, 19, 16)} fill="none" stroke="currentColor" strokeWidth="1.2" opacity="0.9" />
        <circle cx="24" cy="24" r="16" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.4" />
        <g transform="translate(24 24)">
          {leaves.map((leaf, i) => (
            <path
              key={i}
              d={leaf.d}
              transform={leaf.transform}
              fill="currentColor"
              opacity={leaf.tone === 'secondary' ? 0.55 : 0.85}
            />
          ))}
          {/* Nœud bas de la couronne, où les deux branches se rejoignent. */}
          <circle cx="0" cy={ringR} r="1.6" fill="currentColor" opacity="0.85" />
        </g>
      </svg>
    )
  }

  const e = GUILLOCHE_EXTENT
  return (
    <svg viewBox="0 0 48 48" className="size-11 shrink-0 text-accent" aria-hidden="true">
      <defs>
        <clipPath id={clipId}>
          <circle cx="24" cy="24" r="14" />
        </clipPath>
      </defs>
      <path d={sealOutlinePath(24, 24, 22, 19, 16)} fill="none" stroke="currentColor" strokeWidth="1.2" opacity="0.9" />
      <circle cx="24" cy="24" r="16" fill="none" stroke="currentColor" strokeWidth="0.75" opacity="0.5" />
      <g clipPath={`url(#${clipId})`} opacity="0.55">
        {guillochePaths().map((d, i) => (
          <path
            key={i}
            d={d}
            fill="none"
            stroke="currentColor"
            strokeWidth="0.35"
            transform={`translate(24 24) scale(${14 / e})`}
          />
        ))}
      </g>
    </svg>
  )
}
