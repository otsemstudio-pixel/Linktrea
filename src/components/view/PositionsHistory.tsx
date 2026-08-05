import type { Position } from '@/types'
import { sortedPositions, displayYearRange } from '@/lib/deriveStats'
import { useMotionPrefs } from '@/lib/motion/MotionPrefsContext'

type Props = {
  positions: Position[]
}

export default function PositionsHistory({ positions }: Props) {
  const { reduced } = useMotionPrefs()

  return (
    <section className="px-6 py-6 border-t border-ink-raised @min-[1024px]:px-0">
      <h2 className="text-label uppercase tracking-label text-muted mb-3">Historique des positions</h2>

      {positions.length === 0 ? (
        <p className="text-sm text-muted">Aucune position renseignée pour le moment.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {sortedPositions(positions).map((position) => (
            <li
              key={position.id}
              className={
                'rounded-lg border border-ink-raised bg-ink-raised/40 p-4' +
                (reduced ? '' : ' active:scale-[0.985] transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]')
              }
            >
              <div className="flex justify-between items-baseline gap-2">
                <span className="font-mono text-xs text-muted">{displayYearRange(position)}</span>
                {position.endDate === null && (
                  <span className="text-[10px] uppercase tracking-label text-up">En cours</span>
                )}
              </div>
              <p className="mt-1 font-medium">{position.role}</p>
              <p className="text-sm text-muted">{position.company}</p>
              {position.description && <p className="mt-2 text-sm">{position.description}</p>}
              {position.highlights.length > 0 && (
                <ul className="mt-2 flex flex-col gap-1">
                  {position.highlights.slice(0, 3).map((highlight, i) => (
                    <li key={i} className="text-sm text-muted flex gap-1.5">
                      <span aria-hidden="true">▸</span>
                      {highlight}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
