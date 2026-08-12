import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth/AuthContext'
import { amIAdmin } from '@/lib/admin'
import PublicProfileNotFound from '@/components/view/PublicProfileNotFound'
import ProfileSkeleton from '@/components/view/ProfileSkeleton'
import AdminDashboard from './admin/AdminDashboard'

const STORAGE_MODE = import.meta.env.VITE_STORAGE_MODE === 'supabase' ? 'supabase' : 'local'

type AdminAccess = 'checking' | 'denied' | 'granted'

// Route /admin (doc "Tableau de bord admin", Phase 1) — le nom de la route
// n'est PAS le mécanisme de sécurité, seule la vérification am_i_admin()
// compte. Un visiteur non-admin (authentifié ou non) voit exactement la
// même page "profil introuvable" qu'un slug qui n'existe pas — jamais un
// message "accès refusé" qui révélerait que cette route a un sens
// particulier. Le squelette de chargement est aussi le même que celui de
// SlugPage.tsx, pour la même raison : rien ne doit distinguer visuellement
// "on vérifie un slug" de "on vérifie un statut admin" pendant l'attente.
export default function AdminPage() {
  const { status } = useAuth()
  const [access, setAccess] = useState<AdminAccess>('checking')

  useEffect(() => {
    document.documentElement.dataset.background = 'graphite'
  }, [])

  useEffect(() => {
    // Le concept d'admin n'existe pas en mode local (pas de am_i_admin() à
    // appeler, pas de Supabase du tout) — refus immédiat plutôt qu'une
    // tentative d'appel RPC vouée à l'échec.
    if (STORAGE_MODE !== 'supabase') {
      setAccess('denied')
      return
    }
    if (status === 'checking') return
    if (status === 'anonymous') {
      setAccess('denied')
      return
    }

    let cancelled = false
    amIAdmin()
      .then((isAdmin) => {
        if (!cancelled) setAccess(isAdmin ? 'granted' : 'denied')
      })
      .catch(() => {
        if (!cancelled) setAccess('denied')
      })
    return () => {
      cancelled = true
    }
  }, [status])

  if (access === 'checking') return <ProfileSkeleton />
  if (access === 'denied') return <PublicProfileNotFound />

  return <AdminDashboard />
}
