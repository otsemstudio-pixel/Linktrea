// Statut de publication (prompt "Publication automatique universelle").
// Une fois qu'un profil a été publié une première fois (published_at non
// nul), le trigger sync_auto_publish() maintient désormais published_at et
// published_snapshot systématiquement à jour à chaque sauvegarde de `data`
// — il n'y a donc plus de brouillon "en attente de publication" à détecter
// ni de comparaison de timestamps à faire ici. `publishedAt` sert
// uniquement à savoir si le profil a déjà été publié au moins une fois
// (voir UnpublishedChangesBanner.tsx).
export type PublishDiffStatus = {
  publishedAt: string | null
}

export async function getPublishDiffStatus(): Promise<PublishDiffStatus | null> {
  const { supabase } = await import('./supabase')
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) return null

  const { data, error } = await supabase.from('profiles').select('published_at').eq('id', userData.user.id).maybeSingle()
  if (error) throw error
  if (!data) return null

  return { publishedAt: data.published_at }
}

// Toujours nécessaire pour la toute première publication (voir
// usePublishState.ts) : l'UPDATE qui pose is_published=true/slug ne touche
// pas forcément `data` dans la même requête, donc le trigger
// `after update of data` ne se déclenche pas tout seul à ce moment-là —
// cet appel explicite comble ce seul cas, qui reste un geste explicite.
export async function publishProfileChanges(): Promise<void> {
  const { supabase } = await import('./supabase')
  const { error } = await supabase.rpc('publish_profile_changes')
  if (error) throw error
}
