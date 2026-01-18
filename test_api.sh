#!/bin/bash

# Test the meeting creation endpoint

echo "🧪 Testing Meeting Creation Endpoint"
echo "===================================="

# Try without slash
echo -e "\n1️⃣ Testing POST /api/v1/meetings (no slash)"
curl -X POST http://localhost:8000/api/v1/meetings \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Meeting"}' \
  -w "\nStatus: %{http_code}\n" 2>&1

# Try with slash
echo -e "\n2️⃣ Testing POST /api/v1/meetings/ (with slash)"
curl -X POST http://localhost:8000/api/v1/meetings/ \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Meeting"}' \
  -w "\nStatus: %{http_code}\n" 2>&1

# Test with valid token
echo -e "\n3️⃣ Testing with Bearer token"
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbiIsImV4cCI6OTk5OTk5OTk5OX0.BcOFkYVmxqipb3ZY-T4m_W_ZVBWLaOhGE-i-XDXkMAI"
curl -X POST http://localhost:8000/api/v1/meetings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"Test Meeting with Auth"}' \
  -w "\nStatus: %{http_code}\n" 2>&1
