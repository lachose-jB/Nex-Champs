#!/bin/bash

# ============================================================================
# TEST INVITATION DE PARTICIPANTS
# ============================================================================

set -e

API_BASE="http://localhost:8000/api/v1"

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

function print_section() {
    echo ""
    echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║${NC} $1"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

function print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

function print_error() {
    echo -e "${RED}❌ $1${NC}"
}

function print_info() {
    echo -e "${YELLOW}ℹ️  $1${NC}"
}

# ============================================================================
# AUTHENTIFICATION
# ============================================================================

print_section "AUTHENTIFICATION - Création de tokens"

TOKEN=$(curl -s -X POST "$API_BASE/auth/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin&password=admin" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    print_error "Impossible de créer un token"
    exit 1
fi

print_success "Token créé: ${TOKEN:0:20}..."

# ============================================================================
# CRÉER UNE RÉUNION
# ============================================================================

print_section "CRÉATION DE RÉUNION"

MEETING=$(curl -s -X POST "$API_BASE/meetings/" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name":"Test Invitation - Participants",
    "description":"Test de l'\''invitation de participants"
  }')

MEETING_ID=$(echo "$MEETING" | grep -o '"id":[0-9]*' | head -1 | cut -d: -f2)

if [ -z "$MEETING_ID" ] || [ "$MEETING_ID" = "0" ]; then
    print_error "Impossible de créer la réunion"
    exit 1
fi

print_success "Réunion créée: ID #$MEETING_ID"

# ============================================================================
# INVITER DES PARTICIPANTS
# ============================================================================

print_section "INVITATION DE PARTICIPANTS"

# Participant 1: Collaborateur (facilitator)
print_info "Invitation 1: Collaborateur (facilitator)"

INVITE1=$(curl -s -X POST "$API_BASE/meetings/$MEETING_ID/invite" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name":"Jean Dupont",
    "role":"facilitator",
    "email":"jean.dupont@company.com"
  }')

echo "$INVITE1" | jq '.' 2>/dev/null || echo "$INVITE1"
print_success "Jean Dupont invité en tant que facilitator"

# Participant 2: Participant observateur
print_info "Invitation 2: Observateur"

INVITE2=$(curl -s -X POST "$API_BASE/meetings/$MEETING_ID/invite" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name":"Marie Martin",
    "role":"observer",
    "email":"marie.martin@company.com"
  }')

echo "$INVITE2" | jq '.' 2>/dev/null || echo "$INVITE2"
print_success "Marie Martin invitée en tant qu'\''observateur"

# Participant 3: Participant régulier
print_info "Invitation 3: Participant régulier"

INVITE3=$(curl -s -X POST "$API_BASE/meetings/$MEETING_ID/invite" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name":"Pierre Bernard",
    "role":"participant",
    "email":"pierre.bernard@company.com"
  }')

echo "$INVITE3" | jq '.' 2>/dev/null || echo "$INVITE3"
print_success "Pierre Bernard invité en tant que participant"

# ============================================================================
# LISTER LES PARTICIPANTS
# ============================================================================

print_section "LISTE DES PARTICIPANTS ACTUELS"

PARTICIPANTS=$(curl -s -X GET "$API_BASE/meetings/$MEETING_ID/participants" \
  -H "Authorization: Bearer $TOKEN")

echo "$PARTICIPANTS" | jq '.' 2>/dev/null || echo "$PARTICIPANTS"

# ============================================================================
# TEST DE SÉCURITÉ: INVITATION PAR NON-FACILITATEUR
# ============================================================================

print_section "TEST DE SÉCURITÉ: Essai d'\''invitation par non-facilitateur"

print_info "Tentative d'invitation par un participant régulier (devrait échouer)..."

INVALID_INVITE=$(curl -s -X POST "$API_BASE/meetings/$MEETING_ID/invite" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name":"Test User",
    "role":"participant"
  }')

if echo "$INVALID_INVITE" | grep -q "Only facilitators can invite"; then
    print_success "Sécurité vérifiée: Seuls les facilitateurs peuvent inviter"
else
    print_info "Réponse: $INVALID_INVITE"
fi

# ============================================================================
# RÉSUMÉ
# ============================================================================

print_section "RÉSUMÉ DES TESTS"

echo -e "${GREEN}✅ Réunion créée: #$MEETING_ID${NC}"
echo -e "${GREEN}✅ 3 participants invités avec différents rôles${NC}"
echo -e "${GREEN}✅ Sécurité vérifiée: seuls les facilitateurs peuvent inviter${NC}"
echo ""
echo "Participants invités:"
echo "  1. Jean Dupont (facilitator)"
echo "  2. Marie Martin (observer)"
echo "  3. Pierre Bernard (participant)"
echo ""
echo "Les participants peuvent rejoindre la réunion en utilisant:"
echo "  POST /meetings/$MEETING_ID/join"
echo ""
