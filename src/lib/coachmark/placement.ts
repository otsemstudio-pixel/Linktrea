// Calcul de position pur (aucune dépendance au DOM ni à React) — testable
// indépendamment de l'overlay. Choisit le premier placement (bas/haut/
// droite/gauche) qui tient entièrement dans le viewport, avec une marge de
// sécurité ; si aucun ne tient (élément proche d'un coin sur petit écran),
// retombe sur le premier candidat, clampé aux bords du viewport plutôt que
// de déborder.
export type Placement = 'top' | 'bottom' | 'left' | 'right'

export type Rect = { top: number; left: number; width: number; height: number }

export type BubblePosition = { top: number; left: number; width: number; placement: Placement }

const GAP = 14
const MARGIN = 16
// Sous ce seuil, la bulle occupe une largeur proche du viewport plutôt que
// de rester étroite à côté de la cible (prompt : référence 375px de large).
const NARROW_VIEWPORT = 640

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), Math.max(min, max))
}

export function computeBubblePosition(
  target: Rect,
  bubbleWidth: number,
  bubbleHeight: number,
  viewportWidth: number,
  viewportHeight: number,
): BubblePosition {
  if (viewportWidth < NARROW_VIEWPORT) {
    const width = Math.min(bubbleWidth, viewportWidth - MARGIN * 2)
    const spaceBelow = viewportHeight - (target.top + target.height)
    const spaceAbove = target.top
    const placeBelow = spaceBelow >= bubbleHeight + GAP || spaceBelow >= spaceAbove
    const rawTop = placeBelow ? target.top + target.height + GAP : target.top - bubbleHeight - GAP
    return {
      top: clamp(rawTop, MARGIN, viewportHeight - bubbleHeight - MARGIN),
      left: MARGIN,
      width,
      placement: placeBelow ? 'bottom' : 'top',
    }
  }

  const targetCenterX = target.left + target.width / 2
  const targetCenterY = target.top + target.height / 2

  const candidates: { placement: Placement; top: number; left: number }[] = [
    { placement: 'bottom', top: target.top + target.height + GAP, left: targetCenterX - bubbleWidth / 2 },
    { placement: 'top', top: target.top - bubbleHeight - GAP, left: targetCenterX - bubbleWidth / 2 },
    { placement: 'right', top: targetCenterY - bubbleHeight / 2, left: target.left + target.width + GAP },
    { placement: 'left', top: targetCenterY - bubbleHeight / 2, left: target.left - bubbleWidth - GAP },
  ]

  const fits = (c: (typeof candidates)[number]) =>
    c.top >= MARGIN &&
    c.top + bubbleHeight <= viewportHeight - MARGIN &&
    c.left >= MARGIN &&
    c.left + bubbleWidth <= viewportWidth - MARGIN

  const chosen = candidates.find(fits) ?? candidates[0]

  return {
    top: clamp(chosen.top, MARGIN, viewportHeight - bubbleHeight - MARGIN),
    left: clamp(chosen.left, MARGIN, viewportWidth - bubbleWidth - MARGIN),
    width: bubbleWidth,
    placement: chosen.placement,
  }
}
