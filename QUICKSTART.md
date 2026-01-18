# 🚀 Guide de Démarrage Rapide

## En 5 Minutes

### Terminal 1: Démarrer le Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

**Résultat attendu**:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
```

### Terminal 2: Démarrer le Frontend
```bash
cd frontend
pnpm install
pnpm dev
```

**Résultat attendu**:
```
  ➜  Local:   http://localhost:5173/
```

### Ouvrir l'Application
Allez à http://localhost:5173/

### Identifiants de Test
```
Nom d'utilisateur: admin
Mot de passe: secret
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Frontend (Vite)                      │
│            http://localhost:5173                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │ React Components + React Query + React Router   │    │
│  │ (Login, Dashboard, Home, MeetingRoom, etc.)     │    │
│  └──────────────────┬──────────────────────────────┘    │
└─────────────────────┼──────────────────────────────────┘
                      │ HTTP API Calls
                      │ (Bearer Token Auth)
                      ▼
┌─────────────────────────────────────────────────────────┐
│                  Backend (FastAPI)                       │
│            http://localhost:8000/api/v1                 │
│  ┌─────────────────────────────────────────────────┐    │
│  │ Auth | Meetings | Tokens | Phases | Annotations │    │
│  │ Decisions | Stats | Audit                       │    │
│  └──────────────────┬──────────────────────────────┘    │
│                     │                                    │
│  ┌──────────────────▼──────────────────────────────┐    │
│  │ Database (PostgreSQL)                           │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

---

## Structure des Dossiers

```
Orchestra-sec/
├── backend/                              # API FastAPI
│   ├── main.py                          # Point d'entrée
│   ├── requirements.txt                 # Dépendances Python
│   ├── api/                             # Routes API
│   │   ├── auth.py                     # Auth endpoints
│   │   ├── meetings.py                 # Meeting endpoints
│   │   ├── tokens.py                   # Token endpoints
│   │   └── ...
│   ├── models/                          # Models ORM
│   └── utils/                           # Utilitaires
│
└── frontend/                             # Application React
    ├── client/                          # Code source React
    │   ├── src/
    │   │   ├── lib/
    │   │   │   ├── api.ts              # Client HTTP centralisé
    │   │   │   └── hooks.ts            # Hooks React Query
    │   │   ├── pages/
    │   │   │   ├── Login.tsx
    │   │   │   ├── Dashboard.tsx
    │   │   │   ├── Home.tsx
    │   │   │   ├── MeetingRoom.tsx
    │   │   │   └── ...
    │   │   ├── components/             # Composants React
    │   │   ├── _core/
    │   │   │   └── hooks/
    │   │   │       └── useAuth.ts     # Hook authentification
    │   │   └── main.tsx               # Entry point
    │   └── index.html
    ├── .env                             # Configuration
    ├── package.json                     # Dépendances Node
    └── vite.config.ts                  # Config Vite
```

---

## Points Clés

### 🔐 Authentification
- **Token**: JWT stocké dans `localStorage['auth_token']`
- **Envoi**: Header `Authorization: Bearer <token>` sur chaque requête
- **Expiration**: Si 401, le frontend redirige vers Login

### 🌐 Client API
Le fichier `/frontend/client/src/lib/api.ts` expose tous les endpoints:

```typescript
// Authentification
api.auth.login(username, password)
api.auth.getCurrentUser()
api.auth.logout()

// Réunions
api.meetings.list()
api.meetings.getById(id)
api.meetings.create({name, description})
api.meetings.update(id, data)
api.meetings.delete(id)

// Jetons
api.tokens.claim(meetingId, participantId)
api.tokens.release(meetingId, participantId)
api.tokens.getEvents(meetingId)

// ... et bien d'autres
```

### ⚡ React Query
Les hooks exposent les opérations React Query:

```typescript
// Queries (récupération de données)
const { data: meetings } = useMeetings()
const { data: meeting } = useMeetingById(id)
const { data: tokenEvents } = useTokenEvents(id)

// Mutations (modifications)
const createMeeting = useCreateMeeting()
createMeeting.mutate({name, description})

const claimToken = useClaimToken(meetingId)
claimToken.mutate(participantId)
```

