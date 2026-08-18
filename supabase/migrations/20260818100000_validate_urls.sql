-- Étend validate_profile_data() (déjà en place, voir
-- 20260812190000_validate_profile_data.sql) pour couvrir un point resté
-- ouvert : la règle "https uniquement" sur les URL de réseaux et de
-- certificats n'existait jusqu'ici que côté client (zod) — un appel direct
-- à l'API REST pouvait donc injecter un protocole arbitraire
-- (javascript:, data:...) dans un profil. Ne pas exécuter automatiquement :
-- à relire puis lancer soi-même dans l'éditeur SQL de Supabase.
--
-- Exception assumée au principe "ne pas dupliquer les règles zod" que ce
-- trigger a suivi jusqu'ici : la validation de schéma d'URL n'est pas une
-- règle de confort métier, c'est une protection directe contre l'injection
-- d'un protocole dangereux, au même titre que les autres garde-fous déjà en
-- place ici. Reste étroite et ciblée — uniquement le préfixe https://, rien
-- d'autre sur le format ou le contenu de ces champs.
--
-- Noms de clés vérifiés dans src/types/profile.ts avant d'écrire ce SQL :
-- Ticker.url et Certificate.credentialUrl/fileUrl, inchangés depuis la
-- dernière évolution du modèle — aucune adaptation nécessaire.
create or replace function public.validate_profile_data()
returns trigger
set search_path = public
language plpgsql
as $$
declare
  v_max_bytes constant integer := 200000; -- 200 Ko, marge large pour un usage normal
  v_max_array_items constant integer := 50;
  v_key text;
  v_element jsonb;
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

  -- Réseaux : url doit commencer par https:// quand elle est renseignée.
  -- nullif(x, '') is not null exclut à la fois l'absence du champ (JSON
  -- null -> NULL SQL via ->>) et la chaîne vide — les deux valent "non
  -- renseigné", jamais une erreur, cohérent avec zod côté client.
  if jsonb_typeof(new.data -> 'tickers') = 'array' then
    for v_element in select * from jsonb_array_elements(new.data -> 'tickers')
    loop
      if nullif(v_element ->> 'url', '') is not null
         and v_element ->> 'url' !~* '^https://' then
        raise exception 'URL de réseau invalide : https uniquement';
      end if;
    end loop;
  end if;

  -- Certificats : credentialUrl et fileUrl, même règle, chacun avec son
  -- propre message pour distinguer clairement lequel des deux a échoué.
  if jsonb_typeof(new.data -> 'certificates') = 'array' then
    for v_element in select * from jsonb_array_elements(new.data -> 'certificates')
    loop
      if nullif(v_element ->> 'credentialUrl', '') is not null
         and v_element ->> 'credentialUrl' !~* '^https://' then
        raise exception 'URL de certificat invalide (lien de vérification) : https uniquement';
      end if;

      if nullif(v_element ->> 'fileUrl', '') is not null
         and v_element ->> 'fileUrl' !~* '^https://' then
        raise exception 'URL de certificat invalide (fichier) : https uniquement';
      end if;
    end loop;
  end if;

  return new;
end;
$$;

-- Aucune instruction CREATE TRIGGER ici, volontairement : le trigger
-- profiles_validate_data existe déjà (migration précédente) et référence
-- cette fonction par NOM, pas par une copie de son corps — CREATE OR
-- REPLACE FUNCTION ci-dessus suffit à ce que le trigger exécute
-- immédiatement la version étendue, sans qu'il ait besoin d'être touché.
-- Le recréer ici échouerait d'ailleurs avec "trigger already exists".
--
-- Comportement du trigger existant, inchangé : `update of data` ne se
-- redéclenche pas pour un changement de slug/is_published/published_snapshot
-- seuls, et continue de s'appliquer à restore_profile_version() (UPDATE ...
-- set data = v_data) — une entrée d'historique contenant une URL invalide
-- ne pourrait donc pas non plus être restaurée telle quelle, une garantie
-- bienvenue plutôt qu'un problème.
