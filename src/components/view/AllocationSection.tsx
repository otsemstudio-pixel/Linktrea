import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { ChevronDown } from 'lucide-react'
import type { Holding } from '@/types'
import { categoryAllocations, sortedHoldings } from '@/lib/deriveStats'
import { useMotionPrefs } from '@/lib/motion/MotionPrefsContext'
import { INTRO_TIMELINE } from '@/lib/motion/timeline'

type Props = {
  holdings: Holding[]
}

// Le remplissage "se fait" visuellement via scaleX (transform), jamais via
// une animation de width — la largeur finale est statique dès le montage,
// seule l'échelle horizontale anime de 0 à 1.
function Bar({ label, weight, introDelay }: { label: string; weight: number; introDelay: number | null }) {
  const { reduced, profile } = useMotionPrefs()
  const animated = introDelay !== null && !reduced

  return (
    <div className="py-2">
      <div className="flex justify-between text-sm mb-1.5">
        <span>{label}</span>
        <span className="font-mono text-muted">{weight}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-ink-raised overflow-hidden">
        <motion.div
          className="h-full bg-accent rounded-full origin-left"
          style={{ width: `${Math.min(100, weight)}%` }}
          initial={{ scaleX: animated ? 0 : 1 }}
          animate={{ scaleX: 1 }}
          transition={
            animated
              ? { delay: introDelay ?? 0, duration: 0.5 * profile.durationScale, ease: profile.ease }
              : { duration: 0 }
          }
        />
      </div>
    </div>
  )
}

const TOP_CATEGORIES_VISIBLE = 3

export default function AllocationSection({ holdings }: Props) {
  const [expanded, setExpanded] = useState(false)
  const { reduced } = useMotionPrefs()

  if (holdings.length === 0) {
    return (
      <section className="px-6 py-6 border-t border-ink-raised @min-[1024px]:border-t-0 @min-[1024px]:px-0">
        <h2 className="text-label uppercase tracking-label text-muted mb-3">Allocation</h2>
        <p className="text-sm text-muted">Aucune compétence renseignée pour le moment.</p>
      </section>
    )
  }

  const categories = categoryAllocations(holdings)
  const items = sortedHoldings(holdings)
  const visibleCategories = expanded ? categories : categories.slice(0, TOP_CATEGORIES_VISIBLE)

  return (
    <section className="px-6 py-6 border-t border-ink-raised @min-[1024px]:border-t-0 @min-[1024px]:px-0">
      <h2 className="text-label uppercase tracking-label text-muted mb-1">Allocation</h2>

      {visibleCategories.map((c, i) => (
        <Bar key={c.category} label={c.category} weight={c.weight} introDelay={INTRO_TIMELINE.allocation + i * INTRO_TIMELINE.allocationStagger} />
      ))}

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: reduced ? 0 : 0.3 }}
            className="overflow-hidden"
          >
            <div className="mt-4 pt-4 border-t border-ink-raised">
              <p className="text-label uppercase tracking-label text-muted mb-1">Détail par ligne</p>
              {items.map((h) => (
                <Bar key={h.id} label={h.label} weight={h.weight} introDelay={null} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {items.length > TOP_CATEGORIES_VISIBLE && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="mt-2 min-h-11 flex items-center gap-1 text-sm text-accent focus-visible:outline-2 focus-visible:outline-accent focus-visible:-outline-offset-2 rounded"
        >
          <motion.span animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: reduced ? 0 : 0.2 }} className="flex">
            <ChevronDown size={16} aria-hidden="true" />
          </motion.span>
          {expanded ? 'Réduire' : `Voir les ${items.length} lignes`}
        </button>
      )}
    </section>
  )
}
