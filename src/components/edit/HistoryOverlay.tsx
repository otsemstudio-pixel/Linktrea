import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { ArrowLeft, History as HistoryIcon, RotateCcw } from 'lucide-react'
import type { Profile } from '@/types'
import ProfileView from '@/components/ProfileView'
import { useMotionPrefs } from '@/lib/motion/MotionPrefsContext'
import {
  getMyProfileHistory,
  getProfileHistoryEntryData,
  restoreProfileVersion,
  type ProfileHistoryEntry,
} from '@/lib/profileHistory'
import Modal from './Modal'

type Props = {
  open: boolean
  onClose: () => void
  // Recharge le brouillon affiché dans l'éditeur depuis le store après une
  // restauration réussie — HistoryOverlay ne connaît pas la mécanique du
  // formulaire (react-hook-form), c'est à EditPage.tsx de la fournir. Pas de
  // logique de "undo" à recoder ici : restore_profile_version() capture déjà
  // la version abandonnée dans l'historique côté serveur, donc revenir en
  // arrière repasse par cette même interface, sans code client dédié.
  onRestored: () => Promise<void>
}

const dateFormatter = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeStyle: 'short' })

type ListState =
  | { status: 'loading' }
  | { status: 'ready'; entries: ProfileHistoryEntry[] }
  | { status: 'error'; message: string }

