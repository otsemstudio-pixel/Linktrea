-- Publication automatique universelle (prompt "Publication automatique
-- universelle"). Ne pas exécuter automatiquement : à relire puis lancer
-- soi-même dans l'éditeur SQL de Supabase, comme pour toutes les
-- précédentes.
--
-- Remplace le comportement conditionné au réglage optionnel auto_publish
-- (migration 20260812220000_auto_publish.sql) par un comportement
-- universel : tout profil déjà publié se synchronise désormais
-- automatiquement à chaque modification, sans réglage à activer. La toute
-- première publication (is_published passant de false à true) reste un
-- geste explicite, inchangé — seul ce qui se passe APRÈS reste concerné ici.
--
-- S'applique immédiatement aux comptes existants sans backfill séparé :
-- new.is_published est déjà vrai pour tout profil publié avant ce
-- changement, donc sa prochaine modification de `data` déclenche la
-- synchronisation sans qu'aucune ligne existante n'ait besoin d'être
-- corrigée — c'est la règle elle-même qui change, pas une valeur en base.
--
-- `security invoker` implicite (pas de SECURITY DEFINER), même raisonnement
-- que la version précédente : quand l'appelant d'origine est le
-- propriétaire authentifié (autosave normale), la ligne ciblée par cet
-- UPDATE interne (id = new.id) est la SIENNE, donc la policy
-- profiles_owner_update l'autorise ; quand l'appelant d'origine est
-- restore_profile_version() (SECURITY DEFINER), ce trigger hérite de son
-- contexte de privilège déjà élevé.
create or replace function public.sync_auto_publish()
returns trigger
set search_path = public
language plpgsql
as $$
begin
  -- Tout profil déjà publié se synchronise automatiquement désormais — plus
  -- de condition sur un réglage optionnel. Un profil jamais publié
  -- (is_published = false) n'est pas concerné : sa première mise en ligne
  -- reste un geste explicite, inchangé.
  if new.is_published then
    update public.profiles
    set published_snapshot = new.data,
        published_at = now()
    where id = new.id;
  end if;
  return new;
end;
$$;

-- Le trigger existant (profiles_sync_auto_publish, after update of data)
-- pointe déjà vers cette fonction par son nom — aucun changement d'ordre
-- avec profiles_validate_data (before update of data) ni le trigger
-- d'historique déjà en place (profiles_snapshot_history, créé hors
-- migration versionnée) : seul le corps de la fonction change, pas sa
-- position dans le pipeline de triggers ni le trigger lui-même.
