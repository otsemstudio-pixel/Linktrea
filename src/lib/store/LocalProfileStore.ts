import type { Profile } from '@/types'
import { createEmptyProfile } from '@/lib/emptyProfile'
import { isValidSlugFormat } from '@/lib/slug'
import type { ProfileStore, PublishStatus, SlugAvailability } from './ProfileStore'
import { ProfileStoreError } from './ProfileStore'

const STORAGE_KEY = 'ledger:local-store'

type LocalRecord = {
  profile: Profile
  slug: string | null
  isPublished: boolean
}

function readRecord(): LocalRecord | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as LocalRecord
  } catch {
    return null
  }
}

function writeRecord(record: LocalRecord) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(record))
  } catch {
    throw new ProfileStoreError(
      "Impossible d'enregistrer en local : le stockage du navigateur est plein ou indisponible.",
    )
  }
}

// VITE_STORAGE_MODE=local : un seul profil, dans ce navigateur, pour
// développer sans réseau. "taken" n'existe pas dans ce monde à un seul
// utilisateur — publish() ne renvoie donc jamais cette raison ici, seul le
// format est vérifié (les mots réservés ne sont une règle que côté
// production/Supabase).
export class LocalProfileStore implements ProfileStore {
  async loadBySlug(slug: string): Promise<Profile | null> {
    const record = readRecord()
    if (!record || !record.isPublished || !record.slug) return null
    return record.slug === slug.toLowerCase() ? record.profile : null
  }

  async loadMine(): Promise<Profile | null> {
    return readRecord()?.profile ?? null
  }

  async save(profile: Profile): Promise<void> {
    const existing = readRecord()
    writeRecord({
      profile,
      slug: existing?.slug ?? null,
      isPublished: existing?.isPublished ?? false,
    })
  }

  async publish(slug: string): Promise<{ ok: true } | { ok: false; reason: 'taken' | 'invalid' }> {
    if (!isValidSlugFormat(slug)) return { ok: false, reason: 'invalid' }
    const existing = readRecord()
    writeRecord({
      profile: existing?.profile ?? createEmptyProfile(),
      slug: slug.toLowerCase(),
      isPublished: true,
    })
    return { ok: true }
  }

  async unpublish(): Promise<void> {
    const existing = readRecord()
    if (!existing) return
    writeRecord({ ...existing, isPublished: false })
  }

  async getPublishStatus(): Promise<PublishStatus | null> {
    const record = readRecord()
    if (!record) return null
    return { slug: record.slug, isPublished: record.isPublished }
  }

  async checkSlugAvailability(slug: string): Promise<SlugAvailability> {
    // Un seul utilisateur en local : "taken" n'a pas de sens (voir publish()).
    return isValidSlugFormat(slug) ? 'available' : 'invalid'
  }

  async deleteAccount(): Promise<void> {
    localStorage.removeItem(STORAGE_KEY)
  }
}
