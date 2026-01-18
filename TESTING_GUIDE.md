# Guide de Test Complet - Orchestra-sec

## 📋 Fonctionnalités à Tester

### 1. **Authentification**
### 2. **Gestion des Réunions** (Créer/Rejoindre/Quitter)
### 3. **Tokens** (Claim/Release)
### 4. **Rôles** (Facilitator/Participant/Observer)
### 5. **Phases** (Ideation → Clarification → Decision → Feedback)
### 6. **Participants** (Créer/Rejoindre/Inviter)
### 7. **Annotations** (Canvas collaboratif)
### 8. **Décisions**
### 9. **Statistiques & Audit**

---

## 🧪 Tests Automatisés

### Script 1: Test Complet de Toutes les Fonctionnalités

```bash
./test_all_features.sh
```

**Ce qui est testé:**
- ✅ Authentification JWT
- ✅ Création de réunion
- ✅ Gestion des participants
- ✅ Tokens (claim/release)
- ✅ Transitions de phases
- ✅ Annotations
- ✅ Création de décisions
- ✅ Statistiques et audit trail

**Output attendu:**
```
✅ Authentification: ✓ Tokens JWT créés
✅ Réunion: ✓ Réunion #1 créée
✅ Participants: ✓ Participants listés
✅ Tokens: ✓ Claim/Release fonctionnel
✅ Phases: ✓ Toutes les phases testées
...
```

---

### Script 2: Test Invitation de Participants

```bash
./test_invite_participants.sh
```

**Ce qui est testé:**
- ✅ Invitation de participants avec différents rôles
- ✅ Sécurité: seuls les facilitateurs peuvent inviter
- ✅ Vérification des doublons
- ✅ Listing des participants après invitation

**Participants créés:**
1. Jean Dupont (facilitator)
2. Marie Martin (observer)
3. Pierre Bernard (participant)

---

## 🖥️ Tests Manuels - Frontend

### 1. **Authentification**
```
1. Aller à http://localhost:5173
2. Login: admin / admin
3. Vérifier que le token JWT est stocké en localStorage['auth_token']
```

### 2. **Créer une Réunion**
```
1. Sur la page Home
2. Cliquer "Nouvelle réunion"
3. Entrer un titre et description
4. Cliquer "Créer"
5. ✅ Vérifier redirection vers MeetingRoom (/meeting/{id})
```

### 3. **Rejoindre une Réunion**
```
1. Sur la page Home
2. Cliquer "Rejoindre une réunion"
3. Sélectionner une réunion dans la dropdown
4. Entrer votre nom
5. Cliquer "Rejoindre"
6. ✅ Vérifier redirection vers MeetingRoom et présence dans la liste des participants
```

### 4. **Tokens (Claim/Release)**
```
1. Dans le MeetingRoom, chercher la section "Token Display"
2. Cliquer "Claim Token" ou utiliser le bouton de token
3. ✅ Vérifier que:
   - Vous avez le token (UI change)
   - Les autres utilisateurs voient que vous avez le token
   - Seul le porteur du token peut annoter le canvas
4. Cliquer "Release Token"
5. ✅ Vérifier que le token est libéré
```

### 5. **Phases (Ideation → Clarification → Decision → Feedback)**
```
1. Dans le MeetingRoom, trouver le sélecteur de phase (probablement dans le sidebar)
2. Commencer par "Ideation"
3. Pour chaque phase, cliquer pour changer:
   - Ideation (Génération d'idées)
   - Clarification (Clarification)
   - Decision (Prise de décision)
   - Feedback (Rétroaction)
4. ✅ Vérifier que:
   - La phase change dans l'UI
   - Tous les participants voient le changement
   - L'historique des phases est enregistré
```

### 6. **Canvas - Annotations**
```
1. Dans le MeetingRoom, localiser le Canvas (zone de dessin collaborative)
2. Sélectionner un outil (pen, shapes, text, etc.)
3. Dessiner quelque chose
4. ✅ Vérifier que:
   - Votre annotation apparaît sur le canvas
   - Les autres utilisateurs voient aussi vos annotations en temps réel
   - Vous ne pouvez annoter que si vous avez le token
```

### 7. **Décisions**
```
1. Dans le MeetingRoom, trouver la section "Décisions"
2. Cliquer "Ajouter une décision"
3. Entrer:
   - Titre: "Décision importante"
   - Description: "Description"
   - Phase: "decision"
4. Cliquer "Créer"
5. ✅ Vérifier que:
   - La décision apparaît dans la liste
   - La date/heure est enregistrée
   - L'auteur est identifié
```

### 8. **Participants et Rôles**
```
1. Dans le MeetingRoom, voir la liste des participants
2. Vérifier que chaque participant a un rôle:
   - Facilitator: peut inviter, changer les phases, gérer les tokens
   - Participant: peut annoter, créer des décisions
   - Observer: peut voir mais a un accès limité (read-only)
3. ✅ Vérifier les permissions selon les rôles
```

### 9. **Quitter une Réunion**
```
1. Dans le MeetingRoom, cliquer le bouton "Quitter"
2. Confirmer
3. ✅ Vérifier que:
   - Vous êtes redirigé vers Home
   - Vous n'apparaissez plus dans la liste des participants actifs
```

