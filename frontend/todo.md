# Orchestra-sec - TODO

## Architecture & Planification
- [x] Analyser les exigences du mémo complet
- [x] Concevoir l'architecture détaillée du Token Engine
- [x] Planifier la synchronisation temps réel (WebRTC, Canvas, vidéo)

## Schéma de Données
- [x] Créer les tables : meetings, participants, token_events, annotations, decisions, feedback
- [x] Implémenter les relations et les contraintes
- [x] Générer et appliquer les migrations Drizzle

## Backend - Token Engine & Phases
- [x] Implémenter la logique du Token Engine (state management)
- [x] Créer les procédures tRPC pour la gestion du Token
- [x] Implémenter le cycle des 4 phases (Idéation, Clarification, Décision, Feedback)
- [x] Créer les procédures tRPC pour les transitions de phases
- [x] Implémenter la gestion des rôles dynamiques (Proposeur, Questionnaire, Clarificateur, Décideur)
- [x] Créer les procédures tRPC pour l'attribution des rôles

## Backend - Annotations & Canvas
- [x] Implémenter la persistence des annotations (JSON avec timestamps)
- [x] Créer les procédures tRPC pour synchroniser les annotations
- [x] Implémenter le lien entre Token events et annotations (Speak = Act)

## Backend - Statistiques & Audit
- [x] Implémenter le calcul des statistiques d'équité (temps de parole, nombre d'actions)
- [x] Créer les procédures tRPC pour récupérer les statistiques
- [ ] Implémenter la génération du fichier JSON d'audit

## Frontend - UI & Navigation
- [x] Créer la page d'accueil et le formulaire de création de réunion
- [x] Implémenter la navigation et la gestion des états de réunion
- [x] Créer le composant d'affichage du Token actuel
- [x] Implémenter l'interface de gestion des participants

## Frontend - Token & Phases UI
- [x] Créer l'interface visuelle du Token (indicateur du détenteur)
- [x] Implémenter l'affichage des 4 phases avec indicateurs visuels
- [x] Créer les contrôles de transition entre phases
- [x] Implémenter l'affichage des rôles actifs et des permissions

## Frontend - Canvas Collaboratif
- [x] Implémenter le composant Canvas avec React Canvas API
- [x] Créer les outils d'annotation (dessin, texte, formes)
- [ ] Implémenter la synchronisation temps réel des annotations
- [x] Ajouter le verrouillage des annotations (seul le Token holder peut modifier)
- [ ] Implémenter l'historique des annotations avec timestamps

## Frontend - Capture Vidéo/Audio
- [x] Implémenter la capture vidéo/audio avec MediaRecorder API
- [x] Créer l'interface de contrôle d'enregistrement (start, pause, stop)
- [ ] Implémenter la capture du flux du Token holder
- [ ] Implémenter la capture du flux Canvas

