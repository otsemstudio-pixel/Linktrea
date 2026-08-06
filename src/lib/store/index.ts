import type { ProfileStore } from './ProfileStore'

export type { ProfileStore } from './ProfileStore'
export { ProfileStoreError } from './ProfileStore'

let cached: ProfileStore | null = null

// Import dynamique délibéré : en mode local, SupabaseProfileStore (et donc
// src/lib/supabase.ts, qui lève si les variables d'env sont absentes)
// n'est jamais chargé. Un import statique des deux implémentations
// évaluerait supabase.ts dans tous les cas, y compris en local.
export async function getProfileStore(): Promise<ProfileStore> {
  if (cached) return cached

  const mode = import.meta.env.VITE_STORAGE_MODE === 'supabase' ? 'supabase' : 'local'

  if (mode === 'supabase') {
    const { SupabaseProfileStore } = await import('./SupabaseProfileStore')
    cached = new SupabaseProfileStore()
  } else {
    const { LocalProfileStore } = await import('./LocalProfileStore')
    cached = new LocalProfileStore()
  }

  return cached
}
