#!/usr/bin/env python3
"""
Debug Privacy Pipeline - Shows exactly what is sent to LLM
"""
from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List, Dict, Optional
import uvicorn
import logging
import requests
import json

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Privacy Debug Interface", 
    description="Debug what gets sent to LLM",
    docs_url=None,  # Disable automatic docs
    redoc_url=None  # Disable redoc
)

class DebugRequest(BaseModel):
    message: str
    session_id: Optional[int] = 1

class DebugResponse(BaseModel):
    original_message: str
    detected_entities: List[Dict]
    masked_message: str
    llm_payload: Dict
    llm_response: str
    steps: List[str]

@app.get("/", response_class=HTMLResponse)
async def debug_interface(request: Request):
    """Debug interface page"""
    html_content = '''
<!DOCTYPE html>
<html>
<head>
    <title>Privacy Pipeline Debug</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .container { max-width: 1200px; margin: 0 auto; }
        .input-section { margin-bottom: 20px; }
        .results-section { margin-top: 20px; }
        .step { 
            background: #f5f5f5; 
            padding: 15px; 
            margin: 10px 0; 
            border-radius: 5px; 
            border-left: 4px solid #007acc;
        }
        .step h3 { margin-top: 0; color: #007acc; }
        .json-display { 
            background: #2d2d2d; 
            color: #f8f8f2; 
            padding: 15px; 
            border-radius: 5px; 
            font-family: 'Courier New', monospace;
            white-space: pre-wrap;
            overflow-x: auto;
        }
        textarea { 
            width: 100%; 
            height: 100px; 
            padding: 10px; 
            border: 1px solid #ddd; 
            border-radius: 4px;
        }
        button { 
            background: #007acc; 
            color: white; 
            padding: 10px 20px; 
            border: none; 
            border-radius: 4px; 
            cursor: pointer;
        }
        button:hover { background: #005a9b; }
        .highlight-entity { background-color: #ffeb3b; padding: 2px 4px; border-radius: 3px; }
        .masked-text { background-color: #e3f2fd; padding: 10px; border-radius: 4px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🛡️ Privacy Pipeline Debug Interface</h1>
        <p>This interface shows exactly what data flows through the privacy protection system.</p>
        
        <div class="input-section">
            <h2>Input Message</h2>
            <textarea id="messageInput" placeholder="Enter your message with PII data...">مرحبا اسمي جابر السلامي من مسقط اعمل في شركة أوركيد رقم حسابي البنكي ٤٥٥٦٦٦٦٦٣٦٣٦٦٣٦٦٣ رقم هاتفي هو ٩٠٨٨٧٧ ايميل Hamed@gmail.com موقع الكتروني www.orki.ai جواز سفر رقم AA9088777 رقم مدني ١٢٣٣٤٤٤ لي صديق احمد انا جابر السلامي وهو احمد</textarea>
            <br><br>
            <button onclick="debugPrivacy()">🔍 Debug Privacy Pipeline</button>
        </div>
        
        <div class="results-section" id="results" style="display: none;">
            <h2>Privacy Pipeline Results</h2>
            <div id="debugOutput"></div>
        </div>
    </div>

    <script>
        async function debugPrivacy() {
            const message = document.getElementById('messageInput').value;
            const resultsSection = document.getElementById('results');
            const debugOutput = document.getElementById('debugOutput');
            
            if (!message.trim()) {
                alert('Please enter a message');
                return;
            }
            
            debugOutput.innerHTML = '<p>🔄 Processing...</p>';
            resultsSection.style.display = 'block';
            
            try {
                const response = await fetch('/debug', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        message: message,
                        session_id: Math.floor(Math.random() * 1000)
                    })
                });
                
                const data = await response.json();
                displayResults(data);
            } catch (error) {
                debugOutput.innerHTML = `<div class="step"><h3>❌ Error</h3><pre>${error.message}</pre></div>`;
            }
        }
        
        function displayResults(data) {
            const debugOutput = document.getElementById('debugOutput');
            
            const html = `
                <div class="step">
                    <h3>📝 Step 1: Original Message</h3>
                    <div class="masked-text">${data.original_message}</div>
                </div>
                
                <div class="step">
                    <h3>🔍 Step 2: PII Detection Results</h3>
                    <strong>Found ${data.detected_entities.length} entities:</strong>
                    <div class="json-display">${JSON.stringify(data.detected_entities, null, 2)}</div>
                </div>
                
                <div class="step">
                    <h3>🛡️ Step 3: Masked Message (Sent to LLM)</h3>
                    <div class="masked-text">${data.masked_message}</div>
                </div>
                
                <div class="step">
                    <h3>📤 Step 4: Exact Payload Sent to OpenAI</h3>
                    <div class="json-display">${JSON.stringify(data.llm_payload, null, 2)}</div>
                </div>
                
                <div class="step">
                    <h3>🤖 Step 5: LLM Response (Using Placeholders)</h3>
                    <div class="masked-text">${data.llm_response}</div>
                </div>
                
                <div class="step">
                    <h3>📊 Processing Steps</h3>
                    <ul>
                        ${data.steps.map(step => `<li>${step}</li>`).join('')}
                    </ul>
                </div>
            `;
            
            debugOutput.innerHTML = html;
        }
    </script>
</body>
</html>
    '''
    return HTMLResponse(content=html_content)

