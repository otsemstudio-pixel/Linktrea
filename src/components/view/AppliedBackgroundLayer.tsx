import type { BackgroundTreatment } from '@/lib/theme/galleryThemes'
import type { ResolvedAnimation } from '@/lib/theme/resolveAppearance'
import { useBackgroundAnimation } from '@/lib/motion/useBackgroundAnimation'
import GuillochePattern from './GuillochePattern'
import NoiseCanvas from './NoiseCanvas'

type Props = {
  treatment: BackgroundTreatment
  // Non résolu en ActiveAnimation par ProfileView : useBackgroundAnimation()
  // lit useMotionPrefs() via le contexte React, qui ne devient disponible
  // qu'à l'intérieur de <MotionPrefsProvider> — donc seulement depuis un
  // composant réellement rendu comme SON enfant (ce que ProfileView n'est
  // pas, puisque c'est lui qui pose le Provider). Chaque composant qui a
  // besoin du résultat final l'appelle donc lui-même.
  resolvedAnimation: ResolvedAnimation
}

// Décore le fond de page selon le traitement du thème actif (refonte v2,
// Phase 2) et, pour 3 des 4 thèmes qui en déclarent un, l'anime doucement
// (refonte v2, Phase 6) — absolute plutôt que fixed : ProfileView peut être
// monté dans un panneau d'aperçu de largeur fixe (voir DesktopPreviewPanel),
// un fixed déborderait sur tout le viewport. --surface-0 reste toujours la
// couleur DE RÉFÉRENCE pour le contraste (voir resolveAppearanceBackground)
// — cette couche est purement décorative, elle ne change aucun calcul de
// lisibilité, animée ou non.
export default function AppliedBackgroundLayer({ treatment, resolvedAnimation }: Props) {
  const animation = useBackgroundAnimation(resolvedAnimation)
  if (treatment.kind === 'flat') return null

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
        className={`text-paper ${animation.kind === 'guilloche' && animation.active ? 'animate-guilloche-pulse' : 'opacity-[0.05]'}`}
      />
      {animation.kind === 'noise' && <NoiseCanvas active={animation.active} />}
    </div>
  )
}
