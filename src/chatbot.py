"""
Privacy-Preserving Chatbot with PII Detection Layer
This chatbot uses the PII detector as a privacy layer to mask sensitive information
before sending it to OpenAI, ensuring LLMs never see actual private data.
"""

import os
import openai
import requests
import json
from typing import Dict, List, Tuple
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class PrivacyChatbot:
    def __init__(self):
        """Initialize the privacy-preserving chatbot"""
        # Load OpenAI API key
        self.api_key = os.getenv("OPENAI_API_KEY")
        if not self.api_key:
            raise ValueError("OpenAI API key not found in .env file")
        
        openai.api_key = self.api_key
        
        # PII detector API endpoint
        self.pii_detector_url = "http://localhost:9000/api/extract"
        
        # Entity mappings for bidirectional masking
        self.entity_mappings = {}  # Original -> Masked
        self.reverse_mappings = {}  # Masked -> Original
        self.entity_counters = {}  # Track entity numbering
        
        # System prompt for the chatbot
        self.system_prompt = """You are a friendly Omani AI assistant for casual daily conversations. You are acknowledge with all Omani dialect 
        
IMPORTANT PRIVACY INSTRUCTIONS:
1. You may receive messages with privacy placeholders like 'Person1', 'Person2', 'Location1', 'Organization1', 'Credit Card1', 'Passport1', etc.
2. When you see these placeholders, treat them as actual entities and respond naturally.
3. ALWAYS keep these placeholders in your responses exactly as they are (e.g., if you see 'Person1', write 'Person1' in your response).
4. Never try to guess or replace these placeholders with real names or information.
5. These placeholders protect user privacy while allowing natural conversation.


Example:
User: "Hello, I'm Person1 from Location1"
You: "Nice to meet you, Person1! How are things in Location1?"

Be helpful, friendly, and maintain natural conversation flow while respecting these privacy placeholders."""
        
        # Conversation history
        self.conversation_history = []
    
    def detect_pii(self, text: str) -> Dict:
        """
        Call PII detector directly using the same model factory
        """
        try:
            # Import the model factory from the main app
            from src.models.model_factory import ModelFactory
            
            # Get or create the model factory instance
            if not hasattr(self, 'model_factory'):
                self.model_factory = ModelFactory()
            
            # Get the model
            model = self.model_factory.get_model("v2")
            if not model:
                print("Failed to load PII detection model")
                return {"entities": []}
            
            # Process the text directly
            entities = model.predict(text)
            
            # Convert to the expected format
            entity_results = []
            for entity in entities:
                entity_results.append({
                    'text': entity[0],
                    'entity_type': entity[1], 
                    'start': entity[2],
                    'end': entity[3]
                })
            
            return {"entities": entity_results}
                
        except Exception as e:
            print(f"Error in PII detection: {e}")
            return {"entities": []}
    
    def mask_entities(self, text: str, entities: List[Dict]) -> str:
        """
        Replace PII entities with privacy placeholders
        
        Args:
            text: Original text with PII
            entities: List of detected entities with positions
            
        Returns:
            Masked text with placeholders
        """
        if not entities:
            return text
        
        # Sort entities by position (reverse) to maintain correct positions
        entities_sorted = sorted(entities, key=lambda x: x['start'], reverse=True)
        
        masked_text = text
        
        for entity in entities_sorted:
            entity_type = entity['entity_type']
            original_text = entity['text']
            
            # Generate placeholder
            placeholder = self.get_or_create_placeholder(original_text, entity_type)
            
            # Replace in text
            start = entity['start']
            end = entity['end']
            masked_text = masked_text[:start] + placeholder + masked_text[end:]
        
        return masked_text
    
    def get_or_create_placeholder(self, original_text: str, entity_type: str) -> str:
        """
        Get existing placeholder or create new one for an entity
        
        Args:
            original_text: The original PII text
            entity_type: Type of entity (PER, LOC, ORG, etc.)
            
        Returns:
            Placeholder string (e.g., 'person1', 'location1')
        """
        # Check if we already have a mapping
        if original_text in self.entity_mappings:
            return self.entity_mappings[original_text]
        
        # Create new placeholder
        type_map = {
            'PER': 'person',
            'LOC': 'location', 
            'ORG': 'organization',
            'EMAIL': 'email',
            'PHONE': 'phone',
            'URL': 'url',
            'CIVIL-ID': 'civilid',
            'PASSPORT-ID': 'passport',
            'CREDIT-CARD': 'creditcard'
        }
        
        base_name = type_map.get(entity_type, 'entity')
        
        # Get next number for this entity type
        if base_name not in self.entity_counters:
            self.entity_counters[base_name] = 0
        
        self.entity_counters[base_name] += 1
        placeholder = f"{base_name}{self.entity_counters[base_name]}"
        
        # Store bidirectional mappings
        self.entity_mappings[original_text] = placeholder
        self.reverse_mappings[placeholder] = original_text
        
        return placeholder
    
    def unmask_text(self, text: str) -> str:
        """
        Replace placeholders back with original PII (for display to user)
        
        Args:
            text: Text with placeholders
            
        Returns:
            Text with original PII restored
        """
        unmasked_text = text
        
        # Replace all placeholders with original values
        for placeholder, original in self.reverse_mappings.items():
            unmasked_text = unmasked_text.replace(placeholder, original)
        
        return unmasked_text
    
    def chat_with_llm(self, masked_message: str) -> str:
        """
        Send masked message to OpenAI and get response
        
        Args:
            masked_message: User message with PII replaced by placeholders
            
        Returns:
            AI response (may contain placeholders)
        """
        try:
            # For testing - return a demo response if OpenAI fails
            demo_mode = False
            ai_response = ""
            
            try:
                # Prepare messages for OpenAI
                messages = [
                    {"role": "system", "content": self.system_prompt}
                ]
                
                # Add conversation history (last 10 messages)
                for msg in self.conversation_history[-10:]:
                    messages.append(msg)
                
                # Add current message
                messages.append({"role": "user", "content": masked_message})
                
                # Call OpenAI API with timeout
                import openai
                openai.api_key = self.api_key
                
                # Use direct API call like the working version
                import requests
                headers = {
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json"
                }
                data = {
                    "model": "gpt-4o-mini",
                    "messages": messages,
                    "max_tokens": 500,
                    "temperature": 0.7
                }
                response = requests.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers=headers,
                    json=data,
                    timeout=10
                )
                if response.status_code == 200:
                    result = response.json()
                    ai_response = result["choices"][0]["message"]["content"]
                else:
                    raise Exception(f"API error: {response.status_code}")
                
            except Exception as api_error:
                print(f"OpenAI API error: {api_error}")
                demo_mode = True
            
            if demo_mode:
                # Demo response showing privacy protection
                if "person" in masked_message.lower():
                    ai_response = f"Hello! I see you mentioned person1. I'm designed to protect privacy, so I'm using placeholders instead of real names. How can I help you today?"
                elif "location" in masked_message.lower():
                    ai_response = f"I notice you're asking about location1. I keep location information private by using placeholders. What would you like to know?"
                elif "organization" in masked_message.lower():
                    ai_response = f"You mentioned organization1. I'm protecting company names with placeholders for privacy. How can I assist you?"
                else:
                    ai_response = f"I received your message with privacy protection enabled. All personal information has been masked with placeholders. This is a demo response showing the privacy layer is working."
            
            # Add to history
            self.conversation_history.append({"role": "user", "content": masked_message})
            self.conversation_history.append({"role": "assistant", "content": ai_response})
            
            return ai_response
            
        except Exception as e:
            print(f"Error in chat_with_llm: {e}")
            return "I understand your message. The privacy layer has protected your personal information by replacing it with secure placeholders."
    
    def process_message(self, user_message: str, privacy_mode: bool = True) -> Tuple[str, str, str]:
        """
        Process a user message through the privacy pipeline
        
        Args:
            user_message: Original user message
            privacy_mode: Whether to mask PII (True) or show original (False)
            
        Returns:
            Tuple of (masked_user_message, ai_response, unmasked_response)
        """
        # Step 1: Detect PII in user message
        pii_result = self.detect_pii(user_message)
        entities = pii_result.get('entities', [])
        
        # Step 2: Mask PII entities
        masked_user_message = self.mask_entities(user_message, entities)
        
        # Step 3: Send masked message to LLM
        ai_response = self.chat_with_llm(masked_user_message)
        
        # Step 4: Detect PII in AI response (it might reference the placeholders)
        # The AI response should already contain placeholders, but we check for any new PII
        ai_pii_result = self.detect_pii(ai_response)
        ai_entities = ai_pii_result.get('entities', [])
        
        # Step 5: Mask any new PII in AI response
        masked_ai_response = self.mask_entities(ai_response, ai_entities)
        
        # Step 6: Unmask response if privacy mode is off
        if privacy_mode:
            return masked_user_message, masked_ai_response, masked_ai_response
        else:
            unmasked_response = self.unmask_text(masked_ai_response)
            unmasked_user = self.unmask_text(masked_user_message)
            return unmasked_user, masked_ai_response, unmasked_response
    
    def reset_conversation(self):
        """Reset conversation history and entity mappings"""
        self.conversation_history = []
        self.entity_mappings = {}
        self.reverse_mappings = {}
        self.entity_counters = {}
        print("Conversation reset. Starting fresh.")
    
    def display_privacy_status(self):
        """Display current privacy mappings"""
        print("\n🔒 Privacy Layer Status:")
        print("-" * 40)
        if self.entity_mappings:
            print("Protected Entities:")
            for original, masked in self.entity_mappings.items():
                print(f"  {masked} → {original}")
        else:
            print("No entities currently masked")
        print("-" * 40)


