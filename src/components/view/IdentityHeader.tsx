import { useId } from 'react'
import { motion } from 'motion/react'
import type { Identity, Ticker, Domain, HeaderLayout } from '@/types'
import { initials } from '@/lib/deriveStats'
import { useMotionPrefs } from '@/lib/motion/MotionPrefsContext'
import { INTRO_TIMELINE } from '@/lib/motion/timeline'
import type { ResolvedAnimation } from '@/lib/theme/resolveAppearance'
import { useBackgroundAnimation } from '@/lib/motion/useBackgroundAnimation'
import { sealOutlinePath } from '@/lib/svg/guilloche'
import { deriveSurfaceTokens } from '@/lib/theme/deriveSurfaces'
import { oklchToHex } from '@/lib/theme/color'
import { photoFilterCss } from '@/lib/theme/photoTreatment'
import DuotoneFilterDefs from '@/components/DuotoneFilterDefs'
import AmbientSparkline from './AmbientSparkline'
import GuillochePattern from './GuillochePattern'
import SocialLinksRow from './SocialLinksRow'
import TickerBanner from './TickerBanner'

type Props = {
  domain: Domain
  identity: Identity
  tickers: Ticker[]
  headerLayout: HeaderLayout
  resolvedAnimation: ResolvedAnimation
  // Couleurs résolues du thème actif (personnalisation avancée, Phase 2) —
  // uniquement pour le duoton, qui doit suivre l'accent et le fond en
  // direct plutôt que figer une valeur à l'upload de la photo.
  accent: string
  background: string
}

const AVAILABILITY_COPY: Record<Identity['availability'], string> = {
  open: 'Ouvert aux missions',
  busy: 'Disponibilité limitée',
  closed: 'Non disponible actuellement',
}

function Avatar({ identity, size, accent, background }: { identity: Identity; size: string; accent: string; background: string }) {
  // useId() plutôt qu'un id fixe : trois instances d'Avatar existent dans ce
  // fichier (Classique/Sceau/Bandeau), une seule est jamais montée à la fois
  // (branches conditionnelles sur headerLayout) mais un id partagé serait
  // quand même fragile si ça changeait un jour.
  const duotoneId = useId()
  if (!identity.photo) {
    return (
      <div
        aria-hidden="true"
        className={`${size} rounded-full bg-ink text-paper flex items-center justify-center font-mono text-2xl`}
      >
        {initials(identity.fullName) || '—'}
      </div>
    )
  }
  // Ombre = --surface-0 du thème (dérivée, pas la couleur de fond brute),
  // lumière = accent — voir le prompt : "les tons sombres tirent vers le
  // fond du thème, les tons clairs vers l'accent".
  const darkHex = oklchToHex(deriveSurfaceTokens(background).surface0)
  const filter = photoFilterCss(identity.photoTreatment, duotoneId)
  return (
    <>
      {identity.photoTreatment === 'duotone' && <DuotoneFilterDefs id={duotoneId} darkHex={darkHex} lightHex={accent} />}
      <img
        src={identity.photo}
        alt={identity.fullName}
        className={`${size} rounded-full object-cover`}
        style={filter ? { filter } : undefined}
      />
    </>
  )
}

// Médaillon Classique (refonte v1) — anneau fin à la couleur d'accent.
function ClassicMedallion({ identity, accent, background }: { identity: Identity; accent: string; background: string }) {
  return (
    <div className="rounded-full border-2 border-accent p-1">
      <Avatar identity={identity} size="size-24" accent={accent} background={background} />
    </div>
  )
}

// Cadre Sceau (refonte v2, Phase 5) — bordure dentelée générée par la même
// fonction que CertificateSeal.tsx, à une autre échelle : renforce le
// registre "document officiel" en reliant visuellement l'en-tête aux
// certificats plutôt que d'inventer un second motif.
function SealMedallion({ identity, accent, background }: { identity: Identity; accent: string; background: string }) {
  return (
    <div className="relative size-28">
      <svg viewBox="0 0 100 100" className="absolute inset-0 size-full text-accent" aria-hidden="true">
        <path d={sealOutlinePath(50, 50, 48, 41, 22)} fill="none" stroke="currentColor" strokeWidth="1.4" />
      </svg>
      <div className="absolute inset-[9%] rounded-full overflow-hidden">
        <Avatar identity={identity} size="size-full" accent={accent} background={background} />
      </div>
    </div>
  )
}

