#!/usr/bin/env python3
"""
Test that PERSON, LOCATION, ORGANIZATION entities are being detected
"""

import requests
import json

def test_detection(text):
    """Test entity detection via API"""
    response = requests.post(
        'http://localhost:9000/api/extract',
        json={'text': text, 'model_version': 'v2'}
    )
    
    if response.status_code == 200:
        result = response.json()
        return result.get('entities', [])
    return []

print("🔬 Testing PERSON, LOCATION, ORGANIZATION Detection")
print("=" * 60)

# Test cases that MUST work
test_cases = [
    ("My name is Ahmed Al-Rashid", "PERSON"),
    ("John Smith is here", "PERSON"),
    ("I met Sarah Johnson yesterday", "PERSON"),
    ("Mohammed Ali works here", "PERSON"),
    
    ("I live in Muscat", "LOCATION"),
    ("Visit Dubai tomorrow", "LOCATION"),
    ("From New York City", "LOCATION"),
    ("Located in Salalah, Oman", "LOCATION"),
    
    ("I work at Microsoft", "ORGANIZATION"),
    ("Google is a company", "ORGANIZATION"),
    ("Apple Inc announced", "ORGANIZATION"),
    ("Oman Air flight", "ORGANIZATION"),
]

failed = []

for text, expected_type in test_cases:
    print(f"\nTest: '{text}'")
    print(f"Expected: {expected_type}")
    
    entities = test_detection(text)
    
    if entities:
        detected_types = [e['entity_type'] for e in entities]
        print(f"✅ Detected: {detected_types}")
        for e in entities:
            print(f"   - {e['text']} → {e['entity_type']}")
    else:
        print(f"❌ NO ENTITIES DETECTED!")
        failed.append((text, expected_type))

print("\n" + "=" * 60)
print(f"\n📊 Results: {len(test_cases) - len(failed)}/{len(test_cases)} passed")

if failed:
    print("\n❌ FAILED TESTS:")
    for text, expected in failed:
        print(f"   - '{text}' (expected: {expected})")

print("\n" + "=" * 60)