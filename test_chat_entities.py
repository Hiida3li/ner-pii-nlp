#!/usr/bin/env python3
"""
Test that entities are being masked in chat
"""

import requests
import json
import time

def test_chat_api(message):
    """Test chat API with streaming"""
    print(f"\n📝 Sending: '{message}'")
    
    response = requests.post(
        'http://localhost:9000/api/chat',
        json={'message': message},
        stream=True
    )
    
    masked_message = None
    entities_found = []
    
    for line in response.iter_lines():
        if line:
            line_str = line.decode('utf-8')
            if line_str.startswith('data: '):
                try:
                    data = json.loads(line_str[6:])
                    if data.get('type') == 'start':
                        masked_message = data.get('masked_message', '')
                        entities_found = data.get('entities', [])
                        break
                except:
                    continue
    
    return masked_message, entities_found

print("🔬 Testing Chat API Entity Masking")
print("=" * 60)

# Test messages with names and organizations
test_messages = [
    "My name is Ahmed and I live in Muscat",
    "John Smith works at Microsoft",
    "Contact Sarah at sarah@example.com or call 94216781",
    "I am Mohammed from Oman, my phone is 77550536"
]

for message in test_messages:
    masked, entities = test_chat_api(message)
    
    print(f"   Entities detected: {len(entities)}")
    if entities:
        for e in entities:
            print(f"      - {e.get('text', '')} → {e.get('entity_type', '')}")
    
    print(f"   Masked message: '{masked}'")
    
    # Check if PII is leaked
    sensitive_words = ['ahmed', 'john', 'smith', 'sarah', 'mohammed', 'microsoft', '94216781', '77550536', 'muscat', 'oman']
    leaked = [w for w in sensitive_words if w in (masked or '').lower()]
    
    if leaked:
        print(f"   ❌ LEAKED PII: {leaked}")
    else:
        print(f"   ✅ All PII masked successfully")

print("\n" + "=" * 60)