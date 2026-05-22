# PII Shield - Advanced Privacy Protection Platform

  <h3> AI-Powered PII Detection & Privacy-Preserving Chat</h3>

  <p>
    <img src="https://img.shields.io/badge/Python-3.8%2B-blue" alt="Python">
    <img src="https://img.shields.io/badge/FastAPI-0.104.1-green" alt="FastAPI">
    <img src="https://img.shields.io/badge/PyTorch-2.1.0-orange" alt="PyTorch">
    <img src="https://img.shields.io/badge/OpenAI-GPT--4-purple" alt="OpenAI">
    <img src="https://img.shields.io/badge/License-MIT-red" alt="License">
  </p>

  <p>
    <strong> Live Demo:</strong> <a href="https://chat.orki.ai/privacy-chat">https://chat.orki.ai/privacy-chat</a>
  </p>


##  Overview

**PII Shield** was created to support **employees of enterprise and government entities in the Sultanate of Oman** in protecting sensitive **Omani data** before it is sent to Large Language Models (LLMs) such as ChatGPT, Claude, Gemini, and others.

Many public-sector and corporate employees rely on LLMs to draft reports, translate documents, and analyze text — but doing so risks leaking confidential national, institutional, and personal data to third-party AI providers. **PII Shield acts as a privacy gateway**: it detects, masks, and substitutes PII and Named Entities locally *before* any data leaves the user's machine, then restores the original values in the model's response. This keeps Omani data sovereign while still letting employees benefit from the productivity of modern LLMs.

The platform is purpose-built with **Gulf-specific PII and NER models**, tuned for Omani names, tribal nomenclature, civil IDs, passport formats, Omani phone numbers, governorates, ministries, and Arabic government discourse.

###  Mission

> **Protect Omani data sovereignty. Empower government and enterprise employees to use LLMs safely — in their own language and dialect.**

###  Try It in Omani Arabic Dialect

To experience the full power of the system, it is **strongly recommended to test it using Arabic in the Omani dialect**, as the models are specifically tuned for Gulf-region linguistic patterns, official Omani government phrasing, honorifics (معالي، فضيلة، السيد/ة)، tribal names, and Omani administrative structures.

####  Example Input (Omani Government Context)

