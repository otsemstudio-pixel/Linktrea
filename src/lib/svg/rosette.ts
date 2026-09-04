// Motifs paramétriques de la famille visuelle "protocole" (domaine
// Diplomatie, prompt dédié) — même esprit que guilloche.ts (courbes
// déterministes calculées par équation, jamais un asset importé) mais une
// géométrie radiante plutôt qu'entrelacée : une rosace de courbes de rose
// mathématique pour le filigrane, une couronne de lauriers stylisée pour le
// sceau de certification. Le contour dentelé du sceau lui-même reste celui
// de guilloche.ts (sealOutlinePath) — seul son intérieur change de famille.

const STEPS_PER_CURVE = 480

// Courbe de rose r = R·cos(kθ) — k=0 dégénère en cercle parfait (cos(0)=1
// pour tout θ), ce qui permet de réutiliser cette même fonction pour les
// anneaux concentriques de la rosace, sans logique séparée.
function rosePath(k: number, R: number): string {
  const points: string[] = []
  for (let i = 0; i <= STEPS_PER_CURVE; i++) {
    const t = (i / STEPS_PER_CURVE) * Math.PI * 2
    const r = R * Math.cos(k * t)
    points.push(`${(r * Math.cos(t)).toFixed(2)},${(r * Math.sin(t)).toFixed(2)}`)
  }
  return `M${points.join('L')}`
}

// Rayon des courbes en unités de viewBox — même rôle que GUILLOCHE_EXTENT :
// l'appelant définit son propre viewBox et applique
// preserveAspectRatio="xMidYMid slice" pour couvrir sa surface quelle que
// soit sa forme réelle.
export const ROSETTE_EXTENT = 100

// Trois pétales de densités différentes superposées au même centre — la
// rosace radiante des pages de garde de passeport, jamais la trame en
// losanges entrelacés de Finance.
const ROSE_CURVES: { k: number; R: number }[] = [
  { k: 7, R: 92 },
  { k: 11, R: 70 },
  { k: 15, R: 48 },
]
const RING_RADII = [96, 74, 52, 30]

let cachedRosette: string[] | null = null

export function rosettePaths(): string[] {
  if (!cachedRosette) {
    cachedRosette = [...RING_RADII.map((r) => rosePath(0, r)), ...ROSE_CURVES.map(({ k, R }) => rosePath(k, R))]
  }
  return cachedRosette
}

export type LaurelLeaf = {
  d: string
  transform: string
  // Bras gauche/droit de la couronne — jamais une couleur en dur : ces deux
  // tons distinguent seulement les deux bras via une opacité différente,
  // currentColor porte la teinte réelle (accent du thème, indépendant de la
  // famille visuelle, voir resolveVisualFamily ci-dessus).
  tone: 'primary' | 'secondary'
}

// Couronne de lauriers stylisée (symbole universel de distinction, non lié
// à un État — voir la contrainte non négociable du prompt) : deux branches
// partant du bas de l'anneau (angle 90°, sud en coordonnées SVG) et
// remontant vers le haut de chaque côté, feuilles dégressives vers la
// pointe. `ringR` est le seul paramètre d'échelle — mêmes proportions
// relatives quelle que soit la taille réelle du sceau appelant (11px dans
// CertificateSeal.tsx, bien davantage sur la carte de partage).
export function laurelWreathLeaves(ringR: number, leafCount = 8): LaurelLeaf[] {
  const leaves: LaurelLeaf[] = []
  for (const side of [-1, 1] as const) {
    for (let i = 0; i < leafCount; i++) {
      const tt = i / (leafCount - 1) // 0 = bas de l'anneau, 1 = haut du bras
      const angleDeg = 90 + side * (20 + tt * 130)
      const angleRad = (angleDeg * Math.PI) / 180
      const x = ringR * Math.cos(angleRad)
      const y = ringR * Math.sin(angleRad)
      const length = ringR * (0.36 - tt * 0.16)
      const width = ringR * (0.16 - tt * 0.065)
      const outwardDeg = angleDeg + side * 90
      const d = `M0,0 Q${(width / 2).toFixed(2)},${(-length / 2).toFixed(2)} 0,${(-length).toFixed(2)} Q${(-width / 2).toFixed(2)},${(-length / 2).toFixed(2)} 0,0 Z`
      leaves.push({
        d,
        transform: `translate(${x.toFixed(2)},${y.toFixed(2)}) rotate(${outwardDeg.toFixed(1)})`,
        tone: side < 0 ? 'secondary' : 'primary',
      })
    }
  }
  return leaves
}
