// Encodage/décodage du Profile pour le canal "URL partageable" :
// JSON -> compression LZString -> composant d'URL sûr, et retour.
import LZString from 'lz-string'
import { profileSchema } from './schema'
import type { Profile } from '@/types'

export const PAYLOAD_WARNING_THRESHOLD = 4000

export function encodeProfile(profile: Profile): string {
  const json = JSON.stringify(profile)
  return LZString.compressToEncodedURIComponent(json)
}

export type DecodeResult =
  | { ok: true; profile: Profile }
  | { ok: false; error: string }

export function decodeProfile(payload: string): DecodeResult {
  if (!payload) {
    return { ok: false, error: 'Payload vide.' }
  }

  const json = LZString.decompressFromEncodedURIComponent(payload)
  if (!json) {
    return { ok: false, error: 'Impossible de décompresser le payload.' }
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(json)
  } catch {
    return { ok: false, error: 'JSON invalide après décompression.' }
  }

  const result = profileSchema.safeParse(parsed)
  if (!result.success) {
    const firstIssue = result.error.issues[0]
    const path = firstIssue?.path.join('.') || 'racine'
    return {
      ok: false,
      error: `Profil invalide (${path}) : ${firstIssue?.message ?? 'schéma inconnu'}`,
    }
  }

  return { ok: true, profile: result.data }
}

export function buildShareUrl(profile: Profile, origin: string = window.location.origin): string {
  const payload = encodeProfile(profile)
  return `${origin}/#/p/${payload}`
}
