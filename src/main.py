from fastapi import FastAPI, Request, Form, HTTPException, Cookie, Response
from fastapi.responses import HTMLResponse, RedirectResponse, JSONResponse, StreamingResponse
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List, Dict, Optional, Tuple, Union
import torch
from transformers import AutoTokenizer, AutoModelForTokenClassification
import os
import uvicorn
import logging
from contextlib import asynccontextmanager
import re
import openai
from dotenv import load_dotenv
import requests
import asyncio
import json

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Import from local modules
from src.models.model_factory import ModelFactory
from src.models.pii_shield_model import PIIShieldModel
from src.models.camel_bert_model import CamelBertModel
from src.models.entity_processor import EntityProcessor
from src.models.entity_config import EntityConfig
from src.config import Config

# Application configuration
APP_TITLE = "PII-Shield Demo"
APP_DESCRIPTION = "Identify and extract sensitive information from text"

# FastAPI application with lifespan for model loading
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Load models at startup
    logger.info("Loading models...")
    app.state.model_factory = ModelFactory()
    yield
    # Clean up at shutdown
    app.state.model_factory = None
    logger.info("Application shutdown, releasing resources.")

app = FastAPI(title=APP_TITLE, description=APP_DESCRIPTION, lifespan=lifespan)

# Mount static files and templates
app.mount("/static", StaticFiles(directory="src/static"), name="static")
templates = Jinja2Templates(directory="src/templates")

# Pydantic models for API
class TextRequest(BaseModel):
    text: str
    model_version: str

class EntityResult(BaseModel):
    text: str
    entity_type: str
    start: int
    end: int

class TextResponse(BaseModel):
    highlighted_text: str
    entities: List[EntityResult]
    entity_counts: Dict[str, int]

@app.get("/", response_class=HTMLResponse)
async def read_root(request: Request):
    """Render the welcome page"""
    logger.info("Root path accessed, rendering welcome page")
    # Simplified to directly render the welcome page without cookie check
    return templates.TemplateResponse("welcome.html", {"request": request})


@app.get("/app", response_class=HTMLResponse)
async def app_page(request: Request):
    """Render the main application page"""
    logger.info("App page accessed")
    response = templates.TemplateResponse(
        "index.html", 
        {"request": request, "title": APP_TITLE, "description": APP_DESCRIPTION}
    )
    # Set cookie to remember the user has seen the welcome page
    response.set_cookie(key="welcome_completed", value="true", max_age=2592000)  # 30 days
    return response


@app.get("/set-welcome-complete")
async def set_welcome_complete():
    """Set the welcome completed cookie and redirect to app"""
    logger.info("Setting welcome_completed cookie")
    response = RedirectResponse(url="/app")
    response.set_cookie(key="welcome_completed", value="true", max_age=2592000)  # 30 days
    return response




@app.post("/api/extract", response_model=TextResponse)
async def extract_entities(request: TextRequest):
    """Extract entities from text"""
    logger.info(f"Extracting entities with model version: {request.model_version}")
    
    # Check v3 separately since it doesn't need file loading
    if request.model_version == "v3":
        model = app.state.model_factory.get_model(request.model_version)
        if not model:
            logger.error("CamelBert model loading failed")
            raise HTTPException(status_code=500, detail="Failed to load CamelBert model")
    else:
        # For v1 and v2, verify model files exist
        from src.models.model_config import ModelConfig
        model_info = ModelConfig.get_model_info(request.model_version)
        checkpoint_path = model_info.get("checkpoint")
        
        if not checkpoint_path or not os.path.exists(checkpoint_path):
            logger.error(f"Model file not found at: {os.path.abspath(checkpoint_path if checkpoint_path else '')}")
            raise HTTPException(status_code=404, detail=f"Model file not found. Please check if model files are correctly placed.")
            
        # Get model if files exist
        model = app.state.model_factory.get_model(request.model_version)
    
    if not model:
        logger.error(f"Failed to load model: {request.model_version}")
        raise HTTPException(status_code=400, detail=f"Invalid model version or model loading error: {request.model_version}")
    
    # Process text
    if not request.text.strip():
        return TextResponse(highlighted_text="", entities=[], entity_counts={})
    
    try:
        # Extract entities
        entities = model.predict(request.text)
        
        # Process entities for display
        entity_processor = EntityProcessor()
        highlighted_text = entity_processor.highlight_entities_in_text(request.text, entities)
        entity_counts = entity_processor.get_entity_stats(entities)
        
        # Convert to API response format
        entity_results = [
            EntityResult(
                text=entity[0],
                entity_type=entity[1],
                start=entity[2],
                end=entity[3]
            ) for entity in entities
        ]
        
        return TextResponse(
            highlighted_text=highlighted_text,
            entities=entity_results,
            entity_counts=entity_counts
        )
    except Exception as e:
        logger.exception(f"Error processing text: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing text: {str(e)}")


