-- Publication automatique optionnelle (doc "Publication automatique
-- optionnelle + clarification de l'export", Phase 1). Ne pas exécuter
-- automatiquement : à relire puis lancer soi-même dans l'éditeur SQL de
-- Supabase, comme pour toutes les précédentes.

alter table public.profiles
  add column auto_publish boolean not null default false;

-- `security invoker` implicite (pas de SECURITY DEFINER) : ce trigger ne
-- fait qu'une opération sur la même table que celle qui a déclenché
-- l'événement, avec les mêmes droits que l'appelant d'origine — même
-- raisonnement que validate_profile_data(). Vérifié : quand l'appelant
-- d'origine est le propriétaire authentifié (autosave normale), la ligne
-- ciblée par cet UPDATE interne (id = new.id) est la SIENNE, donc la
-- policy profiles_owner_update l'autorise. Quand l'appelant d'origine est
-- restore_profile_version() (SECURITY DEFINER), ce trigger hérite du
-- contexte de privilège déjà élevé de cette fonction — pas besoin d'être
-- lui-même SECURITY DEFINER pour fonctionner dans ce cas non plus.
create or replace function public.sync_auto_publish()
returns trigger
set search_path = public
language plpgsql
as $$
begin
  if new.auto_publish and new.is_published then
    update public.profiles
    set published_snapshot = new.data,
        published_at = now()
    where id = new.id;
  end if;
  return new;
end;
$$;

-- Récursion vérifiée : ce trigger se déclenche `after update OF DATA`.
-- L'UPDATE qu'il exécute lui-même ne touche que published_snapshot et
-- published_at, jamais `data` — la condition de colonne du trigger n'est
-- donc jamais réunie par sa propre écriture, aucun risque de boucle. Même
-- raisonnement pour validate_profile_data() (before update OF DATA) : cet
-- UPDATE interne ne la redéclenche pas non plus.
create trigger profiles_sync_auto_publish
  after update of data on public.profiles
  for each row execute function public.sync_auto_publish();
