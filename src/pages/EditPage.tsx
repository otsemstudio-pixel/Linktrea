import { useEffect, useState } from 'react'
import { useForm, FormProvider, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { Profile } from '@/types'
import { profileSchema } from '@/lib/schema'
import { readDraft, useDraftAutosave } from '@/lib/draft'
import { createEmptyProfile } from '@/lib/emptyProfile'
import { MotionPrefsProvider } from '@/lib/motion/MotionPrefsContext'
import CollapsibleSection from '@/components/edit/CollapsibleSection'
import IdentitySection from '@/components/edit/IdentitySection'
import PositionsSection from '@/components/edit/PositionsSection'
import HoldingsSection from '@/components/edit/HoldingsSection'
import CertificatesSection from '@/components/edit/CertificatesSection'
import TickersSection from '@/components/edit/TickersSection'
import AppearanceSection from '@/components/edit/AppearanceSection'
import EditorActionBar from '@/components/edit/EditorActionBar'
import ShareLinkModal from '@/components/edit/ShareLinkModal'
import PreviewOverlay from '@/components/edit/PreviewOverlay'
import DesktopPreviewPanel from '@/components/edit/DesktopPreviewPanel'
import { useFaviconAndThemeColor } from '@/lib/useDocumentMeta'

export default function EditPage() {
  const methods = useForm<Profile>({
    resolver: zodResolver(profileSchema),
    defaultValues: readDraft() ?? createEmptyProfile(),
    mode: 'onBlur',
  })

  const { control, reset } = methods
  const profile = useWatch({ control }) as Profile
  const saveStatus = useDraftAutosave(profile)

  const [previewOpen, setPreviewOpen] = useState(false)
  const [linkModalOpen, setLinkModalOpen] = useState(false)

  const activePreset = profile.theme?.preset ?? 'terminal'

  useEffect(() => {
    document.documentElement.dataset.preset = activePreset
  }, [activePreset])

  useFaviconAndThemeColor(activePreset)
  useEffect(() => {
    document.title = 'Éditeur · Ledger'
  }, [])

  return (
    <MotionPrefsProvider preset={activePreset} themeMotion={profile.theme?.motion ?? 'full'}>
      <FormProvider {...methods}>
        <div className="min-h-dvh bg-ink text-paper font-sans pb-24 lg:pb-10">
          <div className="lg:mx-auto lg:flex lg:max-w-[1400px] lg:items-start lg:gap-8 lg:px-8 lg:pt-8">
            <div className="lg:min-w-0 lg:flex-1">
              <header className="px-4 py-4 flex justify-between items-center border-b border-ink-raised lg:border lg:rounded-lg lg:px-5 lg:mb-4">
                <h1 className="font-medium">Éditeur</h1>
                <span className="text-xs text-muted">{saveStatus === 'saved' ? 'Enregistré' : ''}</span>
              </header>

              <main>
                <form onSubmit={(e) => e.preventDefault()} className="lg:border lg:rounded-lg">
                  <CollapsibleSection title="Identité" defaultOpen>
                    <IdentitySection />
                  </CollapsibleSection>
                  <CollapsibleSection title="Positions">
                    <PositionsSection />
                  </CollapsibleSection>
                  <CollapsibleSection title="Compétences">
                    <HoldingsSection />
                  </CollapsibleSection>
                  <CollapsibleSection title="Certificats">
                    <CertificatesSection />
                  </CollapsibleSection>
                  <CollapsibleSection title="Réseaux">
                    <TickersSection />
                  </CollapsibleSection>
                  <CollapsibleSection title="Apparence">
                    <AppearanceSection />
                  </CollapsibleSection>
                </form>
              </main>
            </div>

            <DesktopPreviewPanel profile={profile} />
          </div>

          <EditorActionBar
            profile={profile}
            onPreview={() => setPreviewOpen(true)}
            onGenerateLink={() => setLinkModalOpen(true)}
            onImport={(imported) => reset(imported)}
          />
        </div>

        <PreviewOverlay open={previewOpen} profile={profile} onClose={() => setPreviewOpen(false)} />
        <ShareLinkModal open={linkModalOpen} profile={profile} onClose={() => setLinkModalOpen(false)} />
      </FormProvider>
    </MotionPrefsProvider>
  )
}
