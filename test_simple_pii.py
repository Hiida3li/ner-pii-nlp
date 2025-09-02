#!/usr/bin/env python3
"""
Simple test to debug PII detection
"""

import requests
import json

def test_detection(text):
    """Test entity detection via API"""
    print(f"\nTesting: '{text}'")
    
    response = requests.post(
        'http://localhost:9000/api/extract',
        json={'text': text, 'model_version': 'v2'}
    )
    
    if response.status_code == 200:
        result = response.json()
        print(f"Response keys: {result.keys()}")
        entities = result.get('entities', [])
        
        if entities:
            print(f"✅ Found {len(entities)} entities:")
            for e in entities:
                print(f"   - {e['text']} → {e['entity_type']}")
        else:
            print("❌ No entities detected")
        
        return result
    else:
        print(f"❌ API Error: {response.status_code}")
        return None

print("🔬 Simple PII Detection Test")
print("=" * 50)

# Test individual entity types
test_cases = [
    "Call me at 94216781",
    "My email is john@example.com",
    "Visit google.com",
    "I live in Muscat",
    "John Smith works here",
    "Microsoft is a company",
    "Credit card 4111111111111111",
    "Passport AB1234567",
    "Civil ID 123456789"
]

for test_text in test_cases:
    test_detection(test_text)

print("\n" + "=" * 50)
print("\n🔬 Testing combined message:")

combined = """My name is Ahmed and I live in Muscat. 
Call me at 94216781 or email ahmed@gmail.com"""

result = test_detection(combined)

print("\n✨ Test completed!")