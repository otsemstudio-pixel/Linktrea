import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getProfileStore } from '@/lib/store'
import { recordProfileView } from '@/lib/stats'
import ProfileView from '@/components/ProfileView'
import PublicProfileNotFound from '@/components/view/PublicProfileNotFound'
import ProfileSkeleton from '@/components/view/ProfileSkeleton'
import type { Profile } from '@/types'

type State = { status: 'loading' } | { status: 'ready'; profile: Profile } | { status: 'not-found' }

// Route publique /:slug — la version Supabase de ViewPage, qui elle reste
// branchée sur payload URL / public/data.json (voir prompt Ledger d'origine,
// non retiré : les deux mécanismes de partage coexistent).
export default function SlugPage() {
  const { slug } = useParams()
  const [state, setState] = useState<State>({ status: 'loading' })

  useEffect(() => {
    document.documentElement.dataset.background = 'graphite'
  }, [])

  useEffect(() => {
    if (!slug) {
      setState({ status: 'not-found' })
      return
    }
    let cancelled = false

    async function resolve() {
      try {
        const store = await getProfileStore()
        const profile = await store.loadBySlug(slug as string)
        if (cancelled) return
        setState(profile ? { status: 'ready', profile } : { status: 'not-found' })
      } catch {
        if (!cancelled) setState({ status: 'not-found' })
      }
    }

    setState({ status: 'loading' })
    resolve()
    return () => {
      cancelled = true
    }
  }, [slug])

  // Une fois par chargement de page, en arrière-plan — voir stats.ts pour la
  // déduplication (sessionStorage) et l'exclusion des vues du propriétaire
  // (gérée côté serveur, auth.uid() lu dans record_profile_view).
  useEffect(() => {
    if (state.status === 'ready' && slug) {
      recordProfileView(slug)
    }
  }, [state.status, slug])

  if (state.status === 'loading') return <ProfileSkeleton />
  if (state.status === 'not-found') return <PublicProfileNotFound />
  return <ProfileView profile={state.profile} slug={slug} />
}