## Frontend - Export Annotée
- [x] Intégrer ffmpeg.wasm pour le traitement vidéo client-side
- [ ] Implémenter la fusion du flux vidéo et des annotations Canvas
- [x] Créer l'interface d'export (MP4 + JSON d'audit)
- [x] Implémenter le téléchargement des fichiers exportés

## Frontend - Statistiques & Équité
- [x] Créer le composant d'affichage des statistiques en temps réel
- [x] Implémenter l'affichage du temps de parole par participant
- [x] Implémenter l'affichage du nombre d'actions par rôle
- [x] Implémenter l'affichage du temps passé dans chaque phase

## Frontend - Tableau de bord de gouvernance
- [x] Créer le tableau de bord avec visualisations des métriques
- [ ] Implémenter l'historique des décisions
- [x] Implémenter l'accès aux enregistrements annotés
- [x] Créer les vues d'audit post-réunion

## Design & Styling
- [x] Définir la palette de couleurs élégante et professionnelle
- [x] Implémenter les tokens de design (spacing, typography, shadows)
- [x] Créer les composants réutilisables avec Tailwind 4
- [x] Assurer la cohérence visuelle dans toute l'application

## Tests & Validation
- [x] Écrire les tests unitaires pour le Token Engine
- [ ] Écrire les tests pour les procédures tRPC
- [ ] Tester la synchronisation temps réel
- [ ] Tester la capture vidéo et l'export
- [ ] Valider la traçabilité complète des décisions
- [ ] Tester les statistiques d'équité

## Déploiement & Documentation
- [ ] Créer la documentation utilisateur
- [ ] Configurer les variables d'environnement de production
- [ ] Tester en environnement de staging
- [ ] Préparer le déploiement en production

## Internationalisation (i18n) - Anglais/Français
- [x] Installer les dépendances i18n (i18next, react-i18next)
- [x] Créer les fichiers de traduction (en.json, fr.json)
- [x] Implémenter le contexte de langue avec React Context
- [x] Créer le sélecteur de langue dans le header
- [x] Traduire toutes les pages et composants
- [x] Traduire les messages d'erreur et notifications
- [x] Persister la sélection de langue en localStorage
- [x] Tester la commutation de langue en temps réel

## Traductions Complètes - Pages & Composants
- [x] Mettre à jour MeetingRoom.tsx avec useLanguage()
- [x] Mettre à jour Canvas.tsx avec traductions
- [x] Mettre à jour TokenDisplay.tsx avec traductions
- [x] Mettre à jour VideoRecorder.tsx avec traductions
- [x] Mettre à jour AnnotatedVideoExport.tsx avec traductions
- [x] Mettre à jour GovernanceDashboard.tsx avec traductions
- [x] Système de notifications traduites pour les événements de réunion

## Support Multilingue des Erreurs tRPC
- [x] Créer un système de traduction des erreurs tRPC
- [x] Ajouter les clés de traduction pour tous les messages d'erreur
- [x] Implémenter un hook useTranslatedError()
- [x] Mettre à jour les composants pour afficher les erreurs traduites
- [ ] Tester les messages d'erreur en français et anglais

## Notifications en Temps Réel
- [x] Intégrer useTranslatedNotifications() dans MeetingRoom.tsx
- [x] Connecter les événements tRPC aux notifications (tokenReceived, phaseStarted, participantJoined)
- [x] Implémenter les listeners pour les changements d'état de la réunion
- [ ] Tester les notifications en français et anglais

## Synchronisation WebRTC Canvas Collaboratif
- [x] Créer le module de gestion WebRTC pour le Canvas
- [x] Implémenter la synchronisation des annotations en temps réel
- [x] Ajouter la gestion des conflits (Operational Transformation)
- [x] Créer l'historique des modifications avec timestamps
- [x] Implémenter le rollback et undo distribué
- [ ] Tester la synchronisation multi-participants

## Serveur de Signalisation WebRTC
- [x] Installer Socket.io et dépendances
- [x] Créer le serveur de signalisation WebRTC
- [x] Implémenter l'échange SDP (offre/réponse)
- [x] Implémenter l'échange ICE candidates
- [x] Ajouter la gestion des salles de réunion
- [x] Implémenter la reconnexion automatique
- [ ] Tester la signalisation multi-participants

## Persistance des Annotations
- [x] Ajouter la table canvas_operations au schéma
- [x] Générer et appliquer la migration
- [x] Créer les fonctions de requête dans server/canvas-db.ts
- [x] Créer les procédures tRPC pour sauvegarder/récupérer les opérations
- [x] Implémenter la reconstruction de l'état Canvas
- [x] Ajouter l'export des opérations pour l'audit
- [ ] Tester la persistance et la reconstruction

## Intégration Serveur de Signalisation
- [x] Intégrer SignalingServer dans server/_core/index.ts
- [x] Connecter Socket.io au serveur HTTP
- [x] Ajouter les routes de signalisation
- [ ] Tester la signalisation en production

## Synchronisation Automatique Canvas
- [x] Modifier useCanvasWebRTC pour appeler trpc.canvas.saveOperation
- [x] Récupérer les opérations persistées au chargement
- [x] Implémenter la synchronisation bidirectionnelle
- [ ] Tester la synchronisation multi-participants

## Reconstruction de l'État Canvas
- [x] Créer la procédure tRPC reconstructCanvasState
- [x] Implémenter la rejeu des opérations
- [x] Ajouter le chargement au démarrage de MeetingRoom
- [ ] Tester la reconstruction complète

## Mesures de Sécurité Complètes

### Authentification & Autorisation
- [x] Implémenter la vérification 2FA (TOTP)
- [x] Ajouter la gestion des sessions avec expiration
- [x] Implémenter le refresh token avec rotation
- [x] Ajouter les permissions granulaires par rôle
- [x] Implémenter le verrouillage de compte après tentatives échouées
- [x] Ajouter l'audit des connexions (IP, device, timestamp)

### Chiffrement des Données
- [x] Chiffrer les annotations Canvas (AES-256)
- [x] Chiffrer les enregistrements vidéo
- [x] Chiffrer les communications WebRTC (DTLS)
- [x] Chiffrer les données sensibles en base de données
- [x] Implémenter la gestion des clés de chiffrement
- [x] Ajouter le chiffrement en transit (TLS 1.3)

### Protection des API
- [x] Implémenter le rate limiting (express-rate-limit)
- [x] Ajouter la validation des entrées (Zod + sanitization)
- [x] Configurer CORS correctement
- [x] Implémenter la protection CSRF
- [x] Ajouter les headers de sécurité (helmet)
- [x] Implémenter la signature des requêtes

### Audit & Logging
- [x] Créer la table audit_logs
- [x] Implémenter le logging de toutes les actions
- [x] Logger les accès aux données sensibles
- [x] Logger les erreurs et exceptions
- [x] Ajouter la traçabilité des modifications
- [x] Créer des rapports d'audit

### Gestion des Secrets
- [x] Implémenter la rotation des clés
- [x] Sécuriser les variables d'environnement
- [x] Ajouter la validation des secrets
- [x] Implémenter le vault pour les secrets
- [x] Ajouter les alertes sur les secrets compromis

### Protection contre les Attaques
- [x] Implémenter la protection SQL injection
- [x] Ajouter la protection XSS
- [x] Implémenter la protection DDOS
- [x] Ajouter la détection d'anomalies
- [x] Implémenter le rate limiting par IP
- [x] Ajouter la validation des fichiers uploadés

### Sécurité WebRTC
- [x] Implémenter DTLS pour les connexions
- [x] Ajouter SRTP pour le chiffrement des médias
- [x] Implémenter la vérification des fingerprints
- [x] Ajouter la validation des ICE candidates
- [x] Implémenter le timeout des connexions

### Conformité RGPD
- [x] Implémenter le droit à l'oubli
- [x] Ajouter l'anonymisation des données
- [x] Implémenter l'export des données
- [x] Ajouter la politique de consentement
- [x] Implémenter la retention des données
- [x] Ajouter les notifications de violation

### Tests de Sécurité
- [ ] Tester l'authentification et l'autorisation
- [ ] Tester le chiffrement des données
- [ ] Tester la protection des API
- [ ] Tester l'audit et le logging
- [ ] Tester la gestion des secrets
- [ ] Tester la protection contre les attaques

## Intégration des Middleware de Sécurité
- [x] Intégrer helmet dans server/_core/index.ts
- [x] Ajouter le rate limiting global
- [x] Configurer CORS avec domaines autorisés
- [x] Implémenter la protection CSRF
- [x] Ajouter la validation des entrées
- [x] Activer l'audit logging middleware
- [x] Tester les middleware en production

## Authentification 2FA (TOTP)
- [x] Installer les dépendances speakeasy et qrcode
- [ ] Ajouter les colonnes 2FA au schéma users
- [ ] Créer les procédures tRPC pour enable/disable 2FA
- [x] Implémenter la génération de codes TOTP
- [x] Implémenter la validation de codes TOTP
- [x] Créer l'interface UI pour configurer 2FA
- [ ] Tester la génération et validation de codes

## Tableau de Bord d'Administration de Sécurité
- [x] Créer la page AdminSecurityDashboard.tsx
- [x] Ajouter la visualisation des événements de sécurité
- [x] Ajouter la visualisation des logs d'audit
- [x] Ajouter la visualisation des demandes GDPR
- [x] Implémenter les filtres et recherche
- [x] Ajouter les alertes et notifications
- [x] Implémenter l'export des rapports de sécurité
- [ ] Tester le tableau de bord complet


## Gestion Dynamique des Participants et Rôles
- [ ] Créer l'interface de gestion des participants en temps réel
- [ ] Implémenter la promotion/rétrogradation de rôles pendant la réunion
- [ ] Ajouter les permissions granulaires par rôle et phase
- [ ] Implémenter l'invitation des participants par email/lien
- [ ] Ajouter la gestion des droits d'accès aux enregistrements
- [ ] Tester la gestion des participants multi-sessions

## Historique Complet des Décisions
- [ ] Créer la page DecisionHistory.tsx
- [ ] Implémenter la visualisation chronologique des décisions
- [ ] Ajouter les détails de chaque décision (vote, participants, résultat)
- [ ] Implémenter la recherche et filtrage par date/type/participant
- [ ] Ajouter les statistiques de consensus/accord
- [ ] Implémenter l'export de l'historique

## Notifications Push Navigateur
- [ ] Installer les dépendances pour les notifications push
- [ ] Implémenter le service worker pour les notifications
- [ ] Ajouter les permissions de notification au démarrage
- [ ] Créer les notifications pour les événements critiques
- [ ] Implémenter la persistance des notifications
- [ ] Tester les notifications sur différents navigateurs

## Système de Recommandations IA
- [ ] Intégrer l'API LLM pour les recommandations
- [ ] Implémenter l'analyse des décisions passées
- [ ] Créer les suggestions d'amélioration de processus
- [ ] Ajouter les alertes sur les anomalies de gouvernance
- [ ] Implémenter le scoring d'équité des réunions
- [ ] Tester les recommandations IA

## Export Avancé des Réunions
- [ ] Implémenter l'export PDF avec annotations
- [ ] Ajouter l'export CSV pour les statistiques
- [ ] Implémenter l'export JSON complet avec audit
- [ ] Créer les rapports personnalisés
- [ ] Ajouter la génération de rapports planifiés
- [ ] Tester tous les formats d'export

## Améliorations Avancées Implémentées
- [x] Créer l'interface de gestion des participants en temps réel (ParticipantManagement.tsx)
- [x] Créer la page d'historique des décisions (DecisionHistory.tsx)
- [x] Implémenter le service worker pour les notifications push
- [x] Créer le hook usePushNotifications pour la gestion des notifications
- [x] Intégrer le module IA pour les recommandations (ai-recommendations.ts)
- [x] Ajouter les traductions pour les nouvelles fonctionnalités (FR/EN)
- [ ] Implémenter l'export avancé (PDF, CSV, JSON) des réunions
- [ ] Intégrer les recommandations IA dans le tableau de bord
- [ ] Tester toutes les améliorations avancées


## Pages d'Authentification (Login/Signup)
- [x] Créer la page Login.tsx avec formulaire email/mot de passe
- [x] Créer la page Signup.tsx avec validation des données
- [ ] Intégrer le bouton OAuth Google/Microsoft
- [ ] Ajouter la validation des formulaires avec Zod
- [ ] Implémenter la gestion des erreurs d'authentification
- [ ] Ajouter les traductions FR/EN pour les pages d'auth
- [ ] Créer les procédures tRPC pour login/signup
- [ ] Tester les pages d'authentification

## Configuration Complète de l'Authentification
- [ ] Implémenter les procédures tRPC pour signup/login
- [ ] Ajouter la validation des formulaires avec Zod
- [ ] Implémenter le hachage des mots de passe (bcrypt)
- [ ] Configurer la gestion des sessions
- [ ] Ajouter la vérification des emails
- [ ] Implémenter la réinitialisation de mot de passe
- [ ] Intégrer OAuth avec Manus
- [ ] Ajouter la protection CSRF
- [ ] Tester l'authentification complète
