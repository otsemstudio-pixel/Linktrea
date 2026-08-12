-- Garde-fou structurel sur profiles.data (durcissement avant ouverture à
-- davantage d'utilisateurs, Phase 1). Le RLS protège déjà QUI peut écrire
-- dans cette colonne (policies owner sur profiles) ; rien ne protégeait
-- jusqu'ici CE QUI est écrit dedans — toute la validation vit côté client
-- (zod, voir src/lib/schema.ts), donc un appel direct à l'API REST avec un
-- JWT valide (n'importe quel titulaire de compte légitime) pouvait y écrire
-- une structure arbitraire ou un volume de texte disproportionné.
--
-- Volontairement ÉTROIT : ne duplique PAS les règles zod (longueurs de
-- champ précises, formats, enums...) — les dupliquer entretiendrait deux
-- sources de vérité à resynchroniser à chaque évolution du modèle. Ce
-- trigger bloque uniquement les abus structurels qu'un appel direct à l'API
-- pourrait produire : mauvais type racine, payload disproportionné,
-- tableaux sans limite de taille.
create or replace function public.validate_profile_data()
returns trigger
set search_path = public
language plpgsql
as $$
declare
  v_max_bytes constant integer := 200000; -- 200 Ko, marge large pour un usage normal
  v_max_array_items constant integer := 50;
  v_key text;
begin
  -- Doit être un objet JSON, jamais un tableau, une chaîne ou un scalaire brut.
  if jsonb_typeof(new.data) is distinct from 'object' then
    raise exception 'structure de profil invalide';
  end if;

  -- Garde-fou global : empêche un payload disproportionné, quelle que soit
  -- sa forme exacte — c'est la protection la plus importante de cette
  -- fonction, elle seule couvre déjà la plupart des abus imaginables.
  if pg_column_size(new.data) > v_max_bytes then
    raise exception 'profil trop volumineux';
  end if;

  -- Limite le nombre d'éléments des tableaux connus pour éviter une
  -- croissance non bornée (positions, compétences, certificats, réseaux) —
  -- ces clés correspondent aux champs top-level de Profile
  -- (src/types/profile.ts) ; zod (profileSchema) ne les borne pas en
  -- longueur aujourd'hui, seulement leurs champs internes.
  for v_key in select unnest(array['positions', 'holdings', 'certificates', 'tickers'])
  loop
    if jsonb_typeof(new.data -> v_key) = 'array'
       and jsonb_array_length(new.data -> v_key) > v_max_array_items then
      raise exception 'trop d''éléments dans %', v_key;
    end if;
  end loop;

  return new;
end;
$$;

-- `update of data` (pas juste `update`) : ne se redéclenche pas pour un
-- changement de slug, is_published ou published_snapshot seuls (publish()/
-- publish_profile_changes() ne touchent jamais `data`) — seule une écriture
-- qui touche réellement ce JSON re-valide, ce qui inclut restore_profile_version()
-- (UPDATE ... set data = v_data), une garantie bienvenue plutôt qu'un problème :
-- une entrée d'historique corrompue ne pourrait pas être restaurée telle quelle.
create trigger profiles_validate_data
  before insert or update of data on public.profiles
  for each row execute function public.validate_profile_data();
