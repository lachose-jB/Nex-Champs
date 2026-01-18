#!/bin/bash

API_BASE="http://localhost:8000/api/v1"
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImFkbWluIiwic3ViIjoiYWRtaW4ifQ.K-nHHGp_3tMr2xYRxGvfqVdqr1uLl7a7q3tEsE8xKj4"

echo "=== Testing Join Meeting Feature ==="
echo ""

# Test 1: Get all meetings
echo "1. Get all meetings:"
curl -s -X GET "$API_BASE/meetings/" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | head -c 200
echo -e "\n\n"

# Test 2: Create a test meeting
echo "2. Create a test meeting:"
MEETING=$(curl -s -X POST "$API_BASE/meetings/" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Join Test Meeting","description":"Testing join feature"}')
echo "$MEETING" | head -c 300
MEETING_ID=$(echo $MEETING | grep -o '"id":[0-9]*' | head -1 | cut -d: -f2)
echo -e "\nMeeting ID: $MEETING_ID\n"

# Test 3: Get meeting participants before join
if [ ! -z "$MEETING_ID" ] && [ "$MEETING_ID" -gt 0 ]; then
  echo "3. Get participants before join:"
  curl -s -X GET "$API_BASE/meetings/$MEETING_ID/participants" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" | head -c 300
  echo -e "\n\n"

  # Test 4: Join meeting
  echo "4. Join meeting:"
  curl -s -X POST "$API_BASE/meetings/$MEETING_ID/join" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"name":"Test User","role":"participant"}'
  echo -e "\n\n"

  # Test 5: Get meeting participants after join
  echo "5. Get participants after join:"
  curl -s -X GET "$API_BASE/meetings/$MEETING_ID/participants" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json"
  echo -e "\n"
fi
