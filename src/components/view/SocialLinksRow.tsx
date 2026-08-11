import type { Ticker } from '@/types'
import { PLATFORM_SYMBOLS } from '@/lib/platformSymbols'
import { recordLinkClick } from '@/lib/stats'

type Props = {
  tickers: Ticker[]
  slug?: string | null
}

// Grille de pastilles carrées, symbole seul (voir platformSymbols.ts — pas
// d'icônes de marque disponibles) — le libellé complet (handle) ne
// s'affiche qu'au toucher/focus, via group-active/group-focus-visible, sans
// état JS : la pastille reste lisible même repliée, le détail arrive à la
// demande plutôt que d'encombrer la grille en permanence.
export default function SocialLinksRow({ tickers, slug }: Props) {
  if (tickers.length === 0) return null

  return (
    <div className="grid grid-cols-4 gap-2 mt-3 w-full max-w-[280px]">
      {tickers.map((ticker) => (
        <a
          key={ticker.id}
          href={ticker.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => recordLinkClick(slug, ticker.id)}
          className="group relative aspect-square min-h-11 flex items-center justify-center rounded-[var(--radius-sm)] font-mono text-[10px] active:scale-95 focus-visible:outline-2 focus-visible:outline-accent focus-visible:-outline-offset-2 transition-transform"
          style={{
            background: 'var(--card-bg)',
            color: 'var(--card-fg-muted)',
            borderStyle: 'solid',
            borderWidth: 'var(--card-border-width)',
            borderColor: 'var(--card-border-color)',
            boxShadow: 'var(--card-shadow)',
          }}
        >
          {PLATFORM_SYMBOLS[ticker.platform]}
          <span
            role="presentation"
            className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md border border-ink-raised bg-ink px-2 py-1 text-[11px] text-paper opacity-0 scale-95 transition-[opacity,transform] duration-150 group-active:opacity-100 group-active:scale-100 group-focus-visible:opacity-100 group-focus-visible:scale-100"
          >
            {ticker.handle}
          </span>
        </a>
      ))}
    </div>
  )
}
