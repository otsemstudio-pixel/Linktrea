// Téléchargement du QR code seul, en PNG transparent (personnalisation
// avancée, Phase 3) — rendu Canvas direct depuis la matrice de modules,
// jamais un aplat de fond posé : sans fillRect de fond, canvas.toBlob()
// produit un PNG à canal alpha, utilisable sur n'importe quel support
// (carte de visite imprimée, diapositive, fond d'écran...).
import type { QrMatrix } from './qrcode'
import { QUIET_ZONE_MODULES } from './qrcode'
import { slugify } from './slug'

const CELL_PX = 12

export async function downloadQrPng(matrix: QrMatrix, moduleColor: string, fileNameHint: string): Promise<void> {
  const count = matrix.length
  const total = (count + QUIET_ZONE_MODULES * 2) * CELL_PX

  const canvas = document.createElement('canvas')
  canvas.width = total
  canvas.height = total
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Le navigateur ne permet pas de générer le QR code.')

  ctx.fillStyle = moduleColor
  matrix.forEach((row, r) => {
    row.forEach((dark, c) => {
      if (!dark) return
      const x = (c + QUIET_ZONE_MODULES) * CELL_PX
      const y = (r + QUIET_ZONE_MODULES) * CELL_PX
      ctx.fillRect(x, y, CELL_PX, CELL_PX)
    })
  })

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob a échoué'))), 'image/png')
  })
  const objectUrl = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = objectUrl
  a.download = `linktrea-qr-${slugify(fileNameHint) || 'profil'}.png`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(objectUrl)
}
