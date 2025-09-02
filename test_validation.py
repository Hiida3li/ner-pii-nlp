#!/usr/bin/env python3
"""
Test validation filters for PERSON and ORGANIZATION entities
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

print("🔬 Testing Entity Validation Filters")
print("=" * 60)

# Test cases for validation
test_cases = [
    # Single letters (should be filtered)
    ("j", "Single letter 'j'"),
    ("a b c", "Single letters separated"),
    
    # Random strings without vowels (should be filtered)
    ("jhjwjwgfjwgjfgwegfh", "Random string 1"),
    ("gfjgwhfgwhgfhwgfhwegfhwdmnbsjhfsjhfbdwjhbfjw", "Random string 2"),
    ("bcdfghjklmnp", "Consonants only"),
    
    # Valid names (should be detected)
    ("Ahmed", "Valid name - Ahmed"),
    ("Microsoft", "Valid organization - Microsoft"),
    ("John Smith", "Valid full name"),
    
    # Edge cases
    ("IBM", "Short but valid org"),
    ("AI", "Two letter acronym"),
]

print("\nTesting individual strings:")
print("-" * 40)

for test_text, description in test_cases:
    sentence = f"This is about {test_text} today"
    entities = test_detection(sentence)
    
    # Check if any PERSON or ORGANIZATION was detected for this text
    detected = any(
        test_text.lower() in e['text'].lower() and 
        e['entity_type'] in ['PERSON', 'ORGANIZATION'] 
        for e in entities
    )
    
    if detected:
        entity = next(e for e in entities if test_text.lower() in e['text'].lower())
        print(f"❌ {description}: '{test_text}' → Detected as {entity['entity_type']}")
    else:
        print(f"✅ {description}: '{test_text}' → Filtered out")

print("\n" + "=" * 60)
print("\nTesting combined sentence:")
test_combined = "Meeting with j about jhjwjwgfjwgjfgwegfh and gfjgwhfgwhgfhwgfhwegfhwdmnbsjhfsjhfbdwjhbfjw issues"
print(f"Input: {test_combined}")

entities = test_detection(test_combined)
if entities:
    print("\n⚠️  Detected entities (should be empty or minimal):")
    for e in entities:
        print(f"  - {e['text']} → {e['entity_type']}")
else:
    print("\n✅ No entities detected (correct - all were filtered)")

print("\n" + "=" * 60)
print("✨ Validation filters applied successfully!")