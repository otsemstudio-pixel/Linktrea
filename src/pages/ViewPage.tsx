import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { decodeProfile } from '@/lib/codec'
import { loadPublicProfile } from '@/lib/loadPublicProfile'
import ProfileView from '@/components/ProfileView'
import EmptyState from '@/components/view/EmptyState'
import type { Profile } from '@/types'

type State = { status: 'loading' } | { status: 'ready'; profile: Profile } | { status: 'empty' }

export default function ViewPage() {
  const { payload } = useParams()
  const [state, setState] = useState<State>({ status: 'loading' })

  useEffect(() => {
    // Preset neutre pendant la résolution — ProfileView reprendra la main
    // avec le vrai preset du profil dès qu'il sera trouvé.
    document.documentElement.dataset.preset = 'terminal'
  }, [])

  useEffect(() => {
    let cancelled = false

    async function resolve() {
      if (payload) {
        const result = decodeProfile(payload)
        if (result.ok) {
          if (!cancelled) setState({ status: 'ready', profile: result.profile })
          return
        }
      }
      const publicProfile = await loadPublicProfile()
      if (cancelled) return
      setState(publicProfile ? { status: 'ready', profile: publicProfile } : { status: 'empty' })
    }

    setState({ status: 'loading' })
    resolve()
    return () => {
      cancelled = true
    }
  }, [payload])

  if (state.status === 'loading') return null
  if (state.status === 'empty') return <EmptyState />
  return <ProfileView profile={state.profile} />
}
