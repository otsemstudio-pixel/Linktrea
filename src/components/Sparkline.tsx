import { useId } from 'react'
import { motion } from 'motion/react'
import { useMotionPrefs } from '@/lib/motion/MotionPrefsContext'
import { INTRO_TIMELINE } from '@/lib/motion/timeline'

type Props = {
  trend: number[]
  // Délai d'entrée avant que le tracé ne s'anime — INTRO_TIMELINE.sparkline
  // par défaut (le chiffre clé du profil public), sinon 0 pour un contexte
  // sans autre séquence d'entrée à synchroniser (dashboard de l'éditeur).
  delay?: number
}

// Extrait de KeyMetric.tsx (dashboard de statistiques, Phase 3) : la même
// sparkline sert au chiffre clé du profil public ET à la tendance des vues
// dans l'éditeur, plutôt que deux implémentations du même tracé SVG.
export default function Sparkline({ trend, delay = INTRO_TIMELINE.sparkline }: Props) {
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
        transition={{ delay: reduced ? 0 : delay, duration: reduced ? 0 : 0.6 * profile.durationScale }}
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
        transition={{ delay: reduced ? 0 : delay, duration: reduced ? 0 : 0.8 * profile.durationScale, ease: 'easeOut' }}
      />
    </svg>
  )
}
