import type { Ticker } from '@/types'
import { PLATFORM_SYMBOLS } from '@/lib/platformSymbols'

type Props = {
  tickers: Ticker[]
}

// Rangée d'accès direct aux réseaux, sous le badge de disponibilité —
// complète le bandeau tickers (ambiant, en haut) par des cibles tactiles
// immédiatement utilisables, sans attendre le défilement.
export default function SocialLinksRow({ tickers }: Props) {
  if (tickers.length === 0) return null

  return (
    <div className="flex flex-wrap justify-center gap-2 mt-3">
      {tickers.map((ticker) => (
        <a
          key={ticker.id}
          href={ticker.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${PLATFORM_SYMBOLS[ticker.platform]} · ${ticker.handle}`}
          className="min-h-11 min-w-11 px-3 flex items-center justify-center rounded-md border border-ink-raised font-mono text-xs text-muted active:scale-95 active:text-accent active:border-accent focus-visible:outline-2 focus-visible:outline-accent focus-visible:-outline-offset-2 transition-transform"
        >
          {PLATFORM_SYMBOLS[ticker.platform]}
        </a>
      ))}
    </div>
  )
}