function HistoryList({ onSelect }: { onSelect: (entry: ProfileHistoryEntry) => void }) {
  const [state, setState] = useState<ListState>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false
    getMyProfileHistory()
      .then((entries) => {
        if (!cancelled) setState({ status: 'ready', entries })
      })
      .catch(() => {
        if (!cancelled) setState({ status: 'error', message: "Impossible de charger l'historique pour le moment. Réessaie dans un instant." })
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (state.status === 'loading') {
    return <p className="text-sm text-muted px-6 py-16 text-center">Chargement de l'historique…</p>
  }
  if (state.status === 'error') {
    return <p className="text-sm text-down px-6 py-16 text-center">{state.message}</p>
  }
  if (state.entries.length === 0) {
    return (
      <div className="px-6 py-16 text-center max-w-sm mx-auto">
        <HistoryIcon size={28} className="mx-auto mb-3 text-muted" aria-hidden="true" />
        <p className="text-sm text-paper">Pas encore de version enregistrée.</p>
        <p className="mt-1 text-xs text-muted">Chaque modification enregistrée conserve la version précédente ici.</p>
      </div>
    )
  }

  return (
    <div className="px-4 pb-10 max-w-md mx-auto">
      <ul className="flex flex-col gap-2 mt-4">
        {state.entries.map((entry, i) => (
          <li key={entry.id}>
            <button
              type="button"
              onClick={() => onSelect(entry)}
              className="w-full min-h-14 flex items-center justify-between gap-3 rounded-lg border border-ink-raised bg-ink-raised/40 px-4 py-3 text-left focus-visible:outline-2 focus-visible:outline-accent"
            >
              <span className="flex flex-col">
                <span className="text-sm">{dateFormatter.format(new Date(entry.createdAt))}</span>
                {i === 0 && <span className="text-xs text-muted">Version la plus récente</span>}
              </span>
              <span className="text-xs text-accent shrink-0">Aperçu</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

type PreviewState =
  | { status: 'loading' }
  | { status: 'ready'; profile: Profile }
  | { status: 'error'; message: string }

function HistoryPreview({
  entry,
  onBack,
  onRestored,
}: {
  entry: ProfileHistoryEntry
  onBack: () => void
  onRestored: () => Promise<void>
}) {
  const [state, setState] = useState<PreviewState>({ status: 'loading' })
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [restoring, setRestoring] = useState(false)
  const [restoreError, setRestoreError] = useState<string | null>(null)
  const [restored, setRestored] = useState(false)

  useEffect(() => {
    let cancelled = false
    getProfileHistoryEntryData(entry.id)
      .then((profile) => {
        if (cancelled) return
        if (!profile) setState({ status: 'error', message: 'Cette version est introuvable.' })
        else setState({ status: 'ready', profile })
      })
      .catch(() => {
        if (!cancelled) setState({ status: 'error', message: 'Impossible de charger cette version pour le moment.' })
      })
    return () => {
      cancelled = true
    }
  }, [entry.id])

  async function handleRestore() {
    setRestoring(true)
    setRestoreError(null)
    try {
      await restoreProfileVersion(entry.id)
      await onRestored()
      setConfirmOpen(false)
      setRestored(true)
    } catch {
      setRestoreError('La restauration a échoué. Réessaie dans un instant.')
      setRestoring(false)
    }
  }

  const formattedDate = dateFormatter.format(new Date(entry.createdAt))

  if (restored) {
    return (
      <div className="px-6 py-16 text-center max-w-sm mx-auto">
        <RotateCcw size={28} className="mx-auto mb-3 text-accent" aria-hidden="true" />
        <p className="text-sm text-paper">Version restaurée avec succès.</p>
        <p className="mt-1 text-xs text-muted">
          Ton brouillon reflète maintenant la version du {formattedDate}. Ton contenu précédent reste, lui aussi, dans
          l'historique.
        </p>
        <button
          type="button"
          onClick={onBack}
          className="mt-6 min-h-11 px-4 rounded-md bg-accent text-ink font-medium text-sm active:scale-[0.98] transition-transform"
        >
          Retour à l'historique
        </button>
      </div>
    )
  }

  return (
    <div className="pb-24">
      <div className="px-4 pt-4 max-w-md mx-auto">
        <button
          type="button"
          onClick={onBack}
          className="min-h-11 px-3 -ml-3 rounded-md text-sm text-muted flex items-center gap-2 focus-visible:outline-2 focus-visible:outline-accent"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          Retour à la liste
        </button>
        <p className="text-xs text-muted mt-1 mb-3">Version du {formattedDate}</p>
      </div>

      {state.status === 'loading' && <p className="text-sm text-muted px-6 py-16 text-center">Chargement de cette version…</p>}
      {state.status === 'error' && <p className="text-sm text-down px-6 py-16 text-center">{state.message}</p>}
      {state.status === 'ready' && (
        <>
          {/* staticActionBar : cet aperçu vit dans un panneau de l'éditeur, pas
              la page publique réelle — sans ce prop, la barre d'actions
              interne de ProfileView (Partager/CV/Carte) se fixerait aussi en
              bas d'écran et chevaucherait le bouton "Restaurer" ci-dessous
              (voir DesktopPreviewPanel.tsx pour le même correctif). */}
          <ProfileView profile={state.profile} standalone={false} staticActionBar />

          <div className="fixed bottom-0 inset-x-0 border-t border-ink-raised bg-ink/95 backdrop-blur-sm p-3 pb-[env(safe-area-inset-bottom)]">
            <button
              type="button"
              onClick={() => setConfirmOpen(true)}
              className="w-full max-w-md mx-auto min-h-11 rounded-md bg-accent text-ink font-medium text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
            >
              <RotateCcw size={16} aria-hidden="true" />
              Restaurer cette version
            </button>
          </div>
        </>
      )}

      <Modal open={confirmOpen} title="Restaurer cette version ?" onClose={() => (restoring ? undefined : setConfirmOpen(false))}>
        <p className="text-sm text-muted mb-4">
          Le contenu actuellement en cours d'édition sera remplacé par la version du{' '}
          <strong className="text-paper">{formattedDate}</strong>. Cette action reste réversible : ta version actuelle
          est elle-même conservée dans l'historique après restauration.
        </p>
        {restoreError && <p className="text-xs text-down mb-3">{restoreError}</p>}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void handleRestore()}
            disabled={restoring}
            className="min-h-11 px-4 rounded-md bg-accent text-ink font-medium text-sm disabled:opacity-50 active:scale-[0.98] transition-transform focus-visible:outline-2 focus-visible:outline-paper focus-visible:-outline-offset-2"
          >
            {restoring ? 'Restauration…' : 'Confirmer'}
          </button>
          <button
            type="button"
            onClick={() => setConfirmOpen(false)}
            disabled={restoring}
            className="min-h-11 px-4 rounded-md border border-ink-raised text-sm disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-accent focus-visible:-outline-offset-2"
          >
            Annuler
          </button>
        </div>
      </Modal>
    </div>
  )
}

export default function HistoryOverlay({ open, onClose, onRestored }: Props) {
  const { reduced } = useMotionPrefs()
  const [selected, setSelected] = useState<ProfileHistoryEntry | null>(null)

  // Repart de la liste à chaque (ré)ouverture, plutôt que de garder la
  // sélection précédente en mémoire entre deux passages dans le panneau.
  useEffect(() => {
    if (open) setSelected(null)
  }, [open])

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
            <h1 className="font-medium">Historique</h1>
          </div>

          {selected ? (
            <HistoryPreview entry={selected} onBack={() => setSelected(null)} onRestored={onRestored} />
          ) : (
            <HistoryList onSelect={setSelected} />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
