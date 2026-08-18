-- Limitation de fréquence sur les fonctions publiques de statistiques (doc
-- "Limitation de fréquence sur les fonctions publiques de statistiques"). Ne
-- pas exécuter automatiquement : à relire puis lancer soi-même dans
-- l'éditeur SQL de Supabase, comme pour toutes les précédentes.
--
-- Par PROFIL, jamais par visiteur — aucun identifiant de visiteur introduit
-- (pas d'IP, pas d'empreinte de navigateur), cohérent avec le principe déjà
-- posé pour ce module. Une seule ligne par profil, réinitialisée sur place :
-- pas de croissance à surveiller ni de purge à prévoir, contrairement aux
-- tables d'agrégation quotidienne du reste du module.

create table public.view_rate_limit (
  profile_id   uuid primary key references public.profiles(id) on delete cascade,
  window_start timestamptz not null default now(),
  count        integer not null default 0
);

alter table public.view_rate_limit enable row level security;
-- Aucune policy directe — seule check_and_bump_rate_limit() (security
-- definer) y touche, jamais un accès direct via l'API REST.

-- `security definer` nécessaire : view_rate_limit n'a aucune policy directe
-- (même principe que la table admins/am_i_admin()), donc même le
-- propriétaire d'un appel en security invoker s'y heurterait via RLS.
create or replace function public.check_and_bump_rate_limit(
  p_profile_id uuid,
  p_max_per_minute integer default 60
)
returns boolean
security definer
set search_path = public
language plpgsql
as $$
declare
  v_window_start timestamptz;
  v_count integer;
begin
  -- count = 0 ici, PAS 1 : le premier appel réel pour un profil doit passer
  -- par le MÊME chemin d'incrémentation que tous les suivants (lu, comparé
  -- au plafond, puis incrémenté une seule fois plus bas) — l'initialiser
  -- directement à 1 ferait compter ce premier appel deux fois (1 posé ici +
  -- 1 de plus par l'incrémentation en fin de fonction), abaissant le
  -- plafond réel à p_max_per_minute - 1 sans que ce soit l'intention.
  insert into public.view_rate_limit (profile_id, window_start, count)
  values (p_profile_id, now(), 0)
  on conflict (profile_id) do nothing;

  select window_start, count into v_window_start, v_count
  from public.view_rate_limit
  where profile_id = p_profile_id
  for update;

  if now() - v_window_start > interval '1 minute' then
    update public.view_rate_limit
    set window_start = now(), count = 1
    where profile_id = p_profile_id;
    return true;
  end if;

  if v_count >= p_max_per_minute then
    return false; -- plafond atteint, l'appelant doit ignorer silencieusement
  end if;

  update public.view_rate_limit
  set count = count + 1
  where profile_id = p_profile_id;

  return true;
end;
$$;

-- Aucun grant à anon/authenticated : pas de point d'entrée client direct,
-- seules record_profile_view()/record_link_click() (déjà security definer)
-- l'appellent en interne — un appel imbriqué depuis une fonction security
-- definer s'exécute avec les droits du PROPRIÉTAIRE de cette fonction, pas
-- ceux de l'appelant d'origine, donc aucun grant supplémentaire n'est requis
-- pour que cet appel interne fonctionne.
revoke all on function public.check_and_bump_rate_limit(uuid, integer) from public;

-- record_profile_view() : identique à la version existante
-- (20260811130000_profile_stats.sql), avec la vérification de plafond
-- insérée juste après l'exclusion du propriétaire, avant toute écriture
-- dans les tables de compteurs.
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

  if not public.check_and_bump_rate_limit(v_profile_id) then
    return; -- plafond atteint : retour silencieux, jamais d'erreur visible au visiteur
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

-- record_link_click() : même correctif, même emplacement.
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

  if not public.check_and_bump_rate_limit(v_profile_id) then
    return;
  end if;

  insert into public.link_clicks_daily (profile_id, link_id, day, clicks)
  values (v_profile_id, p_link_id, current_date, 1)
  on conflict (profile_id, link_id, day) do update
    set clicks = public.link_clicks_daily.clicks + 1;
end;
$$;

-- Grants inchangés — mêmes rôles qu'avant ce correctif, ce ne sont que les
-- CORPS des deux fonctions qui changent (CREATE OR REPLACE préserve les
-- grants existants de toute façon, mais les reposer explicitement documente
-- l'intention sans dépendre de cette garantie implicite).
revoke all on function public.record_profile_view(text) from public;
grant execute on function public.record_profile_view(text) to anon, authenticated;

revoke all on function public.record_link_click(text, text) from public;
grant execute on function public.record_link_click(text, text) to anon, authenticated;
