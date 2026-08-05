import { useState } from 'react'
import { Mail, Share2 } from 'lucide-react'
import type { Ticker } from '@/types'

type Props = {
  tickers: Ticker[]
}

export default function ActionBar({ tickers }: Props) {
  const [toast, setToast] = useState<string | null>(null)
  const emailTicker = tickers.find((t) => t.platform === 'email')

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

  return (
    <div className="fixed bottom-0 inset-x-0 z-30 border-t border-ink-raised bg-ink/95 backdrop-blur-sm pb-[env(safe-area-inset-bottom)] @min-[1024px]:static @min-[1024px]:pb-0 @min-[1024px]:border @min-[1024px]:rounded-lg @min-[1024px]:bg-ink-raised/40">
      {toast && (
        <p role="status" aria-live="polite" className="text-center text-xs text-up py-1.5">
          {toast}
        </p>
      )}
      <div className="flex gap-2 p-3">
        {emailTicker && (
          <a
            href={emailTicker.url}
            className="flex-1 min-h-11 flex items-center justify-center gap-2 rounded-md bg-accent text-ink font-medium text-sm active:scale-[0.98] transition-transform focus-visible:outline-2 focus-visible:outline-paper focus-visible:-outline-offset-2"
          >
            <Mail size={16} aria-hidden="true" />
            Contacter
          </a>
        )}
        <button
          type="button"
          onClick={handleShare}
          className="flex-1 min-h-11 flex items-center justify-center gap-2 rounded-md border border-ink-raised text-sm active:scale-[0.98] transition-transform focus-visible:outline-2 focus-visible:outline-accent focus-visible:-outline-offset-2"
        >
          <Share2 size={16} aria-hidden="true" />
          Partager
        </button>
      </div>
    </div>
  )
}
