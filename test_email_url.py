#!/usr/bin/env python3
"""
Test email and URL validation filters
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

print("🔬 Email & URL Validation Test")
print("=" * 60)

# Test cases
test_cases = [
    # Valid emails (should be detected)
    ("john@example.com", "EMAIL", True, "Valid email"),
    ("user.name@company.co", "EMAIL", True, "Email with dots"),
    ("admin@domain.om", "EMAIL", True, "Omani domain"),
    
    # Invalid emails (should be filtered)
    ("hhhhhdfhjeuheu23yey", "EMAIL", False, "Random string"),
    ("something@", "EMAIL", False, "Missing domain"),
    ("@example.com", "EMAIL", False, "Missing username"),
    ("user at example.com", "EMAIL", False, "Missing @ symbol"),
    
    # Valid URLs (should be detected)
    ("google.com", "URL", True, "Simple domain"),
    ("www.example.com", "URL", True, "With www"),
    ("https://github.com", "URL", True, "With https"),
    ("website.ai", "URL", True, ".ai domain"),
    ("site.net/path", "URL", True, "With path"),
    
    # Invalid URLs (should be filtered)
    ("hhhhhdfhjeuheu23yey", "URL", False, "Random string"),
    ("just-text", "URL", False, "No domain extension"),
    ("user@domain.com", "URL", False, "Email not URL"),
    ("something.invalidtld", "URL", False, "Invalid TLD"),
]

for test_text, expected_type, should_detect, description in test_cases:
    sentence = f"Check this: {test_text} for more info"
    entities = test_detection(sentence)
    
    # Check if the expected entity type was detected
    detected = any(e['entity_type'] == expected_type and test_text in e['text'] for e in entities)
    
    if detected == should_detect:
        print(f"✅ {description}: '{test_text}'")
        if detected:
            entity = next(e for e in entities if e['entity_type'] == expected_type)
            print(f"   Detected as: {entity['text']} ({entity['entity_type']})")
    else:
        print(f"❌ {description}: '{test_text}'")
        print(f"   Expected: {'Detected' if should_detect else 'Filtered'}, Got: {'Detected' if detected else 'Filtered'}")

print("\n" + "=" * 60)
print("✨ Test completed! App ready at http://localhost:9000")