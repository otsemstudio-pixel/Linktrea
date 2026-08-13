import { useEffect, useState } from 'react'
import { useFormContext, useWatch } from 'react-hook-form'
import { Download } from 'lucide-react'
import type { Profile } from '@/types'
import { useAuth } from '@/lib/auth/AuthContext'
import { getProfileStore, ProfileStoreError } from '@/lib/store'
import { clearLastEmail } from '@/lib/auth/lastEmail'
import { markAccountDeleted } from '@/lib/auth/accountDeletedFlag'
import { downloadProfileJson } from '@/lib/exportImport'
import { useAutoPublishSetting } from './useAutoPublishSetting'
import Modal from './Modal'

// Compte (refonte sécurité, Phases 4-5) : déconnexion globale et suppression
// définitive. Les deux exigent une confirmation explicite avant d'agir —
// aucune des deux n'aboutit en un seul clic.
export default function AccountSection() {
  const { signOutEverywhere } = useAuth()
  const { control } = useFormContext<Profile>()
  const profile = useWatch({ control }) as Profile
  const {
    loading: autoPublishLoading,
    enabled: autoPublishEnabled,
    pending: autoPublishPending,
    error: autoPublishError,
    toggle: toggleAutoPublish,
  } = useAutoPublishSetting()

  const [slug, setSlug] = useState<string | null>(null)
  const [loadingSlug, setLoadingSlug] = useState(true)
  const [confirming, setConfirming] = useState(false)
  const [retyped, setRetyped] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [globalSignOutOpen, setGlobalSignOutOpen] = useState(false)
  const [globalSignOutPending, setGlobalSignOutPending] = useState(false)

  useEffect(() => {
    let cancelled = false
    getProfileStore()
      .then((store) => store.getPublishStatus())
      .then((status) => {
        if (!cancelled) setSlug(status?.slug ?? null)
      })
      .catch(() => {
        // Statut non chargé : on retombe sur la confirmation par mot fixe,
        // pas la peine de bloquer la section pour autant.
      })
      .finally(() => {
        if (!cancelled) setLoadingSlug(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  async function handleGlobalSignOut() {
    setGlobalSignOutPending(true)
    try {
      await signOutEverywhere()
      // Pas de navigate() ici : cette déconnexion met AUSSI fin à la session
      // de cet appareil (c'est tout son intérêt), donc RequireAuth redirige
      // de son côté dès que le statut repasse à 'anonymous' — même principe
      // qu'après une suppression de compte, voir handleDelete() plus bas.
    } finally {
      setGlobalSignOutPending(false)
      setGlobalSignOutOpen(false)
    }
  }

  const confirmPhrase = slug ?? 'supprimer'
  const canConfirm = retyped.trim().toLowerCase() === confirmPhrase.toLowerCase()

  function openConfirm() {
    setConfirming(true)
    setRetyped('')
    setError(null)
  }

  function cancelConfirm() {
    setConfirming(false)
    setRetyped('')
    setError(null)
  }

  async function handleDelete() {
    if (!canConfirm || deleting) return
    setDeleting(true)
    setError(null)
    try {
      const store = await getProfileStore()
      await store.deleteAccount()
      // Le compte n'existe plus : rien à reconnaître à la prochaine visite,
      // ni de session locale à garder active.
      clearLastEmail()
      markAccountDeleted()
      // Pas de navigate() explicite ici : signOutEverywhere() fait passer
      // AuthContext à 'anonymous', et RequireAuth redirige alors vers /login
      // de son propre côté — un navigate() concurrent ici perdrait
      // systématiquement cette course (voir accountDeletedFlag.ts pour le
      // détail). Portée globale plutôt que locale : le compte disparaît
      // entièrement, autant clore toute session ouverte ailleurs plutôt que
      // seulement celle de cet appareil.
      await signOutEverywhere()
    } catch (e) {
      setError(e instanceof ProfileStoreError ? e.message : 'La suppression a échoué. Réessaie dans un instant.')
      setDeleting(false)
    }
  }

  if (loadingSlug || autoPublishLoading) return null

  return (
    <div className="flex flex-col gap-6">
      <div>
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={autoPublishEnabled}
            disabled={autoPublishPending}
            onChange={(e) => void toggleAutoPublish(e.target.checked)}
            className="mt-0.5"
          />
          <span>
            <span className="block text-sm">Publication automatique</span>
            <span className="block text-xs text-muted mt-1">
              Une fois activée, chaque modification enregistrée devient immédiatement visible sur ton profil public,
              sans avoir à cliquer sur Publier. Désactivée, tu gardes le contrôle avant que tes changements soient
              visibles.
            </span>
          </span>
        </label>
        {autoPublishError && <p className="text-xs text-down mt-2">{autoPublishError}</p>}
      </div>

      {/* Export JSON brut (retour utilisateur, doc "Publication automatique
          optionnelle + clarification de l'export", Phase 2) — obligation de
          portabilité des données, format technique et réutilisable par une
          machine, jamais un remplacement du générateur de CV PDF (bouton
          "CV" de la barre d'actions). Libellé et explication volontairement
          sans ambiguïté possible avec ce dernier, ici discret dans la zone
          Compte plutôt qu'au même niveau que Partager/CV dans la barre
          principale (voir EditorActionBar.tsx). */}
      <div className="pt-6 border-t border-ink-raised">
        <button
          type="button"
          onClick={() => downloadProfileJson(profile)}
          className="min-h-11 px-4 rounded-md border border-ink-raised text-sm flex items-center gap-2 focus-visible:outline-2 focus-visible:outline-accent focus-visible:-outline-offset-2"
        >
          <Download size={16} aria-hidden="true" />
          Télécharger mes données brutes (JSON)
        </button>
        <p className="text-xs text-muted mt-2">
          Format technique, pour ton usage personnel ou légal. Pour un document à envoyer à un recruteur, utilise
          plutôt Télécharger mon CV.
        </p>
      </div>

      <div className="pt-6 border-t border-ink-raised">
        <p className="text-sm text-muted mb-4">
          Termine ta session sur tous les appareils où tu es connecté — utile si tu soupçonnes un accès non désiré ou
          si tu as perdu un appareil resté connecté. Différent du bouton "Déconnexion" en haut de l'éditeur, qui ne
          ferme que la session de cet appareil-ci.
        </p>
        <button
          type="button"
          onClick={() => setGlobalSignOutOpen(true)}
          className="min-h-11 px-4 rounded-md border border-ink-raised text-sm focus-visible:outline-2 focus-visible:outline-accent focus-visible:-outline-offset-2"
        >
          Se déconnecter de tous les appareils
        </button>

        <Modal open={globalSignOutOpen} title="Déconnexion globale" onClose={() => setGlobalSignOutOpen(false)}>
          <p className="text-sm text-muted mb-4">
            Cette action déconnecte immédiatement <strong className="text-paper">tous</strong> les appareils
            connectés à ce compte, y compris celui-ci — pas seulement celui-ci, contrairement à "Déconnexion". Il
            faudra redemander un lien de connexion partout.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleGlobalSignOut}
              disabled={globalSignOutPending}
              className="min-h-11 px-4 rounded-md bg-accent text-ink font-medium text-sm disabled:opacity-50 active:scale-[0.98] transition-transform focus-visible:outline-2 focus-visible:outline-paper focus-visible:-outline-offset-2"
            >
              {globalSignOutPending ? 'Déconnexion…' : 'Confirmer'}
            </button>
            <button
              type="button"
              onClick={() => setGlobalSignOutOpen(false)}
              disabled={globalSignOutPending}
              className="min-h-11 px-4 rounded-md border border-ink-raised text-sm disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-accent focus-visible:-outline-offset-2"
            >
              Annuler
            </button>
          </div>
        </Modal>
      </div>

      <div className="pt-6 border-t border-ink-raised">
        <p className="text-sm text-muted mb-4">
          Supprime définitivement ton compte, ton profil et tout son contenu. Cette action est irréversible.
        </p>

        {!confirming ? (
          <button
            type="button"
            onClick={openConfirm}
            className="min-h-11 px-4 rounded-md border border-down text-down text-sm focus-visible:outline-2 focus-visible:outline-down focus-visible:-outline-offset-2"
          >
            Supprimer mon compte
          </button>
        ) : (
          // Pas de <form> ici : AccountSection est monté dans le <form> global
          // de l'éditeur (EditPage.tsx), et un <form> imbriqué dans un autre
          // est invalide en HTML — le navigateur route alors la soumission
          // vers le <form> EXTÉRIEUR (qui ne fait qu'un e.preventDefault() au
          // clic sur "Enregistrer"), pas vers celui-ci : le clic sur
          // "Supprimer définitivement" n'aurait jamais réellement appelé
          // handleDelete(). Bouton + onClick direct, comme les autres actions
          // de l'éditeur qui vivent dans ce même form (voir PublishSection).
          <div className="flex flex-col gap-3">
            <label className="block">
              <span className="text-label uppercase tracking-label text-muted block mb-1.5">
                Retape <span className="font-mono text-paper">{confirmPhrase}</span> pour confirmer
              </span>
              <input
                type="text"
                autoFocus
                autoComplete="off"
                value={retyped}
                onChange={(e) => setRetyped(e.target.value)}
                className="w-full min-h-11 rounded-md border border-down bg-ink px-3 text-sm text-paper focus-visible:outline-2 focus-visible:outline-down focus-visible:-outline-offset-2"
              />
            </label>

            {error && <p className="text-xs text-down">{error}</p>}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleDelete}
                disabled={!canConfirm || deleting}
                className="min-h-11 px-4 rounded-md bg-down text-ink font-medium text-sm disabled:opacity-50 active:scale-[0.98] transition-transform focus-visible:outline-2 focus-visible:outline-down focus-visible:-outline-offset-2"
              >
                {deleting ? 'Suppression…' : 'Supprimer définitivement'}
              </button>
              <button
                type="button"
                onClick={cancelConfirm}
                disabled={deleting}
                className="min-h-11 px-4 rounded-md border border-ink-raised text-sm disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-accent focus-visible:-outline-offset-2"
              >
                Annuler
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
