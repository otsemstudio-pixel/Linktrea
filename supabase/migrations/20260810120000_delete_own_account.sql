-- Suppression de compte par l'utilisateur lui-même (refonte sécurité,
-- Phase 4). Ne pas exécuter automatiquement : à relire puis lancer soi-même
-- dans l'éditeur SQL de Supabase.

-- Le rôle authenticated n'a normalement aucun droit sur auth.users (schéma
-- interne à Supabase Auth) — une personne ne peut donc pas supprimer sa
-- propre ligne par un DELETE client classique. SECURITY DEFINER fait
-- tourner cette fonction avec les droits de son propriétaire (postgres),
-- le seul moyen de laisser un utilisateur s'auto-supprimer sans passer par
-- la clé service_role côté client. search_path est épinglé explicitement
-- (bonne pratique avec SECURITY DEFINER, sinon une fonction malveillante du
-- même nom dans un autre schéma pourrait être résolue à la place de
-- celle-ci — voir handle_new_user dans la migration précédente pour le même
-- principe).
--
-- Ne supprime QUE auth.users, jamais public.profiles explicitement : la
-- contrainte "id uuid primary key references auth.users on delete cascade"
-- (20260806120000_create_profiles.sql) fait disparaître la ligne profiles
-- automatiquement dès que la ligne auth.users est supprimée — la dupliquer
-- ici serait redondant et un risque de désynchronisation si l'une des deux
-- suppressions changeait sans l'autre.
create or replace function public.delete_own_account()
returns void
security definer
set search_path = public
language plpgsql
as $$
begin
  if auth.uid() is null then
    raise exception 'aucun utilisateur authentifié';
  end if;

  delete from auth.users where id = auth.uid();
end;
$$;

-- auth.uid() est lu DANS le corps de la fonction, jamais passé en
-- paramètre : impossible d'appeler cette fonction avec l'id de quelqu'un
-- d'autre, quel que soit ce qu'un appelant tenterait de fournir.
revoke all on function public.delete_own_account() from public;
grant execute on function public.delete_own_account() to authenticated;
