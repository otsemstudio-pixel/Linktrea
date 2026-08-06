import { useEffect, useRef, type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/lib/auth/AuthContext'

type Props = {
  children: ReactNode
}

export default function RequireAuth({ children }: Props) {
  const { user, loading } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  // AnimatePresence garde l'arbre de la route sortante monté le temps de son
  // animation de sortie — pendant ce temps il reste abonné au contexte
  // location (global), donc re-rend à chaque changement de route. Un
  // <Navigate> déclaratif re-déclencherait alors la redirection à chaque
  // rendu (state={{from}} étant un nouvel objet à chaque fois), boucle
  // infinie ("Maximum update depth exceeded"). Cette ref garantit un seul
  // appel à navigate() par montage réel du garde.
  const hasRedirected = useRef(false)

  useEffect(() => {
    if (loading || user || hasRedirected.current) return
    hasRedirected.current = true
    navigate('/login', { state: { from: location }, replace: true })
  }, [loading, user, location, navigate])

  // Rien tant que la session n'est pas résolue — sans ça, un utilisateur
  // déjà connecté verrait /login clignoter une fraction de seconde à
  // chaque rechargement de /edit, le temps que getSession() réponde.
  if (loading || !user) return null

  return <>{children}</>
}
