from fastapi import FastAPI, Request, Form, HTTPException, Cookie, Response
from fastapi.responses import HTMLResponse, RedirectResponse
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
import httpx
import json

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Import from local modules
from models.model_factory import ModelFactory
from models.pii_shield_model import PIIShieldModel
from models.camel_bert_model import CamelBertModel
from models.entity_processor import EntityProcessor
from models.entity_config import EntityConfig
from config import Config

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
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

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

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    message: str
    api_key: str
    conversation_history: Optional[List[ChatMessage]] = []
    pii_detected: Optional[bool] = False
    privacy_mode: Optional[bool] = True

class ChatResponse(BaseModel):
    response: str
    pii_protected: bool = False


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
        from models.model_config import ModelConfig
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
    from models.model_config import ModelConfig
    return {"models": ModelConfig.MODELS}


@app.get("/chatbot", response_class=HTMLResponse)
async def chatbot_page(request: Request):
    """Render the chatbot page"""
    logger.info("Chatbot page accessed")
    return templates.TemplateResponse("chatbot.html", {"request": request})


@app.post("/api/chat", response_model=ChatResponse)
async def chat_with_gpt(request: ChatRequest):
    """Chat with GPT-4o-mini with PII protection"""
    logger.info(f"Chat request received, privacy_mode: {request.privacy_mode}")
    
    try:
        # Prepare messages for OpenAI API
        messages = [
            {"role": "system", "content": "You are a helpful assistant. If the user's message mentions that PII has been protected or masked, acknowledge this and continue the conversation naturally."}
        ]
        
        # Add conversation history
        for msg in request.conversation_history:
            messages.append({"role": msg.role, "content": msg.content})
        
        # Add current message
        messages.append({"role": "user", "content": request.message})
        
        # Call OpenAI API
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {request.api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "gpt-4o-mini",
                    "messages": messages,
                    "temperature": 0.7,
                    "max_tokens": 500
                },
                timeout=30.0
            )
            
            if response.status_code != 200:
                error_data = response.json()
                logger.error(f"OpenAI API error: {error_data}")
                raise HTTPException(status_code=response.status_code, 
                                  detail=error_data.get("error", {}).get("message", "OpenAI API error"))
            
            data = response.json()
            ai_response = data["choices"][0]["message"]["content"]
            
            return ChatResponse(
                response=ai_response,
                pii_protected=request.pii_detected and request.privacy_mode
            )
            
    except httpx.TimeoutException:
        logger.error("OpenAI API timeout")
        raise HTTPException(status_code=504, detail="Request to OpenAI API timed out")
    except httpx.RequestError as e:
        logger.error(f"Request error: {str(e)}")
        raise HTTPException(status_code=503, detail=f"Failed to connect to OpenAI API: {str(e)}")
    except Exception as e:
        logger.exception(f"Unexpected error in chat endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@app.get("/check-model-files")
async def check_model_files():
    """Helper endpoint to check if model files exist"""
    from models.model_config import ModelConfig
    
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


if __name__ == "__main__":
    logger.info(f"Starting application on port 8001")
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)
    