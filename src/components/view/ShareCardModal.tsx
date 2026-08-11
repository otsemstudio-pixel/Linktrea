import { useEffect, useRef, useState } from 'react'
import { Download } from 'lucide-react'
import type { Profile } from '@/types'
import {
  renderShareCardToCanvas,
  exportCanvasToBlob,
  downloadCanvasBlob,
  SHARE_CARD_DIMENSIONS,
  type ShareCardFormat,
} from '@/lib/shareCard'
import {
  loadShareCardContent,
  saveShareCardContent,
  resolveShareCardContent,
  type ShareCardContent,
} from '@/lib/shareCardContent'
import { slugify } from '@/lib/slug'
import Modal from '@/components/edit/Modal'

type Props = {
  open: boolean
  profile: Profile
  publicUrl: string
  onClose: () => void
}

const FORMATS: ShareCardFormat[] = ['square', 'portrait', 'landscape']
const FORMAT_LABELS: Record<ShareCardFormat, string> = {
  square: 'Carré',
  portrait: 'Portrait',
  landscape: 'Paysage',
  // Jamais affiché ici (FORMATS ci-dessus l'exclut délibérément, voir
  // BusinessCardModal.tsx — Phase 5) — présent seulement parce que
  // Record<ShareCardFormat, string> exige une entrée par clé du type.
  business: 'Carte de visite',
}

const CONTENT_KEYS: (keyof ShareCardContent)[] = ['showKeyMetric', 'showTopSkills', 'showCertifications', 'showSignature', 'showQrCode']
const CONTENT_LABELS: Record<keyof ShareCardContent, string> = {
  showKeyMetric: 'Chiffre clé',
  showTopSkills: 'Compétences principales',
  showCertifications: 'Certificats',
  showSignature: 'Signature',
  showQrCode: 'QR code',
}

// Aperçu en direct (refonte carte de partage, Phase 3) — remplace le flux
// précédent (clic → téléchargement direct) par ce panneau : chaque
// changement de format ou de contenu redessine le <canvas> visible, la même
// primitive que l'export final (renderShareCardToCanvas), donc jamais une
// approximation qui pourrait diverger de ce qui est réellement téléchargé.
export default function ShareCardModal({ open, profile, publicUrl, onClose }: Props) {
  const [format, setFormat] = useState<ShareCardFormat>('square')
  const [rawContent, setRawContent] = useState<ShareCardContent>(() => loadShareCardContent())
  const [rendering, setRendering] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  // Ignore le résultat d'un rendu devenu obsolète (format/contenu changé
  // pendant qu'un rendu précédent, asynchrone à cause du chargement des
  // polices, était encore en cours) — sinon un rendu lent pourrait écraser
  // un rendu plus récent déjà affiché.
  const renderToken = useRef(0)

  const { content, autoDisabled } = resolveShareCardContent(rawContent, format, true)

  useEffect(() => {
    if (!open) return
    const canvas = canvasRef.current
    if (!canvas) return
    const token = ++renderToken.current
    setRendering(true)
    renderShareCardToCanvas(canvas, profile, format, content, publicUrl)
      .catch(() => {
        // Rien d'affiché de correct si ça échoue — le bouton Télécharger
        // reste désactivé (rendering=true) plutôt que de proposer un export
        // d'un canvas à moitié dessiné.
      })
      .finally(() => {
        if (token === renderToken.current) setRendering(false)
      })
    // content est dérivé de rawContent + format à chaque rendu (voir plus
    // haut) — le comparer par valeur éviterait un objet neuf à chaque appel,
    // mais rawContent + format suffisent déjà comme dépendances réelles.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, profile, format, rawContent, publicUrl])

  function toggleContent(key: keyof ShareCardContent) {
    const next = { ...rawContent, [key]: !rawContent[key] }
    setRawContent(next)
    saveShareCardContent(next)
  }

  async function handleDownload() {
    const canvas = canvasRef.current
    if (!canvas || rendering) return
    const blob = await exportCanvasToBlob(canvas)
    downloadCanvasBlob(blob, `ledger-${slugify(profile.identity.fullName) || 'profil'}-${format}.png`)
  }

  const { width, height } = SHARE_CARD_DIMENSIONS[format]
  // Aperçu réduit à l'écran mais fidèle au pixel près dans ses proportions
  // (prompt, Phase 3) : seule la taille CSS d'AFFICHAGE change, jamais la
  // résolution réelle du bitmap (canvas.width/height, posée par
  // renderShareCardToCanvas d'après le format) — une largeur d'affichage
  // fixe avec une hauteur calculée depuis le ratio du format garde ça vrai
  // quel que soit le format choisi.
  const previewWidth = 260
  const previewHeight = Math.round((previewWidth * height) / width)

  return (
    <Modal open={open} title="Carte de partage" onClose={onClose} maxWidthClassName="max-w-md">
      <div className="mb-4">
        <span className="text-label uppercase tracking-label text-muted block mb-2">Format</span>
        <div className="grid grid-cols-3 gap-2">
          {FORMATS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFormat(f)}
              aria-pressed={format === f}
              className="min-h-11 rounded-md border text-sm"
              style={{ borderColor: format === f ? 'var(--accent)' : 'var(--ink-raised)' }}
            >
              {FORMAT_LABELS[f]}
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-center mb-4">
        <div
          className="rounded-md overflow-hidden border border-ink-raised"
          style={{ width: previewWidth, height: previewHeight }}
        >
          <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
        </div>
      </div>

      <div className="mb-4">
        <span className="text-label uppercase tracking-label text-muted block mb-2">Contenu</span>
        <div className="flex flex-col gap-1">
          {CONTENT_KEYS.map((key) => {
            const disabledByPublish = key === 'showQrCode' && !publicUrl
            return (
              <label key={key} className="flex items-center gap-2 min-h-11 text-sm">
                <input
                  type="checkbox"
                  checked={rawContent[key]}
                  disabled={disabledByPublish}
                  onChange={() => toggleContent(key)}
                  className="size-4 accent-[var(--accent)]"
                />
                <span className={disabledByPublish ? 'text-muted' : undefined}>{CONTENT_LABELS[key]}</span>
              </label>
            )
          })}
        </div>
        {autoDisabled.length > 0 && (
          <p className="text-xs text-muted mt-2" role="status">
            {autoDisabled.map((k) => CONTENT_LABELS[k]).join(', ')} désactivé{autoDisabled.length > 1 ? 's' : ''} : ce
            format n'a pas assez de place pour tout afficher proprement.
          </p>
        )}
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
