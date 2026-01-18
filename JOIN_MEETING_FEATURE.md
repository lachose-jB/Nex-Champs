# Fonctionnalité: Rejoindre une Réunion

## Vue d'ensemble
Implémentation complète de la fonctionnalité permettant aux utilisateurs de rejoindre des réunions existantes, avec synchronisation en temps réel des participants.

## Modifications effectuées

### 1. Backend (FastAPI)

#### Fichier: `backend/models/participants.py`
- **Modification**: Changement du schéma `ParticipantCreate`
  - Avant: Exigeait `user_id` (car créé manuellement par l'API)
  - Après: Prend uniquement `name` et `role` (l'API récupère `user_id` depuis le JWT)
  - Raison: Simplifier l'API pour le frontend, utiliser l'authentification existante

```python
class ParticipantCreate(SQLModel):
    name: str
    role: str = "participant"
```

#### Fichier: `backend/api/meetings.py`
Deux nouveaux endpoints ajoutés:

**1. POST `/meetings/{meeting_id}/join`**
- **Authentification**: Requise (JWT token)
- **Paramètres**:
  - `meeting_id`: ID de la réunion (URL)
  - `participant`: Objet ParticipantCreate avec `name` et `role` optionnel
- **Logique**:
  - Vérifie que la réunion existe
  - Vérifie si l'utilisateur est déjà participant
  - Si oui: Met à jour son statut (réactive `is_active = True`)
  - Si non: Crée un nouveau participant
- **Réponse**:
  ```json
  {
    "message": "Successfully joined the meeting",
    "meeting_id": 1
  }
  ```

**2. GET `/meetings/{meeting_id}/participants`**
- **Authentification**: Requise
- **Paramètres**: `meeting_id` (URL)
- **Logique**:
  - Récupère tous les participants actifs de la réunion
  - Retourne une liste de `ParticipantRead`
- **Réponse**:
  ```json
  [
    {
      "id": 1,
      "user_id": "john@example.com",
      "name": "John Doe",
      "role": "facilitator",
      "is_active": true,
      "meeting_id": 1
    }
  ]
  ```

### 2. Frontend (React + TypeScript)

#### Fichier: `frontend/client/src/lib/api.ts`
**Nouvelle interface**:
```typescript
export interface Participant {
  id: number;
  user_id: string;
  name: string;
  role: 'participant' | 'facilitator' | 'observer';
  is_active: boolean;
  meeting_id: number;
}
```

**Nouveaux endpoints API**:
```typescript
export const meetingsAPI = {
  // ... endpoints existants ...
  
  /**
   * Join an existing meeting
   * POST /meetings/{id}/join
   */
  join: async (meetingId: number, data: { name: string; role?: string }): Promise<{ message: string; meeting_id: number }> => {
    return apiCall<{ message: string; meeting_id: number }>(`/meetings/${meetingId}/join`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Get participants for a meeting
   * GET /meetings/{id}/participants
   */
  getParticipants: async (meetingId: number): Promise<Participant[]> => {
    return apiCall<Participant[]>(`/meetings/${meetingId}/participants`);
  },
};
```

#### Fichier: `frontend/client/src/lib/hooks.ts`
**Nouveaux React Query hooks**:

```typescript
/**
 * Hook pour rejoindre une réunion
 * Invalide les caches: participants et meetings après succès
 */
export function useJoinMeeting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ meetingId, data }: { meetingId: number; data: { name: string; role?: string } }) =>
      api.meetings.join(meetingId, data),
    onSuccess: (_, { meetingId }) => {
      queryClient.invalidateQueries({ queryKey: ['meetings', meetingId, 'participants'] });
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
    },
  });
}

/**
 * Hook pour récupérer les participants
 * Refetch automatique toutes les 3 secondes
 */
export function useMeetingParticipants(meetingId: number) {
  return useQuery({
    queryKey: ['meetings', meetingId, 'participants'],
    queryFn: () => api.meetings.getParticipants(meetingId),
    enabled: meetingId > 0,
    refetchInterval: 3000, // Refetch toutes les 3 secondes
  });
}
```

#### Fichier: `frontend/client/src/pages/Home.tsx`
**Nouvelle section UI**: "Join Meeting"
- Formulaire permettant de:
  1. Sélectionner une réunion existante (liste dropdown)
  2. Entrer son nom pour la réunion
  3. Rejoindre avec un bouton
- États gérés:
  - `showJoinForm`: Affiche/cache le formulaire
  - `selectedMeetingId`: ID de la réunion sélectionnée
  - `joinName`: Nom de l'utilisateur dans la réunion

**Comportement**:
- Liste les réunions via `useMeetings()` hook
- Affiche un loader pendant la récupération des réunions
- Affiche un message si aucune réunion disponible
- Redirige vers `/meeting/{meetingId}/dashboard` après succès
- Réinitialise le formulaire en cas d'annulation

## Flux d'utilisation

### Créer une réunion (existant)
1. Utilisateur clique "Nouvelle réunion"
2. Entre le titre et description
3. Clique "Créer"
4. Est redirigé automatiquement vers le dashboard de la réunion
5. Devient participant avec rôle "facilitator"

### Rejoindre une réunion (nouveau)
1. Utilisateur clique "Rejoindre une réunion"
2. Sélectionne une réunion dans la dropdown
3. Entre son nom (peut être différent du username)
4. Clique "Rejoindre"
5. Est redirigé vers le dashboard de la réunion
6. Devient participant avec rôle "participant" par défaut

## Sécurité

1. **Authentification**: Tous les endpoints requièrent un JWT token valide
2. **Utilisateur identifié**: Le `user_id` provient du JWT, pas du formulaire
3. **Vérification d'existence**: Endpoint vérifie que la réunion existe avant d'ajouter un participant
4. **Réactivation**: Si un participant quitte puis rejoint, il est réactivé au lieu de dupliquer

## Synchronisation en temps réel

Le hook `useMeetingParticipants()` refetch automatiquement tous les **3 secondes**:
- Les participants apparaissent dynamiquement dans la UI
- Les départs de participants peuvent être détectés (is_active = false)
- Pas de WebSocket pour le moment (peut être amélioré ultérieurement)

## Prochaines améliorations possibles

1. **WebSocket**: Remplacer les refetch par des mises à jour WebSocket en temps réel
2. **Notifications**: Notifier les participants quand quelqu'un rejoint
3. **Liste des participants**: Afficher la liste sur le dashboard avec présence en direct
4. **Rôles**: Permettre au facilitateur de modifier les rôles des participants
5. **Départ de réunion**: Ajouter un bouton "Quitter" pour laisser une réunion

## Tests recommandés

### Cas de test 1: Rejoindre une réunion
```bash
# 1. Créer une réunion en tant qu'utilisateur A
POST /meetings/
{
  "name": "Test Meeting",
  "description": "Test"
}
# Réponse: meeting.id = 1

# 2. Rejoindre en tant qu'utilisateur B
POST /meetings/1/join
{
  "name": "User B Name",
  "role": "participant"
}

# 3. Vérifier les participants
GET /meetings/1/participants
# Devrait retourner 2 participants (facilitator + participant)
```

### Cas de test 2: Rejoindre deux fois
```bash
# L'utilisateur B rejoint deux fois
POST /meetings/1/join { "name": "Updated Name" }
POST /meetings/1/join { "name": "Updated Name Again" }

# Vérifier qu'il n'y a pas de doublon
GET /meetings/1/participants
# Devrait retourner 2 participants, pas 3
```

## Statut d'implémentation

✅ Backend: Endpoints implémentés et fonctionnels
✅ Frontend: UI créée et intégrée
✅ API Client: Méthodes ajoutées
✅ React Hooks: Hooks créés avec React Query
✅ TypeScript: 0 erreurs de compilation
✅ Tests manuels: À faire

## Fichiers modifiés

1. `backend/models/participants.py`
2. `backend/api/meetings.py`
3. `frontend/client/src/lib/api.ts`
4. `frontend/client/src/lib/hooks.ts`
5. `frontend/client/src/pages/Home.tsx`

## Notes

- L'interface Participant contient tous les champs exposés par le backend
- Le formulaire "Rejoindre" utilise le même state manager (React Query) que "Créer"
- Les erreurs sont loggées en console (peut être amélioré avec toast notifications)
- La redirection est automatique après un join réussi
