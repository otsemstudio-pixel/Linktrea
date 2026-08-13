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
  // Doc "Publication automatique optionnelle + clarification de l'export",
  // Phase 1 — quand actif, le trigger profiles_sync_auto_publish maintient
  // published_at collé à updated_at à chaque sauvegarde de `data`, donc
  // hasUnpublishedChanges reste quasi-toujours faux tout seul ; ce champ
  // sert à afficher explicitement ce mode plutôt que de compter sur cet
  // effet de bord (voir UnpublishedChangesBanner.tsx).
  autoPublish: boolean
}

export async function getPublishDiffStatus(): Promise<PublishDiffStatus | null> {
  const { supabase } = await import('./supabase')
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) return null

  const { data, error } = await supabase
    .from('profiles')
    .select('updated_at, published_at, auto_publish')
    .eq('id', userData.user.id)
    .maybeSingle()
  if (error) throw error
  if (!data) return null

  return {
    publishedAt: data.published_at,
    hasUnpublishedChanges: data.published_at !== null && new Date(data.updated_at) > new Date(data.published_at),
    autoPublish: data.auto_publish,
  }
}

export async function publishProfileChanges(): Promise<void> {
  const { supabase } = await import('./supabase')
  const { error } = await supabase.rpc('publish_profile_changes')
  if (error) throw error
}

// Réglage "Publication automatique" (zone Compte, AccountSection.tsx via
// useAutoPublishSetting.ts) — n'affecte QUE les modifications futures de
// `data` (le trigger ne se déclenche que sur une écriture réelle de cette
// colonne) : l'activer seul ne republie pas rétroactivement un brouillon
// déjà en attente, cohérent avec le comportement littéral du trigger SQL.
export async function setAutoPublish(enabled: boolean): Promise<void> {
  const { supabase } = await import('./supabase')
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) throw new Error('Tu dois être connecté pour faire ça.')

  const { error } = await supabase.from('profiles').update({ auto_publish: enabled }).eq('id', userData.user.id)
  if (error) throw error
}
