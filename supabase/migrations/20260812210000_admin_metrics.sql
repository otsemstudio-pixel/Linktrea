-- Fonctions de métriques agrégées pour /admin (Phase 2). Ne pas exécuter
-- automatiquement : à relire puis lancer soi-même dans l'éditeur SQL de
-- Supabase, comme pour toutes les précédentes.
--
-- Chaque fonction vérifie am_i_admin() en première ligne et lève une
-- exception sinon (voir 20260812200000_admin_status.sql). Accordées à
-- `authenticated` (pas un rôle admin dédié côté base, qui n'existe pas dans
-- ce projet) parce que la vraie vérification se fait À L'INTÉRIEUR de
-- chaque fonction — un compte non-admin qui les appelle directement obtient
-- l'exception 'accès refusé', jamais de données.
--
-- Aucune de ces fonctions ne renvoie de ligne par profil individuel — chaque
-- résultat est un agrégat au niveau du produit entier (total, moyenne, ou
-- regroupement par jour/thème/domaine, jamais par personne).

-- Nouvelles inscriptions par jour, sur la période demandée.
create or replace function public.admin_signup_trend(p_days integer default 90)
returns table (day date, signups bigint)
security definer
set search_path = public
language plpgsql
as $$
begin
  if not public.am_i_admin() then
    raise exception 'accès refusé';
  end if;

  return query
  select d.day::date, count(p.id)
  from generate_series(
    current_date - (p_days - 1), current_date, interval '1 day'
  ) as d(day)
  left join public.profiles p on p.created_at::date = d.day::date
  group by d.day
  order by d.day;
end;
$$;

-- Vue d'ensemble : total de profils, nombre publiés, taux de publication.
create or replace function public.admin_publish_stats()
returns table (total_profiles bigint, published_profiles bigint, publish_rate numeric)
security definer
set search_path = public
language plpgsql
as $$
begin
  if not public.am_i_admin() then
    raise exception 'accès refusé';
  end if;

  return query
  select
    count(*),
    count(*) filter (where is_published),
    round(100.0 * count(*) filter (where is_published) / nullif(count(*), 0), 1)
  from public.profiles;
end;
$$;

-- Popularité des thèmes choisis, du plus utilisé au moins utilisé.
-- Adapté à la structure RÉELLE du modèle de thème (vérifiée dans
-- src/types/profile.ts et par test direct cette session, pas dans le
-- data->'theme'->>'preset' du prompt d'origine, qui ne correspond à aucun
-- champ réel) : `appearance` porte soit un thème nommé de la Galerie
-- (kind='gallery', themeId parmi 13 valeurs), soit un thème Personnalisé
-- (kind='custom', pas de nom unique — regroupé sous 'personnalisé').
create or replace function public.admin_theme_popularity()
returns table (theme_name text, profile_count bigint)
security definer
set search_path = public
language plpgsql
as $$
begin
  if not public.am_i_admin() then
    raise exception 'accès refusé';
  end if;

  return query
  select
    case
      when data -> 'appearance' ->> 'kind' = 'custom' then 'personnalisé'
      else coalesce(data -> 'appearance' ->> 'themeId', 'non défini')
    end,
    count(*)
  from public.profiles
  group by 1
  order by 2 desc;
end;
$$;

-- Tendance globale des vues et clics, agrégée sur TOUS les profils, jour par
-- jour — jamais de détail par profil individuel.
create or replace function public.admin_engagement_trend(p_days integer default 90)
returns table (day date, total_views bigint, total_clicks bigint)
security definer
set search_path = public
language plpgsql
as $$
begin
  if not public.am_i_admin() then
    raise exception 'accès refusé';
  end if;

  return query
  select
    d.day::date,
    coalesce(sum(v.views), 0),
    coalesce((
      select sum(c.clicks) from public.link_clicks_daily c where c.day = d.day::date
    ), 0)
  from generate_series(
    current_date - (p_days - 1), current_date, interval '1 day'
  ) as d(day)
  left join public.profile_views_daily v on v.day = d.day::date
  group by d.day
  order by d.day;
end;
$$;

-- Répartition des profils par domaine professionnel (finance aujourd'hui,
-- d'autres plus tard) — agrégat, aucune identité de profil exposée.
create or replace function public.admin_domain_distribution()
returns table (domain text, profile_count bigint)
security definer
set search_path = public
language plpgsql
as $$
begin
  if not public.am_i_admin() then
    raise exception 'accès refusé';
  end if;

  return query
  select coalesce(data ->> 'domain', 'non défini'), count(*)
  from public.profiles
  group by 1
  order by 2 desc;
end;
$$;

revoke all on function public.admin_signup_trend(integer) from public;
grant execute on function public.admin_signup_trend(integer) to authenticated;

revoke all on function public.admin_publish_stats() from public;
grant execute on function public.admin_publish_stats() to authenticated;

revoke all on function public.admin_theme_popularity() from public;
grant execute on function public.admin_theme_popularity() to authenticated;

revoke all on function public.admin_engagement_trend(integer) from public;
grant execute on function public.admin_engagement_trend(integer) to authenticated;

revoke all on function public.admin_domain_distribution() from public;
grant execute on function public.admin_domain_distribution() to authenticated;
