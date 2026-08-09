// Fond animé "sparkline ambiante" (refonte v2, Phase 6, thème Placement) —
// un tracé décoratif façon cours boursier, sans rapport avec les données
// réelles du profil (le prompt est explicite : purement décoratif). N'anime
// que `transform: translateX` (voir .animate-ambient-sparkline dans
// index.css) — même principe que le défilement de TickerBanner : le tracé
// est dupliqué bout à bout puis translaté d'exactement une copie, ce qui
// boucle sans le moindre saut visible au rebouclage.
const POINTS = [4, 22, 14, 30, 10, 26, 6, 32, 18, 8, 24, 12, 28, 4]
const SEGMENT_WIDTH = 60
const HEIGHT = 40
const SINGLE_WIDTH = SEGMENT_WIDTH * (POINTS.length - 1)

function buildPath(offsetX: number): string {
  return POINTS.map((y, i) => `${i === 0 ? 'M' : 'L'}${offsetX + i * SEGMENT_WIDTH},${HEIGHT - y}`).join('')
}

const PATH_D = buildPath(0) + buildPath(SINGLE_WIDTH).replace('M', 'L')

export default function AmbientSparkline() {
  return (
    <svg
      aria-hidden="true"
      viewBox={`0 0 ${SINGLE_WIDTH * 2} ${HEIGHT}`}
      preserveAspectRatio="none"
      className="absolute inset-x-0 bottom-0 pointer-events-none opacity-[0.12] text-accent animate-ambient-sparkline"
      style={{ width: '200%', height: '56px' }}
    >
      <path d={PATH_D} fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}