@app.get("/welcome", response_class=HTMLResponse)
async def welcome(request: Request):
    """Display welcome screen"""
    logger.info("Welcome page accessed via /welcome path")
    return templates.TemplateResponse("welcome.html", {"request": request})


@app.get("/api/models")
async def get_models():
    """Get available models"""
    logger.info("Models API accessed")
    from src.models.model_config import ModelConfig
    return {"models": ModelConfig.MODELS}



@app.get("/check-model-files")
async def check_model_files():
    """Helper endpoint to check if model files exist"""
    from src.models.model_config import ModelConfig
    
    results = {}
    for version, info in ModelConfig.MODELS.items():
        checkpoint = info.get("checkpoint")
        if checkpoint:
            full_path = os.path.abspath(checkpoint)
            results[version] = {
                "path": full_path,
                "exists": os.path.exists(full_path),
                "is_file": os.path.isfile(full_path) if os.path.exists(full_path) else False
            }
        else:
            results[version] = {"path": None, "exists": False, "is_file": False}
    
    return results


# ============= PRIVACY CHATBOT INTEGRATION =============

# Pydantic models for chatbot
class PrivacyChatRequest(BaseModel):
    message: str
    privacy_mode: bool = True
    session_id: Optional[int] = 1

class PrivacyChatResponse(BaseModel):
    original_message: str
    masked_message: str
    display_response: str
    unmasked_response: str  # Response with actual entities
    user_entities: Optional[List[Dict]] = None
    response_entities: Optional[List[Dict]] = None

