import { useState } from 'react'
import { useFormContext, useWatch } from 'react-hook-form'
import { Copy } from 'lucide-react'
import type { Profile } from '@/types'
import { usePublishState } from './usePublishState'
import PublishForm from './PublishForm'
import Modal from './Modal'

type Props = {
  open: boolean
  onClose: () => void
}

// Remplace l'ancienne modale "Générer le lien" (correctif de régression,
// voir le prompt dédié) — celle-ci générait un lien encodé indépendant
// (LZString, /#/p/{payload}), un mécanisme de secours du tout premier
// prompt du projet, avant Supabase, devenu illisible et redondant avec la
// vraie publication par slug. Cette modale-ci reflète l'état RÉEL de
// publication : lien public court + copie s'il existe déjà, flux de
// publication intégré sinon (même instance de usePublishState que ce
// flux met directement à jour — bascule automatique vers le lien une fois
// publié, jamais une resynchronisation manuelle après coup).
export default function ShareProfileModal({ open, onClose }: Props) {
  const { control } = useFormContext<Profile>()
  const fullName = useWatch({ control, name: 'identity.fullName' })
  const state = usePublishState(fullName)
  const [copied, setCopied] = useState(false)

  const publicUrl =
    state.isPublished && state.savedSlug ? `${window.location.origin}${window.location.pathname}#/${state.savedSlug}` : null

  async function handleCopy() {
    if (!publicUrl) return
    try {
      await navigator.clipboard.writeText(publicUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Rien à faire de plus ici — l'URL reste affichée et sélectionnable.
    }
  }

  return (
    <Modal open={open} title="Partager mon profil" onClose={onClose}>
      {publicUrl ? (
        <>
          <p className="text-sm break-all font-mono bg-ink-raised rounded-md p-3 mb-3">{publicUrl}</p>
          <button
            type="button"
            onClick={handleCopy}
            className="w-full min-h-11 rounded-md bg-accent text-ink font-medium text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
          >
            <Copy size={16} aria-hidden="true" />
            {copied ? 'Lien copié' : 'Copier le lien'}
          </button>
        </>
      ) : (
        <>
          <p className="text-sm text-muted mb-4">Choisis d'abord ton adresse pour pouvoir partager ton profil.</p>
          <PublishForm {...state} />
        </>
      )}
    </Modal>
  )
}
