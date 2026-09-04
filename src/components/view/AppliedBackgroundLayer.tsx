import type { Domain, EclatVariant } from '@/types'
import type { BackgroundTreatment } from '@/lib/theme/galleryThemes'
import type { ResolvedAnimation } from '@/lib/theme/resolveAppearance'
import { useBackgroundAnimation } from '@/lib/motion/useBackgroundAnimation'
import { isEclatVariant } from '@/lib/theme/eclatGradients'
import GuillochePattern from './GuillochePattern'
import NoiseCanvas from './NoiseCanvas'
import EclatBackgroundLayer from './EclatBackgroundLayer'

type Props = {
  treatment: BackgroundTreatment
  // Non résolu en ActiveAnimation par ProfileView : useBackgroundAnimation()
  // lit useMotionPrefs() via le contexte React, qui ne devient disponible
  // qu'à l'intérieur de <MotionPrefsProvider> — donc seulement depuis un
  // composant réellement rendu comme SON enfant (ce que ProfileView n'est
  // pas, puisque c'est lui qui pose le Provider). Chaque composant qui a
  // besoin du résultat final l'appelle donc lui-même.
  resolvedAnimation: ResolvedAnimation
  // Famille visuelle du filigrane "texture" (prompt domaine Diplomatie,
  // Phase 2) — voir GuillochePattern.tsx, seul point qui lit réellement
  // resolveVisualFamily pour ce motif.
  domain: Domain
}

// Décore le fond de page selon le traitement du thème actif (refonte v2,
// Phase 2) et, pour 3 des 4 thèmes qui en déclarent un, l'anime doucement
// (refonte v2, Phase 6) — absolute plutôt que fixed : ProfileView peut être
// monté dans un panneau d'aperçu de largeur fixe (voir DesktopPreviewPanel),
// un fixed déborderait sur tout le viewport. --surface-0 reste toujours la
// couleur DE RÉFÉRENCE pour le contraste (voir resolveAppearanceBackground)
// — cette couche est purement décorative, elle ne change aucun calcul de
// lisibilité, animée ou non.
export default function AppliedBackgroundLayer({ treatment, resolvedAnimation, domain }: Props) {
  const animation = useBackgroundAnimation(resolvedAnimation)

  if (treatment.kind === 'flat') {
    // Fond animé du mode Personnalisé (voir resolveAppearanceAnimation) —
    // seul cas où un traitement 'flat' a quand même une décoration : aucun
    // thème de la Galerie à fond 'flat' ne déclare d'animationKind, donc
    // animation.colors n'est jamais défini ici pour ces thèmes-là — le
    // cast ci-dessous est sûr par construction (resolveAppearanceAnimation
    // ne pose colors que quand kind = settings.animationStyle, un EclatVariant).
    if (animation.kind && animation.colors) {
      return (
        <div aria-hidden="true" className="absolute inset-0 -z-10 pointer-events-none overflow-hidden">
          <div className="absolute inset-0" style={{ background: treatment.base }} />
          <EclatBackgroundLayer variant={animation.kind as EclatVariant} active={animation.active} colors={animation.colors} />
        </div>
      )
    }
    return null
  }

  if (treatment.kind === 'gradient') {
    return (
      <div aria-hidden="true" className="absolute inset-0 -z-10 pointer-events-none overflow-hidden">
        <div
          className="absolute inset-0"
          style={{ background: `linear-gradient(to bottom, ${treatment.from}, ${treatment.to})` }}
        />
        {/* Respiration : un lavis blanc dont l'opacité pulse très lentement
            au-dessus du dégradé figé — plus simple et moins coûteux que
            réanimer le dégradé lui-même, et strictement une variation
            d'opacity. Figé (opacity 0) quand l'animation n'est pas active :
            visuellement identique au dégradé nu. */}
        {animation.kind === 'breath' && (
          <div
            aria-hidden="true"
            className={`absolute inset-0 bg-white ${animation.active ? 'animate-bg-breath' : ''}`}
            style={animation.active ? undefined : { opacity: 0 }}
          />
        )}
        {/* Éclat : calque chromatique animé, posé par-dessus le dégradé
            sombre fixe ci-dessus (voir GALLERY_THEMES.eclat.background) —
            toujours rendu, animé ou non (voir EclatBackgroundLayer.tsx). */}
        {animation.kind && isEclatVariant(animation.kind) && (
          <EclatBackgroundLayer variant={animation.kind} active={animation.active} />
        )}
      </div>
    )
  }

  // texture
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 -z-10 pointer-events-none overflow-hidden"
      style={{ background: treatment.base }}
    >
      <GuillochePattern
        domain={domain}
        className={`text-paper ${animation.kind === 'guilloche' && animation.active ? 'animate-guilloche-pulse' : 'opacity-[0.05]'}`}
      />
      {animation.kind === 'noise' && <NoiseCanvas active={animation.active} />}
    </div>
  )
}
