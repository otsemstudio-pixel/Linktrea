import { useEffect, useState } from 'react'
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
  if (trend.length < 2) return null
  const width = 320
  const height = 48
  const max = Math.max(...trend)
  const min = Math.min(...trend)
  const range = max - min || 1
  const points = trend.map((value, i) => {
    const x = (i / (trend.length - 1)) * width
    const y = height - ((value - min) / range) * height
    return `${x},${y}`
  })

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-12" preserveAspectRatio="none" aria-hidden="true">
      <motion.polyline
        points={points.join(' ')}
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

  return (
    <section className="px-6 py-6 border-t border-ink-raised">
      <p className="text-label uppercase tracking-label text-muted">Valeur totale</p>
      <p className="font-mono font-medium text-hero leading-none mt-2">{displayedYears} ANS</p>
      <p className="mt-2 text-xs text-up">
        ▲ +{positionsCount} postes · {holdingsCount} compétences
      </p>
      <div className="mt-4">
        <Sparkline trend={trend} />
      </div>
    </section>
  )
}
