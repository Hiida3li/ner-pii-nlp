from fastapi import FastAPI, Request, Form, HTTPException, Cookie, Response, UploadFile, File
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
import hashlib
from datetime import datetime

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
from src.models.document_processor import DocumentProcessor
from src.config import Config

# Application configuration
APP_TITLE = "PII-Shield Demo"
APP_DESCRIPTION = "Identify and extract sensitive information from text"

# Global state management
chatbot_sessions = {}
document_sessions = {}  # Store document content per session

# FastAPI application with lifespan for model loading
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Load models at startup
    logger.info("Loading models...")
    app.state.model_factory = ModelFactory()
    app.state.document_processor = DocumentProcessor()
    yield
    # Clean up at shutdown
    app.state.model_factory = None
    app.state.document_processor.cleanup_temp_files()
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
        # Split any combined entities first
        split_entities = entity_processor.split_combined_entities(request.text, entities)
        highlighted_text = entity_processor.highlight_entities_in_text(request.text, entities)
        entity_counts = entity_processor.get_entity_stats(split_entities)
        
        # Convert to API response format using split entities
        entity_results = [
            EntityResult(
                text=entity[0],
                entity_type=entity[1],
                start=entity[2],
                end=entity[3]
            ) for entity in split_entities
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
        self.document_context = None  # Store current document context

    def detect_pii(self, text: str) -> List[Dict]:
        """Call the PII detector API internally"""
        try:
            # Use the app's already-loaded model
            model = app.state.model_factory.get_model("v2")
            
            # Get predictions from model (returns list of tuples)
            predictions = model.predict(text)
            
            # Use EntityProcessor to split combined entities
            from src.models.entity_processor import EntityProcessor
            processor = EntityProcessor()
            split_predictions = processor.split_combined_entities(text, predictions)
            
            # Convert to dictionary format for consistency
            entities = []
            for entity in split_predictions:
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

    def filter_overlapping_entities(self, entities: List[Dict]) -> List[Dict]:
        """Remove overlapping entities, keeping the longest ones"""
        if not entities:
            return []
        
        # Sort by start position, then by length (longest first)
        sorted_entities = sorted(entities, key=lambda x: (x['start'], -(x['end'] - x['start'])))
        
        filtered = []
        for entity in sorted_entities:
            # Check if this entity overlaps with any already selected entity
            overlaps = False
            for selected in filtered:
                # Check for any overlap
                if not (entity['end'] <= selected['start'] or entity['start'] >= selected['end']):
                    # There is overlap - keep the longer entity
                    if (entity['end'] - entity['start']) > (selected['end'] - selected['start']):
                        # Current entity is longer, replace the selected one
                        filtered.remove(selected)
                    else:
                        # Selected entity is longer or equal, skip current
                        overlaps = True
                        break
            
            if not overlaps:
                filtered.append(entity)
        
        return filtered
    
    def mask_entities(self, text: str, entities: List[Dict]) -> str:
        """Replace PII with placeholders"""
        if not entities:
            return text
        
        # Filter out overlapping entities first
        filtered_entities = self.filter_overlapping_entities(entities)
        
        # Sort by position (reverse) for replacement
        entities_sorted = sorted(filtered_entities, key=lambda x: x['start'], reverse=True)
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
- Engage in casual conversation and small talk
- Provide explanations, advice, and recommendations
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
                "max_tokens": 1000,
                "temperature": 0.7
            }
            
            response = requests.post(
                "https://api.openai.com/v1/chat/completions",
                headers=headers,
                json=data,
                timeout=30  # Increased timeout for better reliability
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
        logger.info(f"AI response before unmasking: {ai_response}")
        logger.info(f"Current entity mappings: {self.entity_mappings}")
        logger.info(f"Current reverse mappings: {self.reverse_mappings}")
        unmasked_response = self.unmask_response(ai_response)
        logger.info(f"AI response after unmasking: {unmasked_response}")
        
        # Step 5: Return both masked and unmasked versions
        return masked_message, ai_response, unmasked_response, entities
    
    def unmask_response(self, masked_response: str) -> str:
        """Replace placeholders in response with original entities"""
        unmasked = masked_response
        
        # Log the mappings for debugging
        logger.info(f"=== UNMASK_RESPONSE START ===")
        logger.info(f"Input masked_response: {masked_response}")
        logger.info(f"Entity mappings: {self.entity_mappings}")
        logger.info(f"Reverse mappings at start: {self.reverse_mappings}")
        
        # Build a map of entity types to their values for intelligent mapping
        type_to_values = {}
        for placeholder, original in self.reverse_mappings.items():
            # Extract the type from placeholder (e.g., "Location" from "Location1")
            match = re.match(r'^([A-Za-z]+)(\d+)$', placeholder)
            if match:
                entity_type = match.group(1)
                if entity_type not in type_to_values:
                    type_to_values[entity_type] = []
                type_to_values[entity_type].append((placeholder, original))
        
        logger.info(f"Type to values mapping: {type_to_values}")
        
        # Find all placeholder patterns in the response
        # Updated pattern to handle Arabic prefixes and word boundaries better
        placeholder_pattern = r'(?:^|[\s\p{P}وفبكلم])(Person|Location|Organization|Email|Phone|URL|CivilID|Passport|CreditCard|BankAccount)(\d+)(?=\s|$|[\p{P}]|\Z)'
        placeholders_in_response = []
        
        # Use a simpler pattern that's more forgiving with boundaries
        simple_pattern = r'(Person|Location|Organization|Email|Phone|URL|CivilID|Passport|CreditCard|BankAccount)(\d+)'
        for match in re.finditer(simple_pattern, masked_response, re.IGNORECASE):
            placeholder = match.group()
            base_type = match.group(1)
            number = int(match.group(2))
            placeholders_in_response.append((placeholder, base_type, number))
            logger.info(f"Found placeholder in response: {placeholder} (type: {base_type}, number: {number})")
        
        logger.info(f"Total placeholders found in response: {placeholders_in_response}")
        
        # Map placeholders intelligently
        for placeholder, base_type, number in placeholders_in_response:
            # Check case-insensitive
            found = False
            for key in self.reverse_mappings.keys():
                if key.lower() == placeholder.lower():
                    found = True
                    if key != placeholder:
                        # Add the case variant
                        self.reverse_mappings[placeholder] = self.reverse_mappings[key]
                        logger.debug(f"Added case variant {placeholder} for existing {key}")
                    break
            
            if not found:
                # Find the correct mapping based on the number
                # Check both exact case and case-insensitive
                matched_type = None
                for type_key in type_to_values.keys():
                    if type_key.lower() == base_type.lower():
                        matched_type = type_key
                        break
                
                if matched_type and matched_type in type_to_values:
                    values = type_to_values[matched_type]
                    # Sort by placeholder number
                    values.sort(key=lambda x: int(re.match(r'^[A-Za-z]+(\d+)$', x[0]).group(1)))
                    
                    # Map by index: Location2 should map to the second location in our list
                    if 1 <= number <= len(values):
                        original = values[number - 1][1]  # Use 0-based indexing
                        self.reverse_mappings[placeholder] = original
                        logger.info(f"Mapped {placeholder} to {original} (index-based)")
                    elif values:
                        # If number is out of range, use the last available
                        original = values[-1][1]
                        self.reverse_mappings[placeholder] = original
                        logger.info(f"Mapped {placeholder} to {original} (fallback to last)")
        
        # Sort placeholders by length (longest first) to avoid partial replacements
        sorted_mappings = sorted(self.reverse_mappings.items(), key=lambda x: len(x[0]), reverse=True)
        
        # Replace each placeholder with its original value
        for placeholder, original in sorted_mappings:
            # Try multiple replacement strategies
            replaced = False
            
            # Strategy 1: Handle Arabic conjunctions and prefixes
            # Look for placeholder with Arabic prefixes like و (and), ال (the), ب (with), ل (for), etc.
            arabic_pattern = re.compile(r'([وفبكلم]?)' + re.escape(placeholder) + r'\b', re.IGNORECASE)
            before = unmasked
            unmasked = arabic_pattern.sub(r'\1' + original, unmasked)
            if before != unmasked:
                logger.info(f"Successfully replaced {placeholder} with {original} (arabic pattern)")
                replaced = True
            
            # Strategy 2: Direct replacement with word boundaries  
            if not replaced:
                pattern = re.compile(r'\b' + re.escape(placeholder) + r'\b', re.IGNORECASE)
                before = unmasked
                unmasked = pattern.sub(original, unmasked)
                if before != unmasked:
                    logger.info(f"Successfully replaced {placeholder} with {original} (regex)")
                    replaced = True
            
            # Strategy 3: Simple string replacement if regex fails
            if not replaced and placeholder in unmasked:
                unmasked = unmasked.replace(placeholder, original)
                logger.info(f"Successfully replaced {placeholder} with {original} (direct)")
                replaced = True
            
            if not replaced:
                logger.info(f"No replacement made for {placeholder}")
        
        logger.info(f"=== UNMASK_RESPONSE END ===")
        logger.info(f"Final unmasked: {unmasked}")
        return unmasked
    
    def set_document_context(self, document_data: Dict):
        """Set the current document context for AI to reference"""
        if document_data:
            # Create a masked version of the document for AI context
            doc_entities = document_data.get('entities', [])
            original_text = document_data.get('original_text', '')
            
            # Process document entities to create mappings
            for entity in doc_entities:
                self.get_or_create_placeholder(entity['text'], entity['entity_type'])
            
            # Mask the document text
            masked_doc_text = self.mask_entities(original_text, doc_entities)
            
            self.document_context = {
                'filename': document_data.get('filename', 'document'),
                'original_text': original_text,
                'masked_text': masked_doc_text,
                'entities': doc_entities,
                'word_count': document_data.get('word_count', 0),
                'uploaded_at': document_data.get('uploaded_at', '')
            }
            logger.info(f"Document context set: {document_data.get('filename', 'Unknown')}")
        else:
            self.document_context = None
            logger.info("Document context cleared")
    
    def has_document_context(self) -> bool:
        """Check if there's an active document context"""
        return self.document_context is not None
    
    def get_document_summary(self) -> str:
        """Get a summary of the current document for AI context"""
        if not self.document_context:
            return ""
        
        doc = self.document_context
        summary = f"Document: {doc['filename']}\n"
        summary += f"Word count: {doc['word_count']}\n"
        summary += "Content preview:\n"
        
        # Use masked text for AI context (first 1000 characters)
        preview = doc['masked_text'][:1000]
        if len(doc['masked_text']) > 1000:
            preview += "...[content continues]"
        
        summary += preview
        return summary
    
    def chat_with_ai_document_context(self, masked_message: str) -> str:
        """Enhanced chat method that includes document context"""
        if not self.api_key:
            return "I'm here to help! (Note: OpenAI API key not configured)"
        
        try:
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }
            
            # Enhanced system prompt for document context
            system_prompt = """You are Blot, an intelligent, knowledgeable, and helpful AI assistant. You can discuss any topic, provide information, help with problems, engage in casual conversation, and analyze documents.

PRIVACY PROTECTION MODE:
- Some user inputs contain placeholders (Person1, Location1, Organization1, Email1, Phone1, etc.) that replace sensitive information
- Treat these placeholders as if they were real names/places/entities - respond naturally without mentioning they are placeholders
- Never reference privacy, masking, or placeholder systems to the user
- ALWAYS keep these placeholders exactly as they are in your responses

DOCUMENT ANALYSIS CAPABILITIES:
- When a document is provided, you can summarize, analyze, answer questions about it
- You can extract key information, identify patterns, and provide insights
- You can help with document-based tasks like summarization, Q&A, data extraction
- Always reference the document naturally in your responses when relevant

CONVERSATIONAL STYLE:
- Answer questions directly and provide useful information
- Ask follow-up questions when appropriate to better help the user
- Support both Arabic and English languages naturally
- Show personality and be genuinely helpful rather than overly formal
- When discussing documents, be specific and cite relevant parts

CAPABILITIES:
- Answer questions on any topic (science, technology, history, culture, etc.)
- Analyze and discuss document content when provided
- Provide summaries, insights, and detailed analysis of documents
- Extract specific information from documents
- Compare document content with user questions
- Engage in casual conversation and small talk
- Provide explanations, advice, and recommendations
- Be curious and ask clarifying questions when needed

Respond naturally as if you were having a conversation with a friend who asked for your help."""
            
            messages = [{"role": "system", "content": system_prompt}]
            
            # Add document context if available
            if self.has_document_context():
                doc_context = f"\n\nDOCUMENT CONTEXT:\n{self.get_document_summary()}\n"
                messages.append({
                    "role": "system", 
                    "content": f"You now have access to a document. Use this context to answer questions about the document:{doc_context}"
                })
            
            # Add conversation history for context (last 10 messages)
            for msg in self.conversation_history[-10:]:
                messages.append(msg)
            
            # Add current message
            messages.append({"role": "user", "content": masked_message})
            
            data = {
                "model": "gpt-4.1",
                "messages": messages,
                "max_tokens": 3000 if self.has_document_context() else 1000,  # More tokens for document analysis
                "temperature": 0.7
            }
            
            response = requests.post(
                "https://api.openai.com/v1/chat/completions",
                headers=headers,
                json=data,
                timeout=30  # Longer timeout for document processing
            )
            
            if response.status_code == 200:
                result = response.json()
                ai_response = result["choices"][0]["message"]["content"]
                logger.info(f"OpenAI response (with document context): {ai_response}")
                
                # Store in conversation history
                self.conversation_history.append({"role": "user", "content": masked_message})
                self.conversation_history.append({"role": "assistant", "content": ai_response})
                
                # Trim history if too long
                if len(self.conversation_history) > self.max_history_length:
                    self.conversation_history = self.conversation_history[-self.max_history_length:]
                
                return ai_response
            else:
                logger.error(f"OpenAI API error: {response.status_code} - {response.text}")
                return self._get_fallback_response_with_document()
                
        except requests.RequestException as e:
            logger.error(f"Request error: {e}")
            return self._get_fallback_response_with_document()
        except Exception as e:
            logger.error(f"Unexpected error in chat_with_ai_document_context: {e}")
            return self._get_fallback_response_with_document()
    
    def _get_fallback_response_with_document(self) -> str:
        """Provide fallback response when API fails, considering document context"""
        fallback_responses = [
            "أعتذر، أواجه مشكلة تقنية الآن. يمكنك إعادة المحاولة؟",
            "عذراً، لا أستطيع الاتصال بالخدمة حالياً. جرب مرة أخرى من فضلك.",
            "Sorry, I'm experiencing technical difficulties. Please try again.",
            "I'm having trouble connecting right now. Could you retry your message?"
        ]
        
        if self.has_document_context():
            doc_responses = [
                f"أعتذر، أواجه مشكلة في تحليل الوثيقة '{self.document_context['filename']}'. يرجى المحاولة مرة أخرى.",
                f"Sorry, I'm having trouble analyzing the document '{self.document_context['filename']}'. Please try again.",
                "I can see you've uploaded a document, but I'm experiencing technical issues. Please retry your question about the document."
            ]
            fallback_responses.extend(doc_responses)
        
        import random
        return random.choice(fallback_responses)

