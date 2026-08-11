import { useEffect, useState } from 'react'
import { useForm, FormProvider, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { Profile } from '@/types'
import { profileSchema } from '@/lib/schema'
import { createEmptyProfile } from '@/lib/emptyProfile'
import { getProfileStore } from '@/lib/store'
import { useProfileStoreAutosave } from '@/lib/store/useProfileStoreAutosave'
import { MotionPrefsProvider } from '@/lib/motion/MotionPrefsContext'
import { CoachmarkProvider } from '@/lib/coachmark/CoachmarkContext'
import { markTutorialSeen } from '@/lib/coachmark/tutorialSeen'
import { buildCoachmarkSteps } from '@/lib/coachmark/steps'
import CoachmarkOverlay from '@/components/coachmark/CoachmarkOverlay'
import CoachmarkAutoStart from '@/components/coachmark/CoachmarkAutoStart'
import CoachmarkHelpButton from '@/components/coachmark/CoachmarkHelpButton'
import CollapsibleSection from '@/components/edit/CollapsibleSection'
import IdentitySection from '@/components/edit/IdentitySection'
import PublishSection from '@/components/edit/PublishSection'
import PositionsSection from '@/components/edit/PositionsSection'
import HoldingsSection from '@/components/edit/HoldingsSection'
import CertificatesSection from '@/components/edit/CertificatesSection'
import TickersSection from '@/components/edit/TickersSection'
import AppearanceSection from '@/components/edit/AppearanceSection'
import AccountSection from '@/components/edit/AccountSection'
import EditorActionBar from '@/components/edit/EditorActionBar'
import EditorSkeleton from '@/components/edit/EditorSkeleton'
import ShareLinkModal from '@/components/edit/ShareLinkModal'
import PreviewOverlay from '@/components/edit/PreviewOverlay'
import StatsOverlay from '@/components/edit/StatsOverlay'
import DesktopPreviewPanel from '@/components/edit/DesktopPreviewPanel'
import { useFaviconAndThemeColor } from '@/lib/useDocumentMeta'
import { useAppliedTheme } from '@/lib/theme/useAppliedTheme'
import { useAuth } from '@/lib/auth/AuthContext'

const STORAGE_MODE = import.meta.env.VITE_STORAGE_MODE === 'supabase' ? 'supabase' : 'local'

export default function EditPage() {
  const { signOut } = useAuth()
  const methods = useForm<Profile>({
    resolver: zodResolver(profileSchema),
    defaultValues: async () => {
      const store = await getProfileStore()
      return (await store.loadMine()) ?? createEmptyProfile()
    },
    mode: 'onBlur',
  })

  const {
    control,
    formState: { isLoading },
  } = methods
  const profile = useWatch({ control }) as Profile
  const { status: saveStatus, error: saveError } = useProfileStoreAutosave(profile)
  // ?? 'finance' — même garde que activeAccent/activeAppearance ci-dessous :
  // useWatch peut renvoyer un profil encore incomplet pendant un bref
  // instant après que isLoading passe à faux.
  const coachmarkSteps = buildCoachmarkSteps(profile.domain ?? 'finance')

  const [previewOpen, setPreviewOpen] = useState(false)
  const [linkModalOpen, setLinkModalOpen] = useState(false)
  const [statsOpen, setStatsOpen] = useState(false)

  const activeAccent = profile.theme?.accent ?? '#E4A93C'
  const activeAppearance: Profile['appearance'] = profile.appearance ?? {
    kind: 'gallery',
    themeId: 'ledger',
    animatedBackground: false,
    eclatVariant: 'braise',
    motion: 'full',
  }

  const resolvedBackground = useAppliedTheme(activeAppearance, activeAccent)
  useFaviconAndThemeColor(resolvedBackground.hex, activeAccent)
  useEffect(() => {
    document.title = 'Éditeur · Linktrea'
  }, [])

  // Le temps que loadMine() résolve (chargement du vrai profil depuis le
  // store) — sans ça, la brève fenêtre de chargement afficherait un
  // formulaire vide avant que les vraies valeurs n'arrivent.
  if (isLoading) return <EditorSkeleton />

  return (
    <MotionPrefsProvider themeMotion={profile.theme?.motion ?? 'full'}>
      <CoachmarkProvider onFinish={markTutorialSeen}>
        <FormProvider {...methods}>
          <div className="min-h-dvh bg-ink text-paper font-sans pb-24 lg:pb-10">
            <div className="lg:mx-auto lg:flex lg:max-w-[1400px] lg:items-start lg:gap-8 lg:px-8 lg:pt-8">
              <div className="lg:min-w-0 lg:flex-1">
                <header className="px-4 py-4 flex justify-between items-center border-b border-ink-raised lg:border lg:rounded-lg lg:px-5 lg:mb-4">
                  <h1 className="font-medium">Éditeur</h1>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs ${saveStatus === 'error' ? 'text-down' : 'text-muted'}`}>
                      {saveStatus === 'saved' && 'Enregistré'}
                      {saveStatus === 'error' && saveError}
                    </span>
                    <CoachmarkHelpButton steps={coachmarkSteps} />
                    {STORAGE_MODE === 'supabase' && (
                      <button
                        type="button"
                        onClick={() => void signOut()}
                        className="min-h-11 px-3 text-xs text-muted rounded-md focus-visible:outline-2 focus-visible:outline-accent focus-visible:-outline-offset-2"
                      >
                        Déconnexion
                      </button>
                    )}
                  </div>
                </header>

                <main>
                  <form onSubmit={(e) => e.preventDefault()} className="lg:border lg:rounded-lg">
                    <CollapsibleSection title="Identité" defaultOpen coachmarkId="identity">
                      <IdentitySection />
                    </CollapsibleSection>
                    <CollapsibleSection title="Publier" coachmarkId="publish">
                      <PublishSection />
                    </CollapsibleSection>
                    <CollapsibleSection title="Positions" count={profile.positions?.length ?? 0} coachmarkId="positions">
                      <PositionsSection />
                    </CollapsibleSection>
                    <CollapsibleSection title="Compétences" count={profile.holdings?.length ?? 0} coachmarkId="holdings">
                      <HoldingsSection />
                    </CollapsibleSection>
                    <CollapsibleSection title="Certificats" count={profile.certificates?.length ?? 0} coachmarkId="certificates">
                      <CertificatesSection />
                    </CollapsibleSection>
                    <CollapsibleSection title="Réseaux" count={profile.tickers?.length ?? 0} coachmarkId="tickers">
                      <TickersSection />
                    </CollapsibleSection>
                    <CollapsibleSection title="Apparence" coachmarkId="appearance">
                      <AppearanceSection />
                    </CollapsibleSection>
                    {/* Pas de vrai compte à supprimer en mode local (voir
                        LOCAL_DEV_USER dans AuthContext.tsx) — même garde que
                        le bouton "Déconnexion" ci-dessus. */}
                    {STORAGE_MODE === 'supabase' && (
                      <CollapsibleSection title="Compte">
                        <AccountSection />
                      </CollapsibleSection>
                    )}
                  </form>
                </main>
              </div>

              <DesktopPreviewPanel profile={profile} />
            </div>

            <EditorActionBar
              profile={profile}
              onPreview={() => setPreviewOpen(true)}
              onGenerateLink={() => setLinkModalOpen(true)}
              onStats={() => setStatsOpen(true)}
            />
          </div>

          <PreviewOverlay open={previewOpen} profile={profile} onClose={() => setPreviewOpen(false)} />
          <ShareLinkModal open={linkModalOpen} profile={profile} onClose={() => setLinkModalOpen(false)} />
          <StatsOverlay open={statsOpen} profile={profile} onClose={() => setStatsOpen(false)} />
        </FormProvider>

        <CoachmarkAutoStart steps={coachmarkSteps} />
        <CoachmarkOverlay />
      </CoachmarkProvider>
    </MotionPrefsProvider>
  )
}
