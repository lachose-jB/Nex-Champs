# 🧪 Nex-Champs Backend API Testing Guide

This guide shows you how to test the Nex-Champs backend API using curl commands and Python scripts.

## 🚀 Starting the Server

First, start the FastAPI server:

```bash
cd /mnt/c/Users/Shota/PycharmProjects/Nex-Champs/backend
uvicorn main:app --reload
```

The server will start on `http://localhost:8000`

## 📋 API Endpoints Overview

### Base URL
```
http://localhost:8000/api/v1
```

### Authentication
- `POST /auth/token` - Get JWT token
- `GET /auth/users/me` - Get current user info

### Meetings
- `POST /meetings/` - Create meeting
- `GET /meetings/` - List meetings
- `GET /meetings/{id}` - Get meeting details

### Tokens
- `POST /tokens/meetings/{id}/claim` - Claim token
- `POST /tokens/meetings/{id}/release` - Release token

### Phases
- `POST /phases/meetings/{id}/change` - Change meeting phase

### Annotations
- `POST /annotations/meetings/{id}` - Create annotation
- `GET /annotations/meetings/{id}` - List annotations

### Decisions
- `POST /decisions/meetings/{id}` - Create decision
- `GET /decisions/meetings/{id}` - List decisions

### Statistics
- `GET /stats/meetings/{id}/stats` - Get meeting statistics
- `GET /stats/meetings/{id}/audit` - Get audit trail

## 🔐 Authentication

First, get a JWT token:

```bash
curl -X POST "http://localhost:8000/api/v1/auth/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin&password=secret"
```

Example response:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

Use this token in subsequent requests:
```bash
export TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## 🏢 Meeting Management

### Create a Meeting

```bash
curl -X POST "http://localhost:8000/api/v1/meetings/" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Product Strategy Meeting",
    "description": "Quarterly planning session"
  }'
```

### List Meetings

```bash
curl -X GET "http://localhost:8000/api/v1/meetings/" \
  -H "Authorization: Bearer $TOKEN"
```

### Get Meeting Details

```bash
curl -X GET "http://localhost:8000/api/v1/meetings/1" \
  -H "Authorization: Bearer $TOKEN"
```

## 🎫 Token Engine

### Claim Token

```bash
curl -X POST "http://localhost:8000/api/v1/tokens/meetings/1/claim" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "participant_id": 1,
    "event_type": "claim"
  }'
```

### Release Token

```bash
curl -X POST "http://localhost:8000/api/v1/tokens/meetings/1/release" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "participant_id": 1,
    "event_type": "release"
  }'
```

## 📊 Phase Management

### Change Phase

```bash
curl -X POST "http://localhost:8000/api/v1/phases/meetings/1/change" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "phase_name": "clarification",
    "started_by": 1
  }'
```

## 🎨 Canvas Annotations

### Create Annotation

```bash
curl -X POST "http://localhost:8000/api/v1/annotations/meetings/1" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "participant_id": 1,
    "annotation_type": "text",
    "content": "{\"text\": \"Main goal\", \"x\": 100, \"y\": 50}",
    "timestamp_ms": 15000
  }'
```

### List Annotations

```bash
curl -X GET "http://localhost:8000/api/v1/annotations/meetings/1" \
  -H "Authorization: Bearer $TOKEN"
```

## ✅ Decision Tracking

### Create Decision

```bash
curl -X POST "http://localhost:8000/api/v1/decisions/meetings/1" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Increase R&D Budget",
    "description": "Allocate additional 20% budget to R&D",
    "decided_by": 1,
    "phase": "ideation"
  }'
```

### List Decisions

```bash
curl -X GET "http://localhost:8000/api/v1/decisions/meetings/1" \
  -H "Authorization: Bearer $TOKEN"
```

## 📊 Statistics and Audit

### Get Meeting Statistics

```bash
curl -X GET "http://localhost:8000/api/v1/stats/meetings/1/stats" \
  -H "Authorization: Bearer $TOKEN"
```

### Get Audit Trail

```bash
curl -X GET "http://localhost:8000/api/v1/stats/meetings/1/audit" \
  -H "Authorization: Bearer $TOKEN"
```

## 🧪 Python Test Script

Here's a Python script to test the API:

```python
import requests
import json

# Configuration
BASE_URL = "http://localhost:8000/api/v1"

# Step 1: Authentication
def get_token():
    response = requests.post(
        f"{BASE_URL}/auth/token",
        data={"username": "admin", "password": "secret"},
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    return response.json()["access_token"]

# Step 2: Create Meeting
def create_meeting(token):
    response = requests.post(
        f"{BASE_URL}/meetings/",
        json={
            "name": "Test Meeting",
            "description": "Testing API"
        },
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
    )
    return response.json()

# Step 3: Test Token System
def test_token_system(token, meeting_id):
    # Claim token
    claim_response = requests.post(
        f"{BASE_URL}/tokens/meetings/{meeting_id}/claim",
        json={"participant_id": 1, "event_type": "claim"},
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
    )
    print("Token claimed:", claim_response.json())

    # Release token
    release_response = requests.post(
        f"{BASE_URL}/tokens/meetings/{meeting_id}/release",
        json={"participant_id": 1, "event_type": "release"},
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
    )
    print("Token released:", release_response.json())

# Main test function
def main():
    print("🧪 Testing Nex-Champs API...")

    # Get authentication token
    token = get_token()
    print(f"✅ Got token: {token[:20]}...")

    # Create meeting
    meeting = create_meeting(token)
    meeting_id = meeting["id"]
    print(f"✅ Created meeting: {meeting['name']} (ID: {meeting_id})")

    # Test token system
    test_token_system(token, meeting_id)

    print("🎉 API testing completed!")

if __name__ == "__main__":
    main()
```

## 🔧 Troubleshooting

### Server not starting
- Check Python dependencies: `pip install -r requirements.txt`
- Check port availability: Make sure port 8000 is free
- Check import errors: Fix any relative import issues

### Authentication failed
- Use username: `admin`, password: `secret`
- Check JWT token format in headers
- Verify token expiration time

### Database errors
- Check SQLite file permissions
- Verify database URL in `.env` file
- Ensure all models are properly imported

### CORS issues
- The backend is configured to allow all origins for development
- In production, configure `ALLOWED_ORIGINS` in `.env`

## 📚 API Documentation

For interactive API documentation, visit:
- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

## 🎯 Next Steps

1. **Frontend Integration**: Connect React components to these endpoints
2. **WebSocket Testing**: Use JavaScript WebSocket client to test real-time features
3. **WebRTC Testing**: Implement WebRTC signaling with the provided endpoints
4. **Performance Testing**: Test with multiple concurrent users
5. **Security Testing**: Validate authentication and authorization

The backend is now fully functional and ready for comprehensive testing!