---

## Développement

### Ajouter une Nouvelle Page

1. **Créer le composant** dans `/frontend/client/src/pages/NewPage.tsx`
2. **Ajouter la route** dans `/frontend/client/src/App.tsx`
3. **Utiliser les hooks API** depuis `@/lib/hooks`

```typescript
import { useMeetings } from '@/lib/hooks'

export default function NewPage() {
  const { data: meetings, isLoading, error } = useMeetings()
  
  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>
  
  return (
    <div>
      {meetings?.map(m => <div key={m.id}>{m.name}</div>)}
    </div>
  )
}
```

### Ajouter un Nouvel Endpoint Backend

1. **Créer la route** dans `/backend/api/new_module.py`
2. **Ajouter le modèle** dans `/backend/models/new_model.py`
3. **Exporter dans l'API client**:

```typescript
// /frontend/client/src/lib/api.ts
export const newModuleAPI = {
  getAll: async (): Promise<Data[]> => {
    return apiCall<Data[]>('/new_module')
  },
  
  create: async (data: DataInput): Promise<Data> => {
    return apiCall<Data>('/new_module', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },
}

// Dans api.ts
export const api = {
  // ... auth, meetings, etc
  newModule: newModuleAPI,
}
```

4. **Créer le hook**:

```typescript
// /frontend/client/src/lib/hooks.ts
export function useNewModule() {
  return useQuery({
    queryKey: ['newModule'],
    queryFn: () => api.newModule.getAll(),
  })
}
```

---

## Dépannage

### Le frontend ne se connecte pas au backend
- ✅ Vérifiez que le backend est en cours d'exécution sur `http://localhost:8000`
- ✅ Vérifiez `.env` a `VITE_OAUTH_PORTAL_URL=http://localhost:8000/api/v1`
- ✅ Consultez la console du navigateur pour les erreurs CORS

### Les erreurs TypeScript après modifications
```bash
cd frontend
npx tsc --noEmit
```

### Les dépendances ne sont pas installées
```bash
cd frontend
pnpm install
```

### Le token n'est pas envoyé
- Vérifiez que le token est stocké: `localStorage.getItem('auth_token')`
- Vérifiez le header Authorization dans Network tab

---

## Conversion de tRPC à API Client

### Avant (tRPC)
```typescript
const meetings = trpc.meetings.list.useQuery()
const createMeeting = trpc.meetings.create.useMutation()
```

### Après (API Client + React Query)
```typescript
const meetings = useMeetings()
const createMeeting = useCreateMeeting()
```

Les hooks automatiquement:
- ✅ Gèrent le chargement et les erreurs
- ✅ Ajoutent le token d'authentification
- ✅ Mettent en cache les données
- ✅ Rafraîchissent automatiquement

---

## Ressources

- 📖 [Documentation d'Intégration](./INTEGRATION_COMPLETE.md)
- 🔗 [API Backend Swagger](http://localhost:8000/docs) (backend en cours d'exécution)
- 📋 [Guide de Test API](./backend/api_test_guide.md)
- ⚙️ [Config Vite](./frontend/vite.config.ts)
- 📦 [Dépendances Frontend](./frontend/package.json)

---

## Questions Fréquentes

**Q: Où est stocké le token?**
A: Dans `localStorage['auth_token']`

**Q: Comment faire une requête authentifiée?**
A: Le client API ajoute automatiquement le header `Authorization: Bearer <token>`

**Q: Où est le serveur Express/tRPC?**
A: Supprimé! Le frontend appelle maintenant directement le backend FastAPI via HTTP.

**Q: Comment changer l'URL du backend?**
A: Modifiez `VITE_OAUTH_PORTAL_URL` dans `.env`

**Q: Comment déboguer les appels API?**
A: Ouvrez les DevTools → Network tab → filtrez par les requêtes `/api`

---

**Bon développement! 🎉**
