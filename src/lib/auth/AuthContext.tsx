import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

export type AuthUser = {
  id: string
  email: string | null
}

type AuthContextValue = {
  user: AuthUser | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  signOut: async () => {},
})

const STORAGE_MODE = import.meta.env.VITE_STORAGE_MODE === 'supabase' ? 'supabase' : 'local'

// Utilisateur factice permanent en mode local : pas de vrai compte, pas de
// /login fonctionnel (voir LoginPage), donc /edit doit rester accessible
// sans jamais importer supabase.ts — même logique que LocalProfileStore en
// Phase 2, appliquée à l'auth.
const LOCAL_DEV_USER: AuthUser = { id: 'local-dev', email: 'local@dev' }

function toAuthUser(user: { id: string; email?: string | null } | null | undefined): AuthUser | null {
  if (!user) return null
  return { id: user.id, email: user.email ?? null }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(STORAGE_MODE === 'local' ? LOCAL_DEV_USER : null)
  const [loading, setLoading] = useState(STORAGE_MODE === 'supabase')

  useEffect(() => {
    if (STORAGE_MODE === 'local') return

    let mounted = true
    let unsubscribe: (() => void) | undefined

    import('@/lib/supabase').then(({ supabase }) => {
      if (!mounted) return

      supabase.auth.getSession().then(({ data }) => {
        if (!mounted) return
        setUser(toAuthUser(data.session?.user))
        setLoading(false)
      })

      const { data } = supabase.auth.onAuthStateChange((event, session) => {
        if (!mounted) return
        setUser(toAuthUser(session?.user))
        setLoading(false)
        // SIGNED_IN ne se déclenche ici que quand une session vient d'être
        // établie DEPUIS L'URL (retour du lien magique) — une restauration
        // de session existante au chargement ne passe pas par cet event.
        // C'est le seul endroit où on sait "on vient de finir de se
        // connecter" ; emailRedirectTo ne peut plus pointer directement
        // vers #/edit (voir LoginPage), donc la redirection se fait ici.
        // location.hash plutôt que useNavigate() : AuthProvider est en
        // dehors du <HashRouter>, HashRouter réagit de toute façon aux
        // changements de hash bruts.
        if (event === 'SIGNED_IN') {
          window.location.hash = '/edit'
        }
      })
      unsubscribe = () => data.subscription.unsubscribe()
    })

    return () => {
      mounted = false
      unsubscribe?.()
    }
  }, [])

  async function signOut() {
    if (STORAGE_MODE === 'local') return
    const { supabase } = await import('@/lib/supabase')
    await supabase.auth.signOut()
  }

  return <AuthContext.Provider value={{ user, loading, signOut }}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  return useContext(AuthContext)
}
