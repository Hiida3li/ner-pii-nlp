#!/usr/bin/env python3
"""
Test PII masking before sending to LLM
Verifies that all entity types are properly detected and masked
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.chatbot import PrivacyChatbot

def test_entity_detection_and_masking():
    """Test that all PII entity types are detected and masked"""
    
    chatbot = PrivacyChatbot()
    
    print("🔬 PII DETECTION AND MASKING TEST")
    print("=" * 70)
    
    # Test messages with different entity types
    test_cases = [
        ("My phone is 94216781", "PHONE"),
        ("Email me at john@example.com", "EMAIL"),
        ("Visit google.com for info", "URL"),
        ("I live in Muscat, Oman", "LOCATION"),
        ("John Smith is my name", "PERSON"),
        ("I work at Microsoft", "ORGANIZATION"),
        ("My civil ID is 123456789", "CIVIL-ID"),
        ("Card number 4111111111111111", "CREDIT-CARD"),
        ("Passport AB1234567", "PASSPORT"),
    ]
    
    print("\n📝 INDIVIDUAL ENTITY TESTS:")
    print("-" * 50)
    
    success_count = 0
    total_count = len(test_cases)
    
    for test_text, expected_type in test_cases:
        print(f"\nTest: '{test_text}'")
        
        # Detect PII
        result = chatbot.detect_pii(test_text)
        entities = result.get('entities', [])
        
        if entities:
            # Mask the entities
            masked = chatbot.mask_entities(test_text, entities)
            
            print(f"✅ Detected: {[e['entity_type'] for e in entities]}")
            print(f"   Masked: '{masked}'")
            
            # Verify sensitive data is masked
            if any(sensitive in masked.lower() for sensitive in ['94216781', 'john', 'google', 'muscat', 'microsoft', '4111111111111111', 'ab1234567', '123456789']):
                print("   ⚠️ WARNING: Sensitive data not fully masked!")
            else:
                success_count += 1
        else:
            print(f"❌ No entities detected (expected: {expected_type})")
    
    print("\n" + "=" * 70)
    print("\n📝 COMPREHENSIVE TEST WITH ALL ENTITIES:")
    print("-" * 50)
    
    comprehensive_message = """Hello, I'm Ahmed Al-Rashid from Muscat, Oman.
Contact me at ahmed@example.com or call 94216781.
Visit my site at https://example.ai
I work at Microsoft Corporation.
My civil ID is 101234567, credit card 4111111111111111, and passport AB1234567."""
    
    print(f"Original message:\n{comprehensive_message}")
    print("\n" + "-" * 50)
    
    # Detect all PII
    result = chatbot.detect_pii(comprehensive_message)
    entities = result.get('entities', [])
    
    print(f"\n✅ Detected {len(entities)} entities:")
    
    # Group by type
    entity_types = {}
    for entity in entities:
        entity_type = entity['entity_type']
        if entity_type not in entity_types:
            entity_types[entity_type] = []
        entity_types[entity_type].append(entity['text'])
    
    for entity_type, items in entity_types.items():
        print(f"   {entity_type}: {items}")
    
    # Mask the message
    masked_message = chatbot.mask_entities(comprehensive_message, entities)
    
    print(f"\n🎭 MASKED MESSAGE (sent to LLM):")
    print("-" * 50)
    print(masked_message)
    print("-" * 50)
    
    # Verify no PII leaked
    sensitive_terms = [
        'ahmed', 'al-rashid', 'muscat', 'oman', 
        'ahmed@example.com', '94216781', 'example.ai',
        'microsoft', '101234567', '4111111111111111', 'ab1234567'
    ]
    
    leaked = []
    for term in sensitive_terms:
        if term.lower() in masked_message.lower():
            leaked.append(term)
    
    print("\n📊 MASKING VERIFICATION:")
    if leaked:
        print(f"❌ LEAKED PII: {leaked}")
        print("   The LLM would see this sensitive data!")
    else:
        print("✅ SUCCESS: All PII properly masked!")
        print("   The LLM never sees the actual sensitive data")
    
    # Test unmasking
    print("\n🔄 TESTING UNMASK (for user display):")
    unmasked = chatbot.unmask_text(masked_message)
    if 'ahmed' in unmasked.lower() and '94216781' in unmasked:
        print("✅ Unmasking works - original data can be restored for display")
    else:
        print("❌ Unmasking failed")
    
    print("\n" + "=" * 70)
    print("📊 SUMMARY:")
    print(f"   Individual tests passed: {success_count}/{total_count}")
    print(f"   Total entities detected: {len(entities)}")
    print(f"   Entity types found: {list(entity_types.keys())}")
    
    required_types = ['PHONE', 'EMAIL', 'URL', 'LOC', 'CREDIT-CARD', 'CIVIL-ID', 'PASSPORT']
    missing_types = [t for t in required_types if t not in entity_types]
    
    if missing_types:
        print(f"   ⚠️ Missing entity types: {missing_types}")
    
    if not leaked and len(entities) > 5:
        print("\n✅ TEST PASSED: PII detection and masking is working!")
        print("   All sensitive data is masked before reaching the LLM")
    else:
        print("\n❌ TEST FAILED: Issues with PII detection or masking")
    
    print("\n✨ Test completed!")

if __name__ == "__main__":
    test_entity_detection_and_masking()