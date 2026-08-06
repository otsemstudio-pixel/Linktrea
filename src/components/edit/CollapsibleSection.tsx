import { useState, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { ChevronDown } from 'lucide-react'
import { useMotionPrefs } from '@/lib/motion/MotionPrefsContext'

type Props = {
  title: string
  subtitle?: string
  // Nombre d'éléments de la section (Phase 5) — undefined pour les sections
  // qui n'ont pas de liste (Identité, Publier, Apparence). À 0, une pastille
  // remplace le compteur : "· 0" se lirait comme du contenu, une pastille se
  // lit comme une alerte discrète.
  count?: number
  defaultOpen?: boolean
  children: ReactNode
}

export default function CollapsibleSection({ title, subtitle, count, defaultOpen = false, children }: Props) {
  const [open, setOpen] = useState(defaultOpen)
  const { reduced } = useMotionPrefs()

  return (
    <section className="border-b border-ink-raised">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full min-h-11 flex justify-between items-center gap-3 px-4 py-3 text-left focus-visible:outline-2 focus-visible:outline-accent focus-visible:-outline-offset-2"
      >
        <span>
          <span className="flex items-center gap-2">
            <span className="font-medium">{title}</span>
            {count !== undefined && count > 0 && (
              <span className="text-xs text-muted font-mono">· {count}</span>
            )}
            {count === 0 && <span className="size-1.5 rounded-full bg-down" aria-label="Section vide" />}
          </span>
          {subtitle && <span className="block text-xs text-muted mt-0.5">{subtitle}</span>}
        </span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: reduced ? 0 : 0.2 }} className="shrink-0 flex">
          <ChevronDown size={18} aria-hidden="true" />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: reduced ? 0 : 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-5">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
