#!/usr/bin/env python3
"""
Test script to demonstrate privacy masking functionality
"""
import sys
import os

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from chatbot import PrivacyChatbot

def test_privacy_masking():
    print("🛡️ Testing Privacy Masking Functionality")
    print("=" * 50)
    
    # Initialize chatbot
    try:
        chatbot = PrivacyChatbot()
        print("✅ Chatbot initialized successfully")
    except Exception as e:
        print(f"❌ Failed to initialize chatbot: {e}")
        return
    
    # Test message with PII
    test_message = "Hi, I am John Smith from Microsoft and my email is john@microsoft.com. I work in Seattle."
    print(f"\n📝 Original Message:")
    print(f"   {test_message}")
    
    # Test with privacy mode ON
    print(f"\n🔒 Testing Privacy Mode ON:")
    print("-" * 30)
    
    try:
        masked_user, masked_response, display_response = chatbot.process_message(
            test_message, privacy_mode=True
        )
        
        print(f"📤 Sent to AI (masked): {masked_user}")
        print(f"🤖 AI Response (with placeholders): {display_response}")
        
        # Show privacy mappings
        print(f"\n🔍 Privacy Mappings:")
        for original, masked in chatbot.entity_mappings.items():
            print(f"   {masked} ← {original}")
            
    except Exception as e:
        print(f"❌ Error in privacy mode ON: {e}")
    
    # Test with privacy mode OFF
    print(f"\n🔓 Testing Privacy Mode OFF:")
    print("-" * 30)
    
    try:
        unmasked_user, masked_response, unmasked_display = chatbot.process_message(
            test_message, privacy_mode=False
        )
        
        print(f"📤 User message (original): {unmasked_user}")
        print(f"🤖 AI Response (unmasked): {unmasked_display}")
        
    except Exception as e:
        print(f"❌ Error in privacy mode OFF: {e}")
    
    print(f"\n✅ Privacy masking test completed!")

if __name__ == "__main__":
    test_privacy_masking()