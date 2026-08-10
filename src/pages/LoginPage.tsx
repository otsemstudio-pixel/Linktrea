import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useLocation, useNavigate, type Location } from 'react-router-dom'
import { useAuth } from '@/lib/auth/AuthContext'
import { getLastEmail, setLastEmail, clearLastEmail } from '@/lib/auth/lastEmail'
import { checkRateLimit, recordAttempt, formatWaitTime } from '@/lib/auth/rateLimit'
import { peekAccountDeletedFlag, clearAccountDeletedFlag } from '@/lib/auth/accountDeletedFlag'
import TurnstileWidget, { TURNSTILE_SITE_KEY } from '@/components/TurnstileWidget'

const RESEND_COOLDOWN_SECONDS = 60
// Message strictement identique que l'email corresponde à un compte
// existant ou non (refonte sécurité, Phase 3) — jamais de variante qui
// laisserait deviner si une adresse est enregistrée.
const NEUTRAL_SENT_MESSAGE = 'Si un compte existe pour cette adresse, un lien vient d\'être envoyé.'

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

type LoginLocationState = { from?: Location } | null

export default function LoginPage() {
  const { status } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as LoginLocationState)?.from?.pathname ?? '/edit'
  // Posé par AccountSection.tsx (sessionStorage, pas le `state` de
  // react-router — voir accountDeletedFlag.ts pour pourquoi) juste avant le
  // signOut() qui suit une suppression de compte réussie. Lecture non
  // destructive ici, effacement dans l'effet ci-dessous — voir
  // clearAccountDeletedFlag() pour pourquoi ce n'est pas une seule fonction.
  const [accountDeleted] = useState(() => peekAccountDeletedFlag())
  useEffect(() => {
    clearAccountDeletedFlag()
  }, [])

  // rememberedEmail piloté séparément de `email` : il ne reflète que ce qui
  // était en localStorage au montage (pour le message "content de te
  // revoir"), pas ce que l'utilisateur tape ensuite dans le champ, qui
  // reste librement modifiable.
  const [rememberedEmail, setRememberedEmail] = useState<string | null>(() => getLastEmail())
  const [email, setEmail] = useState(() => getLastEmail() ?? '')
  const [sentTo, setSentTo] = useState<string | null>(null)
  const [cooldown, setCooldown] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined)

  // Jeton Turnstile — à usage unique, voir TurnstileWidget.tsx. `null` tant
  // qu'aucun défi n'a été résolu ; incrémenter turnstileResetSignal force le
  // widget à en redemander un (après chaque tentative d'envoi, ratée ou non).
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const [turnstileResetSignal, setTurnstileResetSignal] = useState(0)

  // Déjà connecté (session existante au chargement) : inutile de montrer le
  // formulaire, direction la destination mémorisée.
  useEffect(() => {
    if (status === 'authenticated') navigate(from, { replace: true })
  }, [status, from, navigate])

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

    const rateLimit = checkRateLimit(targetEmail)
    if (!rateLimit.allowed) {
      setError(`Trop de tentatives pour cette adresse. Réessaie dans ${formatWaitTime(rateLimit.retryAfterSeconds)}.`)
      return
    }

    // Turnstile n'est requis que si une clé de site est configurée (voir
    // TurnstileWidget.tsx) — sans elle, /login reste utilisable, juste sans
    // CAPTCHA. Le jeton est à usage unique : sa présence ici veut dire qu'un
    // défi vient d'être résolu, jamais réutilisé pour une tentative précédente.
    if (TURNSTILE_SITE_KEY && !captchaToken) {
      setError('Vérification anti-robot en cours — réessaie dans un instant.')
      return
    }

    setSubmitting(true)
    // Comptabilisée avant l'appel réseau : c'est la requête envoyée à
    // Supabase qui consomme le quota SMTP à protéger, pas seulement une
    // réponse positive (voir rateLimit.ts).
    recordAttempt(targetEmail)
    try {
      const { supabase } = await import('@/lib/supabase')
      const { error: authError } = await supabase.auth.signInWithOtp({
        email: targetEmail,
        options: { emailRedirectTo: redirectTarget(), captchaToken: captchaToken ?? undefined },
      })
      if (authError) {
        setError("Impossible d'envoyer le lien. Vérifie l'adresse et réessaie.")
        return
      }
      setSentTo(targetEmail)
      setLastEmail(targetEmail)
      startCooldown()
    } catch {
      setError('Impossible de contacter le serveur. Vérifie ta connexion et réessaie.')
    } finally {
      setSubmitting(false)
      setCaptchaToken(null)
      setTurnstileResetSignal((s) => s + 1)
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    void sendLink(email)
  }

  function forgetEmail() {
    clearLastEmail()
    setRememberedEmail(null)
    setEmail('')
  }

  // Même principe qu'à /edit (voir RequireAuth) : un accès direct à /login
  // pendant que le statut est encore 'checking' ne doit pas laisser voir le
  // formulaire vierge une fraction de seconde à quelqu'un déjà connecté.
  if (status === 'checking') {
    return <div className="min-h-dvh bg-ink" aria-hidden="true" />
  }

  // Pas de branche "mode local" dédiée : en mode local, l'utilisateur
  // factice de AuthContext est toujours présent, donc l'effet "déjà
  // connecté" ci-dessus redirige vers /edit avant que quoi que ce soit ici
  // ne soit visible — une UI spécifique à ce cas ne serait jamais vue.
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center gap-4 px-6 text-center bg-ink text-paper font-sans">
      <p className="text-label uppercase tracking-label text-muted">Ledger</p>

      {accountDeleted && (
        <p className="text-sm text-up max-w-xs" role="status">
          Ton compte a été supprimé.
        </p>
      )}

      {/* Monté en permanence, pas seulement dans la branche formulaire : le
          bouton "Renvoyer" de l'écran de confirmation ci-dessous passe aussi
          par sendLink(), qui a donc besoin d'un jeton disponible dans les
          deux vues. */}
      <TurnstileWidget
        onVerify={setCaptchaToken}
        onExpire={() => setCaptchaToken(null)}
        resetSignal={turnstileResetSignal}
      />

      {sentTo ? (
        <>
          <h1 className="text-2xl font-semibold max-w-xs">{NEUTRAL_SENT_MESSAGE}</h1>
          <p className="text-sm text-muted max-w-xs">Vérifie {sentTo} — le lien est valable 1 heure.</p>
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
          <h1 className={rememberedEmail ? 'text-xl font-semibold' : 'text-2xl font-semibold'}>
            {rememberedEmail ? (
              <>
                Content de te revoir,{' '}
                {/* inline-block + overflow-hidden/text-ellipsis plutôt qu'une
                    troncature calculée en caractères : robuste à n'importe
                    quelle largeur de police réelle, là où un seuil fixe se
                    serait révélé soit trop court (adresses courtes coupées
                    pour rien), soit encore trop long pour une adresse très
                    longue (débordement horizontal malgré la troncature). */}
                <span className="inline-block max-w-[85%] align-bottom overflow-hidden text-ellipsis whitespace-nowrap">
                  {rememberedEmail}
                </span>{' '}
                — on t'envoie un nouveau lien ?
              </>
            ) : (
              'Connexion'
            )}
          </h1>
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
          {rememberedEmail && (
            <button
              type="button"
              onClick={forgetEmail}
              className="min-h-11 text-xs text-muted underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-accent focus-visible:-outline-offset-2 rounded"
            >
              Ce n'est pas moi
            </button>
          )}
        </form>
      )}
    </div>
  )
}
