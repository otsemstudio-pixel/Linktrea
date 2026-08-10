// QR code du profil (personnalisation avancée, Phase 3) — génération
// entièrement côté client via qrcode-generator (~15 Ko gzippés, aucune
// dépendance runtime, aucun appel réseau) : la bibliothèque ne fait que le
// calcul (correction d'erreur, placement des modules), tout le rendu visuel
// (couleurs de thème, zone de silence) est fait à la main dans
// QrCodeDisplay.tsx et qrDownload.ts, pour garder un contrôle complet sur le
// style plutôt que dépendre du rendu SVG/canvas intégré de la bibliothèque.
import qrcodeFactory from 'qrcode-generator'

// Zone de silence réglementaire ISO/IEC 18004 — 4 modules minimum de chaque
// côté, condition de bonne lecture par un lecteur de code (prompt, Phase 3).
export const QUIET_ZONE_MODULES = 4

export type QrMatrix = boolean[][]

// typeNumber 0 = taille automatique selon la longueur du texte ; niveau M
// (15 % de correction) = compromis standard entre robustesse et densité,
// suffisant pour une URL simple sans logo superposé.
export function buildQrMatrix(text: string): QrMatrix {
  const qr = qrcodeFactory(0, 'M')
  qr.addData(text)
  qr.make()
  const count = qr.getModuleCount()
  const matrix: QrMatrix = []
  for (let row = 0; row < count; row++) {
    const line: boolean[] = []
    for (let col = 0; col < count; col++) {
      line.push(qr.isDark(row, col))
    }
    matrix.push(line)
  }
  return matrix
}
