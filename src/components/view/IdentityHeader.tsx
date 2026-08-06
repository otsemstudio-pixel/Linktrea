import { motion } from 'motion/react'
import type { Identity, Ticker } from '@/types'
import { initials } from '@/lib/deriveStats'
import { useMotionPrefs } from '@/lib/motion/MotionPrefsContext'
import { INTRO_TIMELINE } from '@/lib/motion/timeline'
import { guillochePaths, GUILLOCHE_EXTENT } from '@/lib/svg/guilloche'
import SocialLinksRow from './SocialLinksRow'
import TickerBanner from './TickerBanner'

type Props = {
  identity: Identity
  tickers: Ticker[]
}

const AVAILABILITY_COPY: Record<Identity['availability'], string> = {
  open: 'Ouvert aux missions',
  busy: 'Disponibilité limitée',
  closed: 'Non disponible actuellement',
}

// Signature visuelle du projet (Phase 3) : la même trame de guillochis que
// les sceaux de certificats, à très faible opacité — lisible comme "document
// financier officiel" sans jamais concurrencer le contenu.
function GuillochePattern() {
  const e = GUILLOCHE_EXTENT
  return (
    <svg
      viewBox={`${-e} ${-e} ${e * 2} ${e * 2}`}
      preserveAspectRatio="xMidYMid slice"
      className="absolute inset-0 size-full text-accent opacity-[0.06]"
      aria-hidden="true"
    >
      {guillochePaths().map((d, i) => (
        <path key={i} d={d} fill="none" stroke="currentColor" strokeWidth="0.35" />
      ))}
    </svg>
  )
}

export default function IdentityHeader({ identity, tickers }: Props) {
  const { reduced, profile } = useMotionPrefs()

  return (
    <motion.header
      initial={{ opacity: 0, y: reduced ? 0 : 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: INTRO_TIMELINE.identity, duration: 0.4 * profile.durationScale, ease: profile.ease }}
      className="relative overflow-hidden bg-ink-raised @min-[1024px]:rounded-lg"
    >
      {/* Fond perdu : texture + dégradé, sous le contenu, jamais interactifs. */}
      <GuillochePattern />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-b from-accent-subtle to-transparent"
      />

      <div className="relative flex flex-col items-center text-center px-6 pt-10 pb-6">
        <div className="rounded-full border-2 border-accent p-1">
          {identity.photo ? (
            <img src={identity.photo} alt={identity.fullName} className="size-24 rounded-full object-cover" />
          ) : (
            <div
              aria-hidden="true"
              className="size-24 rounded-full bg-ink text-paper flex items-center justify-center font-mono text-2xl"
            >
              {initials(identity.fullName) || '—'}
            </div>
          )}
        </div>

        <h1 className="mt-4 text-[32px] leading-tight font-semibold tracking-tight">
          {identity.fullName || 'Nom à renseigner'}
        </h1>

        <p className="mt-1 text-xs text-muted">
          {[identity.headline, identity.location].filter(Boolean).join(' · ')}
        </p>

        {identity.bio && <p className="mt-3 text-sm max-w-xs text-paper/90">{identity.bio}</p>}

        <div className="mt-3 inline-flex items-center gap-2 min-h-11 px-3 rounded-full border border-paper/15 text-xs">
          <span
            aria-hidden="true"
            className={
              'size-2 rounded-full ' +
              (identity.availability === 'open'
                ? 'bg-up'
                : identity.availability === 'busy'
                  ? 'bg-accent'
                  : 'bg-muted')
            }
          />
          <span>{AVAILABILITY_COPY[identity.availability]}</span>
        </div>

        <SocialLinksRow tickers={tickers} />
      </div>

      {/* Bande de tickers "par-dessus" le bloc, en bas de l'en-tête — surface
          distincte (surface-0) pour lire comme posée sur le fond de l'en-tête,
          pas comme une continuation de celui-ci. */}
      <div className="relative">
        <TickerBanner tickers={tickers} />
      </div>
    </motion.header>
  )
}
