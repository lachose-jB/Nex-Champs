#!/usr/bin/env python3
"""
Test script for authentication endpoints
Tests signup and login flows
"""

import requests
import json
import sys

BASE_URL = "http://localhost:8000/api/v1"

def test_signup():
    """Test user signup"""
    print("\n=== Testing Signup ===")
    
    signup_data = {
        "email": "testuser@example.com",
        "password": "TestPassword123!",
        "full_name": "Test User"
    }
    
    response = requests.post(
        f"{BASE_URL}/auth/signup",
        json=signup_data
    )
    
    print(f"Signup Status: {response.status_code}")
    if response.status_code in [200, 201]:
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        print("✓ Signup successful")
        return response.json()
    else:
        print(f"Response Text: {response.text}")
        try:
            print(f"Response JSON: {json.dumps(response.json(), indent=2)}")
        except:
            pass
        print("✗ Signup failed")
        return None

def test_login(email, password):
    """Test user login"""
    print("\n=== Testing Login ===")
    
    # Using form data for OAuth2
    login_data = {
        "username": email,  # Can use email or username
        "password": password
    }
    
    response = requests.post(
        f"{BASE_URL}/auth/token",
        data=login_data
    )
    
    print(f"Login Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    if response.status_code == 200:
        print("✓ Login successful")
        return response.json()
    else:
        print("✗ Login failed")
        return None

def test_get_current_user(token):
    """Test getting current user info"""
    print("\n=== Testing Get Current User ===")
    
    headers = {
        "Authorization": f"Bearer {token}"
    }
    
    response = requests.get(
        f"{BASE_URL}/auth/users/me/",
        headers=headers
    )
    
    print(f"Get User Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    if response.status_code == 200:
        print("✓ Get current user successful")
        return True
    else:
        print("✗ Get current user failed")
        return False

def test_get_meetings(token):
    """Test getting meetings (requires auth)"""
    print("\n=== Testing Get Meetings ===")
    
    headers = {
        "Authorization": f"Bearer {token}"
    }
    
    response = requests.get(
        f"{BASE_URL}/meetings/",
        headers=headers
    )
    
    print(f"Get Meetings Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    if response.status_code == 200:
        print("✓ Get meetings successful")
        return True
    else:
        print("✗ Get meetings failed")
        return False

if __name__ == "__main__":
    print("Starting Authentication Tests...")
    
    # Test signup
    signup_result = test_signup()
    if not signup_result:
        print("\n❌ Signup test failed. Exiting.")
        sys.exit(1)
    
    token = signup_result.get("access_token")
    email = signup_result.get("user", {}).get("email")
    password = "TestPassword123!"
    
    # Test login with new account
    login_result = test_login(email, password)
    if not login_result:
        print("\n❌ Login test failed. Exiting.")
        sys.exit(1)
    
    token = login_result.get("access_token")
    
    # Test getting current user
    if not test_get_current_user(token):
        print("\n❌ Get current user test failed.")
        sys.exit(1)
    
    # Test getting meetings
    if not test_get_meetings(token):
        print("\n❌ Get meetings test failed.")
        sys.exit(1)
    
    print("\n✓ All tests passed!")
