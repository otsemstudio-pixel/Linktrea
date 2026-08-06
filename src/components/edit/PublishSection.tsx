import { useFormContext, useWatch } from 'react-hook-form'
import { Check, X, Loader2 } from 'lucide-react'
import type { Profile } from '@/types'
import { usePublishState, type CheckStatus } from './usePublishState'

const STATUS_COPY: Record<CheckStatus, { label: string; className: string }> = {
  idle: { label: '', className: '' },
  checking: { label: 'Vérification…', className: 'text-muted' },
  available: { label: 'Disponible', className: 'text-up' },
  taken: { label: 'Déjà pris', className: 'text-down' },
  invalid: { label: 'Format invalide : 3-32 caractères, minuscules, chiffres, tirets', className: 'text-down' },
}

function previewUrl(slug: string): string {
  const base = `${window.location.origin}${window.location.pathname}`
  return `${base}#/${slug || '…'}`
}

export default function PublishSection() {
  const { control } = useFormContext<Profile>()
  const fullName = useWatch({ control, name: 'identity.fullName' })

  const {
    slugInput,
    setSlugInput,
    savedSlug,
    isPublished,
    checkStatus,
    actionPending,
    actionError,
    actionMessage,
    publish,
    unpublish,
  } = usePublishState(fullName)

  const hasPendingSlugChange = slugInput !== (savedSlug ?? '')
  const canPublish = checkStatus === 'available' && !actionPending
  const StatusIcon = checkStatus === 'available' ? Check : checkStatus === 'checking' ? Loader2 : X

  return (
    <>
      <label className="block mb-2">
        <span className="text-label uppercase tracking-label text-muted block mb-1.5">Lien</span>
        <input
          type="text"
          value={slugInput}
          onChange={(e) => setSlugInput(e.target.value.toLowerCase())}
          placeholder="jean-david"
          className="w-full min-h-11 rounded-md border border-ink-raised bg-surface-inset px-3 text-sm text-paper focus-visible:outline-2 focus-visible:outline-accent focus-visible:-outline-offset-2 focus:border-accent"
        />
      </label>

      {checkStatus !== 'idle' && (
        <p className={`text-xs mb-3 flex items-center gap-1.5 ${STATUS_COPY[checkStatus].className}`}>
          <StatusIcon size={12} aria-hidden="true" className={checkStatus === 'checking' ? 'animate-spin' : ''} />
          {STATUS_COPY[checkStatus].label}
        </p>
      )}

      <p className="text-xs text-muted mb-4 break-all font-mono">{previewUrl(slugInput)}</p>

      {actionError && <p className="text-xs text-down mb-3">{actionError}</p>}
      {actionMessage && <p className="text-xs text-up mb-3">{actionMessage}</p>}

      <div className="flex gap-2">
        {(!isPublished || hasPendingSlugChange) && (
          <button
            type="button"
            onClick={publish}
            disabled={!canPublish}
            className="min-h-11 px-4 rounded-md bg-accent text-ink font-medium text-sm disabled:opacity-50 active:scale-[0.98] transition-transform focus-visible:outline-2 focus-visible:outline-paper focus-visible:-outline-offset-2"
          >
            Publier
          </button>
        )}
        {isPublished && (
          <button
            type="button"
            onClick={unpublish}
            disabled={actionPending}
            className="min-h-11 px-4 rounded-md border border-ink-raised text-sm disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-accent focus-visible:-outline-offset-2"
          >
            Dépublier
          </button>
        )}
      </div>
    </>
  )
}
