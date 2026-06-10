# Budget 2026 - Web App

Application web statique issue du tableau de budget.

## Fonctions

- Modification directe des postes budgétaires.
- Ajout / suppression de lignes.
- Affectation libre par type, personne et compte.
- Calcul automatique du prorata Laura / Romain.
- Calcul du besoin net par compte.
- Graphiques intégrés.
- Sauvegarde locale dans le navigateur.
- Export CSV.
- Export / import JSON pour sauvegarder ou transférer le scénario.
- Mode PWA avec manifeste et service worker.

## Lancement local

Depuis le dossier de l'application :

```bash
python3 -m http.server 8080
```

Puis ouvrir :

```text
http://localhost:8080
```

## Déploiement

Cette application est statique. Elle peut être déposée telle quelle sur :

- GitHub Pages
- Netlify
- Vercel
- serveur interne
- NAS
- SharePoint avec hébergement de fichiers statiques si autorisé

## Données

Les données modifiées sont stockées dans le navigateur via `localStorage`.
Pour ne pas perdre un scénario, utiliser `Exporter JSON`.

## Note

Publication par micro-changements.
