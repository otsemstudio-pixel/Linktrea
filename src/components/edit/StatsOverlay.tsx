import { motion, AnimatePresence } from 'motion/react'
import { ArrowLeft, TrendingUp } from 'lucide-react'
import type { Profile, Ticker } from '@/types'
import { useMotionPrefs } from '@/lib/motion/MotionPrefsContext'
import { PLATFORM_SYMBOLS } from '@/lib/platformSymbols'
import Sparkline from '@/components/Sparkline'
import { usePublishStatus } from './usePublishStatus'
import { useProfileStats } from './useProfileStats'

type Props = {
  open: boolean
  profile: Profile
  onClose: () => void
}

// Contenu réel du panneau — voir useProfileStats.ts : n'est monté (donc ne
// déclenche ses deux appels réseau) que lorsque le panneau est ouvert, grâce
// à l'AnimatePresence du composant parent.
function StatsContent({ tickers }: { tickers: Ticker[] }) {
  const state = useProfileStats()

  if (state.status === 'loading') {
    return <p className="text-sm text-muted px-6 py-16 text-center">Chargement des statistiques…</p>
  }

  if (state.status === 'error') {
    return (
      <p className="text-sm text-down px-6 py-16 text-center">
        Impossible de charger tes statistiques pour le moment. Réessaie plus tard.
      </p>
    )
  }

  const totalViews = state.views.reduce((sum, d) => sum + d.views, 0)

  // Empty state encourageant plutôt qu'un graphique plat à zéro (prompt) :
  // une sparkline entièrement à plat n'apprendrait rien au propriétaire,
  // autant l'inviter directement à partager son lien.
  if (totalViews === 0) {
    return (
      <div className="px-6 py-16 text-center max-w-sm mx-auto">
        <TrendingUp size={28} className="mx-auto mb-3 text-muted" aria-hidden="true" />
        <p className="text-sm text-paper">Pas encore de visite.</p>
        <p className="mt-1 text-xs text-muted">Partage ton lien pour commencer à voir tes statistiques ici.</p>
      </div>
    )
  }

  const trend = state.views.map((d) => d.views)

  return (
    <div className="px-6 pb-10 max-w-md mx-auto">
      {/* Même traitement typographique que le chiffre clé du profil public
          (KeyMetric.tsx) : mono, chiffres tabulaires (font-variant-numeric
          global, tokens.css), contraste d'échelle avec le libellé au-dessus. */}
      <div className="rounded-[var(--radius-lg)] border border-ink-raised bg-ink-raised/50 p-5 mt-4">
        <p className="text-label uppercase tracking-label text-muted">Vues sur les 90 derniers jours</p>
        <p className="font-mono font-medium text-hero leading-none mt-3">{totalViews}</p>
        <div className="mt-3 rounded-[var(--radius-sm)] bg-ink/60 px-2 pt-3 pb-1">
          <Sparkline trend={trend} delay={0} />
        </div>
      </div>

      <h2 className="text-label uppercase tracking-label text-muted mt-8 mb-3">Liens les plus cliqués</h2>
      {state.links.length === 0 ? (
        <p className="text-sm text-muted">Aucun clic enregistré sur tes liens pour l'instant.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {state.links.map((link) => {
            // Le lien peut avoir été renommé/supprimé depuis — link_id reste
            // le seul identifiant stable côté base (voir la migration SQL).
            const ticker = tickers.find((t) => t.id === link.link_id)
            return (
              <div
                key={link.link_id}
                className="flex items-center justify-between gap-3 rounded-lg border border-ink-raised bg-ink-raised/40 px-4 py-3"
              >
                <span className="flex items-center gap-2 min-w-0">
                  <span className="font-mono text-xs text-accent shrink-0">
                    {ticker ? PLATFORM_SYMBOLS[ticker.platform] : '—'}
                  </span>
                  <span className="text-sm truncate">{ticker?.handle ?? 'Lien supprimé'}</span>
                </span>
                <span className="font-mono text-sm shrink-0">{link.total_clicks}</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function StatsOverlay({ open, profile, onClose }: Props) {
  const { reduced } = useMotionPrefs()
  const { isPublished, loading } = usePublishStatus()

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduced ? 0 : 0.2 }}
          className="fixed inset-0 z-40 bg-ink overflow-y-auto"
        >
          <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-ink-raised bg-ink/95 px-4 py-3 backdrop-blur-sm">
            <button
              type="button"
              onClick={onClose}
              className="min-h-11 px-3 rounded-md bg-ink-raised/90 text-sm flex items-center gap-2 focus-visible:outline-2 focus-visible:outline-accent"
            >
              <ArrowLeft size={16} aria-hidden="true" />
              Retour à l'édition
            </button>
            <h1 className="font-medium">Statistiques</h1>
          </div>

          {loading ? (
            <p className="text-sm text-muted px-6 py-16 text-center">Chargement…</p>
          ) : !isPublished ? (
            <p className="text-sm text-muted px-6 py-16 text-center max-w-sm mx-auto">
              Publie ton profil pour commencer à voir tes statistiques.
            </p>
          ) : (
            <StatsContent tickers={profile.tickers} />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
