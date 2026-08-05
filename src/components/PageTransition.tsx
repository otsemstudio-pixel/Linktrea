import { motion } from 'motion/react'
import type { ReactNode } from 'react'

// Fondu simple entre routes (ex: / <-> /edit) — sert aussi de "le fond
// apparaît" pour la séquence d'arrivée (étape 0ms du plan Phase 4) : les
// deux effets sont le même fondu d'opacité au montage, pas la peine de
// les dupliquer.
export default function PageTransition({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.div>
  )
}
