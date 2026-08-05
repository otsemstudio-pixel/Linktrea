import { profileSchema } from './schema'
import type { Profile } from '@/types'

// Deuxième maillon de l'ordre de priorité défini en Phase 1 : payload URL ->
// /public/data.json -> état vide. Ce fichier n'existe que si quelqu'un l'y a
// déposé (export JSON depuis /edit, ou npm run seed en local) — son absence
// est un cas normal, pas une erreur.
export async function loadPublicProfile(): Promise<Profile | null> {
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}data.json`, { cache: 'no-store' })
    if (!res.ok) return null
    const json = await res.json()
    const result = profileSchema.safeParse(json)
    return result.success ? result.data : null
  } catch {
    return null
  }
}
