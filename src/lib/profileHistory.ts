// Historique des versions du profil (doc "Complétude, historique,
// publication différée", Phase 2) — s'appuie sur la table profile_history et
// les fonctions SECURITY DEFINER get_my_profile_history()/
// restore_profile_version(uuid)/get_profile_history_entry(uuid), toutes
// confirmées côté Supabase. La troisième a été ajoutée après coup (voir
// supabase/migrations/20260812120000_get_profile_history_entry.sql) : un
// test réel a montré que profile_history a RLS activé sans policy directe
// pour le propriétaire (SELECT authentifié → 200 avec un tableau vide), donc
// impossible de lire le contenu d'une version sans un point d'entrée dédié —
// get_my_profile_history() ne renvoie QUE id/created_at (liste légère).
import type { Profile } from '@/types'
import { parseProfileData } from './store/SupabaseProfileStore'

export type ProfileHistoryEntry = {
  id: string
  createdAt: string
}

export async function getMyProfileHistory(): Promise<ProfileHistoryEntry[]> {
  const { supabase } = await import('./supabase')
  const { data, error } = await supabase.rpc('get_my_profile_history')
  if (error) throw error
  return (data ?? []).map((row: { id: string; created_at: string }) => ({ id: row.id, createdAt: row.created_at }))
}

// `null` ne signifie ici QUE "id inconnu ou appartenant à quelqu'un
// d'autre" (la fonction SQL renvoie explicitement null dans ce cas, jamais
// d'exception) — un contenu qui ne colle pas au schéma (le '{}' initial de
// handle_new_user, capturé comme plus ancienne entrée de TOUS les comptes)
// retombe sur un profil vide via parseProfileData, jamais sur null : ce
// n'est pas une version "introuvable", juste une version vide à prévisualiser
// comme telle.
export async function getProfileHistoryEntryData(historyId: string): Promise<Profile | null> {
  const { supabase } = await import('./supabase')
  const { data, error } = await supabase.rpc('get_profile_history_entry', { p_history_id: historyId })
  if (error) throw error
  if (data === null) return null
  return parseProfileData(data)
}

export async function restoreProfileVersion(historyId: string): Promise<void> {
  const { supabase } = await import('./supabase')
  const { error } = await supabase.rpc('restore_profile_version', { p_history_id: historyId })
  if (error) throw error
}
