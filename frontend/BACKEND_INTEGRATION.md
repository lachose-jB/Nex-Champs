# Frontend Backend Integration Guide

## Overview

Le frontend a été réorganisé pour utiliser directement l'API backend FastAPI au lieu d'un serveur Node.js intégré (tRPC).

## Architecture

### API Client (`client/src/lib/api.ts`)

Un client API centralisé qui gère toutes les communications avec le backend:

```typescript
import { api } from '@/lib/api';

// Authentication
await api.auth.login(username, password);
await api.auth.getCurrentUser();
await api.auth.logout();

// Meetings
await api.meetings.create({ name, description });
await api.meetings.list();
await api.meetings.getById(meetingId);

// Tokens
await api.tokens.claim(meetingId, participantId);
await api.tokens.release(meetingId, participantId);
await api.tokens.getEvents(meetingId);

// Phases
await api.phases.change(meetingId, phaseName, startedBy);

// Annotations
await api.annotations.create(meetingId, data);
await api.annotations.list(meetingId);

// Decisions
await api.decisions.create(meetingId, data);
await api.decisions.list(meetingId);

// Statistics
await api.stats.getStats(meetingId);
await api.stats.getAudit(meetingId);
```

### React Hooks (`client/src/lib/hooks.ts`)

Des hooks React Query personnalisés pour les opérations courantes:

```typescript
import { 
  useMeetings, 
  useCreateMeeting,
  useTokenEvents,
  useClaimToken,
  useReleaseToken,
  useChangePhase,
  useAnnotations,
  useCreateAnnotation,
  useDecisions,
  useCreateDecision,
  useMeetingStats,
  useAuditTrail
} from '@/lib/hooks';

// Usage in components
const { data: meetings, isLoading } = useMeetings();
const createMeeting = useCreateMeeting();

const handleCreate = async (name, description) => {
  const meeting = await createMeeting.mutateAsync({ name, description });
  // ...
};
```

### Authentication Hook (`client/src/_core/hooks/useAuth.ts`)

```typescript
import { useAuth } from '@/_core/hooks/useAuth';

export function MyComponent() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  if (!isAuthenticated) return <div>Not logged in</div>;
  
  return <div>Welcome {user?.username}</div>;
}
```

## Configuration

### Environment Variables

Assurez-vous que votre `.env` est configuré correctement:

```env
VITE_OAUTH_PORTAL_URL="http://localhost:8000/api/v1"
OAUTH_SERVER_URL="http://localhost:8000"
```

### API Base URL

L'URL de base du backend est définie dans `client/src/lib/api.ts`:

```typescript
const API_BASE_URL = 'http://localhost:8000/api/v1';
```

Vous pouvez la modifier pour votre environnement (production, staging, etc.).

## Workflow

### 1. Authentication

```typescript
const { user, isAuthenticated } = useAuth();

if (!isAuthenticated) {
  // Redirect to login
}
```

### 2. Create Meeting

```typescript
const createMeeting = useCreateMeeting();

await createMeeting.mutateAsync({
  name: "Meeting Title",
  description: "Optional description"
});
```

### 3. Join Meeting & Manage Tokens

```typescript
const { data: meeting } = useMeetingById(meetingId);
const { data: tokenEvents } = useTokenEvents(meetingId);
const claimToken = useClaimToken(meetingId);

await claimToken.mutateAsync(userId);
```

### 4. Save Annotations

```typescript
const createAnnotation = useCreateAnnotation(meetingId);

await createAnnotation.mutateAsync({
  participant_id: userId,
  annotation_type: 'text',
  content: JSON.stringify({ text: 'annotation' }),
  timestamp_ms: Date.now()
});
```

## Error Handling

L'API client lance des `ApiError` en cas d'erreur:

```typescript
import { api, ApiError } from '@/lib/api';

try {
  const user = await api.auth.getCurrentUser();
} catch (err) {
  if (err instanceof ApiError) {
    if (err.statusCode === 401) {
      // Unauthorized - redirect to login
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    } else {
      console.error('API Error:', err.message);
    }
  }
}
```

## Token Management

Le token JWT est sauvegardé dans `localStorage` avec la clé `auth_token`.

Lors de chaque requête API, le token est automatiquement ajouté à l'en-tête `Authorization`:

```
Authorization: Bearer <token>
```

## Running the Frontend

```bash
cd frontend
pnpm install
pnpm dev
```

L'application sera disponible sur `http://localhost:5173` (ou un autre port si celui-ci est occupé).

## Removed Components

Le dossier `server/` a été supprimé car il n'est plus nécessaire. Tous les appels tRPC ont été remplacés par des appels directs à l'API backend.

## Next Steps

1. **Tester l'authentification**: Assurez-vous que le login fonctionne avec votre backend
2. **Tester les meetings**: Créez, listez et récupérez des meetings
3. **Tester le token engine**: Testez le claim/release de tokens
4. **WebRTC Signaling**: Mettez à jour le WebRTC signaling pour utiliser votre backend
5. **Notifications**: Implémentez les notifications en temps réel via WebSocket (optionnel)

## API Documentation

Pour une documentation interactive de l'API backend, visitez:
- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

Voir `api_test_guide.md` dans la racine du projet pour des exemples d'utilisation complets.
