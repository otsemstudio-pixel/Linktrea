import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { ChevronDown } from 'lucide-react'
import type { Holding, Domain } from '@/types'
import { categoryAllocations, sortedHoldings, weightSum } from '@/lib/deriveStats'
import { useMotionPrefs } from '@/lib/motion/MotionPrefsContext'
import { INTRO_TIMELINE } from '@/lib/motion/timeline'
import { resolveAccent, accentAllocationShades } from '@/lib/theme/accent'
import { VOCABULARY } from '@/lib/vocabulary'

type Props = {
  domain: Domain
  holdings: Holding[]
  accent: string
  // Couleur de fond résolue (hex) — libre depuis la refonte v2 Phase 2, plus
  // limitée aux 4 BackgroundId fixes. Voir resolveAppearanceBackground().
  background: string
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

const RADIUS = 68
const STROKE = 22
const CIRCUMFERENCE = 2 * Math.PI * RADIUS
const GAP = 3 // écart visuel entre segments, en unités de circonférence

function DonutRing({
  categories,
  shades,
  active,
  onSelect,
}: {
  categories: { category: string; weight: number; percent: number }[]
  shades: string[]
  active: number | null
  onSelect: (i: number | null) => void
}) {
  const { reduced, profile } = useMotionPrefs()

  let cumulative = 0
  const segments = categories.map((c, i) => {
    const length = Math.max(0, (c.percent / 100) * CIRCUMFERENCE - GAP)
    const offset = -((cumulative / 100) * CIRCUMFERENCE)
    cumulative += c.percent
    return { category: c, i, length, offset, isActive: active === i }
  })

  return (
    <svg
      viewBox="0 0 176 176"
      className="w-44 h-44 shrink-0"
      role="group"
      aria-label="Répartition des compétences par catégorie"
    >
      <circle cx="88" cy="88" r={RADIUS} fill="none" stroke="var(--surface-2)" strokeWidth={STROKE} />
      {/* La rotation vit sur un <g> ancestor, pas sur les motion.circle
          eux-mêmes : Motion possède entièrement la propriété CSS transform
          des éléments qu'il anime (même quand on n'anime aucune valeur de
          transform), ce qui écrasait silencieusement l'attribut SVG
          transform="rotate(...)" posé directement dessus. */}
      <g transform="rotate(-90 88 88)">
        {segments.map(({ category: c, i, length, offset, isActive }) => (
          <motion.circle
            key={c.category}
            cx="88"
            cy="88"
            r={RADIUS}
            fill="none"
            stroke={shades[i]}
            strokeWidth={isActive ? STROKE + 4 : STROKE}
            strokeDasharray={`${length} ${CIRCUMFERENCE - length}`}
            strokeDashoffset={offset}
            style={{ pointerEvents: 'none' }}
            initial={{ opacity: reduced ? 1 : 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: reduced ? 0 : INTRO_TIMELINE.allocation + i * 0.06, duration: 0.4 * profile.durationScale }}
          />
        ))}
      </g>
      {/* Cible tactile élargie, invisible : le trait rendu (22px) est trop
          fin pour un doigt — chaque segment reçoit ici une zone de clic bien
          plus large que son tracé visible, sans l'épaissir à l'écran. */}
      {segments.map(({ category: c, i, length, offset, isActive }) => (
        <circle
          key={`hit-${c.category}`}
          cx="88"
          cy="88"
          r={RADIUS}
          fill="none"
          stroke="transparent"
          strokeWidth={STROKE + 24}
          strokeDasharray={`${length} ${CIRCUMFERENCE - length}`}
          strokeDashoffset={offset}
          transform="rotate(-90 88 88)"
          role="button"
          tabIndex={0}
          aria-pressed={isActive}
          aria-label={`${c.category} — ${Math.round(c.percent)}%`}
          className="cursor-pointer focus-visible:outline-2 focus-visible:outline-accent"
          onClick={() => onSelect(isActive ? null : i)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              onSelect(isActive ? null : i)
            }
          }}
        />
      ))}
    </svg>
  )
}

