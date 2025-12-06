# Spécification MVP — Application de gestion de tontines

Ce document rassemble les user stories prioritaires, les exigences fonctionnelles et non-fonctionnelles, et un modèle de données initial pour lancer un MVP.

## Objectif
Permettre à des groupes (tontines) de gérer leurs cotisations, tours et paiements de façon simple, fiable et traçable, avec possibilité d'intégrer des paiements mobile (Orange Money / Wave) ultérieurement.

## Utilisateurs et rôles
- Admin (créateur du groupe) : gérer groupe, ajouter/supprimer membres, démarrer le cycle, valider paiements, exporter données.
- Membre : consulter son statut, marquer un paiement (ou recevoir confirmation), recevoir rappel.

## Priorités MVP (Must have)
1. Gestion de groupes : création, modification, suppression.
2. Gestion des membres : ajout, suppression, liste.
3. Définition du montant de cotisation et fréquence du tour.
4. Logique de cycle : ordre des bénéficiaires, avancement du tour, shuffle.
5. Enregistrement des paiements pour chaque membre (simulé / manuel).
6. Historique des paiements et export/import JSON.
7. Simple interface web responsive (mobile-first).

## User stories (priorisées)
- En tant qu'Admin, je peux créer un groupe et définir le montant de la cotisation.
- En tant qu'Admin, je peux ajouter et supprimer des membres du groupe.
- En tant qu'Admin, je peux démarrer un cycle et voir l'ordre des bénéficiaires.
- En tant qu'Admin, je peux marquer un membre comme payeur pour un tour donné.
- En tant que Membre, je peux voir la liste des membres et savoir qui est bénéficiaire prochain.
- En tant qu'Admin, je peux exporter les données du groupe (JSON) pour sauvegarde.
- En tant qu'Admin, je peux importer des données JSON pour restaurer un groupe.

## Exigences non-fonctionnelles
- Données persistantes (DB) : robustesse et sauvegarde (pour MVP local, SQLite ou Firebase).
- Sécurité : stockage sécurisé des identifiants et permissions (prochaine itération).
- Scalabilité : architecture simple pouvant évoluer (API REST + DB relationnelle ou NoSQL).
- Localisation (FR/EN) : interface en français par défaut.

## Modèle de données (entités principales)
- Groupe
  - id (UUID)
  - name
  - createdAt
  - contribution (decimal)
  - frequency (enum: weekly, monthly, custom)
  - cycle (relation vers Cycle)

- Membre
  - id
  - groupId
  - name
  - contact (phone/email)
  - joinedAt

- Cycle
  - id
  - groupId
  - order (array de memberId)
  - index (entier, position actuelle)
  - startedAt
  - frequency

- Paiement
  - id
  - groupId
  - memberId
  - amount
  - date
  - round (tour number)
  - status (pending, confirmed, failed)
  - externalReference (optionnel pour paiements réels)

- Rappel (optionnel)
  - id
  - groupId
  - memberId
  - dueDate
  - sentAt
  - channel (sms, whatsapp, push)

## API endpoints (proposition pour MVP)
- Groups
  - GET /groups
  - POST /groups
  - GET /groups/:id
  - PUT /groups/:id
  - DELETE /groups/:id

- Members
  - POST /groups/:id/members
  - PUT /groups/:id/members/:memberId
  - DELETE /groups/:id/members/:memberId

- Cycle
  - POST /groups/:id/cycle/start
  - POST /groups/:id/cycle/shuffle
  - POST /groups/:id/cycle/advance
  - GET /groups/:id/cycle

- Payments
  - POST /groups/:id/payments
  - GET /groups/:id/payments
  - POST /payments/webhook (pour intégration prestataire)

- Import / Export
  - GET /groups/:id/export
  - POST /groups/import

## Intégration Paiement & Notifications (notes)
- Orange Money / Wave : nécessitent contrat commercial et clés API; pour MVP utiliser un simulateur et préparer webhooks pour confirmations.
- Notifications : Twilio / Africa's Talking / services opérateurs locaux pour SMS/WhatsApp. Commencer par une abstraction de service et un simulateur.

## Priorisation technique (sprint 1)
1. API CRUD Groups/Members (Node.js + SQLite ou Firebase).
2. Pages UI : dashboard groupe, membres, cycle, paiement.
3. Import/Export JSON.
4. Tests unitaires basiques + validations.

## Risques et mitigations
- Paiements réels : gestion des litiges, réconciliations — prévoir réconciliation via webhook et référence externe.
- Confidentialité : chiffrer données sensibles et suivre réglementation locale.

## Annexes — Checklist de lancement
- [ ] Authentification basique (email/phone) + rôle admin
- [ ] Persistance multi-utilisateurs
- [ ] Webhooks pour paiements
- [ ] Documentation pour intégration opérateurs de paiement

---
Pour la suite, je peux :
- Scaffold une API Node.js + SQLite et implémenter endpoints CRUD.
- Prototyper une intégration simulée Orange Money (webhook + confirmation).
- Préparer maquettes plus détaillées (Figma/HTML) pour mobile.

Dites quelle action vous préférez que je lance ensuite.
