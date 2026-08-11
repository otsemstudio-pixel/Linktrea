import { useEffect, useRef, useState } from 'react'
import { motion, useAnimationControls } from 'motion/react'
import type { Ticker, Domain, PlatformIconStyle } from '@/types'
import PlatformIcon from '@/components/PlatformIcon'
import { pseudoVariation } from '@/lib/tickerVariation'
import { useMotionPrefs } from '@/lib/motion/MotionPrefsContext'
import { VOCABULARY } from '@/lib/vocabulary'
import { recordLinkClick } from '@/lib/stats'

type Props = {
  domain: Domain
  tickers: Ticker[]
  iconStyle: PlatformIconStyle
  slug?: string | null
}

function tickerContent(ticker: Ticker, iconStyle: PlatformIconStyle) {
  const variation = pseudoVariation(ticker.id)
  const isUp = variation >= 0
  return (
    <>
      {/* className porté par PlatformIcon uniquement pour son repli texte
          LinkedIn (voir PlatformIcon.tsx) — sans effet sur les icônes SVG,
          dont la couleur suit `iconStyle`, pas les classes utilitaires. */}
      <PlatformIcon platform={ticker.platform} style={iconStyle} size={14} className="text-accent font-medium" />
      <span className="text-muted">{ticker.handle}</span>
      <span className={isUp ? 'text-up' : 'text-down'}>
        {isUp ? '▲' : '▼'} {Math.abs(variation).toFixed(2)}%
      </span>
    </>
  )
}

const TICKER_ITEM_CLASS =
  'shrink-0 flex items-center gap-2 px-4 py-2.5 min-h-11 border-r border-ink-raised font-mono text-xs whitespace-nowrap'

function TickerItem({ ticker, iconStyle, slug }: { ticker: Ticker; iconStyle: PlatformIconStyle; slug?: string | null }) {
  return (
    <a
      role="listitem"
      href={ticker.url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => recordLinkClick(slug, ticker.id)}
      className={`${TICKER_ITEM_CLASS} focus-visible:outline-2 focus-visible:outline-accent focus-visible:-outline-offset-2`}
    >
      {tickerContent(ticker, iconStyle)}
    </a>
  )
}

// Copie visuelle non interactive : sert uniquement à boucler le marquee
// sans coupure, ne doit jamais être atteignable au clavier ni annoncée.
function TickerItemVisual({ ticker, iconStyle }: { ticker: Ticker; iconStyle: PlatformIconStyle }) {
  return <div className={TICKER_ITEM_CLASS}>{tickerContent(ticker, iconStyle)}</div>
}

// Élément signature. Marquee en transform (jamais scrollLeft ni width),
// dupliqué pour boucler sans coupure. Se met en pause au toucher — c'est
// le seul endroit "bruyant" de la page, comme prévu par le plan de design.
export default function TickerBanner({ domain, tickers, iconStyle, slug }: Props) {
  const trackRef = useRef<HTMLDivElement>(null)
  const controls = useAnimationControls()
  const { reduced } = useMotionPrefs()
  const [halfWidth, setHalfWidth] = useState(0)
  const networksLabel = VOCABULARY[domain].networks

  useEffect(() => {
    if (trackRef.current) {
      setHalfWidth(trackRef.current.scrollWidth / 2)
    }
  }, [tickers])

  useEffect(() => {
    if (reduced || halfWidth === 0) return
    const pixelsPerSecond = 40
    controls.start({
      x: -halfWidth,
      transition: { duration: halfWidth / pixelsPerSecond, ease: 'linear', repeat: Infinity },
    })
  }, [controls, halfWidth, reduced])

  if (tickers.length === 0) return null

  if (reduced) {
    return (
      <div role="list" aria-label={networksLabel} className="flex overflow-x-auto scrollbar-none bg-ink/90">
        {tickers.map((t) => (
          <TickerItem key={t.id} ticker={t} iconStyle={iconStyle} slug={slug} />
        ))}
      </div>
    )
  }

  return (
    <div
      role="list"
      aria-label={networksLabel}
      className="overflow-hidden bg-ink/90"
      onPointerDown={() => controls.stop()}
      onPointerUp={() =>
        halfWidth > 0 &&
        controls.start({
          x: -halfWidth,
          transition: { duration: halfWidth / 40, ease: 'linear', repeat: Infinity },
        })
      }
    >
      <motion.div ref={trackRef} className="flex w-max" animate={controls}>
        {tickers.map((t) => (
          <TickerItem key={t.id} ticker={t} iconStyle={iconStyle} slug={slug} />
        ))}
        <div aria-hidden="true" className="flex">
          {tickers.map((t) => (
            <TickerItemVisual key={`dup-${t.id}`} ticker={t} iconStyle={iconStyle} />
          ))}
        </div>
      </motion.div>
    </div>
  )
}
