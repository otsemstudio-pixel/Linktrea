import { useEffect, useRef, useState } from 'react'
import { motion, useAnimationControls } from 'motion/react'
import type { Ticker, Domain } from '@/types'
import { PLATFORM_SYMBOLS } from '@/lib/platformSymbols'
import { pseudoVariation } from '@/lib/tickerVariation'
import { useMotionPrefs } from '@/lib/motion/MotionPrefsContext'
import { VOCABULARY } from '@/lib/vocabulary'

type Props = {
  domain: Domain
  tickers: Ticker[]
}

function tickerContent(ticker: Ticker) {
  const variation = pseudoVariation(ticker.id)
  const isUp = variation >= 0
  return (
    <>
      <span className="text-accent font-medium">{PLATFORM_SYMBOLS[ticker.platform]}</span>
      <span className="text-muted">{ticker.handle}</span>
      <span className={isUp ? 'text-up' : 'text-down'}>
        {isUp ? '▲' : '▼'} {Math.abs(variation).toFixed(2)}%
      </span>
    </>
  )
}

const TICKER_ITEM_CLASS =
  'shrink-0 flex items-center gap-2 px-4 py-2.5 min-h-11 border-r border-ink-raised font-mono text-xs whitespace-nowrap'

function TickerItem({ ticker }: { ticker: Ticker }) {
  return (
    <a
      role="listitem"
      href={ticker.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`${TICKER_ITEM_CLASS} focus-visible:outline-2 focus-visible:outline-accent focus-visible:-outline-offset-2`}
    >
      {tickerContent(ticker)}
    </a>
  )
}

// Copie visuelle non interactive : sert uniquement à boucler le marquee
// sans coupure, ne doit jamais être atteignable au clavier ni annoncée.
function TickerItemVisual({ ticker }: { ticker: Ticker }) {
  return <div className={TICKER_ITEM_CLASS}>{tickerContent(ticker)}</div>
}

// Élément signature. Marquee en transform (jamais scrollLeft ni width),
// dupliqué pour boucler sans coupure. Se met en pause au toucher — c'est
// le seul endroit "bruyant" de la page, comme prévu par le plan de design.
export default function TickerBanner({ domain, tickers }: Props) {
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
          <TickerItem key={t.id} ticker={t} />
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
          <TickerItem key={t.id} ticker={t} />
        ))}
        <div aria-hidden="true" className="flex">
          {tickers.map((t) => (
            <TickerItemVisual key={`dup-${t.id}`} ticker={t} />
          ))}
        </div>
      </motion.div>
    </div>
  )
}
