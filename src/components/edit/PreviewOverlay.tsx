import { motion, AnimatePresence } from 'motion/react'
import { ArrowLeft } from 'lucide-react'
import type { Profile } from '@/types'
import ProfileView from '@/components/ProfileView'
import { useMotionPrefs } from '@/lib/motion/MotionPrefsContext'
import { usePublishStatus } from './usePublishStatus'

type Props = {
  open: boolean
  profile: Profile
  onClose: () => void
}

// Plein écran mobile avec retour. Le cadre fixe 390px en desktop arrive en
// Phase 6, avec le reste du layout deux colonnes.
export default function PreviewOverlay({ open, profile, onClose }: Props) {
  const { reduced } = useMotionPrefs()
  // correctif "modale carte de partage" Partie 2 — voir DesktopPreviewPanel.tsx.
  const { publicUrl } = usePublishStatus()

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduced ? 0 : 0.2 }}
          className="fixed inset-0 z-40 bg-ink overflow-y-auto"
        >
          <button
            type="button"
            onClick={onClose}
            className="fixed top-3 left-3 z-50 min-h-11 px-3 rounded-md bg-ink-raised/90 backdrop-blur-sm text-sm flex items-center gap-2 focus-visible:outline-2 focus-visible:outline-accent"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            Retour à l'édition
          </button>
          <ProfileView profile={profile} standalone={false} publicUrl={publicUrl} />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
