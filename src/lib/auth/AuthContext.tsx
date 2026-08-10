import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

export type AuthUser = {
  id: string
  email: string | null
}

// Trois états explicites plutôt que `user`/`loading` (refonte sécurité,
// Phase 1) : 'checking' est un état à part entière, pas une simple absence
// de user pendant que loading est vrai — RequireAuth doit pouvoir s'y
// accrocher sans jamais confondre "en cours de vérification" avec "vérifié,
// anonyme", ce qui était la source du flash vers /login au rechargement
// (loading passait à false un instant avant que user ne soit posé).
export type AuthStatus = 'checking' | 'authenticated' | 'anonymous'

type AuthContextValue = {
  status: AuthStatus
  user: AuthUser | null
  signOut: () => Promise<void>
  // Déconnexion globale (refonte sécurité, Phase 5) — révoque la session sur
  // tous les appareils, pas seulement celui-ci. Utile si l'utilisateur
  // soupçonne un accès non désiré ou a perdu un appareil resté connecté.
  signOutEverywhere: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue>({
  status: 'checking',
  user: null,
  signOut: async () => {},
  signOutEverywhere: async () => {},
})

const STORAGE_MODE = import.meta.env.VITE_STORAGE_MODE === 'supabase' ? 'supabase' : 'local'

// Utilisateur factice permanent en mode local : pas de vrai compte, pas de
// /login fonctionnel (voir LoginPage), donc /edit doit rester accessible
// sans jamais importer supabase.ts — même logique que LocalProfileStore en
// Phase 2, appliquée à l'auth. 'authenticated' dès le premier rendu : rien
// à vérifier de façon asynchrone dans ce mode.
const LOCAL_DEV_USER: AuthUser = { id: 'local-dev', email: 'local@dev' }

function toAuthUser(user: { id: string; email?: string | null } | null | undefined): AuthUser | null {
  if (!user) return null
  return { id: user.id, email: user.email ?? null }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>(STORAGE_MODE === 'local' ? 'authenticated' : 'checking')
  const [user, setUser] = useState<AuthUser | null>(STORAGE_MODE === 'local' ? LOCAL_DEV_USER : null)

  useEffect(() => {
    if (STORAGE_MODE === 'local') return

    let mounted = true
    let unsubscribe: (() => void) | undefined

    import('@/lib/supabase').then(({ supabase }) => {
      if (!mounted) return

      // getSession() lit la session déjà persistée localement par le SDK
      // (voir supabase.ts, persistSession) — c'est ce qui permet de passer
      // directement à 'authenticated' sans appel réseau ni flash vers
      // /login à chaque rechargement de /edit.
      supabase.auth.getSession().then(({ data }) => {
        if (!mounted) return
        const nextUser = toAuthUser(data.session?.user)
        setUser(nextUser)
        setStatus(nextUser ? 'authenticated' : 'anonymous')
      })

      const { data } = supabase.auth.onAuthStateChange((event, session) => {
        if (!mounted) return
        const nextUser = toAuthUser(session?.user)
        setUser(nextUser)
        setStatus(nextUser ? 'authenticated' : 'anonymous')
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

  // scope: 'local' explicite — le SDK Supabase révoque TOUS les appareils
  // par défaut si on ne précise rien (voir signOutEverywhere ci-dessous),
  // contre-intuitif pour un simple bouton "Déconnexion" : sans ce réglage,
  // les deux actions de cette page auraient été rigoureusement identiques.
  async function signOut() {
    if (STORAGE_MODE === 'local') return
    const { supabase } = await import('@/lib/supabase')
    await supabase.auth.signOut({ scope: 'local' })
  }

  async function signOutEverywhere() {
    if (STORAGE_MODE === 'local') return
    const { supabase } = await import('@/lib/supabase')
    await supabase.auth.signOut({ scope: 'global' })
  }

  return <AuthContext.Provider value={{ status, user, signOut, signOutEverywhere }}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  return useContext(AuthContext)
}
