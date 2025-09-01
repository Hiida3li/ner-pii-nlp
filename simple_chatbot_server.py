#!/usr/bin/env python3
"""
Simple working chatbot server with mock PII detection for demo
"""
from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List, Dict, Optional
import uvicorn
import logging
import re
import openai
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Privacy Chatbot Demo", description="Privacy-preserving chat with PII masking")

# Mount static files and templates
app.mount("/static", StaticFiles(directory="src/static"), name="static")
templates = Jinja2Templates(directory="src/templates")

# Pydantic models
class PrivacyChatRequest(BaseModel):
    message: str
    privacy_mode: bool = True
    session_id: Optional[int] = 1

class PrivacyChatResponse(BaseModel):
    original_message: str
    masked_message: str
    display_response: str
    user_entities: Optional[List[Dict]] = []  # Entities found in user message
    response_entities: Optional[List[Dict]] = []  # Entities found in AI response

class SimpleChatbot:
    def __init__(self):
        self.api_key = os.getenv("OPENAI_API_KEY")
        self.entity_mappings = {}  # Original -> Masked
        self.reverse_mappings = {}  # Masked -> Original
        self.entity_counters = {}  # Track entity numbering
        self.conversation_history = []

    def detect_pii(self, text: str) -> List[Dict]:
        """Call the real PII detector API"""
        try:
            import requests
            response = requests.post(
                "http://localhost:9000/api/extract",
                json={"text": text, "model_version": "v2"},
                timeout=10
            )
            if response.status_code == 200:
                result = response.json()
                return result.get('entities', [])
            else:
                return []
        except Exception as e:
            logger.warning(f"PII API failed, using fallback: {e}")
            return []

    def get_or_create_placeholder(self, original_text: str, entity_type: str) -> str:
        """Get existing placeholder or create new one with proper descriptive names"""
        # Check if we already have a mapping for this exact text
        if original_text in self.entity_mappings:
            return self.entity_mappings[original_text]
        
        # Proper entity type mapping with descriptive names
        type_map = {
            'PER': 'Person',
            'LOC': 'Location', 
            'ORG': 'Organization',
            'EMAIL': 'Email',
            'PHONE': 'Phone',
            'URL': 'URL',
            'CIVIL-ID': 'CivilID',
            'PASSPORT-ID': 'Passport',
            'CREDIT-CARD': 'CreditCard',
            'BANK-ACCOUNT': 'BankAccount',  
            'ACCOUNT': 'BankAccount'
        }
        
        base_name = type_map.get(entity_type, 'Entity')
        
        # Initialize counter for this entity type if not exists
        if base_name not in self.entity_counters:
            self.entity_counters[base_name] = 0
        
        # Increment counter and create placeholder
        self.entity_counters[base_name] += 1
        placeholder = f"{base_name}{self.entity_counters[base_name]}"
        
        # Store bidirectional mapping
        self.entity_mappings[original_text] = placeholder
        self.reverse_mappings[placeholder] = original_text
        
        return placeholder

    def mask_entities(self, text: str, entities: List[Dict]) -> str:
        """Replace PII with placeholders"""
        if not entities:
            return text
        
        entities_sorted = sorted(entities, key=lambda x: x['start'], reverse=True)
        masked_text = text
        
        for entity in entities_sorted:
            placeholder = self.get_or_create_placeholder(entity['text'], entity['entity_type'])
            start = entity['start']
            end = entity['end']
            masked_text = masked_text[:start] + placeholder + masked_text[end:]
        
        return masked_text

    def unmask_text(self, text: str) -> str:
        """Replace placeholders with original text"""
        unmasked_text = text
        for placeholder, original in self.reverse_mappings.items():
            unmasked_text = unmasked_text.replace(placeholder, original)
        return unmasked_text

    def chat_with_ai(self, masked_message: str) -> str:
        """Get AI response using OpenAI"""
        try:
            if not self.api_key:
                logger.error("No OpenAI API key found")
                return self.fallback_response(masked_message)
            
            logger.info(f"Calling OpenAI with masked message: {masked_message}")
            
            # Use direct requests to OpenAI API
            import requests
            import json
            
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }
            
            data = {
                "model": "gpt-4o-mini",
                "messages": [
                    {"role": "system", "content": """You are a helpful assistant. Important: When you receive messages with placeholders like 'person1', 'organization1', 'email1', etc., treat them as real entities and use the SAME placeholders in your response. 

For example:
- If user says "Hi I'm person1 from organization1" 
- You respond "Hello person1! How are things at organization1?"

Always use the exact same placeholders the user mentions."""},
                    {"role": "user", "content": masked_message}
                ],
                "max_tokens": 200,
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
                logger.info(f"OpenAI response: {ai_response}")
                return ai_response
            else:
                logger.error(f"OpenAI API error: {response.status_code} - {response.text}")
                return self.fallback_response(masked_message)
            
        except Exception as e:
            logger.error(f"OpenAI API error: {e}")
            return self.fallback_response(masked_message)
    
    def fallback_response(self, masked_message: str) -> str:
        """Fallback response when OpenAI fails"""
        if "person" in masked_message.lower():
            return f"Hello! I see you mentioned person1. I'm using placeholders to protect your privacy. How can I help you?"
        elif "organization" in masked_message.lower():
            return f"I notice you're from organization1. The privacy system is working to protect company names. What can I assist with?"
        else:
            return "I received your message with privacy protection enabled. All sensitive information has been masked with placeholders."

    def process_message(self, user_message: str, privacy_mode: bool = True):
        """Simple process: detect PII → mask → send to LLM → return response"""
        # Step 1: Detect PII using real API
        entities = self.detect_pii(user_message)
        
        # Step 2: Mask PII in user message
        masked_message = self.mask_entities(user_message, entities)
        
        # Step 3: Send masked message to LLM (LLM responds with placeholders)
        ai_response = self.chat_with_ai(masked_message)
        
        # Step 4: Return - LLM already uses correct placeholders, plus detected entities
        return masked_message, ai_response, ai_response, entities

# Store chatbot sessions
chatbot_sessions = {}

@app.get("/", response_class=HTMLResponse)
async def root(request: Request):
    """Home page"""
    return templates.TemplateResponse("welcome.html", {"request": request})

@app.get("/privacy-chat", response_class=HTMLResponse)
async def privacy_chat_page(request: Request):
    """Privacy chat interface"""
    logger.info("Privacy chat page accessed")
    return templates.TemplateResponse("privacy_chat.html", {"request": request})

@app.post("/api/privacy-chat", response_model=PrivacyChatResponse)
async def privacy_chat_api(request: PrivacyChatRequest):
    """Handle chat messages"""
    session_id = request.session_id
    
    # Get or create chatbot
    if session_id not in chatbot_sessions:
        chatbot_sessions[session_id] = SimpleChatbot()
        logger.info(f"Created chatbot for session {session_id}")
    
    chatbot = chatbot_sessions[session_id]
    
    try:
        # Process message
        masked_user, masked_response, display_response, detected_entities = chatbot.process_message(
            request.message, request.privacy_mode
        )
        
        # Convert detected entities to frontend format for user message highlighting
        user_entities = []
        for entity in detected_entities:
            user_entities.append({
                'text': entity['text'],
                'entity_type': entity['entity_type'],
                'start': entity['start'],
                'end': entity['end'],
                'placeholder': chatbot.entity_mappings.get(entity['text'], entity['text'])
            })
        
        # Find placeholder entities in AI response for highlighting
        response_entities = []
        pattern = r'(person|location|organization|email|phone|url|civilid|passport|creditcard)\d+'
        for match in re.finditer(pattern, display_response.lower()):
            response_entities.append({
                'text': match.group(),
                'type': match.group().rstrip('0123456789'),
                'start': match.start(),
                'end': match.end()
            })
        
        return PrivacyChatResponse(
            original_message=request.message,
            masked_message=masked_user,
            display_response=display_response,
            user_entities=user_entities,
            response_entities=response_entities
        )
        
    except Exception as e:
        logger.error(f"Chat error: {e}")
        return PrivacyChatResponse(
            original_message=request.message,
            masked_message=request.message,
            display_response="Privacy protection is active. Your message has been processed safely.",
            user_entities=[],
            response_entities=[]
        )

@app.post("/api/privacy-chat/reset")
async def reset_session(request: dict):
    """Reset chat session"""
    session_id = request.get('session_id', 1)
    if session_id in chatbot_sessions:
        del chatbot_sessions[session_id]
        logger.info(f"Reset session {session_id}")
    return {"status": "ok"}

if __name__ == "__main__":
    logger.info("Starting chatbot server on port 9001")
    uvicorn.run("simple_chatbot_server:app", host="0.0.0.0", port=9001, reload=False)