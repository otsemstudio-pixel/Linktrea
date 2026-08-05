import { motion } from 'motion/react'
import type { Identity, Ticker } from '@/types'
import { initials } from '@/lib/deriveStats'
import { useMotionPrefs } from '@/lib/motion/MotionPrefsContext'
import { INTRO_TIMELINE } from '@/lib/motion/timeline'
import SocialLinksRow from './SocialLinksRow'

type Props = {
  identity: Identity
  tickers: Ticker[]
}

const AVAILABILITY_COPY: Record<Identity['availability'], string> = {
  open: 'Ouvert aux missions',
  busy: 'Disponibilité limitée',
  closed: 'Non disponible actuellement',
}

export default function IdentityHeader({ identity, tickers }: Props) {
  const { reduced, profile } = useMotionPrefs()

  return (
    <motion.header
      initial={{ opacity: 0, y: reduced ? 0 : 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: INTRO_TIMELINE.identity, duration: 0.4 * profile.durationScale, ease: profile.ease }}
      className="flex flex-col items-center text-center px-6 pt-8 pb-6"
    >
      {identity.photo ? (
        <img
          src={identity.photo}
          alt={identity.fullName}
          className="size-24 rounded-full object-cover border border-ink-raised"
        />
      ) : (
        <div
          aria-hidden="true"
          className="size-24 rounded-full bg-ink-raised text-paper flex items-center justify-center font-mono text-2xl"
        >
          {initials(identity.fullName) || '—'}
        </div>
      )}

      <h1 className="mt-4 text-[32px] leading-tight font-semibold tracking-tight">
        {identity.fullName || 'Nom à renseigner'}
      </h1>

      <p className="mt-1 text-xs text-muted">
        {[identity.headline, identity.location].filter(Boolean).join(' · ')}
      </p>

      {identity.bio && <p className="mt-3 text-sm max-w-xs text-paper/90">{identity.bio}</p>}

      <div className="mt-3 inline-flex items-center gap-2 min-h-11 px-3 rounded-full border border-ink-raised text-xs">
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
    </motion.header>
  )
}
