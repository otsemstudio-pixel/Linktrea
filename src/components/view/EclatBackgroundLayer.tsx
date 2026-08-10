import type { EclatVariant } from '@/types'
import { ECLAT_GRADIENT, ECLAT_OPACITY, ECLAT_NEEDS_OVERSCAN, ECLAT_ANIMATION_CLASS } from '@/lib/theme/eclatGradients'

type Props = {
  variant: EclatVariant
  active: boolean
  className?: string
}

// Calque décoratif du thème "Éclat" — le dégradé de base reste TOUJOURS
// rendu, animé ou non : figé (prefers-reduced-motion, interrupteur "Fond
// animé" désactivé, ou onglet caché — voir useBackgroundAnimation), il doit
// rester visuellement le même dégradé chromatique, juste immobile, jamais
// disparaître ni retomber sur un aplat neutre. Réutilisé identique pour la
// pleine page (ProfileView, via AppliedBackgroundLayer) et pour les
// miniatures du sélecteur (EclatVariantPicker.tsx) — au conteneur appelant
// de poser position:relative + une taille.
export default function EclatBackgroundLayer({ variant, active, className }: Props) {
  const overscan = ECLAT_NEEDS_OVERSCAN[variant]
  return (
    <div
      aria-hidden="true"
      className={`absolute pointer-events-none ${overscan ? '-inset-1/4' : 'inset-0'} ${active ? ECLAT_ANIMATION_CLASS[variant] : ''} ${className ?? ''}`}
      style={{
        background: ECLAT_GRADIENT[variant],
        backgroundSize: variant === 'maree' ? '250% 250%' : undefined,
        opacity: ECLAT_OPACITY[variant],
      }}
    />
  )
}