### 10. **Statistiques et Audit**
```
1. Dans le dashboard (si disponible), chercher "Statistiques"
2. ✅ Vérifier que vous pouvez voir:
   - Nombre de participants
   - Nombre d'annotations
   - Nombre de décisions
   - Temps total de la réunion
   - Qui a parlé/agi en dernier
```

---

## 🔍 Cas de Test Avancés

### Test: Plusieurs Utilisateurs Simultanément

```bash
# Terminal 1: User1 (admin)
# 1. Créer une réunion: ID = 1
# 2. Devenir facilitator

# Terminal 2: User2
# 1. Login avec un autre utilisateur
# 2. Rejoindre réunion #1
# 3. Vérifier que User1 voit User2 dans la liste

# Terminal 3: User3
# 1. Login
# 2. Rejoindre réunion #1
# 3. Tester collaboration en temps réel

# Actions simultanées à tester:
# - User1 change la phase
# - User2 et User3 voient le changement immédiatement
# - User1 crée une décision
# - User2 ajoute une annotation
# - User3 voit tout en temps réel
```

### Test: Permissions par Rôle

```
Facilitator (User1):
  ✅ Peut créer réunion
  ✅ Peut inviter participants
  ✅ Peut changer la phase
  ✅ Peut créer/modifier décisions
  ✅ Peut voir statistiques

Participant (User2):
  ✅ Peut rejoindre
  ✅ Peut annoter (avec token)
  ✅ Peut créer décisions
  ✅ Cannot changer phase (error)
  ✅ Cannot inviter (error)

Observer (User3):
  ✅ Peut rejoindre
  ✅ Cannot annoter (read-only)
  ✅ Cannot créer décisions
  ❌ Cannot changer phase
  ❌ Cannot inviter
```

### Test: Edge Cases

```
1. Inviter un participant qui n'existe pas
   → Participant créé avec username fictif

2. Rejoindre 2 fois la même réunion
   → Pas de doublon, participant réactivé

3. Quitter puis rejoindre
   → Participant réactivé comme avant

4. Changer le rôle d'un participant
   → Via API (future feature)

5. Plus de 10 participants
   → Vérifier la scalabilité

6. Tokens avec 5+ personnes
   → Vérifier que seul le porteur peut annoter
```

---

## ✅ Checklist de Validation

### Backend
- [ ] Tous les endpoints répondent avec les bons status codes
- [ ] Authentification JWT fonctionne
- [ ] Vérification des permissions par rôle
- [ ] Gestion des erreurs cohérente
- [ ] Données persistées en base de données

### Frontend
- [ ] Pas d'erreurs TypeScript (`npx tsc --noEmit`)
- [ ] Pas d'erreurs JavaScript en console
- [ ] UI responsive (desktop, tablet, mobile)
- [ ] Navigation fluide entre pages
- [ ] Gestion des erreurs avec toasts

### Sécurité
- [ ] JWT validation sur tous les endpoints
- [ ] Permissions par rôle vérifiées
- [ ] CORS configuré correctement
- [ ] Pas d'injection SQL (utilisation de paramètres)
- [ ] Pas d'exposition de données sensibles

### Performance
- [ ] Pas de requêtes N+1
- [ ] Cache de réunions fonctionnel
- [ ] Refetch des participants toutes les 3s (acceptable)
- [ ] Canvas WebRTC synchronisé
- [ ] Token events en temps réel

---

## 📊 Résultats Attendus

### Après test_all_features.sh:
```
✅ 8/8 fonctionnalités testées avec succès
✅ 0 erreurs
✅ Base de données mise à jour
```

### Après test_invite_participants.sh:
```
✅ 3 participants invités
✅ Sécurité vérifiée
✅ Permissions fonctionnelles
```

### Après tests manuels:
```
✅ Frontend et Backend en synchronisation
✅ Temps réel fonctionnel
✅ UX intuitive
✅ Toutes les fonctionnalités accessibles
```

---

## 🚀 Commandes Rapides

```bash
# Démarrer les serveurs
cd frontend && pnpm dev &
cd ../backend && uvicorn main:app --reload &

# Tester toutes les fonctionnalités
./test_all_features.sh

# Tester invitation
./test_invite_participants.sh

# Accéder à l'app
# Frontend: http://localhost:5173
# Backend API: http://localhost:8000/api/v1
# Docs API: http://localhost:8000/docs
```

---

## 📞 Troubleshooting

### "401 Unauthorized"
→ Token JWT invalide ou expiré
→ Rélogin avec admin/admin

### "403 Forbidden"
→ Permissions insuffisantes
→ Vérifier le rôle du participant

### "404 Not Found"
→ Réunion/Participant inexistant
→ Vérifier l'ID

### "Canvas not syncing"
→ Vérifier WebRTC connection
→ Vérifier le token
→ Consoles: F12

### "Participants not updating"
→ Vérifier le refetch interval (3s)
→ Vérifier les permissions
→ Network tab: Voir les requêtes GET

---

## 📝 Notes Importantes

1. **Tokens JWT**: Expiration à configurer (actuellement pas d'expiration)
2. **WebRTC**: Peut nécessiter une configuration de serveur STUN/TURN en production
3. **Real-time**: Actuellement via polling (3s refetch), WebSocket en future
4. **Base de données**: SQLite en développement, changer en production
5. **Auth**: Actuellement juste username/password, ajouter OAuth2 en future

---

**Status**: ✅ Tous les tests sont prêts à être exécutés

Lancez les scripts et testez! 🚀
