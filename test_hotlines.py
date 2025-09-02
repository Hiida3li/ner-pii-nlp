#!/usr/bin/env python3
"""
Test Omani hotline number detection
"""

import requests
import json

def test_phone(text):
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

print("🔬 Omani Hotline & Phone Number Test")
print("=" * 60)

# Test cases for hotlines and special formats
test_cases = [
    # Hotlines
    ("9999", "4-digit hotline"),
    ("1234", "4-digit service number"),
    ("80077444", "Toll-free hotline"),
    ("22848232", "8-digit landline"),
    
    # Regular Omani numbers
    ("94216781", "Mobile starting with 9"),
    ("77550536", "Mobile starting with 7"),
    ("24343998", "Landline starting with 2"),
    
    # Should be filtered
    ("555", "3-digit number (too short)"),
    ("12345", "5-digit number (invalid)"),
    ("88888888", "8-digit starting with 8"),
]

for number, description in test_cases:
    test_text = f"Call {number} for assistance"
    entities = test_phone(test_text)
    
    if entities:
        print(f"✅ {description}: '{number}' → Detected as {entities[0]['text']}")
    else:
        print(f"❌ {description}: '{number}' → Not detected")

print("\n" + "=" * 60)
print("✨ Test completed! The app is ready at http://localhost:9000")