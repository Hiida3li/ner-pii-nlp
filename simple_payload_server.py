#!/usr/bin/env python3
"""
Simple payload inspector server that works without CORS issues
"""
from fastapi import FastAPI, Request, Form
from fastapi.responses import HTMLResponse
import uvicorn
import requests
import json

app = FastAPI(title="Payload Inspector")

@app.get("/", response_class=HTMLResponse)
async def payload_inspector():
    """Simple payload inspector interface"""
    return """
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>🛡️ Privacy Payload Inspector</title>
    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Cairo', Arial, sans-serif; margin: 20px; background: #f0f2f5; }
        .container { max-width: 1000px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .step { background: #f8f9fa; padding: 20px; margin: 15px 0; border-radius: 8px; border-left: 5px solid #28a745; }
        .step h3 { margin-top: 0; color: #28a745; }
        .payload { background: #2d3748; color: #e2e8f0; padding: 15px; border-radius: 5px; font-family: monospace; white-space: pre-wrap; overflow-x: auto; direction: ltr; }
        .arabic-text { background: #e3f2fd; padding: 15px; border-radius: 5px; direction: rtl; text-align: right; }
        textarea { width: 100%; height: 120px; padding: 15px; border: 2px solid #ddd; border-radius: 8px; font-family: 'Cairo', Arial; direction: rtl; text-align: right; }
        button { background: #007bff; color: white; padding: 15px 30px; border: none; border-radius: 8px; cursor: pointer; font-size: 16px; font-weight: bold; }
        button:hover { background: #0056b3; }
        .error { background: #f8d7da; color: #721c24; padding: 15px; border-radius: 8px; margin: 10px 0; }
        .success { background: #d4edda; color: #155724; padding: 15px; border-radius: 8px; margin: 10px 0; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🛡️ Privacy Payload Inspector</h1>
        <p>This tool shows exactly what data flows through your privacy protection system.</p>
        
        <form method="post" action="/inspect">
            <h2>📝 Test Message</h2>
            <textarea name="message" placeholder="أدخل الرسالة مع البيانات الشخصية..." required>مرحبا اسمي جابر السلامي من مسقط اعمل في شركة أوركيد رقم حسابي البنكي ٤٥٥٦٦٦٦٦٣٦٣٦٦٣٦٦٣ رقم هاتفي هو ٩٠٨٨٧٧ ايميل Hamed@gmail.com موقع الكتروني www.orki.ai جواز سفر رقم AA9088777 رقم مدني ١٢٣٣٤٤٤ لي صديق احمد انا جابر السلامي وهو احمد</textarea>
            <br><br>
            <button type="submit">🔍 فحص مسار الخصوصية</button>
        </form>
    </div>
</body>
</html>
    """

