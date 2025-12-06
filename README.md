# Tontine — Prototype

Prototype interactif pour gestion de tontines (démonstration locale).

## But
Ce dépôt contient un prototype frontend minimal (HTML/CSS/JS) pour gérer des groupes de tontine : création de groupes, ajout de membres, démarrage d'un cycle, enregistrement simulé des paiements, et historique. Il vise à valider l'UX et les règles métiers avant d'implémenter un backend et des intégrations de paiement.

## Fichiers
- `index.html` : prototype interactif (stockage local via `localStorage`).
- `README.md` : ce fichier.
- `MVP_SPEC.md` : spécification MVP et user stories.

## Fonctionnalités disponibles
- Créer / sélectionner un groupe
- Ajouter / supprimer des membres
- Définir le montant de la cotisation
- Démarrer un cycle (ordre d'attribution des tours)
- Mélanger l'ordre des bénéficiaires
- Enregistrer des paiements simulés
- Avancer manuellement au tour suivant
- Historique des paiements
- Import / Export JSON des données

## Limitations
- Interface locale uniquement : pas de backend, ni d'authentification.
- Pas d'intégration réelle Orange Money / Wave — paiements simulés.
- Pas de notifications (SMS / WhatsApp) implémentées.

## Tester localement
Double-cliquez sur `index.html` pour l'ouvrir dans votre navigateur, ou utilisez PowerShell pour démarrer le fichier :

```powershell
Start-Process .\index.html
```

Si vous préférez servir le prototype via un petit serveur HTTP (option utile pour certaines extensions navigateur) :

```powershell
# avec Python 3 (ligne unique)
python -m http.server 8000
# puis ouvrez http://localhost:8000/index.html
```

## Scénarios de test rapides
1. Créez un groupe (ex: "Tontine Famille").
2. Ajoutez 3-6 membres.
3. Définissez un montant de cotisation.
4. Démarrez le cycle et vérifiez que le bénéficiaire s'affiche.
5. Simulez un paiement via le sélecteur puis enregistrez-le.
6. Avancez au tour suivant et observez l'historique.
7. Exportez les données (JSON) puis importez-les dans une autre instance.

## Prochaines étapes recommandées
- Ajouter une API backend (Node/Express + SQLite ou Firebase) pour persistance multi-utilisateurs.
- Authentification et gestion des rôles (admin / membre).
- Intégration Orange Money / Wave via prestataire ou API directe.
- Notifications (SMS/WhatsApp) pour rappels de paiement.

## Captures d'écran
Placez des captures dans un dossier `./screenshots` et référencez-les ici si nécessaire.

---
Prototype fourni pour évaluation et tests UX. Pour aller plus loin, demandez l'intégration backend ou la priorisation des user stories.
