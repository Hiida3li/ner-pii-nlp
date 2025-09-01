#!/usr/bin/env python3
"""
Simple test without PII detection to isolate the issue
"""
import sys
import os

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

# Test direct masking functions
def test_direct_masking():
    print("🧪 Testing Direct Masking Functions")
    print("=" * 40)
    
    from chatbot import PrivacyChatbot
    
    # Initialize chatbot
    chatbot = PrivacyChatbot()
    
    # Simulate detected entities (without calling PII detector)
    entities = [
        {'text': 'John Smith', 'entity_type': 'PER', 'start': 8, 'end': 18},
        {'text': 'Microsoft', 'entity_type': 'ORG', 'start': 24, 'end': 33},
        {'text': 'john@microsoft.com', 'entity_type': 'EMAIL', 'start': 50, 'end': 68}
    ]
    
    text = "Hi, I am John Smith from Microsoft and my email is john@microsoft.com"
    print(f"Original text: {text}")
    
    # Test masking
    masked_text = chatbot.mask_entities(text, entities)
    print(f"Masked text: {masked_text}")
    
    # Test unmasking
    unmasked_text = chatbot.unmask_text(masked_text)
    print(f"Unmasked text: {unmasked_text}")
    
    # Show mappings
    print("\nEntity mappings:")
    for original, masked in chatbot.entity_mappings.items():
        print(f"  {masked} ← {original}")
    
    print("\n✅ Direct masking test completed!")

if __name__ == "__main__":
    test_direct_masking()