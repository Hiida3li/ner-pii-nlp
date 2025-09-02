#!/usr/bin/env python3
"""
Test validation for Civil ID, Credit Card, and Passport numbers
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

print("🔬 Testing ID, Credit Card, and Passport Validation")
print("=" * 60)

# Test cases
test_cases = [
    # Valid Civil IDs
    ("My civil ID is 101234567", "CIVIL-ID", True, "Valid Civil ID starting with 10"),
    ("ID number: 123456789", "CIVIL-ID", True, "Valid Civil ID starting with 12"),
    ("Civil: 987654321", "CIVIL-ID", True, "Valid Civil ID starting with 9"),
    ("ID: 8123456789", "CIVIL-ID", True, "Valid Civil ID starting with 8"),
    
    # Invalid Civil IDs
    ("ID: 201234567", "CIVIL-ID", False, "Invalid Civil ID starting with 20"),
    ("Civil: 12345", "CIVIL-ID", False, "Civil ID too short (5 digits)"),
    ("ID: 1234567890123", "CIVIL-ID", False, "Civil ID too long (13 digits)"),
    
    # Valid Credit Cards
    ("Card: 4111111111111111", "CREDIT-CARD", True, "Valid Visa (starts with 4)"),
    ("Pay with 5105105105105100", "CREDIT-CARD", True, "Valid Mastercard (starts with 5)"),
    
    # Invalid Credit Cards
    ("Card: 3111111111111111", "CREDIT-CARD", False, "Invalid card (starts with 3)"),
    ("Number: 411111111111", "CREDIT-CARD", False, "Too short (12 digits)"),
    ("Card: 41111111111111112", "CREDIT-CARD", False, "Too long (17 digits)"),
    
    # Valid Passports
    ("Passport A1234567", "PASSPORT", True, "Valid passport (A + 7 digits)"),
    ("Pass: AB12345678", "PASSPORT", True, "Valid passport (AB + 8 digits)"),
    ("ID: P123456789", "PASSPORT", True, "Valid passport (P + 9 digits)"),
    
    # Invalid Passports
    ("Passport 1234567", "PASSPORT", False, "No letter prefix"),
    ("Pass: ABC1234567", "PASSPORT", False, "Too many letters (3)"),
    ("ID: A12345", "PASSPORT", False, "Too few digits (5)"),
    ("Pass: a1234567", "PASSPORT", False, "Lowercase letter"),
]

print("\nTest Results:")
print("-" * 40)

for test_text, entity_type, should_detect, description in test_cases:
    entities = test_detection(test_text)
    
    # Check if the expected entity type was detected
    detected = any(e['entity_type'] == entity_type for e in entities)
    
    if detected == should_detect:
        print(f"✅ {description}")
        if detected:
            entity = next(e for e in entities if e['entity_type'] == entity_type)
            print(f"   Detected: {entity['text']}")
    else:
        print(f"❌ {description}")
        print(f"   Expected: {'Detected' if should_detect else 'Filtered'}, Got: {'Detected' if detected else 'Filtered'}")
        if entities:
            print(f"   Found entities: {[e['entity_type'] for e in entities]}")

print("\n" + "=" * 60)
print("✨ Validation test completed!")