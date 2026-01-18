# Orchestra-sec - Guide d'Installation Local

## 📋 Prérequis

- **Node.js** : v18+ (https://nodejs.org/)
- **pnpm** : v10+ (https://pnpm.io/)
- **MySQL/TiDB** : Base de données compatible MySQL
- **Git** (optionnel, pour le contrôle de version)

## 🚀 Installation

### 1. Extraire le projet

```bash
tar -xzf orchestra-sec-export.tar.gz
cd orchestra-sec
```

### 2. Installer les dépendances

```bash
pnpm install
```

### 3. Configurer les variables d'environnement

Créez un fichier `.env.local` à la racine du projet :

```env
# Base de données
DATABASE_URL="mysql://user:password@localhost:3306/orchestra_sec"

# OAuth Manus (remplacer par vos credentials)
VITE_APP_ID="your-app-id"
OAUTH_SERVER_URL="https://api.manus.im"
VITE_OAUTH_PORTAL_URL="https://auth.manus.im"

# Secrets
JWT_SECRET="your-secret-key-min-32-chars"

# Propriétaire
OWNER_NAME="Your Name"
OWNER_OPEN_ID="your-open-id"

# APIs Manus
BUILT_IN_FORGE_API_URL="https://api.manus.im"
BUILT_IN_FORGE_API_KEY="your-api-key"
VITE_FRONTEND_FORGE_API_URL="https://api.manus.im"
VITE_FRONTEND_FORGE_API_KEY="your-frontend-api-key"

# Analytics (optionnel)
VITE_ANALYTICS_ENDPOINT="https://analytics.example.com"
VITE_ANALYTICS_WEBSITE_ID="your-website-id"
```

### 4. Initialiser la base de données

```bash
# Générer les migrations
pnpm drizzle-kit generate

# Appliquer les migrations
pnpm drizzle-kit migrate
```

### 5. Démarrer le serveur de développement

```bash
pnpm dev
```

Le serveur sera disponible à : `http://localhost:3000`

## 📦 Structure du Projet

```
orchestra-sec/
├── client/                    # Frontend React
│   ├── src/
│   │   ├── pages/            # Pages principales
│   │   ├── components/       # Composants réutilisables
│   │   ├── contexts/         # Contextes React (Language, Theme)
│   │   ├── hooks/            # Hooks personnalisés
│   │   ├── locales/          # Traductions (FR/EN)
│   │   ├── lib/              # Utilitaires
│   │   └── App.tsx           # Routeur principal
│   └── public/               # Assets statiques
├── server/                    # Backend Express + tRPC
│   ├── _core/                # Framework core
│   ├── routers.ts            # Procédures tRPC
│   ├── db.ts                 # Requêtes base de données
│   ├── token-engine.ts       # Token Engine
│   ├── security.ts           # Audit & logging
│   ├── encryption.ts         # Chiffrement AES-256
│   └── totp.ts               # Authentification 2FA
├── drizzle/                  # Schéma & migrations
├── shared/                   # Code partagé
└── package.json              # Dépendances
```

## 🔑 Fonctionnalités Principales

### 1. **Système de Token d'Expression**
- Gestion équitable de la parole avec RBAC
- File d'attente et limites de temps
- Traçabilité complète des actions

### 2. **4 Phases Structurées**
- Idéation : génération d'idées
- Clarification : analyse et questions
- Décision : vote/choix formel
- Feedback : retour et amélioration

### 3. **Canvas Collaboratif Temps Réel**
- Synchronisation WebRTC entre participants
- Annotations avec traçabilité complète
- Historique des modifications

### 4. **Capture Vidéo/Audio**
- Enregistrement du détenteur du Token
- Capture du Canvas
- Export annoté en MP4 avec ffmpeg.wasm

### 5. **Sécurité Complète**
- Chiffrement AES-256 des données
- Authentification 2FA (TOTP)
- Audit immuable de toutes les actions
- Conformité GDPR (export, suppression, anonymisation)

### 6. **Support Bilingue**
- Interface entièrement traduite (FR/EN)
- Changement de langue en temps réel
- Traductions des messages d'erreur

## 🧪 Tests

Exécuter les tests unitaires :

```bash
pnpm test
```

Vérifier les erreurs TypeScript :

```bash
pnpm check
```

## 🏗️ Build pour la Production

```bash
pnpm build
pnpm start
```

## 📚 Documentation des APIs

### Procédures tRPC Principales

#### Gestion des Réunions
- `meeting.create` : Créer une nouvelle réunion
- `meeting.list` : Lister les réunions
- `meeting.get` : Récupérer les détails d'une réunion
- `meeting.updatePhase` : Changer la phase

#### Token Engine
- `token.assign` : Assigner le Token à un participant
- `token.pass` : Passer le Token au suivant
- `token.release` : Libérer le Token
- `token.getStatus` : Obtenir le statut du Token

#### Canvas Collaboratif
- `canvas.saveOperation` : Sauvegarder une opération d'annotation
- `canvas.getOperations` : Récupérer l'historique
- `canvas.reconstructState` : Reconstruire l'état complet

#### Statistiques & Audit
- `stats.getEquityMetrics` : Obtenir les métriques d'équité
- `stats.getParticipantStats` : Statistiques par participant
- `audit.getLogs` : Récupérer les logs d'audit

#### Sécurité
- `auth.me` : Obtenir l'utilisateur courant
- `auth.logout` : Se déconnecter
- `security.enableTwoFactor` : Activer 2FA
- `security.verifyTwoFactor` : Vérifier un code TOTP

## 🔐 Configuration OAuth

Pour utiliser l'authentification OAuth, vous devez :

1. Créer une application sur la plateforme Manus
2. Obtenir votre `VITE_APP_ID`
3. Configurer les URLs de redirection
4. Ajouter les credentials dans `.env.local`

## 🐛 Troubleshooting

### Erreur de connexion à la base de données
```bash
# Vérifier que MySQL est en cours d'exécution
# Vérifier la chaîne DATABASE_URL dans .env.local
# Vérifier les permissions de l'utilisateur MySQL
```

### Erreur de port 3000 déjà utilisé
```bash
# Changer le port dans server/_core/index.ts
# Ou tuer le processus : lsof -ti:3000 | xargs kill -9
```

### Erreur d'import de modules
```bash
# Réinstaller les dépendances
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

## 📞 Support

Pour toute question ou problème, consultez :
- Documentation : `/docs`
- Issues : Créer une issue sur GitHub
- Email : support@orchestra-sec.com

## 📄 Licence

MIT License - Voir LICENSE.md

---

**Version** : 0ad13208  
**Dernière mise à jour** : 18 Janvier 2026