const DETAIL_STAGGER = 0.04

export default function AllocationSection({ domain, holdings, accent, background }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [active, setActive] = useState<number | null>(null)
  const { reduced } = useMotionPrefs()
  const vocabulary = VOCABULARY[domain]

  if (holdings.length === 0) {
    return (
      <section className="px-6 py-6 border-t border-ink-raised @min-[1024px]:border-t-0 @min-[1024px]:px-0">
        <h2 className="text-label uppercase tracking-label text-muted mb-3">{vocabulary.expertiseBreakdown}</h2>
        <p className="text-sm text-muted">Aucune compétence renseignée pour le moment.</p>
      </section>
    )
  }

  const totalWeight = weightSum(holdings) || 1
  const categories = categoryAllocations(holdings).map((c) => ({ ...c, percent: (c.weight / totalWeight) * 100 }))
  const items = sortedHoldings(holdings)
  const { color: accentColor } = resolveAccent(accent, background)
  const shades = accentAllocationShades(accentColor, categories.length)
  const activeCategory = active !== null ? categories[active] : null

  return (
    <section className="px-6 py-6 border-t border-ink-raised @min-[1024px]:border-t-0 @min-[1024px]:px-0">
      <h2 className="text-label uppercase tracking-label text-muted mb-4">{vocabulary.expertiseBreakdown}</h2>

      <div className="flex items-center gap-6 flex-wrap @min-[480px]:flex-nowrap">
        <div className="relative shrink-0">
          <DonutRing categories={categories} shades={shades} active={active} onSelect={setActive} />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 pointer-events-none">
            {activeCategory ? (
              <>
                <span className="font-mono font-medium text-xl leading-none">{Math.round(activeCategory.percent)}%</span>
                <span className="text-[10px] text-muted mt-1 leading-tight">{activeCategory.category}</span>
              </>
            ) : (
              <>
                <span className="font-mono font-medium text-xl leading-none">{categories.length}</span>
                <span className="text-[10px] text-muted mt-1 uppercase tracking-label">
                  {categories.length > 1 ? 'catégories' : 'catégorie'}
                </span>
              </>
            )}
          </div>
        </div>

        <ul className="flex flex-col gap-2 min-w-0 flex-1">
          {categories.map((c, i) => (
            <li key={c.category}>
              <button
                type="button"
                onClick={() => setActive(active === i ? null : i)}
                aria-pressed={active === i}
                className="w-full min-h-9 flex items-center gap-2 text-sm rounded-[var(--radius-sm)] px-1.5 -mx-1.5 focus-visible:outline-2 focus-visible:outline-accent focus-visible:-outline-offset-2"
                style={{ background: active === i ? 'var(--accent-subtle)' : 'transparent' }}
              >
                <span className="size-2.5 rounded-full shrink-0" style={{ background: shades[i] }} aria-hidden="true" />
                <span className="truncate">{c.category}</span>
                <span className="font-mono text-muted ml-auto shrink-0">{Math.round(c.percent)}%</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: reduced ? 0 : 0.3 }}
            className="overflow-hidden"
          >
            <div className="mt-5 pt-4 border-t border-ink-raised">
              <p className="text-label uppercase tracking-label text-muted mb-1">Détail par ligne</p>
              {items.map((h, i) => (
                <Bar key={h.id} label={h.label} weight={h.weight} introDelay={i * DETAIL_STAGGER} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className="mt-3 min-h-11 flex items-center gap-1 text-sm text-accent focus-visible:outline-2 focus-visible:outline-accent focus-visible:-outline-offset-2 rounded"
      >
        <motion.span animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: reduced ? 0 : 0.2 }} className="flex">
          <ChevronDown size={16} aria-hidden="true" />
        </motion.span>
        {expanded ? 'Réduire' : `Voir les ${items.length} lignes`}
      </button>
    </section>
  )
}
