#!/usr/bin/env python3
"""
Privacy Demo - Shows how the system masks PII and protects privacy
"""
import sys
import os
import requests

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

def demo_privacy_protection():
    print("🛡️ Privacy Protection Demo")
    print("=" * 50)
    
    # Test message with PII
    test_message = "Hi, I'm John Smith from Microsoft. My email is john.smith@microsoft.com and I work in Seattle."
    
    print(f"📝 Original Message:")
    print(f"   {test_message}")
    print(f"\n🔍 Length: {len(test_message)} characters")
    
    # Test PII detection directly
    print(f"\n🔍 Step 1: Detecting PII entities...")
    
    try:
        # Try to detect PII (mock if API fails)
        try:
            pii_response = requests.post(
                "http://localhost:9000/api/extract",
                json={"text": test_message, "model_version": "v2"},
                timeout=5
            )
            
            if pii_response.status_code == 200:
                pii_data = pii_response.json()
                entities = pii_data.get('entities', [])
                print(f"✅ Found {len(entities)} entities via API")
            else:
                raise Exception("API failed")
                
        except Exception as api_error:
            print(f"⚠️  PII API not available, using mock data: {api_error}")
            # Mock entities for demo
            entities = [
                {'text': 'John Smith', 'entity_type': 'PER', 'start': 8, 'end': 18},
                {'text': 'Microsoft', 'entity_type': 'ORG', 'start': 24, 'end': 33},
                {'text': 'john.smith@microsoft.com', 'entity_type': 'EMAIL', 'start': 47, 'end': 71},
                {'text': 'Seattle', 'entity_type': 'LOC', 'start': 84, 'end': 91}
            ]
            print(f"📋 Using {len(entities)} mock entities")
        
        # Display found entities
        print(f"\n📋 Detected entities:")
        for entity in entities:
            print(f"   • {entity['text']} [{entity['entity_type']}] at {entity['start']}-{entity['end']}")
        
        # Test manual masking
        from chatbot import PrivacyChatbot
        chatbot = PrivacyChatbot()
        
        print(f"\n🔒 Step 2: Masking entities...")
        masked_text = chatbot.mask_entities(test_message, entities)
        
        print(f"📤 Masked message (sent to AI):")
        print(f"   {masked_text}")
        
        # Show privacy mappings
        print(f"\n🗝️  Privacy mappings:")
        for original, masked in chatbot.entity_mappings.items():
            print(f"   {masked} → {original}")
        
        # Simulate AI response with placeholders
        print(f"\n🤖 Step 3: AI processes masked message...")
        mock_ai_response = f"Hello {chatbot.entity_mappings.get('John Smith', 'person1')}! Nice to meet someone from {chatbot.entity_mappings.get('Microsoft', 'organization1')}. How are things in {chatbot.entity_mappings.get('Seattle', 'location1')}?"
        
        print(f"📨 AI response (with placeholders):")
        print(f"   {mock_ai_response}")
        
        # Test unmasking
        print(f"\n🔓 Step 4: Unmasking for display...")
        unmasked_response = chatbot.unmask_text(mock_ai_response)
        
        print(f"👤 Final response to user:")
        print(f"   {unmasked_response}")
        
        print(f"\n✅ Privacy protection demo completed!")
        print(f"\n🔐 Key takeaway: The AI never saw actual names, companies, or personal info!")
        
    except Exception as e:
        print(f"❌ Error in demo: {e}")

if __name__ == "__main__":
    demo_privacy_protection()