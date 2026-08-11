import { useEffect, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { X } from 'lucide-react'
import { useMotionPrefs } from '@/lib/motion/MotionPrefsContext'

type Props = {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
  // 'max-w-sm' par défaut (dialogues de confirmation courts) — un contenu
  // plus riche (aperçu de carte de partage, par exemple) peut avoir besoin
  // de plus de place plutôt que de forcer un habillage étroit.
  maxWidthClassName?: string
}

export default function Modal({ open, title, onClose, children, maxWidthClassName = 'max-w-sm' }: Props) {
  const { reduced } = useMotionPrefs()

  useEffect(() => {
    if (!open) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="presentation"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduced ? 0 : 0.2 }}
          onClick={onClose}
          className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-4"
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, y: reduced ? 0 : 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: reduced ? 0 : 16 }}
            transition={{ duration: reduced ? 0 : 0.2 }}
            className={`w-full ${maxWidthClassName} rounded-lg border border-ink-raised bg-ink p-5 text-paper`}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-medium">{title}</h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Fermer"
                className="size-11 -mr-2 flex items-center justify-center rounded-md focus-visible:outline-2 focus-visible:outline-accent focus-visible:-outline-offset-2"
              >
                <X size={16} aria-hidden="true" />
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
