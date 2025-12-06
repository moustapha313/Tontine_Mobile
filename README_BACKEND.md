# Backend minimal — Instructions

Ce backend est un prototype Express + SQLite pour tester les endpoints CRUD, la simulation de paiement et une authentification simple par token JWT.

Prérequis
- Node.js (14+ recommandé)
- npm

Installation et exécution

Ouvrez PowerShell dans le dossier du projet et lancez :

```powershell
npm install
npm run migrate
npm start
```

- `npm run migrate` crée la base SQLite `./data/tontine.db` et les tables.
- `npm start` démarre le serveur sur le port `3000` (ou `PORT` si défini).

Endpoints importants
- `POST /auth/signup` {name,email,phone,password,role}
- `POST /auth/login` {email,password}
- `POST /groups` (Authorization: Bearer <token>)
- `GET /groups`
- `POST /groups/:id/members` etc.
- `POST /groups/:id/payments` (enregistrer paiement)
- `POST /payments/webhook` (simulateur d'événement externe)

Notes
- Pour le prototype l'authentification est simplifiée : pas d'OTP SMS réel.
- JWT secret par défaut est `dev-secret-change-me`; changez-le via `.env` en production.

Exemples rapides (PowerShell + curl)

Créer un utilisateur :
```powershell
curl -X POST http://localhost:3000/auth/signup -H "Content-Type: application/json" -d '{"name":"Admin","email":"admin@example.com","password":"pass"}'
```

Se connecter :
```powershell
curl -X POST http://localhost:3000/auth/login -H "Content-Type: application/json" -d '{"email":"admin@example.com","password":"pass"}'
```

Créer un groupe (passez le token reçu dans Authorization header) :
```powershell
curl -X POST http://localhost:3000/groups -H "Content-Type: application/json" -H "Authorization: Bearer <token>" -d '{"name":"Tontine Famille","contribution":5000}'
```

Tester webhook simulateur :
```powershell
curl -X POST http://localhost:3000/payments/webhook -H "Content-Type: application/json" -d '{"external_ref":"tx123","group_id":"<groupId>","member_id":"<memberId>","amount":5000,"status":"confirmed"}'
```

Prochaines étapes proposées
- Validation des permissions (seuls admins peuvent supprimer groupes / membres)
- Endpoints pour la gestion avancée des cycles (shuffle, frequency scheduler)
- Intégration réelle Orange Money / Wave via prestataire

