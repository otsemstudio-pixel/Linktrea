import { useFormContext } from 'react-hook-form'
import type { Profile, ShareCardConfig } from '@/types'
import ProfileView from '@/components/ProfileView'
import { usePublishStatus } from './usePublishStatus'
import { useCoachmarkTarget } from '@/lib/coachmark/CoachmarkContext'

type Props = {
  profile: Profile
}

// Cadre fixe 390px, mis à jour en direct — Phase 5 en avait différé la
// construction à la Phase 6 (finitions desktop).
export default function DesktopPreviewPanel({ profile }: Props) {
  // correctif "modale carte de partage" Partie 2 : window.location reste sur
  // /edit ici (c'est l'aperçu de l'éditeur, pas la page publique elle-même)
  // — sans ce statut lu séparément, ActionBar retomberait sur cette URL pour
  // son QR/lien de partage. Voir usePublishStatus.ts.
  const { publicUrl } = usePublishStatus()
  // Cible "preview-desktop" du tuto (voir steps.ts) — ce panneau est
  // "hidden lg:block" : côté coachmark, resolveTargetId (CoachmarkOverlay.tsx)
  // s'en sert pour savoir si c'est LUI ou le bouton "Aperçu" mobile
  // (EditorActionBar.tsx) qui est réellement visible au moment de l'étape.
  const previewTargetRef = useCoachmarkTarget('preview-desktop')
  // Doc "Publication automatique optionnelle + clarification de l'export",
  // Phase 3 — ce panneau vit DANS le <FormProvider> de EditPage.tsx, donc
  // peut écrire directement dans le brouillon ; shouldValidate : ce champ
  // n'est jamais lié à un register() classique (aucun <input> à côté dont
  // l'interaction déclencherait sa propre revalidation), donc un setValue
  // sans ce flag laisserait une éventuelle erreur de validation obsolète.
  const { setValue } = useFormContext<Profile>()
  function handleShareCardChange(config: ShareCardConfig) {
    setValue('shareCard', config, { shouldDirty: true, shouldValidate: true })
  }
  return (
    <div
      ref={previewTargetRef}
      className="hidden lg:block lg:sticky lg:top-6 lg:h-[calc(100dvh-3rem)] lg:w-[390px] lg:shrink-0 lg:overflow-y-auto lg:rounded-lg lg:border lg:border-ink-raised"
    >
      {/* staticActionBar : correctif "panneau d'aperçu desktop" — ce panneau
          n'est rendu (hidden lg:block) que lorsque la vraie page qui
          l'entoure est déjà assez large pour du desktop, même si LUI ne
          fait que 390px de large. Sans ce prop, ActionBar (via son
          @container) croirait être sur un petit écran et resterait fixed,
          épinglé au bas du VRAI viewport plutôt qu'à l'intérieur de ce
          panneau — voir ActionBar.tsx. */}
      <ProfileView
        profile={profile}
        standalone={false}
        publicUrl={publicUrl}
        staticActionBar
        onShareCardChange={handleShareCardChange}
      />
    </div>
  )
}
