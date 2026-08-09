import type { Position, Domain } from '@/types'
import { sortedPositions, displayYearRange } from '@/lib/deriveStats'
import { useMotionPrefs } from '@/lib/motion/MotionPrefsContext'
import { VOCABULARY } from '@/lib/vocabulary'

type Props = {
  domain: Domain
  positions: Position[]
}

const RAIL_X = 5 // position horizontale (px) du rail et du centre des pastilles

export default function PositionsHistory({ domain, positions }: Props) {
  const { reduced } = useMotionPrefs()
  const sorted = sortedPositions(positions)
  const vocabulary = VOCABULARY[domain]

  return (
    <section className="px-6 py-6 border-t border-ink-raised @min-[1024px]:px-0">
      <h2 className="text-label uppercase tracking-label text-muted mb-4">{vocabulary.history}</h2>

      {sorted.length === 0 ? (
        <p className="text-sm text-muted">Aucune position renseignée pour le moment.</p>
      ) : (
        <ol className="relative">
          {/* Rail continu : un seul trait qui traverse toute la frise, sous les
              pastilles et les cartes — pas un trait par élément. */}
          <div
            aria-hidden="true"
            className="absolute top-2 bottom-2 w-px bg-ink-raised"
            style={{ left: RAIL_X }}
          />
          {sorted.map((position) => {
            const current = position.endDate === null
            return (
              <li key={position.id} className="relative pl-7 pb-6 last:pb-0">
                <span
                  aria-hidden="true"
                  className={
                    'absolute top-1.5 size-2.5 rounded-full ' +
                    (current ? 'bg-accent' : 'bg-ink border-2 border-ink-raised')
                  }
                  style={{ left: RAIL_X - 5 }}
                />

                <div
                  className={
                    'rounded-lg p-4' +
                    (reduced ? '' : ' active:scale-[0.985] transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]')
                  }
                  style={{
                    background: 'var(--card-bg)',
                    color: 'var(--card-fg)',
                    borderStyle: 'solid',
                    borderWidth: 'var(--card-border-width)',
                    borderColor: 'var(--card-border-color)',
                    boxShadow: 'var(--card-shadow)',
                  }}
                >
                  <div className="flex justify-between items-baseline gap-2">
                    <span className="font-mono text-xs tabular-nums" style={{ color: 'var(--card-fg-muted)' }}>
                      {displayYearRange(position)}
                    </span>
                    {current && <span className="text-[10px] uppercase tracking-label text-up">En cours</span>}
                  </div>
                  <p className="mt-1 font-medium">{position.role}</p>
                  <p className="text-sm" style={{ color: 'var(--card-fg-muted)' }}>
                    {position.company}
                  </p>
                  {position.description && <p className="mt-2 text-sm">{position.description}</p>}
                  {position.highlights.length > 0 && (
                    <ul className="mt-2 flex flex-col gap-1">
                      {position.highlights.slice(0, 3).map((highlight, hi) => (
                        <li key={hi} className="text-sm flex gap-1.5" style={{ color: 'var(--card-fg-muted)' }}>
                          <span aria-hidden="true">▸</span>
                          {highlight}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </li>
            )
          })}
        </ol>
      )}
    </section>
  )
}
