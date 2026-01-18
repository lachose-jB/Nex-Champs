# API Frontend - Guide d'Utilisation

Ce document décrit le client API centralisé (`lib/api.ts`) et comment l'utiliser dans les composants.

## Table des Matières

1. [Configuration](#configuration)
2. [Authentication API](#authentication-api)
3. [Meetings API](#meetings-api)
4. [Tokens API](#tokens-api)
5. [Phases API](#phases-api)
6. [Annotations API](#annotations-api)
7. [Decisions API](#decisions-api)
8. [Statistics API](#statistics-api)
9. [Gestion des Erreurs](#gestion-des-erreurs)
10. [Exemples Complets](#exemples-complets)

---

## Configuration

### Client API

Le client API est défini dans `/frontend/client/src/lib/api.ts`.

**Configuration de base**:
```typescript
const API_BASE_URL = import.meta.env.VITE_OAUTH_PORTAL_URL || 'http://localhost:8000/api/v1'

// Les tokens sont automatiquement ajoutés au header Authorization
const token = localStorage.getItem('auth_token')
if (token) {
  headers['Authorization'] = `Bearer ${token}`
}
```

### Variables d'Environnement

Dans `/frontend/.env`:
```env
VITE_OAUTH_PORTAL_URL=http://localhost:8000/api/v1
OAUTH_SERVER_URL=http://localhost:8000
```

---

## Authentication API

### Types

```typescript
interface User {
  id: number
  username: string
  email: string
  role: string
  created_at: string
  updated_at: string
}

interface LoginResponse {
  access_token: string
  token_type: string
  user: User
}
```

### Endpoints

#### Login
```typescript
api.auth.login(username: string, password: string): Promise<LoginResponse>
```

**Utilisation**:
```typescript
const response = await api.auth.login('admin', 'secret')
localStorage.setItem('auth_token', response.access_token)
```

#### Obtenir l'utilisateur actuel
```typescript
api.auth.getCurrentUser(): Promise<User>
```

**Utilisation**:
```typescript
const user = await api.auth.getCurrentUser()
console.log(user.username) // "admin"
```

#### Logout
```typescript
api.auth.logout(): Promise<void>
```

**Utilisation**:
```typescript
await api.auth.logout()
localStorage.removeItem('auth_token')
```

### Hook React Query

```typescript
import { useAuth } from '@/_core/hooks/useAuth'

export function MyComponent() {
  const { user, isLoading, error, logout } = useAuth()
  
  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>
  if (!user) return <LoginPage />
  
  return (
    <div>
      <h1>Welcome, {user.username}</h1>
      <button onClick={logout}>Logout</button>
    </div>
  )
}
```

---

## Meetings API

### Types

```typescript
interface Meeting {
  id: number
  name: string
  description?: string
  created_by: number
  created_at: string
  updated_at: string
}

interface CreateMeetingInput {
  name: string
  description?: string
}
```

### Endpoints

#### Lister les réunions
```typescript
api.meetings.list(): Promise<Meeting[]>
```

**Utilisation directe**:
```typescript
const meetings = await api.meetings.list()
```

**Via Hook**:
```typescript
import { useMeetings } from '@/lib/hooks'

export function MeetingsList() {
  const { data: meetings, isLoading } = useMeetings()
  
  return (
    <div>
      {meetings?.map(m => (
        <div key={m.id}>{m.name}</div>
      ))}
    </div>
  )
}
```

#### Obtenir une réunion
```typescript
api.meetings.getById(meetingId: number): Promise<Meeting>
```

**Utilisation directe**:
```typescript
const meeting = await api.meetings.getById(1)
```

**Via Hook**:
```typescript
import { useMeetingById } from '@/lib/hooks'

export function MeetingDetail({ meetingId }: Props) {
  const { data: meeting, isLoading } = useMeetingById(meetingId)
  
  return <div>{meeting?.name}</div>
}
```

#### Créer une réunion
```typescript
api.meetings.create(data: CreateMeetingInput): Promise<Meeting>
```

**Utilisation directe**:
```typescript
const meeting = await api.meetings.create({
  name: 'Mon meeting',
  description: 'Description du meeting'
})
```

**Via Hook**:
```typescript
import { useCreateMeeting } from '@/lib/hooks'

export function CreateMeetingForm() {
  const createMeeting = useCreateMeeting()
  
  const handleSubmit = async (formData) => {
    try {
      await createMeeting.mutateAsync(formData)
      // Succès
    } catch (error) {
      // Erreur
    }
  }
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <button disabled={createMeeting.isPending}>
        {createMeeting.isPending ? 'Creating...' : 'Create'}
      </button>
    </form>
  )
}
```

#### Mettre à jour une réunion
```typescript
api.meetings.update(meetingId: number, data: Partial<CreateMeetingInput>): Promise<Meeting>
```

**Utilisation**:
```typescript
const updated = await api.meetings.update(1, {
  name: 'Updated Name'
})
```

#### Supprimer une réunion
```typescript
api.meetings.delete(meetingId: number): Promise<void>
```

**Utilisation**:
```typescript
await api.meetings.delete(1)
```

---

## Tokens API

### Types

```typescript
interface TokenEvent {
  id: number
  meeting_id: number
  participant_id: number
  event_type: 'claim' | 'release'
  timestamp?: string
}
```

### Endpoints

#### Réclamer le jeton
```typescript
api.tokens.claim(meetingId: number, participantId: number): Promise<TokenEvent>
```

**Via Hook**:
```typescript
import { useClaimToken } from '@/lib/hooks'

export function TokenControl({ meetingId, participantId }: Props) {
  const claimToken = useClaimToken(meetingId)
  
  return (
    <button 
      onClick={() => claimToken.mutate(participantId)}
      disabled={claimToken.isPending}
    >
      Claim Token
    </button>
  )
}
```

#### Libérer le jeton
```typescript
api.tokens.release(meetingId: number, participantId: number): Promise<TokenEvent>
```

**Via Hook**:
```typescript
import { useReleaseToken } from '@/lib/hooks'

export function ReleaseTokenButton({ meetingId, participantId }: Props) {
  const releaseToken = useReleaseToken(meetingId)
  
  return (
    <button 
      onClick={() => releaseToken.mutate(participantId)}
      disabled={releaseToken.isPending}
    >
      Release Token
    </button>
  )
}
```

#### Obtenir les événements de jeton
```typescript
api.tokens.getEvents(meetingId: number): Promise<TokenEvent[]>
```

**Via Hook**:
```typescript
import { useTokenEvents } from '@/lib/hooks'

export function TokenTimeline({ meetingId }: Props) {
  const { data: events, isLoading } = useTokenEvents(meetingId)
  
  return (
    <div>
      {events?.map(event => (
        <div key={event.id}>
          {event.event_type === 'claim' && 'Token Claimed'}
          {event.event_type === 'release' && 'Token Released'}
        </div>
      ))}
    </div>
  )
}
```

---

## Phases API

### Types

```typescript
interface Phase {
  id: number
  meeting_id: number
  name: string // 'ideation' | 'clarification' | 'decision' | 'feedback'
  started_by: number
  started_at: string
}

interface ChangePhaseInput {
  phaseName: string
  startedBy: number
}
```

### Endpoints

#### Changer de phase
```typescript
api.phases.change(meetingId: number, phaseName: string, startedBy: number): Promise<Phase>
```

**Via Hook**:
```typescript
import { useChangePhase } from '@/lib/hooks'

export function PhaseControls({ meetingId, userId }: Props) {
  const changePhase = useChangePhase(meetingId)
  
  const handleNextPhase = async (nextPhaseName: string) => {
    await changePhase.mutateAsync({
      phaseName: nextPhaseName,
      startedBy: userId
    })
  }
  
  return (
    <div>
      <button onClick={() => handleNextPhase('clarification')}>
        Next Phase
      </button>
    </div>
  )
}
```

---

## Annotations API

### Types

```typescript
interface Annotation {
  id: number
  meeting_id: number
  participant_id: number
  annotation_type: string
  content: string
  timestamp_ms: number
  created_at: string
}

interface CreateAnnotationInput {
  participant_id: number
  annotation_type: string
  content: string
  timestamp_ms: number
}
```

### Endpoints

#### Lister les annotations
```typescript
api.annotations.list(meetingId: number): Promise<Annotation[]>
```

**Via Hook**:
```typescript
import { useAnnotations } from '@/lib/hooks'

export function AnnotationsList({ meetingId }: Props) {
  const { data: annotations } = useAnnotations(meetingId)
  
  return (
    <div>
      {annotations?.map(a => (
        <div key={a.id}>
          <p>{a.content}</p>
          <small>by user {a.participant_id}</small>
        </div>
      ))}
    </div>
  )
}
```

#### Créer une annotation
```typescript
api.annotations.create(meetingId: number, data: CreateAnnotationInput): Promise<Annotation>
```

**Via Hook**:
```typescript
import { useCreateAnnotation } from '@/lib/hooks'

export function AddAnnotation({ meetingId, userId }: Props) {
  const createAnnotation = useCreateAnnotation(meetingId)
  
  const handleAdd = async (content: string) => {
    await createAnnotation.mutateAsync({
      participant_id: userId,
      annotation_type: 'text',
      content,
      timestamp_ms: Date.now()
    })
  }
  
  return (
    <input 
      onBlur={(e) => handleAdd(e.target.value)}
      placeholder="Add annotation..."
    />
  )
}
```

---

## Decisions API

### Types

```typescript
interface Decision {
  id: number
  meeting_id: number
  title: string
  description: string
  decided_by: number
  phase: string
  created_at: string
}

interface CreateDecisionInput {
  title: string
  description: string
  decided_by: number
  phase: string
}
```

### Endpoints

#### Lister les décisions
```typescript
api.decisions.list(meetingId: number): Promise<Decision[]>
```

**Via Hook**:
```typescript
import { useDecisions } from '@/lib/hooks'

export function DecisionsList({ meetingId }: Props) {
  const { data: decisions } = useDecisions(meetingId)
  
  return (
    <ul>
      {decisions?.map(d => (
        <li key={d.id}>{d.title}</li>
      ))}
    </ul>
  )
}
```

#### Créer une décision
```typescript
api.decisions.create(meetingId: number, data: CreateDecisionInput): Promise<Decision>
```

**Via Hook**:
```typescript
import { useCreateDecision } from '@/lib/hooks'

export function RecordDecision({ meetingId, userId, currentPhase }: Props) {
  const createDecision = useCreateDecision(meetingId)
  
  const handleRecord = async (title: string, description: string) => {
    await createDecision.mutateAsync({
      title,
      description,
      decided_by: userId,
      phase: currentPhase
    })
  }
  
  return (
    <button onClick={() => handleRecord('Decision', 'Description')}>
      Record Decision
    </button>
  )
}
```

---

## Statistics API

### Types

```typescript
interface MeetingStats {
  meeting_id: number
  total_participants: number
  total_annotations: number
  total_decisions: number
  average_token_hold_time: number
  phases_completed: string[]
}

interface AuditEntry {
  id: number
  meeting_id: number
  action: string
  user_id: number
  timestamp: string
  details: Record<string, any>
}
```

### Endpoints

#### Obtenir les statistiques
```typescript
api.stats.getStats(meetingId: number): Promise<MeetingStats>
```

**Via Hook**:
```typescript
import { useMeetingStats } from '@/lib/hooks'

export function MeetingStatistics({ meetingId }: Props) {
  const { data: stats } = useMeetingStats(meetingId)
  
  return (
    <div>
      <p>Participants: {stats?.total_participants}</p>
      <p>Annotations: {stats?.total_annotations}</p>
      <p>Decisions: {stats?.total_decisions}</p>
    </div>
  )
}
```

#### Obtenir l'audit trail
```typescript
api.stats.getAudit(meetingId: number): Promise<AuditEntry[]>
```

**Via Hook**:
```typescript
import { useAuditTrail } from '@/lib/hooks'

export function AuditLog({ meetingId }: Props) {
  const { data: audit } = useAuditTrail(meetingId)
  
  return (
    <table>
      <tbody>
        {audit?.map(entry => (
          <tr key={entry.id}>
            <td>{entry.action}</td>
            <td>{entry.timestamp}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
```

---

## Gestion des Erreurs

### ApiError

Tous les appels API peuvent lever une `ApiError`:

```typescript
export class ApiError extends Error {
  constructor(
    public status: number,
    public message: string,
    public path?: string
  ) {
    super(message)
  }
}
```

### Gestion dans les composants

```typescript
import { useCreateMeeting } from '@/lib/hooks'
import { toast } from 'sonner'

export function CreateForm() {
  const createMeeting = useCreateMeeting()
  
  const handleSubmit = async (data) => {
    try {
      await createMeeting.mutateAsync(data)
      toast.success('Meeting created!')
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message)
      }
    }
  }
  
  return <form onSubmit={handleSubmit}>{/* ... */}</form>
}
```

### Gestion Globale

Dans `main.tsx`, les erreurs 401 sont gérées globalement:

```typescript
queryClient.getQueryCache().subscribe(({ query, state }) => {
  if (state.error instanceof Error && 'status' in state.error) {
    if (state.error.status === 401) {
      localStorage.removeItem('auth_token')
      window.location.href = '/login'
    }
  }
})
```

---

## Exemples Complets

### Exemple 1: Composant de Connexion

```typescript
import { useState } from 'react'
import { useNavigate } from 'wouter'
import { api } from '@/lib/api'
import { toast } from 'sonner'

export function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [, navigate] = useNavigate()
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const response = await api.auth.login(username, password)
      localStorage.setItem('auth_token', response.access_token)
      navigate('/')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Username"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
      />
      <button disabled={loading}>
        {loading ? 'Logging in...' : 'Login'}
      </button>
    </form>
  )
}
```

### Exemple 2: Liste de Réunions avec Actions

```typescript
import { useMeetings, useCreateMeeting } from '@/lib/hooks'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Link } from 'wouter'

export function MeetingsPage() {
  const { data: meetings, isLoading } = useMeetings()
  const createMeeting = useCreateMeeting()
  
  if (isLoading) return <div>Loading...</div>
  
  return (
    <div>
      <h1>Meetings</h1>
      
      <Button onClick={() => {
        createMeeting.mutate({
          name: 'New Meeting',
          description: 'Created at ' + new Date()
        })
      }}>
        Create Meeting
      </Button>
      
      <div className="grid gap-4 mt-4">
        {meetings?.map(m => (
          <Card key={m.id}>
            <h2>{m.name}</h2>
            <p>{m.description}</p>
            <Link href={`/meeting/${m.id}`}>
              <Button>Open</Button>
            </Link>
          </Card>
        ))}
      </div>
    </div>
  )
}
```

### Exemple 3: Salle de Réunion avec Jeton

```typescript
import { useMeetingById, useTokenEvents, useClaimToken } from '@/lib/hooks'
import { useAuth } from '@/_core/hooks/useAuth'

export function MeetingRoom({ meetingId }: Props) {
  const { user } = useAuth()
  const { data: meeting } = useMeetingById(meetingId)
  const { data: tokenEvents } = useTokenEvents(meetingId)
  const claimToken = useClaimToken(meetingId)
  
  // Déterminer qui tient le jeton
  const latestEvent = tokenEvents?.[tokenEvents.length - 1]
  const tokenHolder = latestEvent?.event_type === 'claim' 
    ? latestEvent.participant_id 
    : null
  
  const isMyTurn = tokenHolder === user?.id
  
  return (
    <div>
      <h1>{meeting?.name}</h1>
      
      {isMyTurn ? (
        <div className="bg-green-100 p-4 rounded">
          You hold the token
        </div>
      ) : (
        <Button onClick={() => claimToken.mutate(user?.id || 0)}>
          Request Token
        </Button>
      )}
      
      <div>
        <h3>Token History</h3>
        {tokenEvents?.map(event => (
          <div key={event.id}>
            {event.event_type === 'claim' && `User ${event.participant_id} claimed token`}
            {event.event_type === 'release' && `User ${event.participant_id} released token`}
          </div>
        ))}
      </div>
    </div>
  )
}
```

---

## Dépannage

### L'authentification n'est pas persistée après un rechargement
- Vérifiez que le token est bien stocké: `localStorage.getItem('auth_token')`
- Vérifiez que `useAuth()` récupère le token au démarrage

### Les mutations ne mettent pas en cache
- React Query met en cache les Queries, pas les Mutations
- Utilisez `queryClient.invalidateQueries()` après les mutations

### Les erreurs CORS
- Vérifiez que le backend a CORS activé
- Consultez `backend/main.py` pour la config CORS

---

**Documentation mise à jour**: Décembre 2024
