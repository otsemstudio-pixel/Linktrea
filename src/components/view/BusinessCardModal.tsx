import { useEffect, useRef, useState } from 'react'
import { Download } from 'lucide-react'
import type { Profile } from '@/types'
import { renderShareCardToCanvas, exportCanvasToBlob, downloadCanvasBlob, SHARE_CARD_DIMENSIONS } from '@/lib/shareCard'
import { DEFAULT_SHARE_CARD_CONTENT } from '@/lib/shareCardContent'
import { slugify } from '@/lib/slug'
import Modal from '@/components/edit/Modal'

type Props = {
  open: boolean
  profile: Profile
  publicUrl: string
  onClose: () => void
}

// Carte de visite (refonte carte de partage, Phase 5) — modal dédié et
// délibérément plus simple que ShareCardModal : pas de sélecteur de format
// (fixé à 'business'), pas de cases à cocher — le contenu est FIXE (voir
// composeBusinessCard dans shareCard.ts), conformément au prompt ("contenu
// fixe et minimal"). Même pipeline canvas et même garantie de parité pixel
// à pixel entre aperçu et téléchargement qu'établi en Phase 3.
export default function BusinessCardModal({ open, profile, publicUrl, onClose }: Props) {
  const [rendering, setRendering] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const renderToken = useRef(0)

  useEffect(() => {
    if (!open) return
    const canvas = canvasRef.current
    if (!canvas) return
    const token = ++renderToken.current
    setRendering(true)
    // DEFAULT_SHARE_CARD_CONTENT n'est ici qu'un remplissage inerte :
    // composeBusinessCard ignore intégralement ce paramètre, mais
    // renderShareCardToCanvas partage sa signature avec les trois autres
    // formats (même pipeline, voir shareCard.ts).
    renderShareCardToCanvas(canvas, profile, 'business', DEFAULT_SHARE_CARD_CONTENT, publicUrl)
      .catch(() => {
        // Rien d'affiché de correct si ça échoue — le bouton Télécharger
        // reste désactivé (rendering=true) plutôt que de proposer un export
        // d'un canvas à moitié dessiné.
      })
      .finally(() => {
        if (token === renderToken.current) setRendering(false)
      })
  }, [open, profile, publicUrl])

  async function handleDownload() {
    const canvas = canvasRef.current
    if (!canvas || rendering) return
    const blob = await exportCanvasToBlob(canvas)
    downloadCanvasBlob(blob, `ledger-${slugify(profile.identity.fullName) || 'profil'}-carte-visite.png`)
  }

  const { width, height } = SHARE_CARD_DIMENSIONS.business
  // Aperçu plus large que celui de ShareCardModal (260px) : ce format est
  // nettement plus large que haut (1050×600), un aperçu étroit l'aurait
  // rendu illisible à l'écran.
  const previewWidth = 320
  const previewHeight = Math.round((previewWidth * height) / width)

  return (
    <Modal open={open} title="Carte de visite" onClose={onClose} maxWidthClassName="max-w-md">
      <div className="flex justify-center mb-4">
        <div
          className="rounded-md overflow-hidden border border-ink-raised"
          style={{ width: previewWidth, height: previewHeight }}
        >
          <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
        </div>
      </div>

      <button
        type="button"
        onClick={handleDownload}
        disabled={rendering}
        className="w-full min-h-11 rounded-md bg-accent text-ink font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98] transition-transform"
      >
        <Download size={16} aria-hidden="true" />
        {rendering ? 'Génération…' : 'Télécharger'}
      </button>
    </Modal>
  )
}
