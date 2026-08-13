import { type ReactNode, type HTMLAttributes } from 'react'
import type { Profile, ShareCardConfig } from '@/types'
import { yearsOfExperience, totalPositions, totalHoldings, experienceTrend, isProfileEmpty } from '@/lib/deriveStats'
import { MotionPrefsProvider } from '@/lib/motion/MotionPrefsContext'
import { useDocumentMeta, useFaviconAndThemeColor } from '@/lib/useDocumentMeta'
import { useAppliedTheme } from '@/lib/theme/useAppliedTheme'
import {
  resolveAppearanceHeaderLayout,
  resolveAppearanceAnimation,
  resolveAppearanceSignatureStyle,
  resolveAppearancePlatformIconStyle,
} from '@/lib/theme/resolveAppearance'
import IdentityHeader from '@/components/view/IdentityHeader'
import SignatureQuote from '@/components/view/SignatureQuote'
import KeyMetric from '@/components/view/KeyMetric'
import AllocationSection from '@/components/view/AllocationSection'
import PositionsHistory from '@/components/view/PositionsHistory'
import CertificatesRail from '@/components/view/CertificatesRail'
import ActionBar from '@/components/view/ActionBar'
import PublicEmptyProfileGhost from '@/components/view/PublicEmptyProfileGhost'
import AppliedBackgroundLayer from '@/components/view/AppliedBackgroundLayer'

