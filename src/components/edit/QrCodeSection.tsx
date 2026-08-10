import { useMemo, useState } from 'react'
import { useFormContext, useWatch } from 'react-hook-form'
import { QrCode, Download, Image as ImageIcon } from 'lucide-react'
import type { Profile } from '@/types'
import { buildQrMatrix } from '@/lib/qrcode'
import { downloadQrPng } from '@/lib/qrDownload'
import { downloadQrCard } from '@/lib/shareCard'
import { resolveAppearanceBackground } from '@/lib/theme/resolveAppearance'
import { deriveSurfaceTokens } from '@/lib/theme/deriveSurfaces'
import { oklchToHex } from '@/lib/theme/color'
import QrCodeDisplay from './QrCodeDisplay'

type Props = {
  isPublished: boolean
  savedSlug: string | null
}

// QR code du profil (personnalisation avancée, Phase 3) — placé à côté du
// lien dans la section Publier, comme demandé par le prompt. publicUrl vient
// de savedSlug (le slug réellement PUBLIÉ), jamais de slugInput : un
// renommage en cours de saisie, pas encore republié, ne doit pas produire un
// QR vers une URL qui ne mène nulle part.
export default function QrCodeSection({ isPublished, savedSlug }: Props) {
  const { control } = useFormContext<Profile>()
  const profile = useWatch({ control }) as Profile
  const appearance = useWatch({ control, name: 'appearance' })
  const [open, setOpen] = useState(false)

  const publicUrl = isPublished && savedSlug ? `${window.location.origin}${window.location.pathname}#/${savedSlug}` : null

  // Couleur du texte de titre réellement affiché sur la page publique —
  // dérivée du fond exactement comme --fg (voir useAppliedTheme.ts), donc
  // garanti AAA (7:1) contre ce fond par deriveSurfaceTokens : un contraste
  // largement supérieur à ce qu'un lecteur de QR code exige pour scanner
  // correctement, sans logique de repli séparée à maintenir.
  const backgroundHex = resolveAppearanceBackground(appearance).hex
  const moduleColor = useMemo(() => oklchToHex(deriveSurfaceTokens(backgroundHex).fg), [backgroundHex])

  const matrix = useMemo(() => (publicUrl ? buildQrMatrix(publicUrl) : null), [publicUrl])

  return (
    <div className="mt-5 pt-5 border-t border-ink-raised">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={!publicUrl}
        aria-expanded={open}
        className="min-h-11 px-4 rounded-md border border-ink-raised text-sm flex items-center gap-2 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-accent focus-visible:-outline-offset-2"
      >
        <QrCode size={16} aria-hidden="true" />
        {open ? 'Masquer le QR code' : 'Générer le QR code'}
      </button>

      {!publicUrl && (
        <p className="text-xs text-muted mt-2">Publie d'abord ton profil pour générer un QR code vers ta page.</p>
      )}

      {open && matrix && publicUrl && (
        <div className="mt-4 flex flex-col items-center gap-4">
          <div className="p-4 rounded-lg" style={{ background: backgroundHex }}>
            <QrCodeDisplay matrix={matrix} moduleColor={moduleColor} size={180} />
          </div>
          <div className="flex gap-2 flex-wrap justify-center">
            <button
              type="button"
              onClick={() => downloadQrPng(matrix, moduleColor, profile.identity.fullName)}
              className="min-h-11 px-3 rounded-md border border-ink-raised text-sm flex items-center gap-2 focus-visible:outline-2 focus-visible:outline-accent focus-visible:-outline-offset-2"
            >
              <Download size={14} aria-hidden="true" />
              QR seul (PNG)
            </button>
            <button
              type="button"
              onClick={() => downloadQrCard(profile, matrix, moduleColor, publicUrl)}
              className="min-h-11 px-3 rounded-md border border-ink-raised text-sm flex items-center gap-2 focus-visible:outline-2 focus-visible:outline-accent focus-visible:-outline-offset-2"
            >
              <ImageIcon size={14} aria-hidden="true" />
              Carte avec QR
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
