# PII Shield — Advanced Privacy Protection Platform

### AI-Powered PII Detection & Privacy-Preserving LLM Gateway

![Python](https://img.shields.io/badge/Python-3.8%2B-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-0.104.1-009688)
![PyTorch](https://img.shields.io/badge/PyTorch-2.1.0-EE4C2C)
![Transformers](https://img.shields.io/badge/Transformers-4.35.0-FFD43B)
![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4-412991)
![Docker](https://img.shields.io/badge/Docker-ready-2496ED)
![License](https://img.shields.io/badge/License-MIT-red)

**Live demo:** [https://chat.orki.ai/privacy-chat](https://chat.orki.ai/privacy-chat)

---

## Table of Contents

1. [Overview](#overview)
2. [Why This Project Matters](#why-this-project-matters-protecting-omani-data--aligning-with-oman-vision-2040)
3. [Try It in Omani Arabic Dialect](#try-it-in-omani-arabic-dialect)
4. [Key Features](#key-features)
5. [Architecture](#architecture)
6. [Supported Entity Types](#supported-entity-types)
7. [Quick Start](#quick-start)
8. [Installation](#installation)
9. [Configuration](#configuration)
10. [Running the Application](#running-the-application)
11. [Application Routes](#application-routes)
12. [API Reference](#api-reference)
13. [Docker Deployment](#docker-deployment)
14. [Production Deployment](#production-deployment)
15. [Project Structure](#project-structure)
16. [Troubleshooting](#troubleshooting)
17. [Contributing](#contributing)
18. [License](#license)
19. [Acknowledgments](#acknowledgments)

---

## Overview

**PII Shield** was created to support **employees of enterprise and government entities in the Sultanate of Oman** in protecting sensitive **Omani data** before it is sent to Large Language Models (LLMs) such as ChatGPT, Claude, Gemini, and others.

Many public-sector and corporate employees rely on LLMs to draft reports, translate documents, and analyze text — but doing so risks leaking confidential national, institutional, and personal data to third-party AI providers. **PII Shield acts as a privacy gateway**: it detects, masks, and substitutes PII and Named Entities locally *before* any data leaves the user's machine, then restores the original values in the model's response. This keeps Omani data sovereign while still letting employees benefit from the productivity of modern LLMs.

The platform is purpose-built with **Gulf-specific PII and NER models**, tuned for Omani names, tribal nomenclature, civil IDs, passport formats, Omani phone numbers, governorates, ministries, and Arabic government discourse.

### Mission

> **Protect Omani data sovereignty. Empower government and enterprise employees to use LLMs safely — in their own language and dialect.**

---

## Why This Project Matters: Protecting Omani Data & Aligning with Oman Vision 2040

The rapid adoption of foreign Large Language Models (ChatGPT, Claude, Gemini, Copilot, DeepSeek, etc.) inside Omani ministries, public authorities, and private enterprises has created a **silent data-leakage crisis**. Every prompt typed into a foreign LLM is:

- **Transmitted abroad** — usually to servers in the US, EU, or East Asia, outside Omani jurisdiction.
- **Often retained and used for training** — depending on the provider's terms of service.
- **Subject to foreign legal regimes** — including subpoenas, intelligence requests, and data-sharing treaties that the Sultanate is not party to.

When that prompt contains an Omani civil ID, a tribal name, a ministerial decision, a tender document, a medical record, a citizen complaint, or a draft policy, it constitutes a **breach of national data sovereignty** — even if no malicious actor is involved.

**PII Shield closes this gap.** All personally identifiable and nationally sensitive information — written in Arabic, Omani dialect, or English — is **detected, masked, and substituted locally** before it ever crosses Oman's digital borders. The LLM still helps the employee draft, summarize, or translate; but the underlying Omani data stays inside the Sultanate.

### Alignment with Oman Vision 2040

| Vision 2040 Pillar | How PII Shield Contributes |
|--------------------|----------------------------|
| **Governance of the State Administration's Apparatus, Resources & Projects** | Enables ministries to safely adopt AI tools without violating government data-classification policies or the Personal Data Protection Law (Royal Decree 6/2022). |
| **Economic Diversification & Fiscal Sustainability** | Lets enterprises in non-oil sectors (logistics, tourism, fintech, manufacturing) use AI productively without exposing trade secrets or customer data abroad. |
| **Development of the Digital Economy** | Provides the privacy-trust layer that makes large-scale, lawful adoption of AI within Oman possible — a prerequisite for a competitive digital economy. |
| **A Caring Society** | Protects the personal data of Omani citizens — their identities, health records, financial details, and family information — from foreign data brokers and AI training pipelines. |
| **National Security & Sovereignty** | Keeps sensitive government correspondence, defense-adjacent communications, and strategic documents inside the Sultanate's digital perimeter. |

The project is also fully aligned with:

- **Royal Decree No. 6/2022 — Personal Data Protection Law (PDPL)** — Oman's binding data-protection framework.
- **The National Programme for Digital Economy** (under the Ministry of Transport, Communications and Information Technology).
- **The National AI Policy & Ethical AI guidelines** issued by MTCIT.

### Target Industries & Sectors

| Sector | Example Stakeholders |
|--------|----------------------|
| **Government & Public Sector** | Ministries, ROP, MoD, MoFA, Tax Authority, MoJ, Courts |
| **Healthcare** | MoH, Royal Hospital, SQUH, Khoula, private hospitals & insurers |
| **Banking, Finance & Fintech** | CBO, Bank Muscat, NBO, Sohar International, Bank Dhofar, Bank Nizwa, Alizz Islamic Bank, insurers |
| **Energy, Oil & Gas** | EDO, PDO, OQ, Oman LNG, Petrogas, Daleel |
| **Telecommunications** | Omantel, Ooredoo, Vodafone Oman, Awasr, TRA |
| **Education & Research** | MoE, MoHE, SQU, GUtech, UTAS, private universities |
| **Legal, Audit & Consulting** | Law firms, Big 4 + local audit, management consultancies |
| **Logistics, Aviation & Tourism** | Asyad Group, Oman Air, Oman Airports, MHT, OMRAN |
| **Critical Infrastructure & Utilities** | Nama Group, OPWP, Haya Water, Be'ah |

---

## Try It in Omani Arabic Dialect

To experience the full power of the system, **test it using Arabic in the Omani dialect**. The models are specifically tuned for Gulf-region linguistic patterns, official Omani government phrasing, honorifics (معالي، فضيلة، السيد/ة), tribal names, and Omani administrative structures.

### Example Input (Omani Government Context)

Paste the following into the **Privacy Chat** at [https://chat.orki.ai/privacy-chat](https://chat.orki.ai/privacy-chat):

```text
احتفت وزارة الإعلام بإطلاق الفيلم الوثائقي من خلال عرض أُقيم على مسرح وزارة الثقافة مساء اليوم، وسط حضور ثقافي وفني من مختلف أنحاء السلطنة.

وأكد معالي الدكتور عبدالله بن ناصر بن سالم بن حمد الحراصي، وزير الإعلام، في تصريح صحفي، أن الفيلم الوثائقي يأتي ضمن برنامج الوزارة الهادف إلى توثيق التاريخ العُماني وإبراز الجوانب الإنسانية والحضارية في المجتمع العُماني.

كما أكدت فضيلة السيدة هادية بنت سلطان بنت محمد عبدالملك السيابية من محافظة جنوب الباطنة أن الفيلم سيصل ويُعرض هناك أيضًا.

ولمزيد من المعلومات والتواصل، يرجى التواصل على رقم هاتف الوزارة: ٢٤٢٢٦٦٥٤٣٢، أو زيارة الموقع الإلكتروني: https://mcsy.om

كما تم تسجيل البيانات الرسمية التالية ضمن ملف التوثيق:

* رقم البطاقة التعريفية: ١٣٧٧٦٥٩٩٨
* رقم جواز السفر: AA656943321
* رقم البطاقة الائتمانية التجريبية (Synthetic/Test): 5443320998765321
```

### What PII Shield Will Detect

| Detected Entity | Example from the Text | Type |
|-----------------|----------------------|------|
| معالي الدكتور عبدالله بن ناصر بن سالم بن حمد الحراصي | Omani full tribal name + honorific | `PER` |
| فضيلة السيدة هادية بنت سلطان بنت محمد عبدالملك السيابية | Omani female tribal name + honorific | `PER` |
| وزارة الإعلام / وزارة الثقافة | Omani government ministries | `ORG` |
| محافظة جنوب الباطنة | Omani governorate | `LOC` |
| ٢٤٢٢٦٦٥٤٣٢ | Arabic-numeral Omani phone | `PHONE` |
| https://mcsy.om | Omani government domain | `URL` |
| ١٣٧٧٦٥٩٩٨ | Omani Civil ID (Arabic numerals) | `CIVIL-ID` |
| AA656943321 | Passport number | `PASSPORT-ID` |
| 5443320998765321 | Credit card number (test) | `CREDIT-CARD` |

After masking, the redacted version is what gets sent to the LLM, and the original values are restored in the response **on your side only** — never leaving your environment.

---

## Key Features

- **AI-Powered Detection** — Custom BERT model (`pii_shield_002v.pt`) fine-tuned for Gulf/Arabic PII detection.
- **Privacy Chat** — GPT-4 powered chat with automatic, bidirectional PII masking & unmasking.
- **Document Processing** — Upload and scan PDF, DOCX, XLSX, CSV, TXT files for PII.
- **Multilingual** — Full Arabic and English support, including RTL rendering and Arabic-numeral parsing.
- **Streaming Responses** — Real-time streaming chat endpoint for low-latency interaction.
- **Voice Input** — Voice-to-text endpoint for privacy chat dictation.
- **Zero Persistent Storage** — Sessions live in memory; no user data is written to disk.
- **Session Management** — Per-session entity dictionaries, configurable timeout & session caps.
- **Security Hardening** — Configurable CORS, security headers, rate limits, and upload size caps.
- **Modern UI** — Dark theme, color-customizable entity highlighting, exportable entity lists.

---

## Architecture

```
┌──────────────┐     ┌──────────────────────────────────────────┐     ┌──────────────┐
│   Browser    │     │            FastAPI Application           │     │  OpenAI API  │
│              │◄───►│                                          │◄───►│  (GPT-4)     │
│  HTML/JS UI  │     │  ┌────────────────────────────────────┐  │     └──────────────┘
└──────────────┘     │  │  Routes: /, /app, /privacy-chat,   │  │
                     │  │          /api/extract, /api/...    │  │
                     │  └────────────────┬───────────────────┘  │
                     │                   │                      │
                     │  ┌────────────────▼───────────────────┐  │
                     │  │         Model Factory              │  │
                     │  │  ┌──────────────┐ ┌─────────────┐  │  │
                     │  │  │ PII Shield   │ │ CAMeL BERT  │  │  │
                     │  │  │ (custom .pt) │ │ (Arabic NER)│  │  │
                     │  │  └──────────────┘ └─────────────┘  │  │
                     │  └────────────────┬───────────────────┘  │
                     │                   │                      │
                     │  ┌────────────────▼───────────────────┐  │
                     │  │  Entity Processor & Masker         │  │
                     │  │  - detects PII spans               │  │
                     │  │  - substitutes with placeholders   │  │
                     │  │  - restores values from response   │  │
                     │  └────────────────────────────────────┘  │
                     │                                          │
                     │  ┌────────────────────────────────────┐  │
                     │  │  Document Processor                │  │
                     │  │  PDF / DOCX / XLSX / CSV / TXT     │  │
                     │  └────────────────────────────────────┘  │
                     └──────────────────────────────────────────┘
```

**Inference path:** input text → tokenization → PII Shield BERT (token classification) → span aggregation → entity dictionary → placeholder substitution → outbound LLM call → response → reverse substitution → render.

---

## Supported Entity Types

The PII detection model uses BIO-tagged labels mapped to nine entity types:

| Entity | Tag | Icon | Examples |
|--------|-----|------|----------|
| Person | `PER` | 👤 | محمد بن سليم الحارثي, John Doe |
| Location | `LOC` | 📍 | قرية السجورة، ولاية نزوى, Muscat |
| Organization | `ORG` | 🏢 | بنك مسقط, وزارة الإعلام |
| Email | `EMAIL` | 📧 | user@example.com |
| Phone | `PHONE` | 📱 | 9xxxxxxx, +968xxxxxxxx, ٢٤٢٢٦٦٥٤٣٢ |
| URL | `URL` | 🔗 | https://example.com |
| Civil ID | `CIVIL-ID` | 🪪 | 123456789, ١٣٧٧٦٥٩٩٨ |
| Passport | `PASSPORT-ID` | 🛂 | AA656943321 |
| Credit Card | `CREDIT-CARD` | 💳 | 4xxx-xxxx-xxxx-xxxx |

Underlying BIO labels: `O`, `B-PER` / `I-PER`, `B-LOC` / `I-LOC`, `B-ORG` / `I-ORG`, `B-EMAIL` / `I-EMAIL`, `B-PHONE` / `I-PHONE`, `B-URL` / `I-URL`, `B-CIVIL-ID`, `B-CREDIT-CARD`, `B-PASSPORT-ID`. See `src/models/label_mapping.py`.

---

## Quick Start

```bash
# Clone the repository
git clone <repository-url>
cd ner-pii-nlp-5

# (Recommended) create and activate a virtual environment
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env and add your OpenAI API key

# Ensure the model checkpoint is in place (~1.3 GB)
ls -lh checkpoints/pii_shield_002v.pt

# Run the application (dev mode, auto-reload)
PYTHONPATH=. python -m uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload
```

Open [http://localhost:8000](http://localhost:8000).

---

## Installation

### Prerequisites

| Requirement | Minimum | Recommended |
|-------------|---------|-------------|
| Python | 3.8 | 3.11 |
| RAM | 4 GB | 8 GB+ |
| Disk | 2 GB | 4 GB (model + cache) |
| OpenAI API key | — | Required for `/privacy-chat` |
| GPU | optional | NVIDIA GPU with CUDA for faster inference |

### Step-by-Step

1. **Clone**
   ```bash
   git clone <repository-url>
   cd ner-pii-nlp-5
   ```

2. **Virtual environment**
   ```bash
   python3 -m venv .venv
   source .venv/bin/activate
   ```

3. **Install dependencies**
   ```bash
   pip install --upgrade pip
   pip install -r requirements.txt
   ```

4. **Verify model checkpoint**
   ```bash
   ls -lh checkpoints/pii_shield_002v.pt
   ```
   If the file is missing, request it from the repository owner — it is required for the `v2` PII Shield model.

5. **Configure environment**
   ```bash
   cp .env.example .env
   # Open .env and set OPENAI_API_KEY=<your key>
   ```

---

## Configuration

All settings live in `src/config.py` and are sourced from environment variables (loaded via `python-dotenv`).

### Core Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `OPENAI_API_KEY` | OpenAI API key for GPT-4 (required for chat) | — |
| `DEBUG` | Enable debug mode (verbose logs, relaxed headers) | `False` |
| `HOST` | Bind host | `0.0.0.0` |
| `PORT` | Bind port | `9000` (uvicorn flag overrides) |
| `LOG_LEVEL` | Logging verbosity | `INFO` |
| `SECRET_KEY` | App secret (must be set in production) | dev default |
| `MODEL_PATH` | Directory holding model checkpoints | `checkpoints` |
| `DEFAULT_MODEL_VERSION` | Which model to load on startup | `v2` |

### Security & Session

| Variable | Description | Default |
|----------|-------------|---------|
| `ALLOWED_HOSTS` | Comma-separated list | `localhost,127.0.0.1` |
| `CORS_ORIGINS` | Comma-separated allowed origins | `http://localhost:9000,http://127.0.0.1:9000` |
| `SESSION_TIMEOUT` | Session lifetime (seconds) | `3600` |
| `MAX_SESSIONS` | Maximum concurrent sessions | `100` |
| `RATE_LIMIT` | Requests per minute per IP | `60` |

### Upload & Text Limits

| Variable | Description | Default |
|----------|-------------|---------|
| `MAX_UPLOAD_SIZE` | Max upload bytes | `10485760` (10 MB) |
| `MAX_TEXT_LENGTH` | Max characters per extraction | `50000` |
| `MAX_MESSAGE_LENGTH` | Max characters per chat message | `10000` |

Allowed upload extensions: `.txt`, `.pdf`, `.docx`, `.xlsx`, `.csv`.

### OpenAI

| Variable | Description | Default |
|----------|-------------|---------|
| `OPENAI_MODEL` | Chat model name | `gpt-4-turbo-preview` |
| `OPENAI_MAX_TOKENS` | Response token cap | `2000` |
| `OPENAI_TEMPERATURE` | Sampling temperature | `0.3` |
| `OPENAI_TIMEOUT` | Request timeout (seconds) | `30` |

### Feature Flags

| Variable | Default |
|----------|---------|
| `ENABLE_DOCUMENT_UPLOAD` | `True` |
| `ENABLE_PRIVACY_MODE` | `True` |
| `ENABLE_ENTITY_EXPORT` | `True` |

### Models

Configured in `src/models/model_config.py`:

| Version | Name | Checkpoint | Type |
|---------|------|------------|------|
| `v2` | PII-Shield | `checkpoints/pii_shield_002v.pt` | `pii_shield` |

Auxiliary model loaded on demand: `CAMeL-Lab/bert-base-arabic-camelbert-msa-ner` (downloaded from Hugging Face on first run, then cached).

Confidence threshold: `CONFIDENCE_THRESHOLD = 0.75` (`src/config.py`).

---

## Running the Application

### Development (auto-reload)

```bash
PYTHONPATH=. python -m uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload
```

### Production (multi-worker)

```bash
PYTHONPATH=. python -m uvicorn src.main:app --host 0.0.0.0 --port 8000 --workers 4
```

> **Note:** with multiple workers, in-memory sessions are not shared across workers. For multi-worker production, run behind a reverse proxy with sticky sessions, or back sessions with Redis.

### Verifying the run

```bash
curl http://localhost:8000/health
# {"status":"healthy","service":"PII-Shield"}
```

---

## Application Routes

### Page routes

| Path | Description |
|------|-------------|
| `/` | Landing / welcome page |
| `/welcome` | Welcome page (explicit) |
| `/app` | PII detector interface |
| `/privacy-chat` | Privacy-preserving GPT-4 chat |

### Diagnostic routes

| Method | Path | Purpose |
|--------|------|---------|
| `GET`  | `/health` | Liveness probe |
| `GET`  | `/api/models` | List available model versions |
| `GET`  | `/check-model-files` | Verify checkpoint files on disk |
| `GET`  | `/set-welcome-complete` | Set "welcome seen" cookie |

---

## API Reference

### `GET /health`

```json
{ "status": "healthy", "service": "PII-Shield" }
```

### `POST /api/extract`

Detect entities in raw text.

```http
POST /api/extract
Content-Type: application/json

{
  "text": "John Doe's email is john@example.com",
  "model_version": "v2"
}
```

Response:

```json
{
  "highlighted_text": "<span class='entity-per'>John Doe</span>'s email is <span class='entity-email'>john@example.com</span>",
  "entities": [
    { "text": "John Doe", "entity_type": "PER", "start": 0, "end": 8 },
    { "text": "john@example.com", "entity_type": "EMAIL", "start": 21, "end": 37 }
  ],
  "entity_counts": { "PER": 1, "EMAIL": 1 }
}
```

### `POST /api/privacy-chat`

Send a message through the privacy gateway.

```http
POST /api/privacy-chat
Content-Type: application/json

{
  "message": "My name is John and I live in New York",
  "privacy_mode": true,
  "session_id": 1
}
```

Response (fields):
- `original_message` — what the user typed
- `masked_message` — what was actually sent to GPT-4
- `display_response` — masked response shown by default
- `unmasked_response` — response with original values restored
- `user_entities`, `response_entities` — entity dictionaries for inspection

### `POST /api/privacy-chat/stream`

Same payload as `/api/privacy-chat`; returns a streaming response (server-sent chunks) for live UI rendering.

### `POST /api/privacy-chat/reset`

Clear the current chat session's history and entity dictionary.

### `GET /api/privacy-chat/export-entities`

Export the session's accumulated entity dictionary as JSON/CSV.

### `POST /api/privacy-chat/voice-to-text`

Upload an audio blob; receive a transcription suitable for the chat input.

### `POST /api/privacy-chat/send-voice`

Combined voice → transcript → privacy chat → response in one call.

### Document APIs

| Method | Path | Purpose |
|--------|------|---------|
| `GET`  | `/api/document/supported-formats` | List allowed extensions |
| `POST` | `/api/document/upload` | Upload a single document (multipart) |
| `POST` | `/api/document/upload-multiple` | Upload several documents at once |
| `GET`  | `/api/document/{session_id}` | List documents in a session |
| `GET`  | `/api/document/{session_id}/{doc_id}` | Fetch processed document |
| `DELETE` | `/api/document/{session_id}/{doc_id}` | Remove a document |
| `POST` | `/api/document/{session_id}/set-active/{doc_id}` | Mark active doc for chat context |

Single upload example:

```http
POST /api/document/upload
Content-Type: multipart/form-data

session_id: 1
file: <binary>
```

### Streaming client snippet

```javascript
const res = await fetch('/api/privacy-chat/stream', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message: text, privacy_mode: true, session_id: 1 })
});

const reader = res.body.getReader();
const decoder = new TextDecoder();
while (true) {
  const { value, done } = await reader.read();
  if (done) break;
  process(decoder.decode(value));
}
```

---

## Docker Deployment

The repository ships with a multi-stage `Dockerfile` (pre-downloads the CAMeL-Lab BERT model into the image cache) and a `docker-compose.yml` with optional Nginx reverse-proxy profile.

### Build & run with Docker

```bash
docker build -t pii-shield .

docker run -d \
  --name pii-shield \
  -p 8000:8000 \
  --env-file .env \
  -v "$(pwd)/checkpoints:/app/checkpoints:ro" \
  pii-shield
```

### docker-compose

```bash
# Standard run
docker-compose up -d

# Run with Nginx reverse proxy (requires nginx.conf and SSL dir)
docker-compose --profile production up -d
```

Compose features:
- Health check on `/health`
- Memory limit 4 G, reservation 2 G
- Persistent volumes for `logs/`, `uploads/`, and a cache volume for HF models
- Read-only mount of `checkpoints/`
- Log rotation (10 MB × 3 files)

See `DOCKER_DEPLOYMENT.md` for the full deployment guide.

---

## Production Deployment

### Tailscale Funnel (publish a private host)

1. Package and ship the source:
   ```bash
   tar -czf deploy-package.tar.gz \
     --exclude='*.pyc' --exclude='__pycache__' \
     --exclude='.git' --exclude='.venv' \
     src/ requirements.txt checkpoints/
   scp deploy-package.tar.gz user@server:~/
   ```

2. On the server:
   ```bash
   mkdir -p ~/ner-pii-nlp && cd ~/ner-pii-nlp
   tar -xzf ~/deploy-package.tar.gz
   python3 -m venv venv && source venv/bin/activate
   pip install -r requirements.txt
   cp .env.example .env && nano .env   # add OPENAI_API_KEY
   ```

3. Install Tailscale:
   ```bash
   curl -fsSL https://tailscale.com/install.sh | sh
   sudo tailscale up
   ```

4. Systemd unit (`/etc/systemd/system/pii-shield.service`):
   ```ini
   [Unit]
   Description=PII Shield Application
   After=network.target

   [Service]
   Type=simple
   User=your-username
   WorkingDirectory=/home/your-username/ner-pii-nlp
   Environment="PATH=/home/your-username/ner-pii-nlp/venv/bin"
   Environment="PYTHONPATH=/home/your-username/ner-pii-nlp"
   ExecStart=/home/your-username/ner-pii-nlp/venv/bin/python -m uvicorn src.main:app --host 0.0.0.0 --port 8000
   Restart=on-failure

   [Install]
   WantedBy=multi-user.target
   ```

5. Enable and expose:
   ```bash
   sudo systemctl enable --now pii-shield
   sudo tailscale serve --bg --http 8000 / http://localhost:8000
   sudo tailscale funnel 8000
   ```

   App URL: `https://<machine>.<tailnet>.ts.net`.

### Other cloud targets

- **AWS EC2** — systemd + Nginx in front
- **Google Cloud Run** — push the Docker image
- **Azure App Service** — Python web app
- **DigitalOcean App Platform** — connect the GitHub repo

See `DEPLOYMENT_CHECKLIST.md` for the full pre-flight checklist.

---

## Project Structure

```
ner-pii-nlp-5/
├── src/
│   ├── main.py                    # FastAPI app, routes, chat & doc endpoints
│   ├── config.py                  # Env-driven application configuration
│   ├── models/
│   │   ├── pii_shield_model.py    # Core PII detection model (BERT + custom head)
│   │   ├── camel_bert_model.py    # Arabic NER wrapper (CAMeL Lab)
│   │   ├── entity_processor.py    # Span aggregation, masking, dictionary mgmt
│   │   ├── entity_config.py       # Display colors / emojis / names per entity
│   │   ├── label_mapping.py       # BIO label ↔ id maps
│   │   ├── model_factory.py       # Loads & caches model versions
│   │   ├── model_config.py        # Registry of available model versions
│   │   ├── model_interface.py     # Abstract model interface
│   │   └── document_processor.py  # PDF / DOCX / XLSX / CSV / TXT parsing
│   ├── static/
│   │   ├── css/                   # styles.css, document-*.css, attachment-text-fix.css
│   │   └── js/                    # privacy_chat.js, app.js, document-attachment-manager.js,
│   │                              # entity-dictionary.js, color_customizer_compact.js,
│   │                              # security-utils.js, logger.js
│   └── templates/
│       ├── base.html              # Layout
│       ├── welcome.html           # Landing page
│       ├── index.html             # PII detector UI
│       └── privacy_chat.html      # Privacy chat UI
├── checkpoints/
│   └── pii_shield_002v.pt         # Fine-tuned model weights (~1.3 GB)
├── temp_uploads/                  # Scratch dir for upload pipeline
├── requirements.txt
├── Dockerfile
├── docker-compose.yml
├── DOCKER_DEPLOYMENT.md
├── DEPLOYMENT_CHECKLIST.md
├── .env.example
├── LICENCE
└── README.md
```

---

## Troubleshooting

**Model file not found**
```
Error: Model file not found at checkpoints/pii_shield_002v.pt
```
Ensure the `.pt` file is present (it's not redistributed via pip). Contact the repository owner if missing.

**OpenAI API error**
```
Error: OpenAI API key not configured
```
Add `OPENAI_API_KEY=...` to `.env`, or export it in the shell. In production (`DEBUG=False`), the app refuses to start without a key.

**Port already in use**
```bash
lsof -i :8000
kill -9 <PID>
```
Or pick a different port with `--port`.

**CUDA out of memory**
Run on CPU (`CUDA_VISIBLE_DEVICES=""`) or restart with a smaller batch. The model fits comfortably on 8 GB VRAM.

**Slow first request**
The CAMeL Lab Arabic NER model is downloaded from Hugging Face on first run. The Docker image pre-downloads it; for bare-metal installs the first request after start can take 30–60 s.

**Sessions disappearing across reloads**
Sessions are in-memory by design. Don't run multiple workers without a shared session store, and don't expect persistence across restarts.

### Logs

```bash
# Local
python -m uvicorn src.main:app --log-level debug

# systemd
sudo journalctl -u pii-shield -f

# Docker
docker logs -f pii-shield
```

---

## Contributing

1. Fork the repository
2. Create a feature branch — `git checkout -b feature/your-feature`
3. Commit changes — `git commit -m "Add your feature"`
4. Push the branch — `git push origin feature/your-feature`
5. Open a Pull Request

**Guidelines**

- Follow PEP 8.
- Keep new code dependency-light; pin versions in `requirements.txt`.
- Update `src/models/label_mapping.py` and `src/models/entity_config.py` together when adding entity types.
- Update this README and `DEPLOYMENT_CHECKLIST.md` if you change configuration or deployment behavior.

---

## License

This project is licensed under the MIT License — see [LICENCE](LICENCE) for details.

---

## Acknowledgments

- **OpenAI** — GPT-4 API
- **CAMeL Lab** — `bert-base-arabic-camelbert-msa-ner`
- **Hugging Face** — Transformers library and model hub
- **FastAPI** — web framework
- **PyTorch** — model runtime
- The Sultanate of Oman's public-sector technologists driving **Vision 2040** and the **Personal Data Protection Law (Royal Decree 6/2022)**.
