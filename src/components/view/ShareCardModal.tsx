import { useEffect, useRef, useState } from 'react'
import { Download } from 'lucide-react'
import type { Profile, ShareCardConfig, ShareCardPickableFormat } from '@/types'
import { renderShareCardToCanvas, exportCanvasToBlob, downloadCanvasBlob } from '@/lib/shareCard'
import { resolveShareCardContent } from '@/lib/shareCardContent'
import { VOCABULARY } from '@/lib/vocabulary'
import { slugify } from '@/lib/slug'
import Modal from '@/components/edit/Modal'

type Props = {
  open: boolean
  profile: Profile
  // null = profil pas encore publié (correctif "modale carte de partage"
  // Partie 2) — voir ProfileView.tsx pour la provenance de cette valeur.
  publicUrl: string | null
  onClose: () => void
  // Doc "Publication automatique optionnelle + clarification de l'export",
  // Phase 3 — présent UNIQUEMENT quand cette modale est ouverte depuis
  // l'éditeur (voir DesktopPreviewPanel.tsx/PreviewOverlay.tsx, les deux
  // seuls appelants dans un arbre <FormProvider>) : sa seule présence
  // décide si l'interface est éditable. Absent sur la route publique réelle
  // (SlugPage.tsx) et sur les routes de secours sans backend (ViewPage.tsx)
  // — aucun <FormProvider> à y lire, donc rien à passer, et c'est ce qui
  // garantit qu'un visiteur ne voit jamais aucun contrôle de format ni case
  // à cocher : pas un simple style visuel désactivé, l'UI n'est même pas
  // rendue.
  onShareCardChange?: (config: ShareCardConfig) => void
}

const FORMATS: ShareCardPickableFormat[] = ['square', 'portrait', 'landscape']
const FORMAT_LABELS: Record<ShareCardPickableFormat, string> = {
  square: 'Carré',
  portrait: 'Portrait',
  landscape: 'Paysage',
}

const CONTENT_KEYS: (keyof Omit<ShareCardConfig, 'format'>)[] = [
  'showKeyMetric',
  'showTopSkills',
  'showCertifications',
  'showSignature',
  'showQrCode',
]

