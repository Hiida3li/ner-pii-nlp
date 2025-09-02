#!/usr/bin/env python3
"""
Test obfuscated PII detection
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

print("🔬 Testing Obfuscated PII Detection")
print("=" * 60)

# Test cases for obfuscated data
test_cases = [
    # Obfuscated URLs
    ("Visit http : // orki . ai for more info", "URL with spaces"),
    ("Check www . google . com today", "URL with dots and spaces"),
    ("Go to github . com / anthropic", "URL with spaces in path"),
    
    # Obfuscated emails
    ("Contact ahmed @ gmail . com", "Email with spaces"),
    ("Send to john . doe @ company . co", "Email with dots and spaces"),
    
    # Obfuscated phone numbers
    ("Call 94.21.67.81 now", "Phone with dots"),
    ("Number is 94 21 67 81", "Phone with spaces"),
    ("Hotline: 9 4 2 1 6 7 8 1", "Phone with single spaces"),
    ("Arabic: ٩٤ ٢١ ٦٧ ٨١", "Arabic numerals with spaces"),
    
    # Mixed obfuscation
    ("+9 6 8 9 4 2 1 6 7 8 1", "Phone with country code and spaces"),
    ("9-4-2-1-6-7-8-1", "Phone with dashes"),
]

print("\nTest Results:")
print("-" * 40)

success_count = 0
total_count = len(test_cases)

for test_text, description in test_cases:
    entities = test_detection(test_text)
    
    # Check if the obfuscated PII was detected
    detected_types = [e['entity_type'] for e in entities]
    
    if 'URL' in description and 'URL' in detected_types:
        print(f"✅ {description}: Detected")
        for e in entities:
            if e['entity_type'] == 'URL':
                print(f"   Found: '{e['text']}'")
        success_count += 1
    elif 'Email' in description and 'EMAIL' in detected_types:
        print(f"✅ {description}: Detected")
        for e in entities:
            if e['entity_type'] == 'EMAIL':
                print(f"   Found: '{e['text']}'")
        success_count += 1
    elif ('Phone' in description or 'Hotline' in description or 'Arabic' in description) and 'PHONE' in detected_types:
        print(f"✅ {description}: Detected")
        for e in entities:
            if e['entity_type'] == 'PHONE':
                print(f"   Found: '{e['text']}'")
        success_count += 1
    else:
        print(f"❌ {description}: Not detected")
        print(f"   Input: '{test_text}'")
        if entities:
            print(f"   Got: {detected_types}")

print("\n" + "=" * 60)
print(f"📊 Success Rate: {success_count}/{total_count} ({(success_count/total_count*100):.1f}%)")
print("✨ Obfuscation detection test completed!")