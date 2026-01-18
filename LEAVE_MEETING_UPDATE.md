# Mise à jour: Redirection et Fonctionnalité "Quitter la Réunion"

## ✅ Statut: COMPLÉTÉ

### Changements effectués

#### 1. Correction de la redirection après créer/rejoindre une réunion
- **Avant**: `/meeting/{id}/dashboard` → GovernanceDashboard
- **Après**: `/meeting/{id}` → MeetingRoom
- **Fichiers modifiés**:
  - `frontend/client/src/pages/Home.tsx` (2 redirections)

#### 2. Ajout de la fonctionnalité "Quitter la réunion"

**Backend (FastAPI)**
- Fichier: `backend/api/meetings.py`
- Endpoint: `POST /meetings/{id}/leave`
- Logique:
  - Récupère le participant courant
  - Le marque comme inactif (`is_active = False`)
  - Retourne un message de confirmation

```python
@router.post("/{meeting_id}/leave", response_model=dict)
def leave_meeting(
    meeting_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_active_user)
):
    """Leave a meeting (mark participant as inactive)"""
    # Logique...
```

**Frontend (React)**
- Fichier: `frontend/client/src/lib/api.ts`
  - Méthode: `meetingsAPI.leave(meetingId)`
  
- Fichier: `frontend/client/src/lib/hooks.ts`
  - Hook: `useLeaveMeeting()` (useMutation)
  - Invalide le cache meetings après succès
  
- Fichier: `frontend/client/src/pages/MeetingRoom.tsx`
  - Import: `useLeaveMeeting`
  - Fonction: `handleLeaveMeeting()`
  - UI: Bouton "Quitter" dans le header
  - Redirection vers `/` après succès

### 3. UI du bouton "Quitter"
- Position: Header du MeetingRoom, à droite avec les autres contrôles
- Style: Texte rouge, outline variant
- Comportement:
  - Désactivé pendant l'envoi
  - Affiche loader pendant l'attente
  - Redirige vers Home après succès
  - Affiche un toast d'erreur en cas de problème

## 📊 Flux mis à jour

```
┌─────────────────────────────┐
│      Home Page (/)          │
├─────────────────────────────┤
│ [Créer Réunion] ou          │
│ [Rejoindre Réunion]         │
└──────────────┬──────────────┘
               │
               ↓
┌─────────────────────────────┐
│   MeetingRoom (/meeting/:id)│ ← CHANGÉ (avant: /meeting/:id/dashboard)
├─────────────────────────────┤
│  Canvas  │ Participants     │
│          │ Token Display    │
│ [Quitter]│ Video Recorder   │ ← AJOUTÉ (nouveau bouton)
└──────────────┬──────────────┘
               │
      [Quitter] clicked
               │
               ↓
┌─────────────────────────────┐
│      Home Page (/)          │
└─────────────────────────────┘
```

## 🔄 Flux de quitter une réunion

1. Utilisateur clique "Quitter" dans le header
2. Frontend appelle `POST /meetings/{id}/leave`
3. Backend marque participant comme inactif
4. Frontend redirige vers Home (`/`)
5. L'utilisateur n'apparaît plus dans la liste des participants actifs

## 📋 Fichiers modifiés

```
backend/
  └─ api/meetings.py
     ├─ Ajout endpoint POST /meetings/{id}/leave

frontend/client/src/
  ├─ lib/
  │  ├─ api.ts
  │  │  └─ meetingsAPI.leave()
  │  └─ hooks.ts
  │     └─ useLeaveMeeting()
  ├─ pages/
  │  ├─ Home.tsx
  │  │  ├─ Redirection: /meeting/{id}/dashboard → /meeting/{id}
  │  │  └─ Affecte: handleCreateMeeting() et handleJoinMeeting()
  │  └─ MeetingRoom.tsx
  │     ├─ Import: useLeaveMeeting
  │     ├─ Hook: leaveMeetingMutation
  │     ├─ Fonction: handleLeaveMeeting()
  │     └─ UI: Bouton "Quitter" dans le header
```

## ✅ Validation

- ✅ Python: Compilation réussie
- ✅ TypeScript: 0 erreurs
- ✅ Imports: À jour
- ✅ Logique: Cohérente avec patterns existants

## 🎯 Comportement attendu

### Avant
```
Créer/Rejoindre → GovernanceDashboard (page de governance)
```

### Après
```
Créer/Rejoindre → MeetingRoom (salle de réunion avec canvas)
                     ↓
                [Quitter button] → Home
```

## 🔐 Sécurité

- ✅ Authentification JWT requise sur endpoint `/leave`
- ✅ Utilisateur ne peut quitter que ses propres réunions (user_id du JWT)
- ✅ Vérification d'existence de la réunion
- ✅ Vérification d'existence du participant

## Prochaines étapes optionnelles

- [ ] Toast de confirmation avant de quitter
- [ ] Sauvegarder le canvas avant de quitter
- [ ] Historique des participants (inclure les inactifs)
- [ ] Message d'avertissement si canvas non sauvegardé