class SimpleChatbot:
    def __init__(self):
        self.api_key = os.getenv("OPENAI_API_KEY")
        self.entity_mappings = {}  # Original -> Masked
        self.reverse_mappings = {}  # Masked -> Original
        self.entity_counters = {}  # Track entity numbering
        self.conversation_history = []  # Store conversation history for context
        self.max_history_length = 10  # Keep last 10 messages for context

    def detect_pii(self, text: str) -> List[Dict]:
        """Call the PII detector API internally"""
        try:
            # Use the app's already-loaded model
            model = app.state.model_factory.get_model("v2")
            
            # Get predictions from model (returns list of tuples)
            predictions = model.predict(text)
            
            # Convert to dictionary format for consistency
            entities = []
            for entity in predictions:
                entities.append({
                    'text': entity[0],
                    'entity_type': entity[1],
                    'start': entity[2],
                    'end': entity[3]
                })
            return entities
        except Exception as e:
            logger.warning(f"PII detection failed: {e}")
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

    def chat_with_ai(self, masked_message: str) -> str:
        """Get AI response using OpenAI with Omani cultural context"""
        try:
            if not self.api_key:
                logger.error("No OpenAI API key found")
                return self.fallback_response(masked_message)
            
            logger.info(f"Calling OpenAI with masked message: {masked_message}")
            
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }
            
            # Build messages with enhanced Omani cultural prompt
            messages = [
                {
                    "role": "system", 
                    "content": """You are Blot, an intelligent, knowledgeable, and helpful AI assistant. You can discuss any topic, provide information, help with problems, engage in casual conversation. You should be conversational, friendly, and naturally helpful.

PRIVACY PROTECTION MODE:
- Some user inputs contain placeholders (Person1, Location1, Organization1, Email1, Phone1, etc.) that replace sensitive information
- Treat these placeholders as if they were real names/places/entities - respond naturally without mentioning they are placeholders
- Never reference privacy, masking, or placeholder systems to the user
- ALWAYS keep these placeholders exactly as they are in your responses

CONVERSATIONAL STYLE:
- Answer questions directly and provide useful information
- Ask follow-up questions when appropriate to better help the user
- Support both Arabic and English languages naturally
- Show personality and be genuinely helpful rather than overly formal

CAPABILITIES:
- Answer questions on any topic (science, technology, history, culture, etc.)
- Help with problems and provide solutions
- Engage in casual conversation and small talk
- Provide explanations, advice, and recommendations
- Help with analysis, writing, coding, math, and creative tasks
- Be curious and ask clarifying questions when needed

Respond naturally as if you were having a conversation with a friend who asked for your help."""
                }
            ]

            # Add conversation history for context (last 5 exchanges)
            for msg in self.conversation_history[-10:]:  # Last 10 messages (5 exchanges)
                messages.append(msg)
            
            # Add current message
            messages.append({"role": "user", "content": masked_message})
            
            data = {
                "model": "gpt-4.1",
                "messages": messages,
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
                
                # Add to conversation history for context
                self.conversation_history.append({"role": "user", "content": masked_message})
                self.conversation_history.append({"role": "assistant", "content": ai_response})
                
                # Keep only last N messages to avoid token limit
                if len(self.conversation_history) > self.max_history_length * 2:
                    self.conversation_history = self.conversation_history[-(self.max_history_length * 2):]
                
                return ai_response
            else:
                logger.error(f"OpenAI API error: {response.status_code} - {response.text}")
                return self.fallback_response(masked_message)
            
        except Exception as e:
            logger.error(f"OpenAI API error: {e}")
            return self.fallback_response(masked_message)
    
    def fallback_response(self, masked_message: str) -> str:
        """Fallback response when OpenAI fails - Omani style"""
        if "person" in masked_message.lower():
            return f"هلا وغلا Person1! شو الأخبار؟ أنا هنا عشان أساعدك مع حماية خصوصيتك. كيف أقدر أخدمك؟"
        elif "organization" in masked_message.lower():
            return f"أهلاً بك من Organization1! نظام الحماية شغال زين عشان يحمي معلوماتك. شو تحتاج؟"
        elif "location" in masked_message.lower():
            return f"حياك الله من Location1! كيف الأحوال عندكم؟ إن شاء الله كل شي زين."
        else:
            return "تفضل حبيبي، وصلتني رسالتك مع حماية الخصوصية. كل المعلومات الشخصية محمية. كيف أقدر أساعدك؟"

    def process_message(self, user_message: str, privacy_mode: bool = True):
        """Simple process: detect PII → mask → send to LLM → return response"""
        # Step 1: Detect PII using internal detection
        entities = self.detect_pii(user_message)
        
        # Step 2: Mask PII in user message
        masked_message = self.mask_entities(user_message, entities)
        
        # Step 3: Send masked message to LLM (LLM responds with placeholders)
        ai_response = self.chat_with_ai(masked_message)
        
        # Step 4: Unmask the AI response to get version with real entities
        unmasked_response = self.unmask_response(ai_response)
        
        # Step 5: Return both masked and unmasked versions
        return masked_message, ai_response, unmasked_response, entities
    
    def unmask_response(self, masked_response: str) -> str:
        """Replace placeholders in response with original entities"""
        unmasked = masked_response
        
        # Replace each placeholder with its original value
        for placeholder, original in self.reverse_mappings.items():
            # Case-insensitive replacement to handle different capitalizations
            pattern = re.compile(re.escape(placeholder), re.IGNORECASE)
            unmasked = pattern.sub(original, unmasked)
        
        return unmasked

# Store chatbot sessions
chatbot_sessions = {}

@app.get("/privacy-chat", response_class=HTMLResponse)
async def privacy_chat_page(request: Request):
    """Privacy chat interface"""
    logger.info("Privacy chat page accessed")
    return templates.TemplateResponse("privacy_chat.html", {"request": request})

@app.get("/privacy-chat-modern", response_class=HTMLResponse)
async def privacy_chat_modern_page(request: Request):
    """Modern purple-themed privacy chat interface"""
    logger.info("Modern privacy chat page accessed")
    return templates.TemplateResponse("privacy_chat_modern.html", {"request": request})

@app.post("/api/privacy-chat", response_model=PrivacyChatResponse)
async def privacy_chat_api(request: PrivacyChatRequest):
    """Handle chat messages"""
    session_id = request.session_id
    
    # Get or create chatbot
    if session_id not in chatbot_sessions:
        chatbot_sessions[session_id] = SimpleChatbot()
        logger.info(f"Created new chatbot for session {session_id}")
    
    chatbot = chatbot_sessions[session_id]
    
    try:
        # Process message
        result = chatbot.process_message(request.message, request.privacy_mode)
        logger.info(f"Process message returned: {result}")
        masked_user, masked_response, unmasked_response, detected_entities = result
        
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
        
        # Find entities in AI response for highlighting using PII detector on unmasked response
        response_entities = []
        try:
            # Use PII detector to find entities in the unmasked AI response
            detected_response_entities = chatbot.detect_pii(unmasked_response)
            
            for entity in detected_response_entities:
                # Get the placeholder for this entity if it exists
                placeholder = chatbot.entity_mappings.get(entity['text'], entity['text'])
                
                response_entities.append({
                    'text': entity['text'],
                    'entity_type': entity['entity_type'], 
                    'start': entity['start'],
                    'end': entity['end'],
                    'placeholder': placeholder,
                    'type': entity['entity_type'].lower(),
                    'value': entity['text']
                })
        except Exception as e:
            logger.warning(f"Failed to detect entities in AI response: {e}")
            # Fallback to placeholder detection in masked response
            pattern = r'(person|location|organization|email|phone|url|civilid|passport|creditcard)\d+'
            for match in re.finditer(pattern, masked_response.lower()):
                placeholder = match.group()
                original_value = chatbot.reverse_mappings.get(placeholder.capitalize(), placeholder)
                if original_value == placeholder:
                    original_value = chatbot.reverse_mappings.get(placeholder.upper(), placeholder)
                
                response_entities.append({
                    'text': original_value,
                    'type': match.group().rstrip('0123456789'),
                    'value': original_value,
                    'placeholder': placeholder,
                    'start': match.start(),
                    'end': match.end()
                })
        
        response_data = {
            "original_message": request.message,
            "masked_message": masked_user,
            "display_response": masked_response,  # Send masked version
            "unmasked_response": unmasked_response,  # Send unmasked version
            "user_entities": user_entities,
            "response_entities": response_entities
        }
        logger.info(f"Returning response data: {response_data}")
        return PrivacyChatResponse(**response_data)
        
    except Exception as e:
        logger.error(f"Error in privacy chat: {e}")
        import traceback
        traceback.print_exc()
        return PrivacyChatResponse(
            original_message=request.message,
            masked_message=request.message,
            display_response="Privacy protection is active. Your message has been processed safely.",
            user_entities=[],
            response_entities=[]
        )

@app.post("/api/privacy-chat/stream")
async def privacy_chat_stream(request: PrivacyChatRequest):
    """Handle chat messages with streaming response"""
    session_id = request.session_id
    
    # Get or create chatbot
    if session_id not in chatbot_sessions:
        chatbot_sessions[session_id] = SimpleChatbot()
        logger.info(f"Created new chatbot for session {session_id}")
    
    chatbot = chatbot_sessions[session_id]
    
    async def generate():
        try:
            # Process message to get entities and masked version
            entities = chatbot.detect_pii(request.message)
            masked_message = chatbot.mask_entities(request.message, entities)
            
            # Send initial data with user message info
            initial_data = {
                "type": "init",
                "original_message": request.message,
                "masked_message": masked_message,
                "user_entities": [
                    {
                        'text': entity['text'],
                        'entity_type': entity['entity_type'],
                        'start': entity['start'],
                        'end': entity['end'],
                        'placeholder': chatbot.entity_mappings.get(entity['text'], entity['text'])
                    } for entity in entities
                ]
            }
            yield f"data: {json.dumps(initial_data)}\n\n"
            
            # Simulate streaming response (chunked)
            ai_response = chatbot.chat_with_ai(masked_message)
            unmasked_response = chatbot.unmask_response(ai_response)
            
            # Stream the response in chunks
            chunk_size = 5  # Characters per chunk
            for i in range(0, len(ai_response), chunk_size):
                chunk_masked = ai_response[i:i+chunk_size]
                chunk_unmasked = unmasked_response[i:i+chunk_size]
                
                chunk_data = {
                    "type": "chunk",
                    "masked_chunk": chunk_masked,
                    "unmasked_chunk": chunk_unmasked
                }
                yield f"data: {json.dumps(chunk_data)}\n\n"
                await asyncio.sleep(0.03)  # Small delay for streaming effect
            
            # Send completion signal with entities
            response_entities = []
            try:
                # First, find all placeholders in the masked response
                placeholder_pattern = r'\b(Person|Location|Organization|Email|Phone|URL|CivilID|Passport|CreditCard)\d+\b'
                for match in re.finditer(placeholder_pattern, ai_response, re.IGNORECASE):
                    placeholder = match.group()
                    # Get the original value for this placeholder
                    original_value = chatbot.reverse_mappings.get(placeholder, '')
                    if not original_value:
                        # Try different case variations
                        original_value = chatbot.reverse_mappings.get(placeholder.capitalize(), '')
                        if not original_value:
                            original_value = chatbot.reverse_mappings.get(placeholder.upper(), '')
                            if not original_value:
                                original_value = chatbot.reverse_mappings.get(placeholder.lower(), '')
                    
                    if original_value:
                        # Determine entity type from placeholder
                        entity_type = re.sub(r'\d+', '', placeholder).upper()
                        
                        # Find position in unmasked response
                        unmasked_start = unmasked_response.find(original_value)
                        unmasked_end = unmasked_start + len(original_value) if unmasked_start >= 0 else -1
                        
                        response_entities.append({
                            'text': original_value,
                            'entity_type': entity_type,
                            'start': match.start(),  # Position in masked response
                            'end': match.end(),      # Position in masked response
                            'unmasked_start': unmasked_start,  # Position in unmasked response
                            'unmasked_end': unmasked_end,      # Position in unmasked response
                            'placeholder': placeholder,
                            'type': entity_type.lower(),
                            'value': original_value
                        })
            except Exception as e:
                logger.warning(f"Failed to detect entities in AI response (streaming): {e}")
                # Fallback to placeholder detection
                pattern = r'(person|location|organization|email|phone|url|civilid|passport|creditcard)\d+'
                for match in re.finditer(pattern, ai_response.lower()):
                    placeholder = match.group()
                    original_value = chatbot.reverse_mappings.get(placeholder.capitalize(), placeholder)
                    if original_value == placeholder:
                        original_value = chatbot.reverse_mappings.get(placeholder.upper(), placeholder)
                    
                    response_entities.append({
                        'text': original_value,
                        'type': match.group().rstrip('0123456789'),
                        'value': original_value,
                        'placeholder': placeholder,
                        'start': match.start(),
                        'end': match.end()
                    })
            
            completion_data = {
                "type": "complete",
                "response_entities": response_entities
            }
            yield f"data: {json.dumps(completion_data)}\n\n"
            
        except Exception as e:
            logger.error(f"Error in streaming: {e}")
            error_data = {"type": "error", "message": str(e)}
            yield f"data: {json.dumps(error_data)}\n\n"
    
    return StreamingResponse(generate(), media_type="text/event-stream")

@app.post("/api/privacy-chat/reset")
async def reset_session(request: dict):
    """Reset chat session and clear conversation history"""
    session_id = request.get('session_id', 1)
    if session_id in chatbot_sessions:
        # Clear conversation history and entity mappings
        chatbot_sessions[session_id].conversation_history = []
        chatbot_sessions[session_id].entity_mappings = {}
        chatbot_sessions[session_id].reverse_mappings = {}
        chatbot_sessions[session_id].entity_counters = {}
        logger.info(f"Reset session {session_id} - cleared history and mappings")
    return {"status": "ok"}


if __name__ == "__main__":
    logger.info(f"Starting application on port 9000")
    uvicorn.run("main:app", host="0.0.0.0", port=9000, reload=True)
    