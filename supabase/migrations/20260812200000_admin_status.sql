-- Statut admin (tableau de bord admin, Phase 1). Ne pas exécuter
-- automatiquement : à relire puis lancer soi-même dans l'éditeur SQL de
-- Supabase, comme pour toutes les précédentes.
--
-- Aucun mécanisme d'auto-attribution nulle part (ni côté client, ni côté
-- fonction publique) — la seule ligne dans `admins` sera insérée
-- manuellement, une fois cette migration confirmée.

create table public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);

alter table public.admins enable row level security;
-- Aucune policy directe — la table est illisible pour tout le monde, y
-- compris son propre titulaire, via l'API REST. am_i_admin() est le SEUL
-- point d'accès, et ne renvoie qu'un booléen, jamais le contenu de la
-- table : c'est pour ça (et uniquement pour ça) que SECURITY DEFINER est
-- justifié ici, contrairement au trigger de validate_profile_data() —
-- cette fonction a réellement besoin de contourner le RLS pour lire une
-- table que l'appelant ne peut jamais lire lui-même.
create or replace function public.am_i_admin()
returns boolean
security definer
set search_path = public
language plpgsql
as $$
begin
  if auth.uid() is null then
    return false;
  end if;
  return exists(select 1 from public.admins where user_id = auth.uid());
end;
$$;

revoke all on function public.am_i_admin() from public;
grant execute on function public.am_i_admin() to authenticated;
