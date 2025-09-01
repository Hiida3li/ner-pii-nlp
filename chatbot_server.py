#!/usr/bin/env python3
"""
Simple chatbot server without PII detection models
"""
import sys
import os
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List, Dict, Optional
import uvicorn
import logging

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Privacy Chatbot", description="Privacy-preserving chat interface")

# Mount static files and templates
app.mount("/static", StaticFiles(directory="src/static"), name="static")
templates = Jinja2Templates(directory="src/templates")

# Pydantic models
class PrivacyChatRequest(BaseModel):
    message: str
    privacy_mode: bool = True
    session_id: Optional[int] = 1

class PrivacyChatResponse(BaseModel):
    masked_message: str
    display_response: str
    entities: Optional[List[Dict]] = []

# Store chatbot instances per session
chatbot_sessions = {}

@app.get("/", response_class=HTMLResponse)
async def read_root(request: Request):
    """Redirect to privacy chat"""
    return templates.TemplateResponse("welcome.html", {"request": request})

@app.get("/privacy-chat", response_class=HTMLResponse)
async def privacy_chat_page(request: Request):
    """Render the privacy-preserving chatbot interface"""
    logger.info("Privacy chat page accessed")
    return templates.TemplateResponse("privacy_chat.html", {"request": request})

@app.post("/api/privacy-chat", response_model=PrivacyChatResponse)
async def privacy_chat_api(request: PrivacyChatRequest):
    """Handle chat messages with privacy protection"""
    from src.chatbot import PrivacyChatbot
    
    session_id = request.session_id
    
    # Get or create chatbot for this session
    if session_id not in chatbot_sessions:
        try:
            chatbot_sessions[session_id] = PrivacyChatbot()
            logger.info(f"Created new chatbot for session {session_id}")
        except Exception as e:
            logger.error(f"Failed to create chatbot: {e}")
            return PrivacyChatResponse(
                masked_message=request.message,
                display_response="Sorry, I'm having trouble connecting to the AI service.",
                entities=[]
            )
    
    chatbot = chatbot_sessions[session_id]
    
    try:
        # Process message through privacy pipeline
        masked_user, masked_response, display_response = chatbot.process_message(
            request.message, 
            request.privacy_mode
        )
        
        # Find entities in response for highlighting
        entities = []
        import re
        pattern = r'(person|location|organization|email|phone)\\d+'
        for match in re.finditer(pattern, display_response.lower()):
            entities.append({
                'text': match.group(),
                'type': match.group().rstrip('0123456789')
            })
        
        return PrivacyChatResponse(
            masked_message=masked_user,
            display_response=display_response,
            entities=entities
        )
        
    except Exception as e:
        logger.error(f"Error in privacy chat: {e}")
        return PrivacyChatResponse(
            masked_message=request.message,
            display_response=f"Sorry, an error occurred: {str(e)}",
            entities=[]
        )

@app.post("/api/privacy-chat/reset")
async def reset_chat_session(request: Dict):
    """Reset a chat session"""
    session_id = request.get('session_id', 1)
    if session_id in chatbot_sessions:
        chatbot_sessions[session_id].reset_conversation()
        logger.info(f"Reset chat session {session_id}")
    return {"status": "ok"}

if __name__ == "__main__":
    logger.info("Starting chatbot server on port 9000")
    uvicorn.run("chatbot_server:app", host="0.0.0.0", port=9000, reload=True)