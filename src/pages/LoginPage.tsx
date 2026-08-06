import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useLocation, useNavigate, type Location } from 'react-router-dom'
import { useAuth } from '@/lib/auth/AuthContext'

const RESEND_COOLDOWN_SECONDS = 60

// Volontairement SANS "#/edit" : Supabase ajoute son ?code=... à la fin de
// cette URL pour le retour du lien magique (PKCE). Si l'URL contient déjà
// un hash, le code atterrit après le #, et le client Supabase — qui relit
// le hash comme une query string pour retrouver d'éventuels paramètres —
// le parse alors comme UNE SEULE paire "/edit?code=xxx", pas comme la clé
// "code" qu'il cherche. Résultat : la session n'est jamais reconnue, et on
// se retrouve renvoyé sur /login malgré un lien cliqué. Avec une URL sans
// hash, ?code=... reste un paramètre de requête normal, correctement lu.
// La redirection vers /edit après coup est gérée par AuthContext (event
// SIGNED_IN), pas par cette URL.
function redirectTarget(): string {
  return `${window.location.origin}${window.location.pathname}`
}

export default function LoginPage() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: Location } | null)?.from?.pathname ?? '/edit'

  const [email, setEmail] = useState('')
  const [sentTo, setSentTo] = useState<string | null>(null)
  const [cooldown, setCooldown] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined)

  // Déjà connecté (session existante au chargement) : inutile de montrer le
  // formulaire, direction la destination mémorisée.
  useEffect(() => {
    if (!loading && user) navigate(from, { replace: true })
  }, [loading, user, from, navigate])

  useEffect(() => () => clearInterval(timerRef.current), [])

  function startCooldown() {
    setCooldown(RESEND_COOLDOWN_SECONDS)
    timerRef.current = setInterval(() => {
      setCooldown((s) => {
        if (s <= 1) {
          clearInterval(timerRef.current)
          return 0
        }
        return s - 1
      })
    }, 1000)
  }

  async function sendLink(targetEmail: string) {
    setError(null)
    setSubmitting(true)
    try {
      const { supabase } = await import('@/lib/supabase')
      const { error: authError } = await supabase.auth.signInWithOtp({
        email: targetEmail,
        options: { emailRedirectTo: redirectTarget() },
      })
      if (authError) {
        setError("Impossible d'envoyer le lien. Vérifie l'adresse et réessaie.")
        return
      }
      setSentTo(targetEmail)
      startCooldown()
    } catch {
      setError('Impossible de contacter le serveur. Vérifie ta connexion et réessaie.')
    } finally {
      setSubmitting(false)
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    void sendLink(email)
  }

  // Pas de branche "mode local" dédiée : en mode local, l'utilisateur
  // factice de AuthContext est toujours présent, donc l'effet "déjà
  // connecté" ci-dessus redirige vers /edit avant que quoi que ce soit ici
  // ne soit visible — une UI spécifique à ce cas ne serait jamais vue.
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center gap-4 px-6 text-center bg-ink text-paper font-sans">
      <p className="text-label uppercase tracking-label text-muted">Ledger</p>

      {sentTo ? (
        <>
          <h1 className="text-2xl font-semibold max-w-xs">Lien envoyé à {sentTo}</h1>
          <p className="text-sm text-muted max-w-xs">Ouvre ta boîte mail, le lien est valable 1 heure.</p>
          {error && <p className="text-xs text-down max-w-xs">{error}</p>}
          <button
            type="button"
            onClick={() => sendLink(sentTo)}
            disabled={cooldown > 0 || submitting}
            className="min-h-11 px-5 rounded-md border border-ink-raised text-sm disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-accent focus-visible:-outline-offset-2"
          >
            {cooldown > 0 ? `Renvoyer (${cooldown}s)` : 'Renvoyer'}
          </button>
        </>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 w-full max-w-xs">
          <h1 className="text-2xl font-semibold">Connexion</h1>
          <label className="text-left">
            <span className="text-label uppercase tracking-label text-muted block mb-1.5">Email</span>
            <input
              type="email"
              required
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="toi@exemple.com"
              className="w-full min-h-11 rounded-md border border-ink-raised bg-ink px-3 text-sm text-paper focus-visible:outline-2 focus-visible:outline-accent focus-visible:-outline-offset-2"
            />
          </label>
          {error && <p className="text-xs text-down">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="min-h-11 rounded-md bg-accent text-ink font-medium text-sm disabled:opacity-50 active:scale-[0.98] transition-transform focus-visible:outline-2 focus-visible:outline-paper focus-visible:-outline-offset-2"
          >
            {submitting ? 'Envoi…' : 'Recevoir mon lien de connexion'}
          </button>
        </form>
      )}
    </div>
  )
}
