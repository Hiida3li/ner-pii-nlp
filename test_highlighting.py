#!/usr/bin/env python3
"""
Test highlighting logic - verify only actual PII placeholders are highlighted
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
        return result
    return None

print("🔬 Testing Highlighting Logic")
print("=" * 60)

# Test case with both regular words and actual PII
test_text = """
I need to discuss email and phone policies. 
My actual email is john@example.com and my phone is 94216781.
We should update our email system and phone directory.
"""

print("Input text:")
print(test_text)
print("\n" + "=" * 60)

result = test_detection(test_text)

if result:
    print("\n✅ Detected Entities:")
    for entity in result.get('entities', []):
        print(f"  - {entity['text']} → {entity['entity_type']}")
    
    print("\n📝 Masked Text:")
    print(result.get('masked_text', ''))
    
    print("\n🎯 What should be highlighted:")
    print("  - Email1 (placeholder for john@example.com)")
    print("  - Phone1 (placeholder for 94216781)")
    print("\n⚠️  Regular words 'email' and 'phone' should NOT be highlighted")
    
print("\n" + "=" * 60)
print("✨ Open http://localhost:9000/chatbot to test the highlighting visually")
print("   Type the test message and verify only placeholders are colored")