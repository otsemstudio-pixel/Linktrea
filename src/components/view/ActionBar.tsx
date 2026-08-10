import { useState } from 'react'
import { Mail, Share2, Image as ImageIcon } from 'lucide-react'
import type { Profile } from '@/types'
import { downloadShareCard } from '@/lib/shareCard'

type Props = {
  profile: Profile
}

export default function ActionBar({ profile }: Props) {
  const [toast, setToast] = useState<string | null>(null)
  const [generatingCard, setGeneratingCard] = useState(false)
  const emailTicker = profile.tickers.find((t) => t.platform === 'email')
  // Thème "Éclat" (Phase 3, lisibilité) : la barre desktop translucide
  // (bg-ink-raised/40) est pensée pour un fond calme — sur le dégradé animé
  // et vif d'Éclat, elle laisserait passer trop de couleur derrière le
  // texte des boutons. Reçoit déjà `profile` en entier, pas besoin d'un
  // prop dédié comme KeyMetric.tsx (qui ne reçoit pas appearance).
  const vividBackground = profile.appearance.kind === 'gallery' && profile.appearance.themeId === 'eclat'

  function showToast(message: string) {
    setToast(message)
    setTimeout(() => setToast(null), 2400)
  }

  async function handleShare() {
    const url = window.location.href
    if (navigator.share) {
      try {
        await navigator.share({ url })
      } catch {
        // L'utilisateur a annulé le partage — rien à signaler.
      }
      return
    }
    try {
      await navigator.clipboard.writeText(url)
      showToast('Lien copié')
    } catch {
      showToast("Impossible de copier le lien")
    }
  }

  async function handleGenerateCard() {
    setGeneratingCard(true)
    try {
      await downloadShareCard(profile)
    } catch {
      showToast('Impossible de générer la carte')
    } finally {
      setGeneratingCard(false)
    }
  }

  return (
    <div
      className={`fixed bottom-0 inset-x-0 z-30 border-t border-ink-raised bg-ink/95 backdrop-blur-sm pb-[env(safe-area-inset-bottom)] @min-[1024px]:static @min-[1024px]:pb-0 @min-[1024px]:border @min-[1024px]:rounded-[var(--radius-lg)] ${vividBackground ? '@min-[1024px]:bg-ink-raised' : '@min-[1024px]:bg-ink-raised/40'}`}
    >
      {toast && (
        <p role="status" aria-live="polite" className="text-center text-xs text-up py-1.5">
          {toast}
        </p>
      )}
      <div className="flex gap-2 p-3">
        {emailTicker && (
          <a
            href={emailTicker.url}
            className="flex-1 min-h-11 flex items-center justify-center gap-2 rounded-[var(--radius-sm)] font-medium text-sm active:scale-[0.98] transition-transform focus-visible:outline-2 focus-visible:outline-paper focus-visible:-outline-offset-2"
            style={{
              background: 'var(--button-bg)',
              color: 'var(--button-fg)',
              borderStyle: 'solid',
              borderWidth: 'var(--button-border-width)',
              borderColor: 'var(--button-border-color)',
              boxShadow: 'var(--button-shadow)',
            }}
          >
            <Mail size={16} aria-hidden="true" />
            Contacter
          </a>
        )}
        <button
          type="button"
          onClick={handleShare}
          className="flex-1 min-h-11 flex items-center justify-center gap-2 rounded-[var(--radius-sm)] border border-ink-raised text-sm active:scale-[0.98] transition-transform focus-visible:outline-2 focus-visible:outline-accent focus-visible:-outline-offset-2"
        >
          <Share2 size={16} aria-hidden="true" />
          Partager
        </button>
        <button
          type="button"
          onClick={handleGenerateCard}
          disabled={generatingCard}
          className="flex-1 min-h-11 flex items-center justify-center gap-2 rounded-[var(--radius-sm)] border border-ink-raised text-sm disabled:opacity-50 active:scale-[0.98] transition-transform focus-visible:outline-2 focus-visible:outline-accent focus-visible:-outline-offset-2"
        >
          <ImageIcon size={16} aria-hidden="true" />
          {generatingCard ? 'Génération…' : 'Carte'}
        </button>
      </div>
    </div>
  )
}
