import { useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { Check } from 'lucide-react'
import type { Profile } from '@/types'
import { computeProfileCompletion } from '@/lib/profileCompletion'
import { useCoachmark } from '@/lib/coachmark/CoachmarkContext'
import { useMotionPrefs } from '@/lib/motion/MotionPrefsContext'

// Anneau de complétude du profil (doc "Complétude, historique, publication
// différée", Phase 1) — même langage visuel que le DonutRing de
// AllocationSection.tsx (anneau SVG à l'accent, piste en var(--surface-2)),
// réduit à un seul segment puisqu'il n'y a ici qu'une seule proportion à
// représenter, pas des catégories. Purement informatif : n'empêche jamais la
// publication, quel que soit le pourcentage.
const RADIUS = 15
const STROKE = 3.5
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

type Props = {
  profile: Profile
}

export default function CompletionRing({ profile }: Props) {
  // Deux sources indépendantes de visibilité plutôt qu'un simple booléen
  // togglé au clic : un clic sur le bouton hors clavier est TOUJOURS précédé
  // d'un survol, donc un onClick qui fait juste setOpen(v => !v) se
  // refermait aussitôt rouvert (le survol ouvrait, le clic qui suit
  // refermait dans la foulée). "hovered" et "pinned" restent indépendants et
  // se combinent en OR : le clic (clavier ou souris) ne fait qu'épingler,
  // jamais fermer ce que le survol maintient déjà ouvert.
  const [hovered, setHovered] = useState(false)
  const [pinned, setPinned] = useState(false)
  const open = hovered || pinned
  const popoverRef = useRef<HTMLDivElement>(null)
  const { activate, getTarget } = useCoachmark()
  const { reduced, profile: motionProfile } = useMotionPrefs()
  const { percent, criteria } = computeProfileCompletion(profile)
  const missing = criteria.filter((c) => !c.done)

  useEffect(() => {
    if (!open) return
    function onClickOutside(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setHovered(false)
        setPinned(false)
      }
    }
    function onEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setHovered(false)
        setPinned(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    document.addEventListener('keydown', onEscape)
    return () => {
      document.removeEventListener('mousedown', onClickOutside)
      document.removeEventListener('keydown', onEscape)
    }
  }, [open])

  // Ouvre la section (activate = CollapsibleSection.setOpen(true) si repliée,
  // voir useCoachmarkActivator) puis scrolle vers elle une fois son animation
  // d'ouverture terminée — réutilise le même registre que le tuto en
  // coachmarks, sans démarrer de séquence.
  function goToSection(sectionId: string) {
    activate(sectionId)
    setTimeout(
      () => {
        getTarget(sectionId)?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' })
      },
      reduced ? 0 : 260,
    )
    setHovered(false)
    setPinned(false)
  }

  const dashOffset = CIRCUMFERENCE * (1 - percent / 100)

  return (
    <div
      className="relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <button
        type="button"
        onClick={() => setPinned((v) => !v)}
        aria-expanded={open}
        aria-label={`Profil complété à ${percent} pourcent`}
        className="relative size-9 flex items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-accent"
      >
        <svg viewBox="0 0 36 36" className="size-9 -rotate-90" aria-hidden="true">
          <circle cx="18" cy="18" r={RADIUS} fill="none" stroke="var(--surface-2)" strokeWidth={STROKE} />
          <motion.circle
            cx="18"
            cy="18"
            r={RADIUS}
            fill="none"
            stroke="var(--accent)"
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            initial={{ strokeDashoffset: CIRCUMFERENCE }}
            animate={{ strokeDashoffset: dashOffset }}
            transition={{ duration: reduced ? 0 : 0.6 * motionProfile.durationScale, ease: motionProfile.ease }}
          />
        </svg>
        <span className="absolute text-[9px] font-mono font-medium">{percent}</span>
      </button>

      {open && (
        <div
          ref={popoverRef}
          className="absolute right-0 top-full mt-2 w-72 z-20 rounded-lg border border-ink-raised bg-ink shadow-lg p-3"
        >
          <p className="text-xs text-muted mb-2">
            Profil complété à <span className="font-mono text-paper">{percent}%</span>
          </p>
          {missing.length === 0 ? (
            <p className="text-xs text-muted flex items-center gap-1.5">
              <Check size={14} className="text-accent shrink-0" aria-hidden="true" />
              Toutes les sections sont renseignées.
            </p>
          ) : (
            <ul className="flex flex-col gap-1">
              {missing.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => goToSection(c.sectionId)}
                    className="w-full text-left text-xs min-h-8 px-2 -mx-2 rounded-md hover:bg-ink-raised flex items-center justify-between gap-2 focus-visible:outline-2 focus-visible:outline-accent"
                  >
                    <span>{c.label}</span>
                    <span className="text-accent shrink-0">Compléter</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