function IdentityText({ identity, tickers }: { identity: Identity; tickers: Ticker[] }) {
  return (
    <>
      <h1 className="mt-4 text-[32px] leading-tight font-semibold tracking-tight font-heading">
        {identity.fullName || 'Nom à renseigner'}
      </h1>

      <p className="mt-1 text-xs text-muted">
        {[identity.headline, identity.location].filter(Boolean).join(' · ')}
      </p>

      {identity.bio && <p className="mt-3 text-sm max-w-xs text-paper/90">{identity.bio}</p>}

      <div className="mt-3 inline-flex items-center gap-2 min-h-11 px-3 rounded-[var(--radius-sm)] border border-paper/15 text-xs">
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
    </>
  )
}

export default function IdentityHeader({ domain, identity, tickers, headerLayout, resolvedAnimation, accent, background }: Props) {
  const animation = useBackgroundAnimation(resolvedAnimation)
  // Sparkline ambiante : rendue uniquement dans les layouts qui ont un
  // véritable bloc de fond derrière l'en-tête (Classique, Bandeau) — Sceau
  // est explicitement "sans bandeau de fond" (Phase 5), y ajouter une
  // sparkline y contredirait sa propre identité minimaliste.
  const showAmbientSparkline = animation.kind === 'sparkline' && animation.active
  const { reduced, profile } = useMotionPrefs()
  const motionProps = {
    initial: { opacity: 0, y: reduced ? 0 : 12 },
    animate: { opacity: 1, y: 0 },
    transition: { delay: INTRO_TIMELINE.identity, duration: 0.4 * profile.durationScale, ease: profile.ease },
  }

  // Sceau : centré, sans bandeau de fond ni guillochis en arrière-plan — le
  // motif "document officiel" vient du cadre dentelé lui-même, pas d'une
  // texture supplémentaire derrière (voir le prompt v2 : "sans bandeau de
  // fond"). Le bloc reste néanmoins une carte élevée, cohérente avec le
  // reste de l'interface.
  if (headerLayout === 'seal') {
    return (
      <motion.header
        {...motionProps}
        className="flex flex-col items-center text-center px-6 pt-10 pb-6 bg-ink-raised @min-[1024px]:rounded-[var(--radius-lg)] overflow-hidden"
      >
        <SealMedallion identity={identity} accent={accent} background={background} />
        <IdentityText identity={identity} tickers={tickers} />
        <div className="w-full -mx-6 mt-3">
          <TickerBanner domain={domain} tickers={tickers} />
        </div>
      </motion.header>
    )
  }

  // Bandeau : bloc à fond perdu pleine largeur en haut (même trame de
  // guillochis + dégradé que Classique, à un autre endroit), bande de
  // tickers intégrée dans ce bandeau, photo en médaillon superposée à
  // cheval sur la limite via une marge négative — pas de positionnement
  // absolu, la moitié haute du médaillon (size-24 = 96px, soit 48px) tombe
  // exactement sur le bord grâce à -mt-12.
  if (headerLayout === 'banner') {
    return (
      <motion.header {...motionProps} className="relative overflow-hidden @min-[1024px]:rounded-[var(--radius-lg)]">
        <div className="relative h-32 overflow-hidden bg-ink-raised">
          <GuillochePattern />
          <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-b from-accent-subtle to-transparent" />
          {showAmbientSparkline && <AmbientSparkline />}
          <div className="absolute inset-x-0 top-0">
            <TickerBanner domain={domain} tickers={tickers} />
          </div>
        </div>
        <div className="relative -mt-12 flex flex-col items-center text-center px-6 pb-6 bg-ink-raised">
          <div className="rounded-full border-2 border-accent p-1 bg-ink-raised">
            <Avatar identity={identity} size="size-24" accent={accent} background={background} />
          </div>
          <IdentityText identity={identity} tickers={tickers} />
        </div>
      </motion.header>
    )
  }

  // Classique (par défaut) — layout de la refonte v1, inchangé hormis la
  // sparkline ambiante optionnelle (thème Placement).
  return (
    <motion.header {...motionProps} className="relative overflow-hidden bg-ink-raised @min-[1024px]:rounded-[var(--radius-lg)]">
      <GuillochePattern />
      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-b from-accent-subtle to-transparent" />
      {showAmbientSparkline && <AmbientSparkline />}

      <div className="relative flex flex-col items-center text-center px-6 pt-10 pb-6">
        <ClassicMedallion identity={identity} accent={accent} background={background} />
        <IdentityText identity={identity} tickers={tickers} />
      </div>

      <div className="relative">
        <TickerBanner domain={domain} tickers={tickers} />
      </div>
    </motion.header>
  )
}
