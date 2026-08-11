import type { Profile } from '@/types'
import ProfileView from '@/components/ProfileView'
import { usePublishStatus } from './usePublishStatus'

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
  return (
    <div className="hidden lg:block lg:sticky lg:top-6 lg:h-[calc(100dvh-3rem)] lg:w-[390px] lg:shrink-0 lg:overflow-y-auto lg:rounded-lg lg:border lg:border-ink-raised">
      {/* staticActionBar : correctif "panneau d'aperçu desktop" — ce panneau
          n'est rendu (hidden lg:block) que lorsque la vraie page qui
          l'entoure est déjà assez large pour du desktop, même si LUI ne
          fait que 390px de large. Sans ce prop, ActionBar (via son
          @container) croirait être sur un petit écran et resterait fixed,
          épinglé au bas du VRAI viewport plutôt qu'à l'intérieur de ce
          panneau — voir ActionBar.tsx. */}
      <ProfileView profile={profile} standalone={false} publicUrl={publicUrl} staticActionBar />
    </div>
  )
}
