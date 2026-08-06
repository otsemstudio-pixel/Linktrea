import { useId } from 'react'
import { guillochePaths, sealOutlinePath, GUILLOCHE_EXTENT } from '@/lib/svg/guilloche'

// Sceau façon cachet officiel (Phase 3) : contour dentelé + guillochis en
// son centre — même trame que l'en-tête, réutilisée à une autre échelle et
// une opacité plus marquée puisqu'ici elle EST le motif, pas un fond discret.
export default function CertificateSeal() {
  const clipId = useId()
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
