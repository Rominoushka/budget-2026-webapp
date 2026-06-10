# Budget 2026 - GitHub Sync chiffré

Remplacer à la racine : index.html, app.css, app.js, service-worker.js, manifest.webmanifest.

Conserver data.js.

Les données sont chiffrées côté iPhone puis écrites dans GitHub dans data/vault.json.

Créer un token GitHub fine-grained avec Repository contents: Read and write, Metadata: Read.

Premier iPhone : créer depuis data.js, modifier, puis Pousser GitHub.
Deuxième iPhone : même mot de passe et mêmes paramètres, puis Charger GitHub.

Si le mot de passe est perdu, les données chiffrées dans GitHub ne sont pas récupérables.
