import { useEffect, useId, useState } from 'react'
import { motion, animate } from 'motion/react'
import { useMotionPrefs } from '@/lib/motion/MotionPrefsContext'
import { INTRO_TIMELINE } from '@/lib/motion/timeline'

type Props = {
  years: number
  positionsCount: number
  holdingsCount: number
  trend: number[]
}

function Sparkline({ trend }: { trend: number[] }) {
  const { reduced, profile } = useMotionPrefs()
  const gradientId = useId()
  const width = 320
  const height = 48
  const max = Math.max(...trend)
  const min = Math.min(...trend)
  const range = max - min || 1
  const points = trend.map((value, i) => {
    const x = (i / (trend.length - 1)) * width
    const y = height - ((value - min) / range) * height
    return [x, y] as const
  })
  const linePoints = points.map(([x, y]) => `${x},${y}`).join(' ')
  const areaPath = `M${points.map(([x, y]) => `${x},${y}`).join('L')}L${width},${height}L0,${height}Z`

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-12" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.35" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <motion.path
        d={areaPath}
        fill={`url(#${gradientId})`}
        initial={{ opacity: reduced ? 1 : 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: reduced ? 0 : INTRO_TIMELINE.sparkline, duration: reduced ? 0 : 0.6 * profile.durationScale }}
      />
      <motion.polyline
        points={linePoints}
        fill="none"
        stroke="var(--accent)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: reduced ? 1 : 0 }}
        animate={{ pathLength: 1 }}
        transition={{ delay: reduced ? 0 : INTRO_TIMELINE.sparkline, duration: reduced ? 0 : 0.8 * profile.durationScale, ease: 'easeOut' }}
      />
    </svg>
  )
}

// Le compteur ne dépend pas de transform/opacity : c'est le contenu texte
// qui change à chaque frame, pas une propriété CSS animée — pas de coût
// de mise en page, donc pas concerné par la restriction "transform/opacity".
function useCountUp(target: number, reduced: boolean, durationScale: number): number {
  const [value, setValue] = useState(reduced ? target : 0)

  useEffect(() => {
    if (reduced) {
      setValue(target)
      return
    }
    setValue(0)
    const controls = animate(0, target, {
      delay: INTRO_TIMELINE.counter,
      duration: INTRO_TIMELINE.counterDuration * durationScale,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (latest) => setValue(Math.round(latest)),
    })
    return () => controls.stop()
  }, [target, reduced, durationScale])

  return value
}

export default function KeyMetric({ years, positionsCount, holdingsCount, trend }: Props) {
  const { reduced, profile } = useMotionPrefs()
  const displayedYears = useCountUp(years, reduced, profile.durationScale)
  const hasHoldings = holdingsCount > 0

  return (
    <section className="px-6 py-4 @min-[1024px]:px-0">
      <div className="rounded-lg border border-ink-raised bg-ink-raised/50 p-5">
        <div className="flex items-start justify-between gap-3">
          <p className="text-label uppercase tracking-label text-muted pt-1">Valeur totale</p>
          {positionsCount > 0 && (
            <span className="inline-flex items-center gap-1 min-h-7 px-2.5 rounded-full bg-up/15 text-up text-xs font-mono font-medium shrink-0">
              ▲ {positionsCount} {positionsCount > 1 ? 'postes' : 'poste'}
            </span>
          )}
        </div>

        <p className="font-mono font-medium text-hero leading-none mt-3">{displayedYears} ANS</p>
        <p className="mt-1.5 text-xs text-muted">
          {hasHoldings ? `${holdingsCount} compétence${holdingsCount > 1 ? 's' : ''} recensée${holdingsCount > 1 ? 's' : ''}` : ' '}
        </p>

        <div className="mt-3 rounded-md bg-ink/60 px-2 pt-3 pb-1">
          {hasHoldings ? (
            <Sparkline trend={trend} />
          ) : (
            <p className="h-12 flex items-center justify-center text-xs text-muted">Pas encore de données</p>
          )}
        </div>
      </div>
    </section>
  )
}
