# {{title}}

App écrite avec [`@colinsavenue/alula`](https://www.npmjs.com/package/@colinsavenue/alula) : une API façon Flutter en React, rendue en site Next.js et en app Expo.

**Avant d'écrire du code, lis `node_modules/@colinsavenue/alula/AGENTS.md`.** Ce fichier explique comment écrire les widgets, les pages, la navigation et l'état. Il est livré avec le paquet, donc toujours à jour pour la version installée.

## Ce projet

- Point d'entrée : `lib/main.tsx`.
- Pages : `lib/pages/` (une classe exportée avec `static route`).
- Ne modifie jamais `.alula/` ni `.alula-native/` : ils sont générés.
- Vérifier : `npm run typecheck`, puis `npm run dev`.

<!-- Ajoute ici les conventions propres à ton projet. -->
