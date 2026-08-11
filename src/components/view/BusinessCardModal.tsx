import { useEffect, useRef, useState } from 'react'
import { Download } from 'lucide-react'
import type { Profile } from '@/types'
import { renderShareCardToCanvas, exportCanvasToBlob, downloadCanvasBlob } from '@/lib/shareCard'
import { DEFAULT_SHARE_CARD_CONTENT } from '@/lib/shareCardContent'
import { slugify } from '@/lib/slug'
import Modal from '@/components/edit/Modal'

type Props = {
  open: boolean
  profile: Profile
  // null = profil pas encore publié (correctif "modale carte de partage"
  // Partie 2) — la carte de visite est QR/URL ou rien (contenu fixe, voir
  // composeBusinessCard), donc ce cas affiche un message plutôt qu'un
  // aperçu à moitié vide, même règle que QrCodeSection.tsx pour le QR
  // autonome (voir ProfileView.tsx pour la provenance de cette valeur).
  publicUrl: string | null
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
    // Pas encore publié : rien à générer (voir le commentaire sur `publicUrl`
    // ci-dessus) — le rendu précédent, s'il y en a un, reste affiché tel
    // quel plutôt que d'être effacé, mais aucun nouveau rendu n'est lancé.
    if (!open || !publicUrl) return
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

  // Même cadre à hauteur CSS fixe que ShareCardModal (voir son commentaire,
  // correctif "modale carte de partage" Partie 1) — un seul format ici, donc
  // pas de bascule qui redimensionnerait le conteneur, mais même mécanique
  // pour rester cohérent et robuste si un second format y était ajouté un jour.
  const PREVIEW_BOX_HEIGHT = 220

  return (
    <Modal open={open} title="Carte de visite" onClose={onClose} maxWidthClassName="max-w-md">
      {publicUrl ? (
        <>
          <div
            className="flex items-center justify-center mb-4 rounded-md overflow-hidden border border-ink-raised bg-ink-raised/20"
            style={{ height: PREVIEW_BOX_HEIGHT }}
          >
            <canvas ref={canvasRef} style={{ maxWidth: '100%', maxHeight: '100%', width: 'auto', height: 'auto', display: 'block' }} />
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
        </>
      ) : (
        // Contenu fixe (nom, headline, QR, URL) — sans URL publique, la
        // carte n'aurait ni QR ni URL à montrer, deux de ses quatre éléments
        // (voir composeBusinessCard dans shareCard.ts) : même règle que le
        // QR code autonome (QrCodeSection.tsx), un message plutôt qu'un
        // aperçu à moitié vide.
        <p className="text-sm text-muted py-6 text-center">Publie d'abord ton profil pour générer une carte de visite.</p>
      )}
    </Modal>
  )
}