# Store chatbot sessions
chatbot_sessions = {}

# Document processing endpoints
@app.post("/api/document/upload")
async def upload_document(session_id: int, file: UploadFile = File(...)):
    """Upload and process a document"""
    try:
        # Validate file
        if not file.filename:
            raise HTTPException(status_code=400, detail="No file provided")
        
        # Read file content
        file_content = await file.read()
        
        # Process document
        doc_processor = app.state.document_processor
        result = await doc_processor.process_document(file_content, file.filename)
        
        if not result['success']:
            raise HTTPException(status_code=400, detail=result['error'])
        
        # Analyze document for PII
        model_factory = app.state.model_factory
        model = model_factory.get_model("v2")
        
        if not model:
            raise HTTPException(status_code=500, detail="Model not available")
        
        # Extract entities from document text using the predict method
        entities_tuples = model.predict(result['text'])
        
        # Convert tuples to dictionary format
        entities = []
        if entities_tuples:
            for entity_tuple in entities_tuples:
                if len(entity_tuple) >= 4:
                    entities.append({
                        'text': entity_tuple[0],
                        'entity_type': entity_tuple[1],
                        'start': entity_tuple[2],
                        'end': entity_tuple[3]
                    })
        
        entity_processor = EntityProcessor()
        
        # Convert entities back to tuple format for entity_processor
        entities_for_processor = []
        for entity in entities:
            entities_for_processor.append((
                entity['text'],
                entity['entity_type'],
                entity['start'],
                entity['end']
            ))
        
        # Process entities for display
        highlighted_text = entity_processor.highlight_entities_in_text(result['text'], entities_for_processor)
        entity_counts = entity_processor.get_entity_stats(entities_for_processor)
        
        # Store document in session
        doc_data = {
            'id': hashlib.md5(f"{session_id}_{file.filename}_{datetime.now().isoformat()}".encode()).hexdigest()[:12],
            'filename': file.filename,
            'original_text': result['text'],
            'highlighted_text': highlighted_text,
            'entities': entities,
            'entity_counts': entity_counts,
            'file_info': result['file_info'],
            'uploaded_at': datetime.now().isoformat(),
            'word_count': result['word_count'],
            'text_length': result['text_length']
        }
        
        # Initialize session if needed
        if session_id not in document_sessions:
            document_sessions[session_id] = {'documents': [], 'active_doc': None}
        
        # Add document to session
        document_sessions[session_id]['documents'].append(doc_data)
        document_sessions[session_id]['active_doc'] = doc_data['id']
        
        logger.info(f"Document uploaded: {file.filename} for session {session_id}")
        
        return JSONResponse({
            'success': True,
            'document': {
                'id': doc_data['id'],
                'filename': doc_data['filename'],
                'text_length': doc_data['text_length'],
                'word_count': doc_data['word_count'],
                'entity_count': sum(entity_counts.values()) if entity_counts else 0,
                'entity_types': list(entity_counts.keys()) if entity_counts else [],
                'file_info': doc_data['file_info']
            }
        })
        
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        logger.error(f"Document upload error: {str(e)}\n{error_details}")
        raise HTTPException(status_code=500, detail=f"Document processing failed: {str(e)}")

