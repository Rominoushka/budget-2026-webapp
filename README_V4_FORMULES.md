# Budget 2026 — V4 formules éditables

Cette version corrige trois points :

1. Stabilisation du menu bas iPhone.
2. Connexion simplifiée avec bouton `Démarrer`.
3. Intégration des formules issues du fichier Excel dans les lignes du budget.

## Fichiers à déposer à la racine

- `index.html`
- `app.css`
- `app.js`
- `data.js`
- `service-worker.js`
- `manifest.webmanifest`

## Formules

Les lignes calculées importées depuis l’Excel possèdent maintenant :

- `formula`
- `formulaOriginalExcel`
- `variables`

Dans l’application, ouvre une ligne puis modifie :

- la formule mensuelle ;
- les variables JSON.

Exemples de formules utilisables :

```js
(brutAnnuel/12)*0.75*(1-(0.75/100))-18*9*(40/100)-110
ligne("Salaire Romain (net sans 13ème mois / avant impots)")*tauxImpots
598+4*4.21*4.5
5000/12
```

Fonctions disponibles :

- `ligne("libellé")`
- `max(a,b)`
- `min(a,b)`
- `round(x,d)`
- `mround(x,m)`

Source Excel : `budget_2026_flux_equitable_corrige.xlsx`

Lignes importées : 58

Lignes avec formule : 14
