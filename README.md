# Linktrea

Portfolio personnel à esthétique financière — un profil professionnel présenté
comme un relevé de portefeuille. 100 % frontend : aucun serveur, aucune base
de données.

Deux modes, deux URLs :

- **`/`** — mode consultation (public). C'est ce que tu partages.
- **`/edit`** — mode éditeur (privé). Formulaire pour saisir tes informations
  et générer le lien à partager.

## Installation

```bash
npm install
```

## Lancement

```bash
npm run dev       # serveur de développement
npm run build     # build de production dans dist/
npm run preview   # sert le build de production localement
npm run seed      # régénère public/data.json avec un profil de démonstration
```

## Persistance — trois canaux

Il n'y a pas de backend, donc pas de base de données. Les données transitent
par trois canaux complémentaires, chacun avec un rôle différent :

1. **`localStorage`** — sauvegarde automatique du brouillon pendant l'édition
   (clé `ledger:draft`, débounce 500 ms). Purement local à ton navigateur :
   si tu vides le cache ou changes d'appareil, le brouillon disparaît.
2. **URL encodée** — dans `/edit`, le bouton "Lien" sérialise ton profil en
   JSON, le compresse (`lz-string`) et produit une URL du type
   `https://<domaine>/#/p/<payload>`. C'est le mécanisme de partage
   principal : toutes les données du profil vivent dans l'URL elle-même, rien
   n'est stocké ailleurs. Un avertissement s'affiche si le lien dépasse
   4000 caractères (certains services le tronqueraient).
3. **Export / Import JSON** — le bouton "Exporter" télécharge
   `linktrea-data.json` ; "Importer" recharge un fichier dans l'éditeur. C'est
   à la fois une sauvegarde de secours et le mécanisme pour figer un profil
   par défaut (voir ci-dessous).

**Ordre de priorité au chargement de `/`** : payload dans l'URL →
`/public/data.json` → état vide (qui renvoie vers `/edit`).

## Figer ton profil pour la production

Par défaut, `/` n'affiche rien tant qu'aucun profil n'est trouvé — pas de
fausses données de démonstration dans le build de production. Pour que ta
page affiche *ton* profil par défaut (sans dépendre d'un lien partagé) :

1. Remplis ton profil dans `/edit`.
2. Clique sur "Exporter" pour télécharger `linktrea-data.json`.
3. Renomme ce fichier en `data.json` et place-le dans `public/`.
4. `npm run build` (ou déploie directement — voir plus bas).

`public/data.json` n'est **jamais committé** (voir `.gitignore`) : chaque
déploiement doit y déposer son propre profil, sinon `/` affiche l'état vide.

## Données de démonstration

`npm run seed` régénère `public/data.json` à partir du profil de référence
(`src/lib/demoProfile.ts`, un exemple réaliste d'analyste financière) — utile
pour voir le site peuplé en développement local. Ce fichier généré reste
ignoré par git ; il ne part jamais dans le dépôt ni dans un déploiement à
moins que tu ne le figes toi-même comme décrit plus haut.

## Déploiement (Vercel)

Le routing (`/`, `/edit`, `/p/:payload`) utilise `HashRouter` : toute la
navigation se fait après le `#`, qui n'est jamais envoyé au serveur. Il n'y a
donc **pas besoin de règle de réécriture SPA** — Vercel sert `index.html` à
la racine par défaut, ce qui suffit pour toutes les routes. Le `vercel.json`
du dépôt ne fait que fixer un cache long sur les fichiers statiques hashés
dans `assets/`.

## Thèmes

Quatre presets (`terminal`, `ledger`, `vault`, `tape`), choisis dans
`/edit` → Apparence. Chacun a sa propre palette (vérifiée WCAG AA), sa paire
typographique et son intensité d'animation — voir `/debug/theme` pour un
aperçu de la palette et de l'échelle typographique de chaque preset.