@app.get("/api/document/{session_id}")
async def get_documents(session_id: int):
    """Get all documents for a session"""
    if session_id not in document_sessions:
        return JSONResponse({'documents': [], 'active_doc': None})
    
    session_data = document_sessions[session_id]
    doc_summaries = []
    
    for doc in session_data['documents']:
        doc_summaries.append({
            'id': doc['id'],
            'filename': doc['filename'],
            'uploaded_at': doc['uploaded_at'],
            'text_length': doc['text_length'],
            'word_count': doc['word_count'],
            'entity_count': sum(doc['entity_counts'].values()) if doc['entity_counts'] else 0,
            'entity_types': list(doc['entity_counts'].keys()) if doc['entity_counts'] else []
        })
    
    return JSONResponse({
        'documents': doc_summaries,
        'active_doc': session_data['active_doc']
    })

@app.get("/api/document/{session_id}/{doc_id}")
async def get_document_content(session_id: int, doc_id: str):
    """Get specific document content with PII analysis"""
    if session_id not in document_sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session_data = document_sessions[session_id]
    document = None
    
    for doc in session_data['documents']:
        if doc['id'] == doc_id:
            document = doc
            break
    
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Set as active document
    document_sessions[session_id]['active_doc'] = doc_id
    
    return JSONResponse({
        'id': document['id'],
        'filename': document['filename'],
        'original_text': document['original_text'],
        'highlighted_text': document['highlighted_text'],
        'entities': document['entities'],
        'entity_counts': document['entity_counts'],
        'file_info': document['file_info'],
        'uploaded_at': document['uploaded_at'],
        'word_count': document['word_count'],
        'text_length': document['text_length']
    })

