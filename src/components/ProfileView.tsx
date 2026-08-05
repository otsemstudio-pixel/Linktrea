import { useEffect, type ReactNode, type HTMLAttributes } from 'react'
import type { Profile } from '@/types'
import { yearsOfExperience, totalPositions, totalHoldings, experienceTrend } from '@/lib/deriveStats'
import { MotionPrefsProvider } from '@/lib/motion/MotionPrefsContext'
import { useDocumentMeta, useFaviconAndThemeColor } from '@/lib/useDocumentMeta'
import TickerBanner from '@/components/view/TickerBanner'
import IdentityHeader from '@/components/view/IdentityHeader'
import KeyMetric from '@/components/view/KeyMetric'
import AllocationSection from '@/components/view/AllocationSection'
import PositionsHistory from '@/components/view/PositionsHistory'
import CertificatesRail from '@/components/view/CertificatesRail'
import ActionBar from '@/components/view/ActionBar'

type Props = {
  profile: Profile
  // Faux quand ProfileView est intégré comme aperçu dans l'éditeur (panneau
  // desktop ou plein écran mobile) plutôt que rendu comme la page / elle-même.
  // Contrôle deux choses qui n'ont de sens que pour la page réelle :
  // 1) appliquer le preset au <html> global (EditPage s'en charge déjà lui-même)
  // 2) les landmarks <aside>/<main> — EditPage a déjà son propre <main>, on
  //    n'en veut pas un second imbriqué dedans quand on n'est qu'un aperçu.
  standalone?: boolean
}

type LandmarkProps = { standalone: boolean; children: ReactNode } & HTMLAttributes<HTMLElement>

// Landmarks <aside>/<main> uniquement pour la page réelle — voir le
// commentaire sur `standalone` plus haut.
function Aside({ standalone, children, ...rest }: LandmarkProps) {
  return standalone ? <aside {...rest}>{children}</aside> : <div {...rest}>{children}</div>
}
function Main({ standalone, children, ...rest }: LandmarkProps) {
  return standalone ? <main {...rest}>{children}</main> : <div {...rest}>{children}</div>
}

export default function ProfileView({ profile, standalone = true }: Props) {
  useEffect(() => {
    if (!standalone) return
    document.documentElement.dataset.preset = profile.theme.preset
  }, [profile.theme.preset, standalone])

  useDocumentMeta(profile, standalone)
  useFaviconAndThemeColor(profile.theme.preset, standalone)

  const years = yearsOfExperience(profile.positions)
  const trend = experienceTrend(profile.holdings)

  return (
    <MotionPrefsProvider preset={profile.theme.preset} themeMotion={profile.theme.motion}>
      <div className="@container min-h-dvh bg-ink text-paper font-sans pb-24 @min-[1024px]:pb-10">
        {/* Le bandeau reste plein-bleed à toutes les tailles — c'est l'élément
            signature façon bandeau boursier, il ne doit pas être contenu. */}
        <TickerBanner tickers={profile.tickers} />

        <div className="@min-[1024px]:mx-auto @min-[1024px]:max-w-[1120px] @min-[1024px]:grid @min-[1024px]:grid-cols-[360px_1fr] @min-[1024px]:items-start @min-[1024px]:gap-10 @min-[1024px]:px-10 @min-[1024px]:pt-10">
          <Aside
            standalone={standalone}
            aria-label="Résumé du profil"
            className="@min-[1024px]:sticky @min-[1024px]:top-10 @min-[1024px]:flex @min-[1024px]:flex-col @min-[1024px]:gap-6"
          >
            <IdentityHeader identity={profile.identity} tickers={profile.tickers} />
            <KeyMetric
              years={years}
              positionsCount={totalPositions(profile.positions)}
              holdingsCount={totalHoldings(profile.holdings)}
              trend={trend}
            />
            <ActionBar tickers={profile.tickers} />
          </Aside>

          <Main standalone={standalone} className="@min-[1024px]:min-w-0">
            <AllocationSection holdings={profile.holdings} />
            <PositionsHistory positions={profile.positions} />
            <CertificatesRail certificates={profile.certificates} />
          </Main>
        </div>
      </div>
    </MotionPrefsProvider>
  )
}