// Aperçu en direct (refonte carte de partage, Phase 3) — chaque changement
// de format ou de contenu redessine le <canvas> visible, la même primitive
// que l'export final (renderShareCardToCanvas), donc jamais une
// approximation qui pourrait diverger de ce qui est réellement téléchargé.
//
// Entièrement contrôlé par profile.shareCard depuis la Phase 3 du doc
// "Publication automatique optionnelle + clarification de l'export" — plus
// aucun état local de format/contenu (ni useState, ni localStorage) : ce
// n'est plus une préférence d'appareil, c'est un attribut du profil qui
// suit ses propres règles de brouillon/publication (voir onShareCardChange
// ci-dessus, qui écrit directement dans le formulaire de l'éditeur).
export default function ShareCardModal({ open, profile, publicUrl, onClose, onShareCardChange }: Props) {
  const editable = Boolean(onShareCardChange)
  const config = profile.shareCard
  const vocabulary = VOCABULARY[profile.domain]
  // Signature et QR code n'ont pas d'équivalent dans DomainVocabulary : ce
  // sont des notions universelles, pas une métaphore propre à un domaine
  // (contrairement aux 3 autres, alignées ci-dessous) — voir le prompt
  // pilote, qui demande de montrer toute extension de la table avant de
  // l'ajouter plutôt que d'en inventer une pour ces deux-là.
  const contentLabels: Record<keyof Omit<ShareCardConfig, 'format'>, string> = {
    showKeyMetric: vocabulary.keyMetric,
    showTopSkills: vocabulary.expertiseBreakdown,
    showCertifications: vocabulary.certifications,
    showSignature: 'Signature',
    showQrCode: 'QR code',
  }
  const [rendering, setRendering] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  // Ignore le résultat d'un rendu devenu obsolète (format/contenu changé
  // pendant qu'un rendu précédent, asynchrone à cause du chargement des
  // polices, était encore en cours) — sinon un rendu lent pourrait écraser
  // un rendu plus récent déjà affiché.
  const renderToken = useRef(0)

  const { content, autoDisabled } = resolveShareCardContent(config, config.format, true)

  useEffect(() => {
    if (!open) return
    const canvas = canvasRef.current
    if (!canvas) return
    const token = ++renderToken.current
    setRendering(true)
    renderShareCardToCanvas(canvas, profile, config.format, content, publicUrl ?? undefined)
      .catch(() => {
        // Rien d'affiché de correct si ça échoue — le bouton Télécharger
        // reste désactivé (rendering=true) plutôt que de proposer un export
        // d'un canvas à moitié dessiné.
      })
      .finally(() => {
        if (token === renderToken.current) setRendering(false)
      })
    // content est dérivé de config à chaque rendu (voir plus haut) — le
    // comparer par valeur éviterait un objet neuf à chaque appel, mais
    // config + profile suffisent déjà comme dépendances réelles.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, profile, config, publicUrl])

  function setFormat(format: ShareCardPickableFormat) {
    onShareCardChange?.({ ...config, format })
  }

  function toggleContent(key: keyof Omit<ShareCardConfig, 'format'>) {
    onShareCardChange?.({ ...config, [key]: !config[key] })
  }

  async function handleDownload() {
    const canvas = canvasRef.current
    if (!canvas || rendering) return
    const blob = await exportCanvasToBlob(canvas)
    downloadCanvasBlob(blob, `linktrea-${slugify(profile.identity.fullName) || 'profil'}-${config.format}.png`)
  }

  // Zone d'aperçu à hauteur CSS CONSTANTE, quel que soit le format choisi
  // (correctif "modale carte de partage" Partie 1) — avant ce correctif, la
  // hauteur du conteneur était calculée depuis le ratio du format actif
  // (previewWidth * height / width), donc changeait à chaque bascule
  // Carré/Portrait/Paysage et étirait toute la modale en cascade. Le canvas
  // s'adapte maintenant PAR CSS (max-width/max-height + width/height: auto,
  // même mécanique que object-fit: contain) à l'intérieur de ce cadre fixe,
  // sans jamais changer sa taille — seules ses dimensions RÉELLES d'export
  // (canvas.width/height, posées par renderShareCardToCanvas) suivent le
  // format, exactement comme avant (Phase 1/3 de la refonte, inchangées).
  const PREVIEW_BOX_HEIGHT = 300

  return (
    <Modal open={open} title="Carte de partage" onClose={onClose} maxWidthClassName="max-w-md">
      {editable && (
        <div className="mb-4">
          <span className="text-label uppercase tracking-label text-muted block mb-2">Format</span>
          <div className="grid grid-cols-3 gap-2">
            {FORMATS.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFormat(f)}
                aria-pressed={config.format === f}
                className="min-h-11 rounded-md border text-sm"
                style={{ borderColor: config.format === f ? 'var(--accent)' : 'var(--ink-raised)' }}
              >
                {FORMAT_LABELS[f]}
              </button>
            ))}
          </div>
        </div>
      )}

      <div
        className="flex items-center justify-center mb-4 rounded-md overflow-hidden border border-ink-raised bg-ink-raised/20"
        style={{ height: PREVIEW_BOX_HEIGHT }}
      >
        <canvas ref={canvasRef} style={{ maxWidth: '100%', maxHeight: '100%', width: 'auto', height: 'auto', display: 'block' }} />
      </div>

      {editable && (
        <div className="mb-4">
          <span className="text-label uppercase tracking-label text-muted block mb-2">Contenu</span>
          <div className="flex flex-col gap-1">
            {CONTENT_KEYS.map((key) => {
              const disabledByPublish = key === 'showQrCode' && !publicUrl
              return (
                <label key={key} className="flex items-center gap-2 min-h-11 text-sm">
                  <input
                    type="checkbox"
                    checked={config[key]}
                    disabled={disabledByPublish}
                    onChange={() => toggleContent(key)}
                    className="size-4 accent-[var(--accent)]"
                  />
                  <span className={disabledByPublish ? 'text-muted' : undefined}>{contentLabels[key]}</span>
                </label>
              )
            })}
          </div>
          {autoDisabled.length > 0 && (
            <p className="text-xs text-muted mt-2" role="status">
              {autoDisabled.map((k) => contentLabels[k]).join(', ')} désactivé{autoDisabled.length > 1 ? 's' : ''} : ce
              format n'a pas assez de place pour tout afficher proprement.
            </p>
          )}
        </div>
      )}

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
