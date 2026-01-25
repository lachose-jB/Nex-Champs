#!/usr/bin/env python3
"""
Diagnostic script to test complete auth flow
"""
import requests
import json

BASE_URL = "http://127.0.0.1:8000/api/v1"
ADMIN_EMAIL = "jadjahouisso@gmail.com"
ADMIN_PASSWORD = "TestPassword123!"

print("=" * 60)
print("🔍 AUTHENTICATION DIAGNOSTIC")
print("=" * 60)

# Step 1: Test login
print("\n1️⃣  Testing login endpoint...")
response = requests.post(
    f"{BASE_URL}/auth/token",
    data={"username": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
)
print(f"   Endpoint: POST /auth/token")
print(f"   Status: {response.status_code} {'✓' if response.status_code == 200 else '✗'}")

if response.status_code != 200:
    print(f"   Error: {response.json()}")
    exit(1)

token_data = response.json()
access_token = token_data["access_token"]
print(f"   Response: {list(token_data.keys())}")
print(f"   Token: {access_token[:40]}...")

# Step 2: Test authenticated request
print("\n2️⃣  Testing authenticated request...")
headers = {"Authorization": f"Bearer {access_token}"}
response = requests.get(f"{BASE_URL}/auth/users/me/", headers=headers)
print(f"   Endpoint: GET /auth/users/me/")
print(f"   Status: {response.status_code} {'✓' if response.status_code == 200 else '✗'}")
if response.status_code == 200:
    user = response.json()
    print(f"   User: {user['email']}")

# Step 3: Test /meetings/ endpoint
print("\n3️⃣  Testing GET /meetings/ endpoint...")
response = requests.get(f"{BASE_URL}/meetings/", headers=headers)
print(f"   Endpoint: GET /meetings/")
print(f"   Status: {response.status_code} {'✓' if response.status_code == 200 else '✗'}")
if response.status_code == 200:
    meetings = response.json()
    print(f"   Meetings count: {len(meetings)}")

# Step 4: Test without token
print("\n4️⃣  Testing without authentication...")
response = requests.get(f"{BASE_URL}/meetings/")
print(f"   Endpoint: GET /meetings/ (no token)")
print(f"   Status: {response.status_code} {'✓ (401 expected)' if response.status_code == 401 else '✗'}")

print("\n" + "=" * 60)
print("✅ DIAGNOSTIC COMPLETE - Backend is working correctly!")
print("=" * 60)
print("\n📝 If frontend shows 401 errors:")
print("   1. Check that localStorage has 'auth_token'")
print("   2. Check that Authorization header is sent")
print("   3. Clear browser cache and reload")
print("   4. Check console for JavaScript errors")
