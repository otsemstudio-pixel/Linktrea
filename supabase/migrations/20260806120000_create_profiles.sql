-- Schéma "profiles" + slugs réservés + RLS pour Linktrea/Ledger.
-- Ne pas exécuter automatiquement : à relire puis lancer soi-même dans
-- l'éditeur SQL de Supabase (Phase 1 du prompt Supabase).

-- ============================================================
-- 1. Table de référence des slugs interdits
-- ============================================================
-- Créée avant `profiles` car le trigger de validation du slug la consulte.

create table public.reserved_slugs (
  slug text primary key
);

insert into public.reserved_slugs (slug) values
  ('admin'), ('api'), ('edit'), ('login'), ('logout'), ('signup'),
  ('settings'), ('about'), ('help'), ('support'), ('legal'), ('privacy'),
  ('terms'), ('app'), ('www'), ('assets'), ('static'), ('new'), ('me'),
  ('dashboard'), ('profile'), ('linktrea');

-- RLS activé même sur une table de référence non sensible : sans ça,
-- l'API REST auto-générée de Supabase l'exposerait en lecture ET écriture
-- à n'importe qui (tout le schéma public est exposé par défaut).
alter table public.reserved_slugs enable row level security;

create policy "reserved_slugs_public_read"
  on public.reserved_slugs
  for select
  to anon, authenticated
  using (true);
-- Aucune policy insert/update/delete : la liste ne se modifie que par
-- migration, jamais depuis le client.

-- ============================================================
-- 2. Table profiles
-- ============================================================

create table public.profiles (
  id            uuid primary key references auth.users on delete cascade,
  slug          text unique,
  -- `data` reflète le type Profile de src/types/profile.ts, sérialisé en
  -- JSON. Pas de validation de schéma côté base : c'est le rôle de zod
  -- côté client avant l'écriture (voir src/lib/schema.ts).
  data          jsonb not null default '{}'::jsonb,
  is_published  boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  -- Longueur 3-32 imposée ici ; le jeu de caractères et l'absence de tiret
  -- en début/fin sont imposés par le CHECK ci-dessous.
  constraint profiles_slug_length check (
    slug is null or char_length(slug) between 3 and 32
  ),
  -- Minuscules/chiffres/tirets uniquement, premier et dernier caractère
  -- alphanumériques (donc jamais de tiret en tête ou en queue).
  constraint profiles_slug_format check (
    slug is null or slug ~ '^[a-z0-9][a-z0-9-]*[a-z0-9]$'
  )
);

-- Accélère la lecture publique (policy "profiles_public_read" plus bas) :
-- seules les lignes publiées sont indexées, l'index reste petit.
create index profiles_is_published_idx
  on public.profiles (is_published)
  where is_published = true;

-- ============================================================
-- 3. Normalisation + rejet des slugs réservés
-- ============================================================
-- Un CHECK constraint ne peut pas interroger une autre table en Postgres
-- (il doit être immutable) — la vérification anti-slugs-réservés passe
-- donc par un trigger, pas par une contrainte déclarative.

create or replace function public.enforce_profile_slug_rules()
returns trigger
language plpgsql
as $$
begin
  if new.slug is not null then
    new.slug := lower(new.slug);

    if exists (select 1 from public.reserved_slugs where slug = new.slug) then
      raise exception 'le slug "%" est réservé', new.slug
        using errcode = '23514'; -- check_violation : cohérent avec les
                                  -- contraintes de format ci-dessus, le
                                  -- client peut le traiter de la même façon
    end if;
  end if;

  return new;
end;
$$;

create trigger enforce_profile_slug_rules_before_write
  before insert or update on public.profiles
  for each row
  execute function public.enforce_profile_slug_rules();

-- ============================================================
-- 4. updated_at automatique
-- ============================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger set_profiles_updated_at
  before update on public.profiles
  for each row
  execute function public.set_updated_at();

-- ============================================================
-- 5. Ligne profiles vide à l'inscription
-- ============================================================
-- SECURITY DEFINER nécessaire ici : à ce stade de l'inscription, il n'y a
-- pas encore de session "authenticated" au sens RLS classique côté
-- profiles, donc un insert normal échouerait sous RLS. Le search_path est
-- épinglé explicitement (bonne pratique avec SECURITY DEFINER, sinon une
-- fonction malveillante du même nom dans un autre schéma pourrait être
-- résolue à la place de celle-ci).

create or replace function public.handle_new_user()
returns trigger
security definer
set search_path = public
language plpgsql
as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- ============================================================
-- 6. Row Level Security sur profiles
-- ============================================================

alter table public.profiles enable row level security;

-- Deux policies SELECT séparées plutôt qu'un seul OU dans une policy :
-- Postgres combine plusieurs policies permissives pour la même commande
-- avec OU logique, donc une ligne est lisible si l'UNE des deux conditions
-- est vraie. Ça matche exactement "public si publié, propriétaire toujours".

create policy "profiles_public_read"
  on public.profiles
  for select
  to anon, authenticated
  using (is_published = true);

create policy "profiles_owner_read"
  on public.profiles
  for select
  to authenticated
  using (id = auth.uid());

-- with check (id = auth.uid()) empêche d'insérer une ligne pour quelqu'un
-- d'autre.
create policy "profiles_owner_insert"
  on public.profiles
  for insert
  to authenticated
  with check (id = auth.uid());

-- using() borne les lignes modifiables à la sienne ; with check() borne la
-- valeur de `id` APRÈS modification. Comme auth.uid() est fixe pour la
-- session, la seule valeur qui satisfait les deux est l'id d'origine — un
-- update qui tenterait de changer `id` échoue donc, sans trigger dédié.
create policy "profiles_owner_update"
  on public.profiles
  for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "profiles_owner_delete"
  on public.profiles
  for delete
  to authenticated
  using (id = auth.uid());
