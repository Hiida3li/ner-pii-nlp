#!/usr/bin/env python3
"""
Direct test of PII detector
"""

import requests
import json

def test_detection(text):
    """Test entity detection via API"""
    url = 'http://localhost:9000/api/extract'
    payload = {'text': text, 'model_version': 'v2'}
    
    print(f"\n📝 Testing: '{text}'")
    print(f"   Sending to: {url}")
    print(f"   Payload: {payload}")
    
    response = requests.post(url, json=payload)
    
    print(f"   Status: {response.status_code}")
    
    if response.status_code == 200:
        result = response.json()
        print(f"   Response: {json.dumps(result, indent=2)}")
        return result
    else:
        print(f"   Error: {response.text}")
        return None

print("🔬 Testing PII Detector API")
print("=" * 50)

# Test simple cases
test_cases = [
    "My phone is 94216781",
    "Email me at john@example.com",
    "I am Ahmed from Muscat",
    "My credit card is 4111111111111111"
]

for text in test_cases:
    test_detection(text)

print("\n" + "=" * 50)
print("✨ Test completed!")