@app.delete("/api/document/{session_id}/{doc_id}")
async def delete_document(session_id: int, doc_id: str):
    """Delete a document from session"""
    if session_id not in document_sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session_data = document_sessions[session_id]
    document_index = None
    
    for i, doc in enumerate(session_data['documents']):
        if doc['id'] == doc_id:
            document_index = i
            break
    
    if document_index is None:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Remove document
    deleted_doc = session_data['documents'].pop(document_index)
    
    # Update active document if needed
    if session_data['active_doc'] == doc_id:
        session_data['active_doc'] = session_data['documents'][0]['id'] if session_data['documents'] else None
    
    logger.info(f"Document deleted: {deleted_doc['filename']} from session {session_id}")
    
    return JSONResponse({'success': True, 'deleted_document': deleted_doc['filename']})

@app.post("/api/document/{session_id}/set-active/{doc_id}")
async def set_active_document(session_id: int, doc_id: str):
    """Set active document for a session"""
    if session_id not in document_sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session_data = document_sessions[session_id]
    
    # Verify document exists
    doc_exists = any(doc['id'] == doc_id for doc in session_data['documents'])
    if not doc_exists:
        raise HTTPException(status_code=404, detail="Document not found")
    
    document_sessions[session_id]['active_doc'] = doc_id
    
    return JSONResponse({'success': True, 'active_doc': doc_id})