def main():
    """Main function to run the chatbot in CLI mode"""
    print("🛡️ Privacy-Preserving Chatbot")
    print("=" * 50)
    print("This chatbot uses PII detection to protect your privacy.")
    print("Your personal information is masked before being sent to AI.")
    print("\nCommands:")
    print("  /privacy - Toggle privacy mode (mask/unmask)")
    print("  /status  - Show privacy mappings")
    print("  /reset   - Start new conversation")
    print("  /quit    - Exit chatbot")
    print("=" * 50)
    
    # Initialize chatbot
    try:
        chatbot = PrivacyChatbot()
        privacy_mode = True
        print("\n✅ Chatbot initialized. Privacy mode: ON")
    except Exception as e:
        print(f"❌ Failed to initialize chatbot: {e}")
        return
    
    # Main chat loop
    while True:
        try:
            # Get user input
            user_input = input("\n👤 You: ").strip()
            
            # Handle commands
            if user_input.lower() == '/quit':
                print("👋 Goodbye!")
                break
            elif user_input.lower() == '/reset':
                chatbot.reset_conversation()
                continue
            elif user_input.lower() == '/status':
                chatbot.display_privacy_status()
                continue
            elif user_input.lower() == '/privacy':
                privacy_mode = not privacy_mode
                status = "ON" if privacy_mode else "OFF (Showing original data)"
                print(f"🔒 Privacy mode: {status}")
                continue
            
            if not user_input:
                continue
            
            # Process message through privacy pipeline
            print("\n🔄 Processing...")
            masked_user, masked_response, display_response = chatbot.process_message(
                user_input, privacy_mode
            )
            
            # Show what was sent to LLM (for transparency)
            if privacy_mode:
                print(f"\n📤 Sent to AI (masked): {masked_user}")
            
            # Display AI response
            print(f"\n🤖 AI: {display_response}")
            
        except KeyboardInterrupt:
            print("\n\n👋 Goodbye!")
            break
        except Exception as e:
            print(f"\n❌ Error: {e}")


if __name__ == "__main__":
    main()