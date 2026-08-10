import { useEffect, useRef } from 'react'

// CAPTCHA invisible (Cloudflare Turnstile, refonte sécurité Phase 3) —
// chargé via son script officiel plutôt qu'un wrapper npm, pour ne pas
// ajouter de dépendance juste pour un <script src> + un appel global.
// `appearance: 'interaction-only'` est le mode recommandé par Cloudflare
// pour un widget invisible dans le cas normal : 0px tant qu'aucun défi n'est
// nécessaire, un widget compact apparaît seulement si Turnstile a besoin
// d'une interaction (trafic suspect).
const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js'

// Fonctions exposées par le script Turnstile sur window une fois chargé —
// typées ici plutôt qu'avec un package @types, pour éviter une dépendance
// juste pour trois signatures.
type TurnstileGlobal = {
  render: (
    container: HTMLElement,
    options: {
      sitekey: string
      appearance: 'always' | 'execute' | 'interaction-only'
      callback: (token: string) => void
      'expired-callback': () => void
      'error-callback': () => void
    },
  ) => string
  reset: (widgetId: string) => void
  remove: (widgetId: string) => void
}

declare global {
  interface Window {
    turnstile?: TurnstileGlobal
  }
}

let scriptPromise: Promise<void> | null = null
function loadTurnstileScript(): Promise<void> {
  if (window.turnstile) return Promise.resolve()
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = SCRIPT_SRC
      script.async = true
      script.defer = true
      script.onload = () => resolve()
      script.onerror = () => reject(new Error('Le script Turnstile ne charge pas.'))
      document.head.appendChild(script)
    })
  }
  return scriptPromise
}

export const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY

type Props = {
  onVerify: (token: string) => void
  onExpire: () => void
  // Incrémenté par l'appelant pour forcer un nouveau défi — un jeton
  // Turnstile est à usage unique, donc chaque tentative d'envoi (même
  // ratée) doit en redemander un pour la suivante.
  resetSignal: number
}

export default function TurnstileWidget({ onVerify, onExpire, resetSignal }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetIdRef = useRef<string | null>(null)
  // Toujours la dernière version des callbacks sans reconstruire le widget
  // à chaque rendu (onVerify/onExpire sont recréés à chaque render de
  // LoginPage) — seul resetSignal doit re-déclencher quoi que ce soit.
  const onVerifyRef = useRef(onVerify)
  const onExpireRef = useRef(onExpire)
  onVerifyRef.current = onVerify
  onExpireRef.current = onExpire

  useEffect(() => {
    if (!TURNSTILE_SITE_KEY) return
    let cancelled = false

    loadTurnstileScript()
      .then(() => {
        if (cancelled || !containerRef.current || !window.turnstile) return
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: TURNSTILE_SITE_KEY,
          appearance: 'interaction-only',
          callback: (token) => onVerifyRef.current(token),
          'expired-callback': () => onExpireRef.current(),
          'error-callback': () => onExpireRef.current(),
        })
      })
      .catch(() => onExpireRef.current())

    return () => {
      cancelled = true
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (resetSignal > 0 && widgetIdRef.current && window.turnstile) {
      window.turnstile.reset(widgetIdRef.current)
    }
  }, [resetSignal])

  if (!TURNSTILE_SITE_KEY) return null

  return <div ref={containerRef} />
}
