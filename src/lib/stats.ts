// Instrumentation client (dashboard de statistiques, Phase 2) — appelle les
// fonctions SQL record_profile_view/record_link_click (voir
// supabase/migrations/20260811130000_profile_stats.sql). Toujours en
// arrière-plan, jamais bloquant : un visiteur ne doit jamais voir d'erreur
// pour un simple comptage, et un clic sur un lien externe ne doit jamais
// être retardé par cet appel.

const STORAGE_MODE = import.meta.env.VITE_STORAGE_MODE === 'supabase' ? 'supabase' : 'local'

function viewedKey(slug: string) {
  return `linktrea:viewed:${slug}`
}

// Une vue comptée par onglet pour un même slug — déduplication approximative
// (pas d'objectif forensique, voir le prompt), évite seulement de recompter
// à chaque re-render/retour sur la page dans le même onglet.
export function recordProfileView(slug: string | null | undefined): void {
  if (!slug || STORAGE_MODE !== 'supabase') return
  const key = viewedKey(slug)
  if (sessionStorage.getItem(key)) return
  sessionStorage.setItem(key, '1')

  void (async () => {
    try {
      const { supabase } = await import('./supabase')
      await supabase.rpc('record_profile_view', { p_slug: slug })
    } catch {
      // silencieux — un comptage raté ne doit jamais se voir
    }
  })()
}

// fetch(..., { keepalive: true }) plutôt que navigator.sendBeacon (préférence
// du prompt d'origine) : sendBeacon ne peut pas porter d'en-tête Authorization
// personnalisé (seul le type du Blob devient Content-Type), donc un clic
// envoyé via sendBeacon tournerait toujours côté Supabase en tant que rôle
// anonyme — auth.uid() y vaudrait NULL même pour le propriétaire connecté,
// cassant silencieusement la règle "les clics du propriétaire sur son propre
// profil ne comptent pas". keepalive:true offre la même garantie de survie à
// la navigation vers le lien externe, tout en permettant d'attacher le vrai
// jeton de session quand il existe.
export function recordLinkClick(slug: string | null | undefined, linkId: string): void {
  if (!slug || STORAGE_MODE !== 'supabase') return

  void (async () => {
    try {
      const { supabase } = await import('./supabase')
      const {
        data: { session },
      } = await supabase.auth.getSession()
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string
      const url = import.meta.env.VITE_SUPABASE_URL as string

      await fetch(`${url}/rest/v1/rpc/record_link_click`, {
        method: 'POST',
        keepalive: true,
        headers: {
          'Content-Type': 'application/json',
          apikey: anonKey,
          Authorization: `Bearer ${session?.access_token ?? anonKey}`,
        },
        body: JSON.stringify({ p_slug: slug, p_link_id: linkId }),
      })
    } catch {
      // silencieux, idem recordProfileView
    }
  })()
}

export type DailyViews = { day: string; views: number }
export type LinkClickTotal = { link_id: string; total_clicks: number }

// Lecture côté propriétaire (dashboard de statistiques, Phase 3) — à
// l'inverse des deux fonctions ci-dessus, ne doit PAS échouer silencieusement :
// c'est une action explicite du propriétaire (ouverture du panneau), une
// erreur doit lui être montrée plutôt qu'avalée.
export async function getMyProfileStats(days = 90): Promise<DailyViews[]> {
  const { supabase } = await import('./supabase')
  const { data, error } = await supabase.rpc('get_my_profile_stats', { p_days: days })
  if (error) throw error
  return data ?? []
}

export async function getMyLinkClicks(days = 90): Promise<LinkClickTotal[]> {
  const { supabase } = await import('./supabase')
  const { data, error } = await supabase.rpc('get_my_link_clicks', { p_days: days })
  if (error) throw error
  return data ?? []
}