type Props = {
  profile: Profile
  // Faux quand ProfileView est intégré comme aperçu dans l'éditeur (panneau
  // desktop ou plein écran mobile) plutôt que rendu comme la page / elle-même.
  // Contrôle deux choses qui n'ont de sens que pour la page réelle :
  // 1) appliquer le thème (fond + accent) au <html> global (EditPage s'en charge déjà lui-même)
  // 2) les landmarks <aside>/<main> — EditPage a déjà son propre <main>, on
  //    n'en veut pas un second imbriqué dedans quand on n'est qu'un aperçu.
  standalone?: boolean
  // URL publique de CE profil (correctif "modale carte de partage" Partie 2)
  // — undefined = "cette page EST la page publique" (SlugPage/ViewPage,
  // window.location.href y est déjà correct, voir ActionBar.tsx) ; null =
  // aperçu éditeur mais profil pas encore publié (aucune URL n'existe) ;
  // string = l'URL publique réelle, calculée depuis le slug PUBLIÉ (voir
  // usePublishStatus.ts), jamais depuis window.location dans ce cas — ce
  // dernier resterait sur /edit.
  publicUrl?: string | null
  // correctif "panneau d'aperçu desktop" — true uniquement depuis
  // DesktopPreviewPanel.tsx : ce panneau est toujours étroit (390px) même
  // quand la VRAIE page qui l'entoure est bien assez large pour du desktop,
  // donc le @container ci-dessous ne peut pas s'en rendre compte tout seul
  // (voir ActionBar.tsx pour le détail du problème que ça cause).
  staticActionBar?: boolean
  // Slug de la route publique /:slug (dashboard de statistiques, Phase 2) —
  // uniquement fourni par SlugPage.tsx, jamais par les aperçus de l'éditeur
  // (DesktopPreviewPanel/PreviewOverlay) ni par ViewPage.tsx (payload URL,
  // sans slug publié) : recordLinkClick devient un no-op sans slug, donc ces
  // contextes-là ne comptent simplement aucun clic, ce qui est le
  // comportement voulu (ce ne sont pas des visites publiques réelles).
  slug?: string | null
  // Doc "Publication automatique optionnelle + clarification de l'export",
  // Phase 3 — simple relais vers ActionBar.tsx → ShareCardModal.tsx, voir
  // ce dernier pour la raison de fond.
  onShareCardChange?: (config: ShareCardConfig) => void
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

export default function ProfileView({
  profile,
  standalone = true,
  publicUrl,
  staticActionBar = false,
  slug,
  onShareCardChange,
}: Props) {
  const resolvedBackground = useAppliedTheme(profile.appearance, profile.theme.accent, standalone)

  useDocumentMeta(profile, standalone)
  useFaviconAndThemeColor(resolvedBackground.hex, profile.theme.accent, standalone)

  // Uniquement pour la page publique réelle : l'aperçu de l'éditeur
  // (standalone=false) doit toujours montrer le contenu tel quel, y compris
  // vide — l'utilisateur est déjà en train de le remplir, un appel à l'action
  // "Créez votre profil" n'y aurait aucun sens.
  if (standalone && isProfileEmpty(profile)) {
    return <PublicEmptyProfileGhost theme={profile.theme} domain={profile.domain} appearance={profile.appearance} />
  }

  const years = yearsOfExperience(profile.positions)
  const trend = experienceTrend(profile.holdings)
  const headerLayout = resolveAppearanceHeaderLayout(profile.appearance)
  const resolvedAnimation = resolveAppearanceAnimation(profile.appearance)
  const signatureStyle = resolveAppearanceSignatureStyle(profile.appearance)
  const iconStyle = resolveAppearancePlatformIconStyle(profile.appearance)
  // Thème "Éclat" (Phase 3, lisibilité) — voir le commentaire sur
  // KeyMetric.tsx : seul thème dont le fond animé est assez vif pour rendre
  // les cartes translucides risquées, jamais un changement pour les autres.
  const vividBackground = profile.appearance.kind === 'gallery' && profile.appearance.themeId === 'eclat'

  return (
    <MotionPrefsProvider themeMotion={profile.theme.motion}>
      <div className="relative @container min-h-dvh bg-ink text-paper font-sans pb-24 @min-[1024px]:pb-10">
        <AppliedBackgroundLayer treatment={resolvedBackground.treatment} resolvedAnimation={resolvedAnimation} />
        <div className="@min-[1024px]:mx-auto @min-[1024px]:max-w-[1120px] @min-[1024px]:grid @min-[1024px]:grid-cols-[360px_1fr] @min-[1024px]:items-start @min-[1024px]:gap-10 @min-[1024px]:px-10 @min-[1024px]:pt-10">
          <Aside
            standalone={standalone}
            aria-label="Résumé du profil"
            className="@min-[1024px]:sticky @min-[1024px]:top-10 @min-[1024px]:flex @min-[1024px]:flex-col @min-[1024px]:gap-6"
          >
            <IdentityHeader
              domain={profile.domain}
              identity={profile.identity}
              tickers={profile.tickers}
              headerLayout={headerLayout}
              resolvedAnimation={resolvedAnimation}
              accent={profile.theme.accent}
              background={resolvedBackground.hex}
              iconStyle={iconStyle}
              slug={slug}
            />
            <KeyMetric
              domain={profile.domain}
              years={years}
              positionsCount={totalPositions(profile.positions)}
              holdingsCount={totalHoldings(profile.holdings)}
              trend={trend}
              vividBackground={vividBackground}
            />
            {/* En pied de profil, juste avant le bouton "Partager" (prompt,
                Phase 4) — testé aussi entre l'identité et le chiffre clé,
                écarté : ce second emplacement chevauche visuellement le bord
                du bloc d'en-tête (fond guilloché) au lieu de reposer sur le
                fond de page, contrairement à cet emplacement-ci. */}
            <div className="px-6 @min-[1024px]:px-0 mt-1">
              <SignatureQuote signature={profile.identity.signature} style={signatureStyle} />
            </div>
          </Aside>

          <Main standalone={standalone} className="@min-[1024px]:min-w-0">
            <AllocationSection
              domain={profile.domain}
              holdings={profile.holdings}
              accent={profile.theme.accent}
              background={resolvedBackground.hex}
            />
            <PositionsHistory domain={profile.domain} positions={profile.positions} />
            <CertificatesRail domain={profile.domain} certificates={profile.certificates} slug={slug} />
          </Main>
        </div>

        {/* Pied de page RÉEL — hors de la grille ci-dessus, donc toujours le
            DERNIER élément de la page, quel que soit le contexte : sur tout
            layout à une seule colonne (mobile réel, panneau d'aperçu étroit
            de l'éditeur — voir DesktopPreviewPanel.tsx), <Aside> apparaît
            avant <Main> dans le flux ; y placer Partager/Carte/Carte de
            visite + la mention de droits les coinçait entre l'identité et
            "Allocation" plutôt qu'à la fin (retour utilisateur). Le bouton
            "Partager" reste fixed-bottom sur mobile réel (voir ActionBar.tsx) —
            sa position CSS ne dépend pas de son ordre dans le DOM, donc ce
            déplacement ne change rien à ce comportement-là.
            @min-[1024px]:max-w-[360px] sur le bloc interne : mêmes
            proportions que l'ancien emplacement dans la colonne de gauche,
            plutôt qu'un rang de boutons étiré sur toute la largeur (1120px). */}
        <div className="px-6 @min-[1024px]:px-10 @min-[1024px]:mx-auto @min-[1024px]:max-w-[1120px] mt-10 @min-[1024px]:mt-8">
          <div className="@min-[1024px]:max-w-[360px]">
            <ActionBar
              profile={profile}
              publicUrl={publicUrl}
              staticPosition={staticActionBar}
              onShareCardChange={onShareCardChange}
            />
            <p className="mt-2 text-xs text-muted text-center @min-[1024px]:text-left">
              Tous droits réservés à Napps de N'nahssé Group - Jean-David Kouamé
            </p>
          </div>
        </div>
      </div>
    </MotionPrefsProvider>
  )
}
