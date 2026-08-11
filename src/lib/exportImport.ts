import { profileSchema } from './schema'
import type { Profile } from '@/types'

export function downloadProfileJson(profile: Profile) {
  const json = JSON.stringify(profile, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'linktrea-data.json'
  a.click()
  URL.revokeObjectURL(url)
}

export type ImportResult = { ok: true; profile: Profile } | { ok: false; error: string }

export function parseProfileJson(text: string): ImportResult {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    return { ok: false, error: "Ce fichier n'est pas un JSON valide." }
  }
  const result = profileSchema.safeParse(parsed)
  if (!result.success) {
    const firstIssue = result.error.issues[0]
    const path = firstIssue?.path.join('.') || 'racine'
    return { ok: false, error: `Fichier invalide (${path}) : ${firstIssue?.message ?? 'schéma inconnu'}` }
  }
  return { ok: true, profile: result.data }
}