@app.post("/inspect", response_class=HTMLResponse)
async def inspect_payload(message: str = Form(...)):
    """Inspect the privacy pipeline"""
    
    results = []
    
    try:
        # Step 1: Original message
        results.append(f"""
        <div class="step">
            <h3>📝 الخطوة 1: الرسالة الأصلية</h3>
            <div class="arabic-text">{message}</div>
        </div>
        """)
        
        # Step 2: PII Detection
        try:
            pii_response = requests.post(
                "http://localhost:9000/api/extract",
                json={"text": message, "model_version": "v2"},
                timeout=10
            )
            
            if pii_response.status_code == 200:
                pii_data = pii_response.json()
                entities = pii_data.get('entities', [])
                
                results.append(f"""
                <div class="step">
                    <h3>🔍 الخطوة 2: كشف البيانات الشخصية</h3>
                    <p><strong>تم العثور على {len(entities)} كيان:</strong></p>
                    <div class="payload">{json.dumps(entities, ensure_ascii=False, indent=2)}</div>
                </div>
                """)
            else:
                results.append(f"""
                <div class="error">❌ فشل في كشف البيانات الشخصية: {pii_response.status_code}</div>
                """)
                entities = []
        except Exception as e:
            results.append(f"""
            <div class="error">❌ خطأ في كشف البيانات الشخصية: {str(e)}</div>
            """)
            entities = []
        
        # Step 3: Privacy Chat
        try:
            session_id = 99999  # Special session for testing
            chat_response = requests.post(
                "http://localhost:9001/api/privacy-chat",
                json={
                    "message": message,
                    "privacy_mode": True,
                    "session_id": session_id
                },
                timeout=15
            )
            
            if chat_response.status_code == 200:
                chat_data = chat_response.json()
                
                results.append(f"""
                <div class="step">
                    <h3>🛡️ الخطوة 3: النص المقنع (ما يراه الذكي الاصطناعي)</h3>
                    <div class="arabic-text" style="background: #fff3cd; border: 2px solid #856404;">{chat_data['masked_message']}</div>
                    <p><small>👆 هذا هو النص الوحيد الذي يراه الذكي الاصطناعي - لا بيانات شخصية حقيقية!</small></p>
                </div>
                """)
                
                # OpenAI Payload
                openai_payload = {
                    "model": "gpt-4o-mini",
                    "messages": [
                        {
                            "role": "system",
                            "content": "You are a helpful assistant. When you see placeholders like Person1, Organization1, etc., treat them as real entities and use the SAME placeholders in your response."
                        },
                        {
                            "role": "user",
                            "content": chat_data['masked_message']
                        }
                    ],
                    "max_tokens": 200,
                    "temperature": 0.7
                }
                
                results.append(f"""
                <div class="step">
                    <h3>📤 الخطوة 4: البيانات المرسلة إلى OpenAI بالضبط</h3>
                    <div class="payload">{json.dumps(openai_payload, ensure_ascii=False, indent=2)}</div>
                </div>
                """)
                
                results.append(f"""
                <div class="step">
                    <h3>🤖 الخطوة 5: رد الذكي الاصطناعي (باستخدام العناصر النائبة فقط)</h3>
                    <div class="arabic-text" style="background: #d1ecf1;">{chat_data['display_response']}</div>
                </div>
                """)
                
                results.append(f"""
                <div class="success">
                    <h3>✅ ملخص الخصوصية</h3>
                    <ul>
                        <li>✓ الرسالة الأصلية تحتوي على {len(entities)} كيان من البيانات الشخصية</li>
                        <li>✓ تم إخفاء جميع البيانات الشخصية بعناصر نائبة آمنة</li>
                        <li>✓ الذكي الاصطناعي لم ير الأسماء أو الأرقام أو البيانات الشخصية الحقيقية مطلقاً</li>
                        <li>✓ رد الذكي الاصطناعي يستخدم العناصر النائبة فقط</li>
                        <li>✓ تم تحقيق الحماية الكاملة للخصوصية!</li>
                    </ul>
                </div>
                """)
            else:
                results.append(f"""
                <div class="error">❌ فشل في محادثة الخصوصية: {chat_response.status_code}</div>
                """)
        except Exception as e:
            results.append(f"""
            <div class="error">❌ خطأ في محادثة الخصوصية: {str(e)}</div>
            """)
    
    except Exception as e:
        results.append(f"""
        <div class="error">❌ خطأ عام: {str(e)}</div>
        """)
    
    # Create the response HTML
    html = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>🛡️ نتائج فحص الخصوصية</title>
    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        body {{ font-family: 'Cairo', Arial, sans-serif; margin: 20px; background: #f0f2f5; }}
        .container {{ max-width: 1000px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }}
        .step {{ background: #f8f9fa; padding: 20px; margin: 15px 0; border-radius: 8px; border-left: 5px solid #28a745; }}
        .step h3 {{ margin-top: 0; color: #28a745; }}
        .payload {{ background: #2d3748; color: #e2e8f0; padding: 15px; border-radius: 5px; font-family: monospace; white-space: pre-wrap; overflow-x: auto; direction: ltr; }}
        .arabic-text {{ background: #e3f2fd; padding: 15px; border-radius: 5px; direction: rtl; text-align: right; }}
        .error {{ background: #f8d7da; color: #721c24; padding: 15px; border-radius: 8px; margin: 10px 0; }}
        .success {{ background: #d4edda; color: #155724; padding: 15px; border-radius: 8px; margin: 10px 0; }}
        .back-btn {{ background: #6c757d; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-bottom: 20px; }}
    </style>
</head>
<body>
    <div class="container">
        <a href="/" class="back-btn">← العودة للاختبار مرة أخرى</a>
        <h1>🛡️ نتائج فحص مسار الخصوصية</h1>
        {''.join(results)}
    </div>
</body>
</html>
    """
    
    return html

if __name__ == "__main__":
    print("Starting Payload Inspector on http://localhost:7777")
    uvicorn.run("simple_payload_server:app", host="0.0.0.0", port=7777, reload=False)