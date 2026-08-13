import { useState } from 'react'
import { Mail, Share2, Image as ImageIcon, IdCard } from 'lucide-react'
import type { Profile, ShareCardConfig } from '@/types'
import ShareCardModal from './ShareCardModal'
import BusinessCardModal from './BusinessCardModal'

type Props = {
  profile: Profile
  // correctif "modale carte de partage" Partie 2 — voir ProfileView.tsx pour
  // la signification exacte des trois états (undefined/null/string).
  publicUrl?: string | null
  // correctif "panneau d'aperçu desktop" — voir ProfileView.tsx : force le
  // rendu "statique" (jamais fixed-to-viewport), indépendamment de la
  // largeur du conteneur @container ci-dessous.
  staticPosition?: boolean
  // Doc "Publication automatique optionnelle + clarification de l'export",
  // Phase 3 — simple relais vers ShareCardModal.tsx, voir son commentaire
  // pour la raison de fond (sa seule présence décide si la carte est
  // éditable).
  onShareCardChange?: (config: ShareCardConfig) => void
}

export default function ActionBar({ profile, publicUrl, staticPosition = false, onShareCardChange }: Props) {
  const [toast, setToast] = useState<string | null>(null)
  const [cardModalOpen, setCardModalOpen] = useState(false)
  // Bouton séparé (Phase 5) — pas mélangé au sélecteur de format de
  // ShareCardModal, voir le prompt : "pour ne pas complexifier le
  // sélecteur principal".
  const [businessCardModalOpen, setBusinessCardModalOpen] = useState(false)
  const emailTicker = profile.tickers.find((t) => t.platform === 'email')
  // Thème "Éclat" (Phase 3, lisibilité) : la barre desktop translucide
  // (bg-ink-raised/40) est pensée pour un fond calme — sur le dégradé animé
  // et vif d'Éclat, elle laisserait passer trop de couleur derrière le
  // texte des boutons. Reçoit déjà `profile` en entier, pas besoin d'un
  // prop dédié comme KeyMetric.tsx (qui ne reçoit pas appearance).
  const vividBackground = profile.appearance.kind === 'gallery' && profile.appearance.themeId === 'eclat'

  // undefined (prop omis) = ProfileView EST la page publique elle-même
  // (SlugPage/ViewPage) : window.location.href y pointe déjà vers la bonne
  // URL. Sinon (aperçu éditeur), la valeur vient de usePublishStatus — une
  // vraie URL publique, ou null si le profil n'est pas encore publié —
  // jamais window.location.href, qui resterait alors sur /edit (voir
  // l'incident : QR/lien de partage pointant vers la route d'édition
  // privée). Voir ProfileView.tsx pour le détail des trois états.
  const resolvedPublicUrl = publicUrl === undefined ? window.location.href : publicUrl

  function showToast(message: string) {
    setToast(message)
    setTimeout(() => setToast(null), 2400)
  }

  async function handleShare() {
    if (!resolvedPublicUrl) {
      showToast("Publie d'abord ton profil")
      return
    }
    const url = resolvedPublicUrl
    if (navigator.share) {
      try {
        await navigator.share({ url })
      } catch {
        // L'utilisateur a annulé le partage — rien à signaler.
      }
      return
    }
    try {
      await navigator.clipboard.writeText(url)
      showToast('Lien copié')
    } catch {
      showToast("Impossible de copier le lien")
    }
  }

  // La bascule fixed(mobile)/static(desktop) repose normalement sur la
  // largeur du @container posé par ProfileView (voir plus bas), qui suit la
  // vraie largeur d'affichage de la page publique. Mais dans
  // DesktopPreviewPanel (éditeur), ce conteneur ne fait que 390px de large
  // même quand la VRAIE page qui l'entoure est bien assez large pour du
  // desktop — @min-[1024px]: ne s'y déclenche donc jamais, et ActionBar
  // reste "fixed bottom-0 inset-x-0" : épinglé au bas du VRAI viewport
  // (échappant aux bornes du panneau), où il atterrit sous la barre
  // d'actions de l'éditeur (EditorActionBar), inatteignable. staticPosition
  // applique directement l'état "desktop" ci-dessous, sans jamais passer par
  // fixed, quelle que soit la largeur mesurée par le @container.
  const barClassName = staticPosition
    ? `static pb-0 border border-ink-raised rounded-[var(--radius-lg)] ${vividBackground ? 'bg-ink-raised' : 'bg-ink-raised/40'}`
    : `fixed bottom-0 inset-x-0 z-30 border-t border-ink-raised bg-ink/95 backdrop-blur-sm pb-[env(safe-area-inset-bottom)] @min-[1024px]:static @min-[1024px]:pb-0 @min-[1024px]:border @min-[1024px]:rounded-[var(--radius-lg)] ${vividBackground ? '@min-[1024px]:bg-ink-raised' : '@min-[1024px]:bg-ink-raised/40'}`

  return (
    <div className={barClassName}>
      {toast && (
        <p role="status" aria-live="polite" className="text-center text-xs text-up py-1.5">
          {toast}
        </p>
      )}
      <div className="flex gap-2 p-3">
        {emailTicker && (
          <a
            href={emailTicker.url}
            className="flex-1 min-h-11 flex items-center justify-center gap-2 rounded-[var(--radius-sm)] font-medium text-sm active:scale-[0.98] transition-transform focus-visible:outline-2 focus-visible:outline-paper focus-visible:-outline-offset-2"
            style={{
              background: 'var(--button-bg)',
              color: 'var(--button-fg)',
              borderStyle: 'solid',
              borderWidth: 'var(--button-border-width)',
              borderColor: 'var(--button-border-color)',
              boxShadow: 'var(--button-shadow)',
            }}
          >
            <Mail size={16} aria-hidden="true" />
            Contacter
          </a>
        )}
        <button
          type="button"
          onClick={handleShare}
          className="flex-1 min-h-11 flex items-center justify-center gap-2 rounded-[var(--radius-sm)] border border-ink-raised text-sm active:scale-[0.98] transition-transform focus-visible:outline-2 focus-visible:outline-accent focus-visible:-outline-offset-2"
        >
          <Share2 size={16} aria-hidden="true" />
          Partager
        </button>
        <button
          type="button"
          onClick={() => setCardModalOpen(true)}
          className="flex-1 min-h-11 flex items-center justify-center gap-2 rounded-[var(--radius-sm)] border border-ink-raised text-sm active:scale-[0.98] transition-transform focus-visible:outline-2 focus-visible:outline-accent focus-visible:-outline-offset-2"
        >
          <ImageIcon size={16} aria-hidden="true" />
          Carte
        </button>
        <button
          type="button"
          onClick={() => setBusinessCardModalOpen(true)}
          className="flex-1 min-h-11 flex items-center justify-center gap-2 rounded-[var(--radius-sm)] border border-ink-raised text-sm active:scale-[0.98] transition-transform focus-visible:outline-2 focus-visible:outline-accent focus-visible:-outline-offset-2"
        >
          <IdCard size={16} aria-hidden="true" />
          Carte de visite
        </button>
      </div>

      <ShareCardModal
        open={cardModalOpen}
        profile={profile}
        publicUrl={resolvedPublicUrl}
        onClose={() => setCardModalOpen(false)}
        onShareCardChange={onShareCardChange}
      />
      <BusinessCardModal
        open={businessCardModalOpen}
        profile={profile}
        publicUrl={resolvedPublicUrl}
        onClose={() => setBusinessCardModalOpen(false)}
      />
    </div>
  )
}
