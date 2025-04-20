from fastapi import FastAPI, Request, Form, HTTPException
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List, Dict, Optional, Tuple, Union
import torch
from transformers import AutoTokenizer, AutoModelForTokenClassification
import os
import uvicorn
from contextlib import asynccontextmanager

from models.model_factory import ModelFactory
from models.pii_shield_model import PIIShieldModel
from models.camel_bert_model import CamelBertModel
from models.entity_processor import EntityProcessor
from models.entity_config import EntityConfig
from config import Config

APP_TITLE = "PII-Shield Demo"
APP_DESCRIPTION = "Identify and extract sensitive information from text"

# FastAPI application with lifespan for model loading
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Load models at startup
    app.state.model_factory = ModelFactory()
    yield
    # Clean up at shutdown
    app.state.model_factory = None

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


@app.get("/", response_class=HTMLResponse)
async def read_root(request: Request):
    """Render the main page"""
    return templates.TemplateResponse(
        "index.html", 
        {"request": request, "title": APP_TITLE, "description": APP_DESCRIPTION}
    )


@app.post("/api/extract", response_model=TextResponse)
async def extract_entities(request: TextRequest):
    """Extract entities from text"""
    # Get the appropriate model
    model = app.state.model_factory.get_model(request.model_version)
    
    if not model:
        raise HTTPException(status_code=400, detail=f"Invalid model version: {request.model_version}")
    
    # Process text
    if not request.text.strip():
        return TextResponse(highlighted_text="", entities=[], entity_counts={})
    
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


@app.get("/api/models")
async def get_models():
    """Get available models"""
    from models.model_config import ModelConfig
    return {"models": ModelConfig.MODELS}


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)