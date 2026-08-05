import { useMemo, useState } from 'react'
import { Copy } from 'lucide-react'
import type { Profile } from '@/types'
import { encodeProfile, PAYLOAD_WARNING_THRESHOLD } from '@/lib/codec'
import Modal from './Modal'

type Props = {
  open: boolean
  profile: Profile
  onClose: () => void
}

export default function ShareLinkModal({ open, profile, onClose }: Props) {
  const [copied, setCopied] = useState(false)

  const { url, payloadLength } = useMemo(() => {
    const payload = encodeProfile(profile)
    return { url: `${window.location.origin}${window.location.pathname}#/p/${payload}`, payloadLength: payload.length }
  }, [profile])

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Rien à faire de plus ici — l'URL reste affichée et sélectionnable.
    }
  }

  return (
    <Modal open={open} title="Générer le lien" onClose={onClose}>
      <p className="text-sm break-all font-mono bg-ink-raised rounded-md p-3 mb-3">{url}</p>

      <p className="text-xs text-muted mb-4">
        Taille du payload : <span className="font-mono">{payloadLength}</span> caractères
      </p>

      {payloadLength > PAYLOAD_WARNING_THRESHOLD && (
        <p className="text-xs text-down mb-4">
          Ce lien dépasse {PAYLOAD_WARNING_THRESHOLD} caractères — certains services le tronqueront. Utilisez plutôt
          l'export JSON pour partager ce profil.
        </p>
      )}

      <button
        type="button"
        onClick={handleCopy}
        className="w-full min-h-11 rounded-md bg-accent text-ink font-medium text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
      >
        <Copy size={16} aria-hidden="true" />
        {copied ? 'Lien copié' : 'Copier le lien'}
      </button>
    </Modal>
  )
}
