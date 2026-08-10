import type { QrMatrix } from '@/lib/qrcode'
import { QUIET_ZONE_MODULES } from '@/lib/qrcode'

type Props = {
  matrix: QrMatrix
  moduleColor: string
  size?: number
}

// Rendu SVG déclaratif, jamais Canvas/bitmap pour l'aperçu — vectoriel,
// donc net à n'importe quelle taille d'écran. Fond transparent (aucun <rect>
// de fond posé ici) : la couleur de fond du thème, quand elle est voulue,
// vient du conteneur qui englobe ce composant, jamais du SVG lui-même — le
// même composant sert aussi de source pour le PNG transparent téléchargeable
// (voir qrDownload.ts), qui doit rester transparent par construction.
export default function QrCodeDisplay({ matrix, moduleColor, size = 200 }: Props) {
  const count = matrix.length
  const total = count + QUIET_ZONE_MODULES * 2
  return (
    <svg
      viewBox={`0 0 ${total} ${total}`}
      width={size}
      height={size}
      role="img"
      aria-label="QR code vers le profil public"
      shapeRendering="crispEdges"
    >
      {matrix.map((row, r) =>
        row.map(
          (dark, c) =>
            dark && <rect key={`${r}-${c}`} x={c + QUIET_ZONE_MODULES} y={r + QUIET_ZONE_MODULES} width={1} height={1} fill={moduleColor} />,
        ),
      )}
    </svg>
  )
}
