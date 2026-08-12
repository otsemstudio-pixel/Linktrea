# Linktrea

Portfolio professionnel présenté comme un relevé de portefeuille financier. Chaque personne
édite son profil dans un éditeur privé, puis le publie sur une URL courte (`/son-slug`) qu'elle
partage.

## Fonctionnalités

**Édition et personnalisation**
- Sections structurées : identité, positions, compétences, certificats, réseaux.
- Système de thème à deux niveaux : 13 thèmes nommés en Galerie (dont "Éclat", à fond animé), ou
  mode Personnalisé (couleurs, police, style de bouton, mise en page d'en-tête, langage de forme,
  fond animé libres). 14 duos typographiques, 6 traitements photo, signature personnelle.
- Indicateur de complétude du profil, avec liens directs vers les sections manquantes.
- Historique des modifications : consultation et restauration d'une version précédente.
- Tuto interactif au premier passage dans l'éditeur.

**Publication et partage**
- Brouillon et version publiée sont séparés : les modifications restent privées tant qu'elles ne
  sont pas explicitement publiées (voir Architecture ci-dessous).
- Lien public court, QR code, carte de partage (carré, portrait, paysage, carte de visite),
  génération de CV en PDF (modèles Classique et Moderne, bilingue FR/EN, photo optionnelle).

**Sécurité et compte**
- Connexion par lien magique (email), CAPTCHA Turnstile optionnel.
- Suppression de compte en libre-service.
- Row Level Security sur toutes les tables, validation structurelle côté base des données écrites
  (voir [Sécurité](#sécurité)).

**Statistiques**
- Vues et clics sur les liens du profil, agrégés par jour, réservés au propriétaire du profil.

## Stack technique

- React 18, React Router 7 (`HashRouter`), TypeScript, Vite 8
- Tailwind CSS 4, Motion (animations)
- react-hook-form + zod pour les formulaires et leur validation
- Supabase (base de données Postgres, authentification, RLS)
- oxlint

## Architecture

Deux modes de stockage, au choix via une variable d'environnement :

- **`local`** — un seul profil, dans le `localStorage` du navigateur. Pour développer sans
  réseau, sans rien configurer.
- **`supabase`** — mode multi-utilisateurs, celui utilisé en production.

En mode Supabase, chaque compte a une seule ligne dans `profiles`, avec deux versions du contenu
qui ne sont **jamais synchronisées automatiquement** :

- `data` — le brouillon, modifié en direct depuis `/edit`. Toujours privé (Row Level Security :
  lecture réservée au propriétaire).
- `published_snapshot` — la version publique, créée uniquement au clic sur "Publier" ou "Publier
  les modifications". La route publique `/:slug` ne lit jamais `data` : elle lit la vue
  `public_profiles`, qui n'expose que `published_snapshot` des profils publiés.

Une modification du brouillon reste donc invisible publiquement jusqu'à sa publication explicite.
Chaque écriture du brouillon capture aussi la version précédente dans un historique, consultable
et restaurable depuis l'éditeur.

Un mode de secours sans Supabase existe également : la racine `/` sert un unique profil statique
depuis `public/data.json` (voir `npm run seed`), pour un déploiement à profil unique sans backend.
Ce n'est pas le flux principal du produit.

## Installation et développement local

```bash
npm install
cp .env.example .env
```

Renseigne `.env` :

| Variable | Rôle |
|---|---|
| `VITE_STORAGE_MODE` | `local` (défaut, sans réseau) ou `supabase`. |
| `VITE_SUPABASE_URL` | URL du projet Supabase. Requise seulement en mode `supabase`. |
| `VITE_SUPABASE_ANON_KEY` | Clé publique (anon/publishable) du projet Supabase. Jamais la clé `service_role`. |
| `VITE_TURNSTILE_SITE_KEY` | Optionnelle — clé de site Cloudflare Turnstile pour le CAPTCHA de `/login`. Sans elle, la connexion fonctionne quand même, juste sans CAPTCHA. |

```bash
npm run dev       # serveur de développement
npm run build     # vérification des types + build de production dans dist/
npm run preview   # sert le build de production localement
npm run lint      # oxlint
npm run seed      # régénère public/data.json avec un profil de démonstration
```

En mode `supabase`, le schéma (tables, fonctions, policies RLS) vit dans `supabase/migrations/` —
chaque fichier est commenté et prévu pour être relu puis exécuté manuellement dans l'éditeur SQL
de Supabase, dans l'ordre, aucun n'est appliqué automatiquement.

## Déploiement

Le projet est déployé en parallèle sur deux cibles, toutes deux compatibles grâce au routing en
`HashRouter` (aucune règle de réécriture SPA nécessaire) :

- **Vercel** — `vercel.json` ne fait que fixer un cache long sur les fichiers statiques hashés.
- **GitHub Pages** — via `.github/workflows/deploy.yml`, déclenché à chaque push sur `main`.

Pour qu'un déploiement en mode `supabase` fonctionne, configure aussi côté Supabase
(Authentication → URL Configuration) le "Site URL" et les "Redirect URLs" pour qu'ils
correspondent au(x) domaine(s) réel(s) du déploiement — sans ça, le lien magique de connexion
redirige vers la mauvaise adresse.

## Sécurité

Row Level Security activé sur toutes les tables, accès aux données sensibles exclusivement via
des fonctions dédiées plutôt qu'un accès direct aux tables, et un garde-fou structurel côté base
qui rejette les écritures anormales dans `profiles.data` (payload disproportionné, structure
invalide) — une protection contre un appel direct à l'API qui contournerait la validation côté
client. Pour signaler une vulnérabilité, voir [SECURITY.md](SECURITY.md).

## Licence

Aucune licence n'est déclarée dans ce dépôt.
