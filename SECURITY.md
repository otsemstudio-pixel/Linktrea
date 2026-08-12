# Politique de sécurité

## Signaler une vulnérabilité

Si tu découvres une faille de sécurité dans ce projet, merci de la signaler de manière
responsable par email à **otsemstudio@gmail.com**, plutôt que de l'exploiter, la divulguer
publiquement ou la partager ailleurs.

Merci d'inclure autant de détails que possible : les étapes pour reproduire, l'impact estimé, et
si possible une preuve de concept minimale et non destructive.

## Ce qu'il ne faut pas faire

- Ne divulgue pas publiquement une vulnérabilité (issue GitHub, réseaux sociaux, forum...) avant
  qu'elle soit corrigée.
- Ne teste jamais sur des comptes ou des données appartenant à d'autres utilisateurs réels du
  service déployé — utilise un compte de test que tu contrôles toi-même.
- Ne mène aucune action destructive (suppression de données, déni de service, spam...) pour
  démontrer une faille : une preuve de concept non destructive suffit toujours.

## Délai de réponse

Ceci est un projet personnel, pas un produit avec une équipe de sécurité dédiée — attends-toi à
une réponse sous 5 à 7 jours, pas à un SLA de niveau entreprise. Je ferai de mon mieux pour
accuser réception rapidement et te tenir informé de l'avancement d'une éventuelle correction.

## Périmètre

Cette politique couvre :

- Le code de ce dépôt (frontend React/Vite).
- L'infrastructure Supabase associée (base de données, authentification, fonctions, policies
  RLS).
- Le déploiement Vercel associé.

Les rapports concernant des dépendances tierces (paquets npm, Supabase ou Vercel en tant que
plateformes, etc.) sont hors périmètre ici et doivent plutôt être signalés directement à leurs
mainteneurs respectifs.
