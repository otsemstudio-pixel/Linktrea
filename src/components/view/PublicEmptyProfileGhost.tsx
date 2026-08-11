import { Link } from 'react-router-dom'
import type { ThemeConfig, Domain, AppearanceConfig } from '@/types'
import { demoProfile } from '@/lib/demoProfile'
import ProfileView from '@/components/ProfileView'

type Props = {
  theme: ThemeConfig
  domain: Domain
  appearance: AppearanceConfig
}

// Premier écran vu par un visiteur qui découvre le produit via un profil pas
// encore rempli (Phase 4 de la refonte v1) — remplace l'ancien "0 ANS" +
// sparkline plate + trois messages "Aucun... pour le moment", qui ne
// montraient rien et décourageaient. Le profil de démonstration existant
// (demoProfile, déjà utilisé par le script seed) sert de contenu d'exemple,
// habillé du thème réellement choisi par l'utilisateur — pas un rendu
// générique déconnecté de ses choix.
//
// `appearance` doit être surchargé au même titre que `theme` et `domain` :
// sans lui, le fantôme retombait sur celui, figé, de demoProfile (thème
// "Ledger") quel que soit le thème réel choisi — repéré en vérifiant cette
// Phase 8, un bug direct de la coexistence theme/appearance des Phases 1-6.
export default function PublicEmptyProfileGhost({ theme, domain, appearance }: Props) {
  const ghostProfile = { ...demoProfile, theme, domain, appearance }

  return (
    <div className="relative min-h-dvh overflow-hidden bg-ink">
      <div
        aria-hidden="true"
        className="pointer-events-none select-none"
        style={{ filter: 'blur(3px) saturate(0.4) brightness(0.85)' }}
      >
        <ProfileView profile={ghostProfile} standalone={false} />
      </div>

      <div className="fixed inset-0 z-10 flex items-center justify-center px-6 bg-ink/50">
        <div className="max-w-xs w-full rounded-lg border border-ink-raised bg-ink-raised p-6 text-center shadow-xl">
          <p className="text-label uppercase tracking-label text-muted mb-2">Aperçu</p>
          <h1 className="text-xl font-semibold mb-2">Voici à quoi ressemble un profil Linktrea</h1>
          <p className="text-sm text-muted mb-5">
            Ce profil n'a pas encore de contenu. Créez le vôtre pour obtenir votre relevé et le lien à partager.
          </p>
          <Link
            to="/edit"
            className="min-h-11 px-5 inline-flex items-center justify-center w-full rounded-md bg-accent text-ink font-medium text-sm active:scale-[0.98] transition-transform focus-visible:outline-2 focus-visible:outline-paper focus-visible:-outline-offset-2"
          >
            Créer mon profil
          </Link>
        </div>
      </div>
    </div>
  )
}
