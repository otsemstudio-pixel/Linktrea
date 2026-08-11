import { useEffect, useState } from 'react'
import { animate } from 'motion/react'
import type { Domain } from '@/types'
import { useMotionPrefs } from '@/lib/motion/MotionPrefsContext'
import { INTRO_TIMELINE } from '@/lib/motion/timeline'
import { VOCABULARY } from '@/lib/vocabulary'
import Sparkline from '@/components/Sparkline'

type Props = {
  domain: Domain
  years: number
  positionsCount: number
  holdingsCount: number
  trend: number[]
  // Thème "Éclat" (prompt dédié, Phase 3 — lisibilité par-dessus le fond) :
  // la carte est normalement translucide (bg-ink-raised/50), pensée pour un
  // fond calme. Sur le dégradé chromatique animé et vif d'Éclat, cette
  // transparence laisserait le texte perdre du contraste selon la couleur
  // qui défile derrière — ce seul thème demande une carte opaque, jamais les
  // 12 autres (voir ProfileView.tsx, seul appelant qui calcule ce booléen).
  vividBackground?: boolean
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

export default function KeyMetric({ domain, years, positionsCount, holdingsCount, trend, vividBackground = false }: Props) {
  const { reduced, profile } = useMotionPrefs()
  const displayedYears = useCountUp(years, reduced, profile.durationScale)
  const hasHoldings = holdingsCount > 0
  const vocabulary = VOCABULARY[domain]

  return (
    <section className="px-6 py-4 @min-[1024px]:px-0">
      <div
        className={`rounded-[var(--radius-lg)] border border-ink-raised p-5 ${vividBackground ? 'bg-ink-raised' : 'bg-ink-raised/50'}`}
      >
        <div className="flex items-start justify-between gap-3">
          <p className="text-label uppercase tracking-label text-muted pt-1">{vocabulary.keyMetric}</p>
          {positionsCount > 0 && (
            <span className="inline-flex items-center gap-1 min-h-7 px-2.5 rounded-[var(--radius-sm)] bg-up/15 text-up text-xs font-mono font-medium shrink-0">
              ▲ {positionsCount} {positionsCount > 1 ? 'postes' : 'poste'}
            </span>
          )}
        </div>

        <p className="font-mono font-medium text-hero leading-none mt-3">
          {displayedYears} {vocabulary.keyMetricUnit.toUpperCase()}
        </p>
        <p className="mt-1.5 text-xs text-muted">
          {hasHoldings ? `${holdingsCount} compétence${holdingsCount > 1 ? 's' : ''} recensée${holdingsCount > 1 ? 's' : ''}` : ' '}
        </p>

        <div className="mt-3 rounded-[var(--radius-sm)] bg-ink/60 px-2 pt-3 pb-1">
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
