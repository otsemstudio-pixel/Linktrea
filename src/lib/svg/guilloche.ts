// Motif de guillochis paramétrique (refonte design Phase 3) — le trait
// entrelacé gravé sur les billets de banque et les diplômes officiels,
// généré par équations d'hypotrochoïde plutôt que par une image. Aucun
// hasard : la signature doit être identique à chaque rendu, comme une
// gravure fixe, pas un motif décoratif qui varie par profil.

type Hypotrochoid = { R: number; r: number; d: number; cycles: number }

// Trois courbes superposées, rayons et déphasages différents, pour un
// entrelacement dense plutôt qu'une simple spirale répétée.
const CURVES: Hypotrochoid[] = [
  { R: 100, r: 39, d: 63, cycles: 5 },
  { R: 100, r: 31, d: 52, cycles: 7 },
]

const STEPS_PER_CYCLE = 24

function hypotrochoidPath({ R, r, d, cycles }: Hypotrochoid): string {
  const steps = cycles * STEPS_PER_CYCLE
  const totalT = Math.PI * 2 * cycles
  const points: string[] = []
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * totalT
    const x = (R - r) * Math.cos(t) + d * Math.cos(((R - r) / r) * t)
    const y = (R - r) * Math.sin(t) - d * Math.sin(((R - r) / r) * t)
    points.push(`${x.toFixed(1)},${y.toFixed(1)}`)
  }
  return `M${points.join('L')}`
}

// Rayon des courbes en unités de viewBox — le SVG appelant définit son
// propre viewBox et applique preserveAspectRatio="xMidYMid slice" pour
// couvrir sa surface quelle que soit sa forme réelle.
export const GUILLOCHE_EXTENT = 100

let cached: string[] | null = null

// Calcul non trivial (plusieurs milliers de points) mais déterministe et
// identique pour tout appelant — un seul calcul pour toute la page, qu'il
// s'agisse de l'en-tête ou d'un sceau de certificat.
export function guillochePaths(): string[] {
  if (!cached) cached = CURVES.map(hypotrochoidPath)
  return cached
}

// Contour dentelé d'un sceau (Phase 3) — cercle festonné façon tampon ou
// cachet de cire, généré par alternance de rayon extérieur/intérieur, pas
// par un tracé dessiné à la main.
export function sealOutlinePath(cx: number, cy: number, rOuter: number, rInner: number, teeth: number): string {
  const step = Math.PI / teeth
  const points: string[] = []
  for (let i = 0; i < teeth * 2; i++) {
    const r = i % 2 === 0 ? rOuter : rInner
    const angle = i * step
    const x = cx + r * Math.cos(angle)
    const y = cy + r * Math.sin(angle)
    points.push(`${x.toFixed(2)},${y.toFixed(2)}`)
  }
  return `M${points.join('L')}Z`
}
