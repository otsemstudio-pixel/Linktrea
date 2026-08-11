-- Dashboard de statistiques du profil (Phase 1). Ne pas exécuter
-- automatiquement : à relire puis lancer soi-même dans l'éditeur SQL de
-- Supabase, comme pour les migrations précédentes.
--
-- Principe général : aucune ligne individuelle par visite, aucune donnée
-- personnelle de visiteur (pas d'IP, pas d'empreinte de navigateur, pas de
-- cookie de suivi) — uniquement des compteurs agrégés par jour. C'est ce qui
-- borne à la fois la sensibilité des données stockées et le volume de
-- lignes dans le temps.

-- ============================================================
-- 1. Tables
-- ============================================================

create table public.profile_views_daily (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  day        date not null,
  views      integer not null default 0,
  primary key (profile_id, day)
);

create table public.link_clicks_daily (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  -- Identifiant du Ticker concerné (src/types/profile.ts) — texte libre, pas
  -- de référence déclarative vers une table tickers : les tickers vivent
  -- dans profiles.data (jsonb), pas dans une table dédiée.
  link_id    text not null,
  day        date not null,
  clicks     integer not null default 0,
  primary key (profile_id, link_id, day)
);

-- ============================================================
-- 2. Row Level Security — activée immédiatement, avant toute autre
--    instruction touchant ces deux tables. Sans ça, l'API REST
--    auto-générée de Supabase (PostgREST) les exposerait en lecture directe
--    avec la clé anon, révélant les statistiques de TOUS les profils.
-- ============================================================

alter table public.profile_views_daily enable row level security;
alter table public.link_clicks_daily enable row level security;

-- Aucune policy sur l'une ou l'autre table : RLS activé sans policy bloque
-- tout accès direct, pour tous les rôles, y compris le propriétaire des
-- données. C'est volontairement plus strict que pour `profiles` — même la
-- lecture de ses propres statistiques passe par une fonction dédiée
-- (get_my_profile_stats / get_my_link_clicks plus bas), qui décide
-- précisément ce qu'elle renvoie, plutôt que d'exposer les lignes brutes.

-- ============================================================
-- 3. Fonctions d'enregistrement — appelables publiquement, y compris sans
--    connexion (un visiteur anonyme doit pouvoir déclencher un
--    enregistrement de vue/clic).
-- ============================================================

-- Incrémente le compteur de vues du jour pour le profil désigné par son
-- slug. N'échoue jamais bruyamment (slug inconnu, profil dépublié entre
-- temps) : la fonction retourne silencieusement, sans lever d'exception —
-- un visiteur anonyme ne doit jamais voir une erreur pour un simple
-- comptage. Ne compte pas la visite du propriétaire sur son propre profil
-- (ex. depuis "Aperçu") : auth.uid() est l'id de la session appelante, qui
-- vaut directement l'id du profil grâce à la contrainte
-- "profiles.id references auth.users" (20260806120000_create_profiles.sql).
create or replace function public.record_profile_view(p_slug text)
returns void
security definer
set search_path = public
language plpgsql
as $$
declare
  v_profile_id uuid;
begin
  select id into v_profile_id
  from public.profiles
  where slug = p_slug and is_published = true;

  if v_profile_id is null then
    return; -- profil inconnu ou non publié : rien à enregistrer
  end if;

  if auth.uid() = v_profile_id then
    return; -- le propriétaire consultant son propre profil n'incrémente rien
  end if;

  insert into public.profile_views_daily (profile_id, day, views)
  values (v_profile_id, current_date, 1)
  on conflict (profile_id, day) do update
    set views = public.profile_views_daily.views + 1;

  -- Rétention 90 jours glissants — purge opportuniste à chaque vue
  -- enregistrée, pas de tâche planifiée (pg_cron) nécessaire : un profil
  -- qui reçoit encore des vues se nettoie tout seul au fil de l'eau, ce qui
  -- suffit largement pour l'objectif de légèreté visé. Doit rester DANS le
  -- corps de la fonction : v_profile_id n'existe que dans cette portée.
  delete from public.profile_views_daily
  where profile_id = v_profile_id and day < current_date - 90;

  delete from public.link_clicks_daily
  where profile_id = v_profile_id and day < current_date - 90;
end;
$$;

-- Même principe que record_profile_view ci-dessus, pour un clic sur un lien
-- sortant du profil (réseau, vérification de certificat) — p_link_id est
-- l'id du Ticker cliqué, fourni tel quel par le client.
create or replace function public.record_link_click(p_slug text, p_link_id text)
returns void
security definer
set search_path = public
language plpgsql
as $$
declare
  v_profile_id uuid;
begin
  select id into v_profile_id
  from public.profiles
  where slug = p_slug and is_published = true;

  if v_profile_id is null or auth.uid() = v_profile_id then
    return;
  end if;

  insert into public.link_clicks_daily (profile_id, link_id, day, clicks)
  values (v_profile_id, p_link_id, current_date, 1)
  on conflict (profile_id, link_id, day) do update
    set clicks = public.link_clicks_daily.clicks + 1;
end;
$$;

revoke all on function public.record_profile_view(text) from public;
grant execute on function public.record_profile_view(text) to anon, authenticated;

revoke all on function public.record_link_click(text, text) from public;
grant execute on function public.record_link_click(text, text) to anon, authenticated;

-- ============================================================
-- 4. Fonctions de lecture — propriétaire authentifié uniquement, jamais un
--    autre profil (auth.uid() est lu DANS le corps, jamais passé en
--    paramètre : impossible d'appeler ces fonctions avec l'id de quelqu'un
--    d'autre, quel que soit ce qu'un appelant tenterait de fournir).
-- ============================================================

-- Une ligne par jour sur les p_days derniers jours (90 par défaut), zéro
-- pour les jours sans visite — generate_series garantit un point CONTINU
-- par jour, indispensable pour tracer une sparkline sans trous plutôt que
-- de ne renvoyer que les jours où il s'est passé quelque chose.
create or replace function public.get_my_profile_stats(p_days integer default 90)
returns table (
  day    date,
  views  integer
)
security definer
set search_path = public
language plpgsql
as $$
begin
  if auth.uid() is null then
    raise exception 'aucun utilisateur authentifié';
  end if;

  return query
  select d.day, coalesce(v.views, 0)
  from generate_series(
    current_date - (p_days - 1), current_date, interval '1 day'
  ) as d(day)
  left join public.profile_views_daily v
    on v.day = d.day and v.profile_id = auth.uid()
  order by d.day;
end;
$$;

-- Total de clics par lien sur la période, du plus cliqué au moins cliqué —
-- pour le classement affiché dans le dashboard (Phase 3).
create or replace function public.get_my_link_clicks(p_days integer default 90)
returns table (
  link_id      text,
  total_clicks bigint
)
security definer
set search_path = public
language plpgsql
as $$
begin
  if auth.uid() is null then
    raise exception 'aucun utilisateur authentifié';
  end if;

  return query
  select c.link_id, sum(c.clicks)::bigint
  from public.link_clicks_daily c
  where c.profile_id = auth.uid()
    and c.day >= current_date - (p_days - 1)
  group by c.link_id
  order by sum(c.clicks) desc;
end;
$$;

revoke all on function public.get_my_profile_stats(integer) from public;
grant execute on function public.get_my_profile_stats(integer) to authenticated;

revoke all on function public.get_my_link_clicks(integer) from public;
grant execute on function public.get_my_link_clicks(integer) to authenticated;
