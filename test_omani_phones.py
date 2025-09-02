#!/usr/bin/env python3
"""
Test Omani phone number detection filter
"""

import requests
import json

def test_phone_detection(text):
    """Test phone number detection via API"""
    response = requests.post(
        'http://localhost:9000/api/extract',
        json={'text': text, 'model_version': 'v2'}
    )
    
    if response.status_code == 200:
        result = response.json()
        phone_entities = [e for e in result.get('entities', []) if e['entity_type'] == 'PHONE']
        return phone_entities
    return []

# Test cases
test_cases = [
    # Valid Omani numbers
    ("+96894216781", True, "Omani mobile with +968"),
    ("96894216781", True, "Omani mobile with 968"),
    ("94216781", True, "Omani mobile starting with 9"),
    ("77550536", True, "Omani mobile starting with 7"),
    ("24343998", True, "Omani landline starting with 2"),
    ("٩٦٥٤٧٨٩١", True, "Arabic numerals"),
    ("+968 9456 7890", True, "Omani with spaces"),
    
    # Invalid numbers (should be filtered out)
    ("1234567890", False, "Random 10 digits"),
    ("+1234567890", False, "US format number"),
    ("555-1234", False, "Short US format"),
    ("8888888", False, "Random 7 digits not starting with 9/7/2"),
    ("34567890", False, "8 digits starting with 3"),
    ("+971501234567", False, "UAE number"),
    ("0501234567", False, "Number starting with 0"),
]

print("🔬 Omani Phone Number Filter Test")
print("=" * 60)

passed = 0
failed = 0

for phone, should_detect, description in test_cases:
    test_text = f"Call me at {phone} tomorrow"
    entities = test_phone_detection(test_text)
    
    detected = len(entities) > 0
    
    if detected == should_detect:
        print(f"✅ PASS: {description}")
        print(f"   Input: '{phone}' → {'Detected' if detected else 'Filtered'}")
        passed += 1
    else:
        print(f"❌ FAIL: {description}")
        print(f"   Input: '{phone}' → Expected: {'Detected' if should_detect else 'Filtered'}, Got: {'Detected' if detected else 'Filtered'}")
        if entities:
            print(f"   Detected: {entities[0]['text']}")
        failed += 1

print("\n" + "=" * 60)
print(f"📊 Results: {passed} passed, {failed} failed out of {len(test_cases)} tests")
print(f"✨ Success rate: {(passed/len(test_cases)*100):.1f}%")