@app.get("/api/document/supported-formats")
async def get_supported_formats():
    """Get supported document formats"""
    doc_processor = app.state.document_processor
    formats = doc_processor.get_supported_formats()
    
    return JSONResponse({
        'formats': formats,
        'max_file_size': DocumentProcessor.MAX_FILE_SIZE,
        'max_text_length': DocumentProcessor.MAX_TEXT_LENGTH
    })

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
            
            # Also find all occurrences of existing mapped entities in the response
            # This ensures we highlight entities that the AI uses but weren't detected
            for original_text, placeholder in chatbot.entity_mappings.items():
                # Find all occurrences in unmasked response
                start = 0
                while True:
                    pos = unmasked_response.find(original_text, start)
                    if pos == -1:
                        break
                    
                    # Check if this position is already covered by detected entities
                    already_covered = any(
                        ent['start'] <= pos < ent['end'] 
                        for ent in detected_response_entities 
                        if ent['text'] == original_text
                    )
                    
                    if not already_covered:
                        # Add this occurrence
                        entity_type = 'LOC' if 'Location' in placeholder else 'ORG' if 'Organization' in placeholder else 'PER'
                        detected_response_entities.append({
                            'text': original_text,
                            'entity_type': entity_type,
                            'start': pos,
                            'end': pos + len(original_text)
                        })
                    
                    start = pos + 1
            
            # Sort entities by position
            detected_response_entities = sorted(detected_response_entities, key=lambda x: x['start'])
            
            for entity in detected_response_entities:
                # Get the placeholder for this entity if it exists
                placeholder = chatbot.entity_mappings.get(entity['text'], '')
                
                if placeholder:
                    # Find all occurrences of placeholder in masked response
                    masked_positions = []
                    start = 0
                    while True:
                        pos = masked_response.find(placeholder, start)
                        if pos == -1:
                            break
                        masked_positions.append((pos, pos + len(placeholder)))
                        start = pos + 1
                    
                    # Use the first available position for this entity
                    masked_start = masked_positions[0][0] if masked_positions else -1
                    masked_end = masked_positions[0][1] if masked_positions else -1
                else:
                    masked_start = -1
                    masked_end = -1
                
                response_entities.append({
                    'text': entity['text'],
                    'entity_type': entity['entity_type'], 
                    'start': masked_start if masked_start >= 0 else entity['start'],  # Position in masked response
                    'end': masked_end if masked_end >= 0 else entity['end'],  # Position in masked response
                    'unmasked_start': entity['start'],  # Position in unmasked response
                    'unmasked_end': entity['end'],  # Position in unmasked response
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
            # Load document context if available
            if session_id in document_sessions and document_sessions[session_id]['active_doc']:
                active_doc_id = document_sessions[session_id]['active_doc']
                # Find the active document
                for doc in document_sessions[session_id]['documents']:
                    if doc['id'] == active_doc_id:
                        chatbot.set_document_context(doc)
                        logger.info(f"Loaded document context: {doc['filename']}")
                        break
            
            # Process message to get entities and masked version
            entities = chatbot.detect_pii(request.message)
            masked_message = chatbot.mask_entities(request.message, entities)
            
            # Send initial data with user message info and document context
            initial_data = {
                "type": "init",
                "original_message": request.message,
                "masked_message": masked_message,
                "has_document": chatbot.has_document_context(),
                "document_info": {
                    'filename': chatbot.document_context['filename'],
                    'word_count': chatbot.document_context['word_count']
                } if chatbot.has_document_context() else None,
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
            
            # Use enhanced chat method with document context
            try:
                if chatbot.has_document_context():
                    ai_response = chatbot.chat_with_ai_document_context(masked_message)
                else:
                    ai_response = chatbot.chat_with_ai(masked_message)
                
                unmasked_response = chatbot.unmask_response(ai_response)
            except Exception as e:
                logger.error(f"Error in chat processing: {e}")
                ai_response = "عذراً، حدث خطأ أثناء معالجة رسالتك. يرجى المحاولة مرة أخرى."
                unmasked_response = ai_response
            
            # Stream the response in chunks - send full responses for proper replacement
            # The frontend will handle the streaming display
            chunk_data = {
                "type": "full_response",
                "masked_response": ai_response,
                "unmasked_response": unmasked_response
            }
            yield f"data: {json.dumps(chunk_data)}\n\n"
            
            # Send completion signal with entities
            response_entities = []
            try:
                # First, detect ALL entities in the unmasked response using PII detector
                detected_ai_entities = chatbot.detect_pii(unmasked_response)
                
                # Process detected entities to handle comma-separated organizations
                from src.models.entity_processor import EntityProcessor
                processor = EntityProcessor()
                
                # Convert to tuple format for processor
                entity_tuples = [(ent['text'], ent['entity_type'], ent['start'], ent['end']) 
                                for ent in detected_ai_entities]
                
                # Split combined entities (e.g., comma-separated organizations)
                split_entities = processor.split_combined_entities(unmasked_response, entity_tuples)
                
                # Convert back to dict format and add to response_entities
                for entity_text, entity_type, start, end in split_entities:
                    # Check if this entity has a placeholder mapping
                    placeholder = chatbot.entity_mappings.get(entity_text, '')
                    
                    response_entities.append({
                        'text': entity_text,
                        'entity_type': entity_type,
                        'start': start,  # Position in unmasked response
                        'end': end,  # Position in unmasked response
                        'unmasked_start': start,  # Position in unmasked response
                        'unmasked_end': end,  # Position in unmasked response
                        'placeholder': placeholder,
                        'type': entity_type.lower(),
                        'value': entity_text
                    })
                
                # Also find occurrences of already-mapped entities that might not be detected
                for placeholder, original_value in chatbot.reverse_mappings.items():
                    if original_value:
                        # Check if this entity is already in response_entities
                        entity_exists = any(ent['text'] == original_value for ent in response_entities)
                        
                        if not entity_exists:
                            # Determine entity type from placeholder
                            entity_type = re.sub(r'\d+', '', placeholder).upper()
                            
                            # Find ALL occurrences of this entity in the unmasked response
                            start = 0
                            while True:
                                pos = unmasked_response.find(original_value, start)
                                if pos == -1:
                                    break
                                
                                # Check if this position overlaps with existing entities
                                overlaps = any(
                                    ent['start'] <= pos < ent['end'] or 
                                    pos <= ent['start'] < pos + len(original_value)
                                    for ent in response_entities
                                )
                                
                                if not overlaps:
                                    response_entities.append({
                                        'text': original_value,
                                        'entity_type': entity_type,
                                        'start': pos,  # Position in unmasked response
                                        'end': pos + len(original_value),  # Position in unmasked response
                                        'unmasked_start': pos,  # Position in unmasked response
                                        'unmasked_end': pos + len(original_value),  # Position in unmasked response
                                        'placeholder': placeholder,
                                        'type': entity_type.lower(),
                                        'value': original_value
                                    })
                                
                                # Move to next possible position
                                start = pos + 1
                
                # Sort entities by position
                response_entities = sorted(response_entities, key=lambda x: x['start'])
                logger.info(f"Found {len(response_entities)} entity occurrences in unmasked response")
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
    
    # Always create a fresh chatbot for reset
    chatbot_sessions[session_id] = SimpleChatbot()
    logger.info(f"Reset chat session {session_id} - created new chatbot instance")
    return {"status": "ok"}


if __name__ == "__main__":
    logger.info(f"Starting application on port 9000")
    uvicorn.run("main:app", host="0.0.0.0", port=9000, reload=True)
    