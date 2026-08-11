import type { EclatVariant } from '@/types'
import { ECLAT_GRADIENT, ECLAT_OPACITY, ECLAT_NEEDS_OVERSCAN, ECLAT_ANIMATION_CLASS, buildAnimatedGradient } from '@/lib/theme/eclatGradients'

type Props = {
  variant: EclatVariant
  active: boolean
  className?: string
  // Fond animé du mode Personnalisé (voir CustomThemeSettings.animatedColors)
  // — même composant, même mécanique de rendu qu'Éclat, mais la palette
  // remplace ECLAT_GRADIENT[variant] plutôt que de s'y ajouter. undefined
  // pour Éclat lui-même (thème de la Galerie, palette fixe).
  colors?: [string, string, string]
}

// Calque décoratif du thème "Éclat" — le dégradé de base reste TOUJOURS
// rendu, animé ou non : figé (prefers-reduced-motion, interrupteur "Fond
// animé" désactivé, ou onglet caché — voir useBackgroundAnimation), il doit
// rester visuellement le même dégradé chromatique, juste immobile, jamais
// disparaître ni retomber sur un aplat neutre. Réutilisé identique pour la
// pleine page (ProfileView, via AppliedBackgroundLayer) et pour les
// miniatures du sélecteur (EclatVariantPicker.tsx) — au conteneur appelant
// de poser position:relative + une taille.
export default function EclatBackgroundLayer({ variant, active, className, colors }: Props) {
  const overscan = ECLAT_NEEDS_OVERSCAN[variant]
  return (
    <div
      aria-hidden="true"
      className={`absolute pointer-events-none ${overscan ? '-inset-1/4' : 'inset-0'} ${active ? ECLAT_ANIMATION_CLASS[variant] : ''} ${className ?? ''}`}
      style={{
        background: colors ? buildAnimatedGradient(variant, colors) : ECLAT_GRADIENT[variant],
        backgroundSize: variant === 'maree' ? '250% 250%' : undefined,
        opacity: ECLAT_OPACITY[variant],
      }}
    />
  )
}
