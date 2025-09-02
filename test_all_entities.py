#!/usr/bin/env python3
"""
Comprehensive test for ALL PII entity types to ensure they are detected and masked
before being sent to the LLM
"""

import requests
import json
import time

def test_pii_detection(text):
    """Test PII detection via API"""
    response = requests.post(
        'http://localhost:9000/api/extract',
        json={'text': text, 'model_version': 'v2'}
    )
    
    if response.status_code == 200:
        result = response.json()
        return result
    return None

def test_chat_masking(message):
    """Test that entities are masked in chat before sending to LLM"""
    response = requests.post(
        'http://localhost:9000/api/chat',
        json={'message': message},
        stream=True
    )
    
    # Collect the streaming response
    full_response = {
        'masked_message': None,
        'entities_detected': [],
        'llm_received': None
    }
    
    for line in response.iter_lines():
        if line:
            line_str = line.decode('utf-8')
            if line_str.startswith('data: '):
                try:
                    data = json.loads(line_str[6:])
                    if data.get('type') == 'start':
                        full_response['masked_message'] = data.get('masked_message', '')
                        full_response['entities_detected'] = data.get('entities', [])
                        # This is what the LLM actually sees
                        full_response['llm_received'] = data.get('masked_message', '')
                except json.JSONDecodeError:
                    continue
    
    return full_response

print("🔬 COMPREHENSIVE PII DETECTION TEST")
print("=" * 70)
print("Testing ALL entity types to ensure they are detected and masked")
print("=" * 70)

# Test message with ALL entity types
comprehensive_test = """
Hello, my name is Ahmed Al-Rashid and I work at Microsoft Corporation.
I'm from Muscat, Oman. You can reach me at ahmed.rashid@gmail.com or
visit my website at https://ahmedtech.ai

My phone number is 94216781 and my office line is 24343998.

For identification:
- My Civil ID is 123456789
- Credit Card: 4111111111111111
- Passport: AB1234567

I need help with my account security.
"""

print("\n📝 TEST MESSAGE:")
print("-" * 50)
print(comprehensive_test)
print("-" * 50)

# Test PII Detection
print("\n🔍 TESTING PII DETECTION API:")
print("-" * 50)

detection_result = test_pii_detection(comprehensive_test)

if detection_result:
    entities = detection_result.get('entities', [])
    masked_text = detection_result.get('masked_text', '')
    
    print(f"✅ Detected {len(entities)} entities\n")
    
    # Group entities by type
    entity_types = {}
    for entity in entities:
        entity_type = entity['entity_type']
        if entity_type not in entity_types:
            entity_types[entity_type] = []
        entity_types[entity_type].append(entity['text'])
    
    # Check for each required entity type
    required_types = {
        'PERSON': ['Ahmed Al-Rashid', 'Ahmed'],
        'ORGANIZATION': ['Microsoft Corporation', 'Microsoft'],
        'LOCATION': ['Muscat', 'Oman'],
        'EMAIL': ['ahmed.rashid@gmail.com'],
        'URL': ['https://ahmedtech.ai', 'ahmedtech.ai'],
        'PHONE': ['94216781', '24343998'],
        'CIVIL-ID': ['123456789'],
        'CREDIT-CARD': ['4111111111111111'],
        'PASSPORT': ['AB1234567']
    }
    
    print("📊 ENTITY DETECTION RESULTS:")
    for entity_type, expected_examples in required_types.items():
        if entity_type in entity_types:
            detected = entity_types[entity_type]
            print(f"✅ {entity_type}: {detected}")
        else:
            print(f"❌ {entity_type}: NOT DETECTED (expected: {expected_examples})")
    
    print("\n🎭 MASKED TEXT (What LLM would see):")
    print("-" * 50)
    print(masked_text)
    print("-" * 50)
    
    # Verify masking
    print("\n✔️ MASKING VERIFICATION:")
    sensitive_terms = [
        'Ahmed', 'Al-Rashid', 'Microsoft', 'Muscat', 'Oman',
        'ahmed.rashid@gmail.com', 'ahmedtech.ai', '94216781', '24343998',
        '123456789', '4111111111111111', 'AB1234567'
    ]
    
    leaked_terms = []
    for term in sensitive_terms:
        if term.lower() in masked_text.lower():
            leaked_terms.append(term)
    
    if leaked_terms:
        print(f"⚠️ WARNING: Found unmasked sensitive data: {leaked_terms}")
    else:
        print("✅ All sensitive data properly masked!")

# Test Chat API Masking
print("\n\n🤖 TESTING CHAT API MASKING:")
print("-" * 50)

simpler_test = "My name is John Smith, email john@example.com, phone 94567890"
print(f"Test message: {simpler_test}")

chat_result = test_chat_masking(simpler_test)

if chat_result['masked_message']:
    print(f"\n✅ Entities detected: {len(chat_result['entities_detected'])}")
    for entity in chat_result['entities_detected']:
        print(f"   - {entity.get('text', '')} → {entity.get('entity_type', '')}")
    
    print(f"\n🎭 What LLM receives: '{chat_result['llm_received']}'")
    
    # Verify no PII leaked
    if 'john' in chat_result['llm_received'].lower() or '@example.com' in chat_result['llm_received']:
        print("❌ WARNING: PII leaked to LLM!")
    else:
        print("✅ PII successfully masked before sending to LLM")

print("\n" + "=" * 70)
print("📊 SUMMARY:")
print("-" * 50)

if detection_result and len(entities) > 0:
    total_expected = len(required_types)
    total_detected = len(entity_types)
    success_rate = (total_detected / total_expected) * 100
    
    print(f"Entity Types Detected: {total_detected}/{total_expected} ({success_rate:.1f}%)")
    print(f"Total Entities Found: {len(entities)}")
    
    if success_rate == 100:
        print("\n✅ SUCCESS: All PII entity types are being detected!")
    else:
        print(f"\n⚠️ Some entity types not detected. Detection rate: {success_rate:.1f}%")
else:
    print("❌ FAILED: No entities detected")

print("\n✨ Test completed!")
print("=" * 70)