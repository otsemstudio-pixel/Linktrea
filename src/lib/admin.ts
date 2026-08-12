// Statut et métriques admin (doc "Tableau de bord admin, métriques agrégées,
// export multi-format"). am_i_admin() est la SEULE vérification qui compte
// pour la route /admin — voir AdminPage.tsx : le nom de la route n'est
// qu'un confort marginal, jamais un mécanisme de sécurité en soi.
export async function amIAdmin(): Promise<boolean> {
  const { supabase } = await import('./supabase')
  // Échec réseau ou RPC = accès refusé, jamais une exception qui remonterait
  // jusqu'à l'appelant — un gate d'accès doit fermer par défaut (fail
  // closed), pas laisser planter la page ou, pire, se comporter comme
  // "admin" en cas de doute.
  const { data, error } = await supabase.rpc('am_i_admin')
  if (error) return false
  return data === true
}

// Lecture seule pour le tableau de bord (Phase 2/3) — chaque fonction
// SQL vérifie déjà am_i_admin() côté serveur ; un appel par un compte
// non-admin lève une exception que ces fonctions laissent remonter telle
// quelle (contrairement à amIAdmin() ci-dessus, qui doit fermer par défaut
// pour un GATE d'accès — ici c'est déjà trop tard pour "fermer", l'accès à
// /admin est déjà acquis au moment où ces fonctions sont appelées).
export type SignupTrendPoint = { day: string; signups: number }
export type PublishStats = { totalProfiles: number; publishedProfiles: number; publishRate: number }
export type ThemePopularity = { themeName: string; profileCount: number }
export type EngagementTrendPoint = { day: string; totalViews: number; totalClicks: number }
export type DomainDistribution = { domain: string; profileCount: number }

export async function getAdminSignupTrend(days: number): Promise<SignupTrendPoint[]> {
  const { supabase } = await import('./supabase')
  const { data, error } = await supabase.rpc('admin_signup_trend', { p_days: days })
  if (error) throw error
  return (data ?? []).map((row) => ({ day: row.day, signups: row.signups }))
}

export async function getAdminPublishStats(): Promise<PublishStats> {
  const { supabase } = await import('./supabase')
  const { data, error } = await supabase.rpc('admin_publish_stats')
  if (error) throw error
  const row = data?.[0]
  return {
    totalProfiles: row?.total_profiles ?? 0,
    publishedProfiles: row?.published_profiles ?? 0,
    publishRate: row?.publish_rate ?? 0,
  }
}

export async function getAdminThemePopularity(): Promise<ThemePopularity[]> {
  const { supabase } = await import('./supabase')
  const { data, error } = await supabase.rpc('admin_theme_popularity')
  if (error) throw error
  return (data ?? []).map((row) => ({ themeName: row.theme_name, profileCount: row.profile_count }))
}

export async function getAdminEngagementTrend(days: number): Promise<EngagementTrendPoint[]> {
  const { supabase } = await import('./supabase')
  const { data, error } = await supabase.rpc('admin_engagement_trend', { p_days: days })
  if (error) throw error
  return (data ?? []).map((row) => ({ day: row.day, totalViews: row.total_views, totalClicks: row.total_clicks }))
}

export async function getAdminDomainDistribution(): Promise<DomainDistribution[]> {
  const { supabase } = await import('./supabase')
  const { data, error } = await supabase.rpc('admin_domain_distribution')
  if (error) throw error
  return (data ?? []).map((row) => ({ domain: row.domain, profileCount: row.profile_count }))
}