Try pasting the following text into the **Privacy Chat** at [https://chat.orki.ai/privacy-chat](https://chat.orki.ai/privacy-chat):

```text
احتفت وزارة الإعلام بإطلاق الفيلم الوثائقي من خلال عرض أُقيم على مسرح وزارة الثقافة مساء اليوم، وسط حضور ثقافي وفني من مختلف أنحاء السلطنة.

وأكد معالي الدكتور عبدالله بن ناصر بن سالم بن حمد الحراصي، وزير الإعلام، في تصريح صحفي، أن الفيلم الوثائقي يأتي ضمن برنامج الوزارة الهادف إلى توثيق التاريخ العُماني وإبراز الجوانب الإنسانية والحضارية في المجتمع العُماني، من خلال إنتاج أعمال إعلامية ووثائقية تُقدَّم برؤية معاصرة ومعايير إنتاج حديثة، بهدف الإثراء الثقافي وإيصال الصورة العُمانية بصورة مميزة.

كما أكدت فضيلة السيدة هادية بنت سلطان بنت محمد عبدالملك السيابية من محافظة جنوب الباطنة أن الفيلم سيصل ويُعرض هناك أيضًا، لما يحمله من قيمة ثقافية وتوثيقية للمجتمع العُماني.

ولمزيد من المعلومات والتواصل، يرجى التواصل على رقم هاتف الوزارة: ٢٤٢٢٦٦٥٤٣٢، أو زيارة الموقع الإلكتروني: [وزارة الثقافة والرياضة والشباب العمانية](https://mcsy.om/?utm_source=chatgpt.com)

كما تم تسجيل البيانات الرسمية التالية ضمن ملف التوثيق:

* رقم البطاقة التعريفية: ١٣٧٧٦٥٩٩٨
* رقم جواز السفر: AA656943321
* رقم البطاقة الائتمانية التجريبية (Synthetic/Test): 5443320998765321
```

####  What PII Shield Will Detect

When you submit the example above, the system will automatically identify and mask Gulf-specific entities including:

| Detected Entity | Example from the Text | Type |
|-----------------|----------------------|------|
| معالي الدكتور عبدالله بن ناصر بن سالم بن حمد الحراصي | Omani full tribal name + honorific | **PER** |
| فضيلة السيدة هادية بنت سلطان بنت محمد عبدالملك السيابية | Omani female tribal name + honorific | **PER** |
| وزارة الإعلام / وزارة الثقافة | Omani government ministries | **ORG** |
| محافظة جنوب الباطنة | Omani governorate | **LOC** |
| ٢٤٢٢٦٦٥٤٣٢ | Arabic-numeral Omani phone | **PHONE** |
| https://mcsy.om | Omani government domain | **URL** |
| ١٣٧٧٦٥٩٩٨ | Omani Civil ID (Arabic numerals) | **CIVIL_ID** |
| AA656943321 | Passport number | **PASSPORT** |
| 5443320998765321 | Credit card number (test) | **CREDIT_CARD** |

After masking, the redacted version is what gets sent to the LLM — and the original values are restored in the response **on your side only**, never leaving your environment.

The application is currently deployed and available at **https://chat.orki.ai/privacy-chat**

##  Strategic Importance: Protecting Omani Data & Aligning with Oman Vision 2040

###  Why This Project Matters for the Sultanate of Oman

The rapid adoption of foreign Large Language Models (ChatGPT, Claude, Gemini, Copilot, DeepSeek, etc.) inside Omani ministries, public authorities, and private enterprises has created a **silent data-leakage crisis**. Every prompt typed into a foreign LLM is:

- **Transmitted abroad** — usually to servers in the US, EU, or East Asia, outside Omani jurisdiction.
- **Often retained and used for training** — depending on the provider's terms of service.
- **Subject to foreign legal regimes** — including subpoenas, intelligence requests, and data-sharing treaties that the Sultanate is not party to.

When that prompt contains an Omani civil ID, a tribal name, a ministerial decision, a tender document, a medical record, a citizen complaint, or a draft policy, it constitutes a **breach of national data sovereignty** — even if no malicious actor is involved.

**PII Shield closes this gap.** It ensures that all personally identifiable and nationally sensitive information — written in Arabic, Omani dialect, or English — is **detected, masked, and substituted locally** before it ever crosses Oman's digital borders. The LLM still helps the employee draft, summarize, or translate; but the underlying Omani data stays inside the Sultanate.

###  Alignment with Oman Vision 2040

PII Shield directly supports several pillars of **رؤية عُمان 2040 (Oman Vision 2040)**:

| Vision 2040 Pillar | How PII Shield Contributes |
|--------------------|---------------------------|
| **Governance of the State Administration's Apparatus, Resources & Projects** | Enables ministries to safely adopt AI tools without violating government data-classification policies or the Personal Data Protection Law (Royal Decree 6/2022). |
| **Economic Diversification & Fiscal Sustainability** | Lets enterprises in non-oil sectors (logistics, tourism, fintech, manufacturing) use AI productively without exposing trade secrets or customer data abroad. |
| **Development of the Digital Economy** | Provides the privacy-trust layer that makes large-scale, lawful adoption of AI within Oman possible — a prerequisite for a competitive digital economy. |
| **A Caring Society** | Protects the personal data of Omani citizens — their identities, health records, financial details, and family information — from foreign data brokers and AI training pipelines. |
| **National Security & Sovereignty** | Keeps sensitive government correspondence, defense-adjacent communications, and strategic documents inside the Sultanate's digital perimeter. |

The project is also fully aligned with:

- **Royal Decree No. 6/2022 — Personal Data Protection Law (PDPL)** — Oman's binding data-protection framework.
- **The National Programme for Digital Economy** (under the Ministry of Transport, Communications and Information Technology).
- **The National AI Policy & Ethical AI guidelines** issued by MTCIT.

###  Target Industries & Sectors That Need PII Shield

PII Shield is designed for any organization that handles Omani personal, commercial, or governmental data and wants to safely leverage LLMs. Priority sectors include:

####  Government & Public Sector
- **Ministries & Government Authorities** — drafting policy, translating documents, summarizing reports without leaking citizen or state data.
- **Royal Oman Police (ROP)** — handling civil records, traffic data, identity documents.
- **Ministry of Defence & Internal Security Service** — protecting strategic and classified discourse.
- **Ministry of Foreign Affairs** — diplomatic cables, briefings, translations.
- **Tax Authority & Ministry of Finance** — taxpayer data, financial statements, audit reports.
- **Ministry of Justice & Legal Affairs / Public Prosecution / Courts** — case files, judicial records, citizen identities.

####  Healthcare
- **Ministry of Health, Royal Hospital, SQUH, Khoula, Royal Court Medical Services** — patient records, diagnoses, medical correspondence (especially sensitive under PDPL Article 6 – Special Categories of Data).
- **Private hospitals, clinics, and insurers** — patient PII and medical claims.

####  Banking, Finance & Fintech
- **Central Bank of Oman (CBO)** — regulatory data, supervision reports.
- **Bank Muscat, NBO, Sohar International, Bank Dhofar, Ahli Bank, OAB, Bank Nizwa, Alizz Islamic Bank** — customer KYC, account numbers, IBAN, transactions.
- **Insurance companies & investment funds** — policyholder and beneficiary data.

####  Energy, Oil & Gas
- **Energy Development Oman (EDO), PDO, OQ, Oman LNG, Petrogas, Daleel** — contractor data, commercial agreements, well data, HSE incident reports.

####  Telecommunications
- **Omantel, Ooredoo, Vodafone Oman, Awasr, TRA** — subscriber data, CDRs, network operations.

####  Education & Research
- **Ministry of Education, Ministry of Higher Education, SQU, GUtech, UTAS, private universities** — student records, research data, academic correspondence.

####  Legal, Audit & Consulting Firms
- Local and international law firms operating in Oman, audit firms (Big 4 and local), and management consultancies — all of whom handle client-confidential Omani data daily.

####  Logistics, Aviation & Tourism
- **Asyad Group, Oman Air, Oman Airports, Ministry of Heritage & Tourism, OMRAN** — passenger data, cargo manifests, hospitality guest records.

####  Critical Infrastructure & Utilities
- **Nama Group, OPWP, Haya Water, Be'ah** — customer billing, infrastructure plans, SCADA-adjacent documentation.

###  The Bottom Line

> Foreign LLMs are powerful — but they were not built with Omani data sovereignty in mind. **PII Shield is the bridge** that lets the Sultanate's workforce harness those LLMs **without surrendering the data that belongs to Oman, its citizens, and its institutions.**
>
> It is a practical, deployable, and locally-tuned contribution to **Oman Vision 2040's promise of a sovereign, secure, and prosperous digital future.**



###  Key Features

- ** AI-Powered Detection**: Custom BERT model fine-tuned for PII detection
- ** Privacy Chat**: GPT-4 powered chat with automatic PII masking
- ** Document Processing**: Support for PDF, DOCX, TXT, CSV, MD files
- ** Multilingual**: Full Arabic and English support with RTL handling
- ** Zero Data Storage**: No persistent storage of user data
- ** Real-time Processing**: Instant detection with streaming responses
- ** Modern UI**: Dark theme with customizable entity colors

##  Table of Contents

- [Quick Start](#-quick-start)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Usage](#-usage)
- [Deployment](#-deployment)
- [API Documentation](#-api-documentation)
- [Project Structure](#-project-structure)
- [Contributing](#-contributing)

##  Quick Start

```bash
# Clone the repository
git clone <repository-url>
cd ner-pii-nlp-5

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env and add your OpenAI API key

# Run the application
PYTHONPATH=. python -m uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload
```

Visit `http://localhost:8000` to access the application.

**Or try the live demo:** [https://chat.orki.ai/privacy-chat](https://chat.orki.ai/privacy-chat)

##  Installation

### Prerequisites

- **Python**: 3.8 or higher
- **Memory**: 4GB RAM minimum (8GB recommended)
- **Storage**: 2GB for models and dependencies
- **OpenAI API Key**: Required for chat functionality

### Step-by-Step Installation

1. **Clone the Repository**
```bash
git clone <repository-url>
cd ner-pii-nlp-5
```

2. **Create Virtual Environment** (Recommended)
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Install Dependencies**
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

4. **Verify Model Checkpoint**
```bash
# Ensure the model file exists at:
# checkpoints/pii_shield_002v.pt
# This file should be included in the repository (1.3 GB)
ls -lh checkpoints/pii_shield_002v.pt
```

5. **Configure Environment Variables**
```bash
cp .env.example .env
```

Edit `.env` file:
```env
# Required for chat functionality
OPENAI_API_KEY=your_openai_api_key_here

# Optional configuration
DEBUG=False
HOST=0.0.0.0
PORT=8000
```

##  Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `OPENAI_API_KEY` | OpenAI API key for GPT-4 | - | Yes (for chat) |
| `DEBUG` | Debug mode | `True` | No |
| `HOST` | Server host | `0.0.0.0` | No |
| `PORT` | Server port | `8000` | No |
| `CONFIDENCE_THRESHOLD` | Entity detection threshold | `0.75` | No |

### Model Configuration

The application uses multiple AI models:

1. **PII Detection Model**: Custom BERT model (`pii_shield_002v.pt`)
2. **Arabic NER Model**: CAMeL-Lab BERT for Arabic text
3. **GPT-4**: For privacy-preserving chat responses

##  Usage

### Running the Application

**Development Mode** (with auto-reload):
```bash
PYTHONPATH=. python -m uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload
```

**Production Mode**:
```bash
PYTHONPATH=. python -m uvicorn src.main:app --host 0.0.0.0 --port 8000 --workers 4
```

### Features Overview

#### 1. PII Detection Interface (`/app`)
- Enter or paste text containing PII
- View real-time entity detection
- Color-coded entity highlighting
- Export results as JSON/CSV

#### 2. Privacy Chat (`/privacy-chat`)
- Chat with GPT-4 while protecting your privacy
- Automatic PII masking in conversations
- Document attachment support
- Toggle between masked/unmasked views
- Export conversation entities

#### 3. Document Processing
- Drag & drop file upload
- Batch processing support
- Extract text from various formats
- Automatic PII detection in documents

### Supported Entity Types

| Entity | Icon | Description | Examples |
|--------|------|-------------|----------|
| **Person** |  | Personal names |  محمد بن سليم الحارثي |
| **Location** |  | Places, addresses | قرية السجورة ولاية نزوى, مسقط |
| **Organization** |  | Companies, institutions | محمد بن خليل للتجارة والمقاولات, بنك مسقط |
| **Email** |  | Email addresses | user@example.com |
| **Phone** |  | Phone numbers | 9xxxxxxx, +968xxxxxxxx |
| **URL** |  | Web addresses | https://example.com |
| **Civil ID** |  | Civil identification | 123456789 |
| **Passport** |  | Passport numbers | AB1234567 |
| **Credit Card** |  | Card numbers | 4xxx-xxxx-xxxx-xxxx |
| **Bank Account** |  | Account numbers | IBAN, account formats |

##  Deployment

### Production Deployment

The application is currently deployed and running at:
- **Live URL**: [https://chat.orki.ai/privacy-chat](https://chat.orki.ai/privacy-chat)
- **Main Interface**: `/privacy-chat` - Privacy-preserving chat interface
- **PII Detector**: `/app` - Entity detection interface
- **Welcome Page**: `/` - Landing page

### Local Deployment

```bash
# Using the quick deploy script (if available)
./quick_deploy.sh
```

### Docker Deployment

```bash
# Build the Docker image
docker build -t pii-shield .

# Run with Docker
docker run -d \
  --name pii-shield \
  -p 8000:8000 \
  --env-file .env \
  pii-shield

# Or use Docker Compose
docker-compose up -d
```

### Production Deployment with Tailscale

Deploy your app publicly using Tailscale Funnel:

1. **Prepare for Deployment**
```bash
# Create deployment package
tar -czf deploy-package.tar.gz \
  --exclude='*.pyc' \
  --exclude='__pycache__' \
  --exclude='.git' \
  --exclude='venv' \
  src/ requirements.txt

# Transfer to server
scp deploy-package.tar.gz user@server:~/
```

2. **On the Server**
```bash
# Extract and setup
mkdir -p ~/ner-pii-nlp
cd ~/ner-pii-nlp
tar -xzf ~/deploy-package.tar.gz

# Create virtual environment
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Configure environment
nano .env  # Add your OpenAI API key
```

3. **Install Tailscale**
```bash
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up
```

4. **Create Systemd Service**
```bash
sudo nano /etc/systemd/system/pii-shield.service
```

Add:
```ini
[Unit]
Description=PII Shield Application
After=network.target

[Service]
Type=simple
User=your-username
WorkingDirectory=/home/your-username/ner-pii-nlp
Environment="PATH=/home/your-username/ner-pii-nlp/venv/bin"
ExecStart=/home/your-username/ner-pii-nlp/venv/bin/python -m uvicorn src.main:app --host 0.0.0.0 --port 8000
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

5. **Enable Public Access**
```bash
# Start the service
sudo systemctl enable pii-shield
sudo systemctl start pii-shield

# Enable Tailscale Funnel
sudo tailscale serve --bg --http 8000 / http://localhost:8000
sudo tailscale funnel 8000
```

Your app will be accessible at: `https://[your-machine].[tailnet].ts.net`

### Cloud Deployment Options

- **AWS EC2**: Use the systemd service approach
- **Google Cloud Run**: Deploy using Docker
- **Azure App Service**: Deploy as a Python web app
- **Heroku**: Use the included `Procfile`
- **DigitalOcean App Platform**: Deploy from GitHub

##  API Documentation

### Core Endpoints

#### Health Check
```http
GET /health
```
Response:
```json
{
  "status": "healthy",
  "service": "PII-Shield"
}
```

#### Extract Entities
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
    {
      "text": "John Doe",
      "entity_type": "PER",
      "start": 0,
      "end": 8
    },
    {
      "text": "john@example.com",
      "entity_type": "EMAIL",
      "start": 21,
      "end": 37
    }
  ],
  "entity_counts": {
    "PER": 1,
    "EMAIL": 1
  }
}
```

#### Privacy Chat
```http
POST /api/privacy-chat
Content-Type: application/json

{
  "message": "My name is John and I live in New York",
  "privacy_mode": true,
  "session_id": 1
}
```
Response:
```json
{
  "original_message": "My name is John and I live in New York",
  "masked_message": "My name is Person1 and I live in Location1",
  "display_response": "Hello Person1! How's the weather in Location1?",
  "unmasked_response": "Hello John! How's the weather in New York?",
  "user_entities": ["..."],
  "response_entities": ["..."]
}
```

#### Document Upload
```http
POST /api/document/upload
Content-Type: multipart/form-data

session_id: 1
file: [binary]
```

### WebSocket Streaming

For real-time chat responses:
```javascript
const response = await fetch('/api/privacy-chat/stream', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message: text, privacy_mode: true })
});

const reader = response.body.getReader();
// Process streaming response
```

##  Project Structure

```
ner-pii-nlp-5/
├── src/
│   ├── main.py                    # FastAPI application entry point (1654+ lines)
│   ├── config.py                  # Application configuration
│   ├── models/
│   │   ├── pii_shield_model.py    # Core PII detection model
│   │   ├── camel_bert_model.py    # Arabic NER model
│   │   ├── entity_processor.py    # Entity processing utilities
│   │   ├── entity_config.py       # Entity type definitions
│   │   ├── document_processor.py  # Document handling
│   │   ├── model_factory.py       # Model management
│   │   └── model_config.py        # Model configuration settings
│   ├── static/
│   │   ├── css/                   # Stylesheets
│   │   ├── js/                    # JavaScript modules
│   │   │   ├── privacy_chat.js    # Chat interface logic
│   │   │   └── document-*.js      # Document handling
│   │   └── icons/                 # UI icons and assets
│   └── templates/
│       ├── base.html               # Base template
│       ├── welcome.html            # Landing page
│       ├── index.html              # PII detector interface
│       └── privacy_chat.html       # Privacy chat interface
├── checkpoints/
│   └── pii_shield_002v.pt         # Model weights (1.3 GB)
├── requirements.txt                # Python dependencies
├── docker-compose.yml              # Docker configuration
├── Dockerfile                      # Container definition
├── DOCKER_DEPLOYMENT.md            # Docker deployment guide
├── .env.example                    # Environment template
└── README.md                       # This file
```

##  Testing

Run tests:
```bash
# Unit tests
pytest tests/

# With coverage
pytest --cov=src tests/

# Integration tests
pytest tests/integration/
```

##  Troubleshooting

### Common Issues

**1. Model Loading Error**
```
Error: Model file not found at checkpoints/pii_shield_002v.pt
```
Solution: Ensure model file exists or contact repository owner

**2. OpenAI API Error**
```
Error: OpenAI API key not configured
```
Solution: Add your API key to `.env` file

**3. Port Already in Use**
```
Error: [Errno 48] Address already in use
```
Solution:
```bash
# Find and kill process using port 8000
lsof -i :8000
kill -9 <PID>
```

**4. Memory Error**
```
Error: CUDA out of memory
```
Solution: Run on CPU or reduce batch size

### Logs and Debugging

View application logs:
```bash

python -m uvicorn src.main:app --log-level debug

# Production (systemd)
sudo journalctl -u pii-shield -f

# Docker
docker logs -f pii-shield
```

##  Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow PEP 8 style guide
- Add unit tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting PR

##  License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details. 

##  Acknowledgments

- **OpenAI** for GPT-4 API
- **Hugging Face** for Transformers library
- **CAMeL Lab** for Arabic BERT model
- **FastAPI** for the web framework
- **PyTorch** community


