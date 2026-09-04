-- Correctif du champ "Lien" qui rejette toute valeur (voir diagnostic :
-- profiles n'a plus de policy de lecture publique depuis l'introduction de
-- public_profiles, créée hors migration versionnée — voir le commentaire
-- déjà présent en tête de SupabaseProfileStore.loadBySlug()). Ne pas
-- exécuter automatiquement : à relire puis lancer soi-même dans l'éditeur
-- SQL de Supabase, comme pour toutes les précédentes.
--
-- checkSlugAvailability() (SupabaseProfileStore.ts) lisait jusqu'ici
-- directement `profiles` pour savoir si un slug appartient déjà à QUELQU'UN
-- D'AUTRE. Avec seulement profiles_owner_read (id = auth.uid()) restant sur
-- cette table, cette lecture ne voit plus jamais la ligne d'un autre
-- utilisateur — la vérification de collision est donc structurellement
-- aveugle depuis ce changement de policy, pas un problème de regex.
--
-- SECURITY DEFINER, volontairement étroite : renvoie UNIQUEMENT un booléen,
-- jamais une ligne de `profiles` — aucune donnée de profil n'est exposée à
-- l'appelant, seulement "quelqu'un d'autre que moi a-t-il déjà ce slug ?".
-- `auth.uid()` exclut le propriétaire actuel : republier sans changer son
-- propre slug ne doit jamais remonter "déjà pris" par lui-même.
create or replace function public.is_slug_taken(p_slug text)
returns boolean
security definer
set search_path = public
language plpgsql
as $$
begin
  if auth.uid() is null then
    raise exception 'aucun utilisateur authentifié';
  end if;

  return exists (
    select 1 from public.profiles
    where slug = lower(p_slug)
      and id is distinct from auth.uid()
  );
end;
$$;

revoke all on function public.is_slug_taken(text) from public;
grant execute on function public.is_slug_taken(text) to authenticated;
