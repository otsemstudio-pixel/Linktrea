-- Complète profile_history/get_my_profile_history()/restore_profile_version()
-- (déjà créés directement en base, hors migration versionnée — voir le doc
-- "Complétude, historique, publication différée"). get_my_profile_history()
-- ne renvoie que id/created_at (liste légère) ; aucune fonction n'exposait
-- jusqu'ici le contenu (`data`) d'UNE version précise pour en faire un
-- aperçu côté éditeur — profile_history a RLS activé sans policy directe
-- pour le propriétaire (confirmé : un SELECT authentifié direct renvoie 200
-- avec un tableau vide), donc ce point d'entrée manquait réellement.
--
-- Même forme que restore_profile_version(uuid) : SECURITY DEFINER, scope
-- strict sur auth.uid(), mais lecture seule — aucune écriture, contrairement
-- à restore_profile_version.
create or replace function public.get_profile_history_entry(p_history_id uuid)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_data jsonb;
begin
  if auth.uid() is null then
    raise exception 'aucun utilisateur authentifié';
  end if;

  select data into v_data
  from public.profile_history
  where id = p_history_id and profile_id = auth.uid();

  return v_data; -- null si introuvable ou si l'entrée n'appartient pas à l'appelant, jamais d'exception
end;
$function$;

revoke all on function public.get_profile_history_entry(uuid) from public;
grant execute on function public.get_profile_history_entry(uuid) to authenticated;
