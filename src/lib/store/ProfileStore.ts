import type { Profile } from '@/types'

export type PublishStatus = { slug: string | null; isPublished: boolean }
export type SlugAvailability = 'available' | 'taken' | 'invalid'

export interface ProfileStore {
  loadBySlug(slug: string): Promise<Profile | null>
  loadMine(): Promise<Profile | null>
  save(profile: Profile): Promise<void>
  publish(slug: string): Promise<{ ok: true } | { ok: false; reason: 'taken' | 'invalid' }>
  unpublish(): Promise<void>

  // Ajoutés en Phase 4 : le contrat d'origine ne couvrait que le contenu du
  // profil (`data`), pas le slug/l'état de publication qui vivent dans
  // leurs propres colonnes. La section "Publier" de l'éditeur a besoin de
  // les lire (pour pré-remplir le champ, savoir Publier vs Dépublier) et de
  // vérifier un slug SANS le committer (le debounce en direct ne doit pas
  // publier à chaque frappe) — ProfileStore reste la seule porte d'entrée
  // vers ces données, même pour ce nouveau besoin.
  getPublishStatus(): Promise<PublishStatus | null>
  checkSlugAvailability(slug: string): Promise<SlugAvailability>

  // Ajouté en Phase 4 (refonte sécurité) — supprime définitivement le
  // compte et tout son contenu. Irréversible : la confirmation (retaper son
  // slug) vit côté UI (AccountSection.tsx), pas ici.
  deleteAccount(): Promise<void>
}

// Une erreur Supabase (ou réseau) brute ne doit jamais atteindre un
// composant : chaque implémentation l'attrape et relance une
// ProfileStoreError avec un message déjà en français, déjà actionnable.
// `save`/`unpublish` gardent la signature Promise<void> imposée par
// l'interface — c'est donc par exception, pas par valeur de retour, que
// l'échec remonte pour ces deux méthodes.
export class ProfileStoreError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options)
    this.name = 'ProfileStoreError'
  }
}
