import type { Position, Domain } from '@/types'
import { sortedPositions, displayYearRange } from '@/lib/deriveStats'
import { useMotionPrefs } from '@/lib/motion/MotionPrefsContext'
import { VOCABULARY } from '@/lib/vocabulary'
import { resolveVisualFamily } from '@/lib/theme/visualFamily'
import { sealOutlinePath } from '@/lib/svg/guilloche'

type Props = {
  domain: Domain
  positions: Position[]
}

// Position horizontale (px) du rail/ruban et du centre des marqueurs — plus
// large en "protocole" pour laisser la place au ruban (voir RIBBON_WIDTH)
// sans empiéter sur le texte (pl-7 = 28px de marge par <li>, voir plus bas).
const RAIL_X_MARCHE = 5
const RAIL_X_PROTOCOLE = 9
const RIBBON_WIDTH = 14

export default function PositionsHistory({ domain, positions }: Props) {
  const { reduced } = useMotionPrefs()
  const sorted = sortedPositions(positions)
  const vocabulary = VOCABULARY[domain]
  const family = resolveVisualFamily(domain)
  const railX = family === 'protocole' ? RAIL_X_PROTOCOLE : RAIL_X_MARCHE

  return (
    <section className="px-6 py-6 border-t border-ink-raised @min-[1024px]:px-0">
      <h2 className="text-label uppercase tracking-label text-muted mb-4">{vocabulary.history}</h2>

      {sorted.length === 0 ? (
        <p className="text-sm text-muted">Aucune position renseignée pour le moment.</p>
      ) : (
        <ol className="relative">
          {/* Rail/ruban continu : un seul tracé qui traverse toute la frise,
              sous les marqueurs et les cartes — pas un tracé par élément.
              "Protocole" (Diplomatie, prompt dédié) remplace le simple trait
              par un ruban plus large à pli central en dégradé, dans l'esprit
              d'un ruban de décoration officielle — "marché" est inchangé. */}
          {family === 'protocole' ? (
            <div
              aria-hidden="true"
              className="absolute top-2 bottom-2 rounded-full text-accent"
              style={{
                left: railX - RIBBON_WIDTH / 2,
                width: RIBBON_WIDTH,
                background:
                  'linear-gradient(to right, transparent, currentColor 35%, currentColor 65%, transparent)',
                opacity: 0.3,
              }}
            />
          ) : (
            <div aria-hidden="true" className="absolute top-2 bottom-2 w-px bg-ink-raised" style={{ left: railX }} />
          )}
          {sorted.map((position) => {
            const current = position.endDate === null
            return (
              <li key={position.id} className="relative pl-7 pb-6 last:pb-0">
                {family === 'protocole' ? (
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    className={'absolute top-0 size-3.5 ' + (current ? 'text-accent' : 'text-ink-raised')}
                    style={{ left: railX - 7 }}
                  >
                    <path d={sealOutlinePath(12, 12, 11, 9, 8)} fill="var(--ink)" stroke="currentColor" strokeWidth="1.5" />
                    <circle cx="12" cy="12" r="3" fill="currentColor" />
                  </svg>
                ) : (
                  <span
                    aria-hidden="true"
                    className={
                      'absolute top-1.5 size-2.5 rounded-full ' +
                      (current ? 'bg-accent' : 'bg-ink border-2 border-ink-raised')
                    }
                    style={{ left: railX - 5 }}
                  />
                )}

                <div
                  className={
                    'rounded-[var(--radius-lg)] p-4' +
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
