import type { Profile } from '@/types'
import ProfileView from '@/components/ProfileView'

type Props = {
  profile: Profile
}

// Cadre fixe 390px, mis à jour en direct — Phase 5 en avait différé la
// construction à la Phase 6 (finitions desktop).
export default function DesktopPreviewPanel({ profile }: Props) {
  return (
    <div className="hidden lg:block lg:sticky lg:top-6 lg:h-[calc(100dvh-3rem)] lg:w-[390px] lg:shrink-0 lg:overflow-y-auto lg:rounded-lg lg:border lg:border-ink-raised">
      <ProfileView profile={profile} standalone={false} />
    </div>
  )
}