@app.post("/debug", response_model=DebugResponse)
async def debug_privacy_pipeline(request: DebugRequest):
    """Debug the complete privacy pipeline"""
    steps = []
    
    try:
        # Step 1: Call PII detection
        steps.append("🔍 Calling PII detector API...")
        pii_response = requests.post(
            "http://localhost:9000/api/extract",
            json={"text": request.message, "model_version": "v2"},
            timeout=30
        )
        
        if pii_response.status_code != 200:
            raise Exception(f"PII detection failed: {pii_response.status_code}")
        
        pii_data = pii_response.json()
        entities = pii_data.get('entities', [])
        steps.append(f"✅ Found {len(entities)} PII entities")
        
        # Step 2: Mask entities
        steps.append("🛡️ Masking PII entities...")
        masked_message = mask_text_with_entities(request.message, entities)
        steps.append("✅ Entities masked with placeholders")
        
        # Step 3: Prepare OpenAI payload
        steps.append("📤 Preparing OpenAI API payload...")
        llm_payload = {
            "model": "gpt-4o-mini",
            "messages": [
                {
                    "role": "system",
                    "content": "You are a helpful assistant. When you see placeholders like Person1, Organization1, etc., treat them as real entities and use the SAME placeholders in your response."
                },
                {
                    "role": "user", 
                    "content": masked_message
                }
            ],
            "max_tokens": 200,
            "temperature": 0.7
        }
        
        # Step 4: Call OpenAI
        steps.append("🤖 Calling OpenAI API...")
        openai_response = requests.post(
            "https://api.openai.com/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {get_openai_key()}",
                "Content-Type": "application/json"
            },
            json=llm_payload,
            timeout=15
        )
        
        if openai_response.status_code == 200:
            openai_data = openai_response.json()
            llm_response = openai_data["choices"][0]["message"]["content"]
            steps.append("✅ Received response from OpenAI")
        else:
            llm_response = "⚠️ OpenAI API failed - using demo response: Hello! I see you mentioned Person1 and Organization1. Privacy protection is working!"
            steps.append("⚠️ OpenAI API failed, using fallback")
        
        return DebugResponse(
            original_message=request.message,
            detected_entities=entities,
            masked_message=masked_message,
            llm_payload=llm_payload,
            llm_response=llm_response,
            steps=steps
        )
        
    except Exception as e:
        logger.error(f"Debug error: {e}")
        return DebugResponse(
            original_message=request.message,
            detected_entities=[],
            masked_message=f"Error: {str(e)}",
            llm_payload={},
            llm_response="Error occurred",
            steps=[f"❌ Error: {str(e)}"]
        )

def mask_text_with_entities(text: str, entities: List[Dict]) -> str:
    """Mask entities in text with proper placeholders"""
    if not entities:
        return text
    
    # Sort entities by position (reverse)
    entities_sorted = sorted(entities, key=lambda x: x['start'], reverse=True)
    
    masked_text = text
    entity_counters = {}
    
    for entity in entities_sorted:
        entity_type = entity['entity_type']
        original_text = entity['text']
        
        # Map entity types to proper placeholder names
        type_map = {
            'PER': 'Person',
            'LOC': 'Location', 
            'ORG': 'Organization',
            'EMAIL': 'Email',
            'PHONE': 'Phone',
            'URL': 'URL',
            'CIVIL-ID': 'Civil ID',
            'PASSPORT-ID': 'Passport',
            'CREDIT-CARD': 'Credit Card'
        }
        
        base_name = type_map.get(entity_type, 'Entity')
        
        if base_name not in entity_counters:
            entity_counters[base_name] = 0
        
        entity_counters[base_name] += 1
        placeholder = f"{base_name}{entity_counters[base_name]}"
        
        # Replace in text
        start = entity['start']
        end = entity['end']
        masked_text = masked_text[:start] + placeholder + masked_text[end:]
    
    return masked_text

def get_openai_key():
    """Get OpenAI API key"""
    import os
    from dotenv import load_dotenv
    load_dotenv()
    return os.getenv("OPENAI_API_KEY")

if __name__ == "__main__":
    logger.info("Starting Privacy Debug Interface on port 8888")
    uvicorn.run("debug_privacy:app", host="0.0.0.0", port=8888, reload=False)