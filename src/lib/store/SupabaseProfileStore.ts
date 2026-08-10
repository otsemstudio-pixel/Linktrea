import type { Profile } from '@/types'
import { profileSchema } from '@/lib/schema'
import { createEmptyProfile } from '@/lib/emptyProfile'
import { isValidSlugFormat } from '@/lib/slug'
import { supabase } from '@/lib/supabase'
import type { ProfileStore, PublishStatus, SlugAvailability } from './ProfileStore'
import { ProfileStoreError } from './ProfileStore'

// data vaut '{}' juste après l'inscription (valeur par défaut posée par le
// trigger handle_new_user, avant que la personne n'ait rien rempli) — ce
// n'est pas une erreur, juste "pas encore de profil". Un JSON qui ne colle
// pas du tout au schéma (corruption, changement de forme) tombe dans le
// même repli plutôt que de faire échouer loadMine/loadBySlug : l'interface
// ProfileStore ne laisse pas de place à un troisième état "corrompu".
function parseProfileData(raw: unknown): Profile {
  const result = profileSchema.safeParse(raw)
  return result.success ? result.data : createEmptyProfile()
}

type SupabaseErrorLike = { message: string; code?: string }

function mapError(error: SupabaseErrorLike, fallback: string): ProfileStoreError {
  if (error.message.includes('Failed to fetch')) {
    return new ProfileStoreError('Impossible de contacter le serveur. Vérifie ta connexion et réessaie.', {
      cause: error,
    })
  }
  const lower = error.message.toLowerCase()
  if (lower.includes('jwt') || lower.includes('session')) {
    return new ProfileStoreError('Ta session a expiré. Reconnecte-toi pour continuer.', { cause: error })
  }
  return new ProfileStoreError(fallback, { cause: error })
}

async function requireUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) {
    throw new ProfileStoreError('Tu dois être connecté pour faire ça.')
  }
  return data.user.id
}

export class SupabaseProfileStore implements ProfileStore {
  async loadBySlug(slug: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('data')
      .eq('slug', slug.toLowerCase())
      .maybeSingle()

    if (error) throw mapError(error, 'Impossible de charger ce profil pour le moment. Réessaie dans un instant.')
    if (!data) return null
    return parseProfileData(data.data)
  }

  async loadMine(): Promise<Profile | null> {
    const { data: userData, error: userError } = await supabase.auth.getUser()
    if (userError || !userData.user) return null

    const { data, error } = await supabase
      .from('profiles')
      .select('data')
      .eq('id', userData.user.id)
      .maybeSingle()

    if (error) throw mapError(error, 'Impossible de charger ton profil. Réessaie dans un instant.')
    if (!data) return null
    return parseProfileData(data.data)
  }

  async save(profile: Profile): Promise<void> {
    const userId = await requireUserId()
    const { error } = await supabase.from('profiles').upsert({ id: userId, data: profile }, { onConflict: 'id' })

    if (error) {
      throw mapError(
        error,
        "L'enregistrement a échoué. Réessaie dans un instant — tes modifications restent dans le formulaire.",
      )
    }
  }

  async publish(slug: string): Promise<{ ok: true } | { ok: false; reason: 'taken' | 'invalid' }> {
    const userId = await requireUserId()
    const { error } = await supabase
      .from('profiles')
      .update({ slug: slug.toLowerCase(), is_published: true })
      .eq('id', userId)

    if (!error) return { ok: true }
    // 23505 = unique_violation (slug déjà pris), 23514 = check_violation
    // (format invalide ou mot réservé — voir enforce_profile_slug_rules).
    if (error.code === '23505') return { ok: false, reason: 'taken' }
    if (error.code === '23514') return { ok: false, reason: 'invalid' }
    throw mapError(error, 'La publication a échoué. Réessaie dans un instant.')
  }

  async unpublish(): Promise<void> {
    const userId = await requireUserId()
    const { error } = await supabase.from('profiles').update({ is_published: false }).eq('id', userId)
    if (error) throw mapError(error, 'La dépublication a échoué. Réessaie dans un instant.')
  }

  async getPublishStatus(): Promise<PublishStatus | null> {
    const { data: userData, error: userError } = await supabase.auth.getUser()
    if (userError || !userData.user) return null

    const { data, error } = await supabase
      .from('profiles')
      .select('slug, is_published')
      .eq('id', userData.user.id)
      .maybeSingle()

    if (error) throw mapError(error, 'Impossible de lire le statut de publication. Réessaie dans un instant.')
    if (!data) return null
    return { slug: data.slug, isPublished: data.is_published }
  }

  // Vérification en lecture seule, sans effet de bord — publish() reste la
  // seule méthode qui écrit réellement. Le slug déjà publié par la personne
  // elle-même ne doit pas remonter "taken" : republier sans rien changer
  // doit rester possible.
  async checkSlugAvailability(slug: string): Promise<SlugAvailability> {
    if (!isValidSlugFormat(slug)) return 'invalid'
    const normalized = slug.toLowerCase()

    const { data: reserved, error: reservedError } = await supabase
      .from('reserved_slugs')
      .select('slug')
      .eq('slug', normalized)
      .maybeSingle()
    if (reservedError) {
      throw mapError(reservedError, 'Impossible de vérifier ce slug pour le moment. Réessaie dans un instant.')
    }
    if (reserved) return 'invalid'

    const { data: userData } = await supabase.auth.getUser()

    const { data: existing, error: existingError } = await supabase
      .from('profiles')
      .select('id')
      .eq('slug', normalized)
      .maybeSingle()
    if (existingError) {
      throw mapError(existingError, 'Impossible de vérifier ce slug pour le moment. Réessaie dans un instant.')
    }
    if (existing && existing.id !== userData.user?.id) return 'taken'

    return 'available'
  }

  // delete_own_account() est une fonction Postgres SECURITY DEFINER (voir
  // supabase/migrations/20260810120000_delete_own_account.sql) : le rôle
  // authenticated n'a normalement aucun droit sur auth.users, donc la
  // suppression ne peut pas passer par un simple delete client — il faut un
  // point d'entrée serveur dédié. Elle supprime la ligne auth.users, dont la
  // contrainte "references auth.users on delete cascade" sur profiles.id
  // fait disparaître public.profiles automatiquement — pas la peine de la
  // dupliquer ici.
  async deleteAccount(): Promise<void> {
    const { error } = await supabase.rpc('delete_own_account')
    if (error) throw mapError(error, 'La suppression du compte a échoué. Réessaie dans un instant.')
  }
}
