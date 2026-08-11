-- Correctif Phase 1 (voir 20260811130000_profile_stats.sql) : découvert
-- pendant les tests de la Phase 3. Ne pas exécuter automatiquement : à
-- relire puis lancer soi-même dans l'éditeur SQL de Supabase.
--
-- Bug : generate_series(date, date, interval) n'existe pas en Postgres —
-- seules les variantes (timestamp, timestamp, interval) et
-- (timestamptz, timestamptz, interval) existent, donc les deux bornes
-- `date` sont implicitement converties et chaque `d.day` généré est un
-- timestamp(tz), pas une date. La fonction déclare pourtant
-- `returns table (day date, ...)` : Postgres refuse l'appel avec
-- "structure of query does not match function result type" (42804), à
-- chaque appel, pour tout le monde. Correction : caster explicitement
-- d.day en date, à la fois dans le SELECT et dans la condition de jointure.

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
  select d.day::date, coalesce(v.views, 0)
  from generate_series(
    current_date - (p_days - 1), current_date, interval '1 day'
  ) as d(day)
  left join public.profile_views_daily v
    on v.day = d.day::date and v.profile_id = auth.uid()
  order by d.day;
end;
$$;

revoke all on function public.get_my_profile_stats(integer) from public;
grant execute on function public.get_my_profile_stats(integer) to authenticated;
