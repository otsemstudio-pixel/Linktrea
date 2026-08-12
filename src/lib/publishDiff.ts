// Distinction brouillon / version publiée (doc "Complétude, historique,
// publication différée", Phase 3) — comparaison de timestamps
// (profiles.updated_at vs profiles.published_at) plutôt qu'une comparaison
// de contenu : plus simple, et fiable ici précisément parce que
// publish_profile_changes() écrit published_at = now() dans la MÊME
// transaction que la mise à jour qui déclenche le trigger set_updated_at()
// — or now() vaut le timestamp de la transaction en cours en Postgres (pas
// l'horloge murale à chaque appel), donc les deux colonnes reçoivent
// exactement la même valeur au moment d'une publication. Tant qu'aucune
// écriture ultérieure sur `data` n'a eu lieu, updated_at ne peut donc pas
// dépasser published_at ; dès qu'une nouvelle sauvegarde (autosave ou
// restauration d'historique) touche la ligne, updated_at avance et
// published_at reste figé — la comparaison devient vraie exactement au bon
// moment, sans jamais avoir à sérialiser/comparer le JSON complet.
export type PublishDiffStatus = {
  publishedAt: string | null
  hasUnpublishedChanges: boolean
}

export async function getPublishDiffStatus(): Promise<PublishDiffStatus | null> {
  const { supabase } = await import('./supabase')
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) return null

  const { data, error } = await supabase
    .from('profiles')
    .select('updated_at, published_at')
    .eq('id', userData.user.id)
    .maybeSingle()
  if (error) throw error
  if (!data) return null

  return {
    publishedAt: data.published_at,
    hasUnpublishedChanges: data.published_at !== null && new Date(data.updated_at) > new Date(data.published_at),
  }
}

export async function publishProfileChanges(): Promise<void> {
  const { supabase } = await import('./supabase')
  const { error } = await supabase.rpc('publish_profile_changes')
  if (error) throw error
}
