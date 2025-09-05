# Blot - Advanced PII Detection & Privacy Protection Platform

<div align="center">
  <img src="https://img.shields.io/badge/Python-3.8%2B-blue" alt="Python">
  <img src="https://img.shields.io/badge/FastAPI-0.104%2B-green" alt="FastAPI">
  <img src="https://img.shields.io/badge/PyTorch-2.0%2B-orange" alt="PyTorch">
  <img src="https://img.shields.io/badge/OpenAI-GPT--4-purple" alt="OpenAI">
  <img src="https://img.shields.io/badge/License-MIT-red" alt="License">
</div>

## 🚀 Overview

**Blot** is an advanced AI-powered platform for detecting and protecting personally identifiable information (PII) in text and documents. Built with FastAPI and state-of-the-art NLP models, it provides real-time entity detection, privacy-preserving chat with GPT-4.1, document processing capabilities, and comprehensive data masking features.

### ✨ Key Features

- **🤖 Dual AI Integration**: 
  - Custom PII-Shield BERT model for entity detection
  - GPT-4.1 integration for privacy-preserving conversations
  
- **📄 Document Processing**:
  - Support for PDF, DOCX, TXT, CSV, and MD files
  - Drag-and-drop file upload interface
  - In-chat document attachment with privacy protection
  - Real-time entity detection in uploaded documents
  - Document preview modal with highlighted entities
  
- **🌍 Multi-Language Support**: 
  - Full Arabic and English text processing
  - RTL (Right-to-Left) text support
  - Arabic numeral detection (١٢٣٤٥٦٧٨٩٠)
  
- **🌐 Modern Web Interface**: 
  - Beautiful dark-themed responsive UI
  - Custom animations and transitions
  - Real-time updates via SSE (Server-Sent Events)
  
- **⚡ Real-time Processing**: 
  - Instant PII detection with streaming chat responses
  - Live entity highlighting during typing
  
- **🔒 Privacy Mode**: 
  - One-click toggle between masked and unmasked views
  - Persistent privacy state across messages
  - Document content protection in chat
  
- **🎨 Entity Highlighting**: 
  - Color-coded visualization for 10+ entity types
  - Interactive entity tooltips
  - Entity statistics dashboard
  
- **🔍 Advanced Detection**:
  - Obfuscation detection (spaces, dots, symbols)
  - Regex fallback for missed entities
  - Context-aware validation
  - Combined entity splitting (multiple organizations)

### 🛡️ Supported Entity Types

| Entity | Color | Description | Validation |
|--------|-------|-------------|------------|
| 👤 **Person** | Purple | Personal names | Arabic & English names |
| 📍 **Location** | Green | Cities, countries, addresses | Multi-language support |
| 🏢 **Organization** | Pink | Companies, institutions | Business entities, comma-separated lists |
| 📧 **Email** | Blue | Email addresses | RFC-compliant validation |
| 📱 **Phone** | Orange | Omani phone numbers | 9/7/22xxx patterns, hotlines |
| 🔗 **URL** | Teal | Web addresses | HTTP/HTTPS validation |
| 🆔 **Civil ID** | Indigo | Civil identification | 9-12 digits, specific patterns |
| 🛂 **Passport** | Red | Passport numbers | 1-2 letters + 7-9 digits |
| 💳 **Credit Card** | Gold | Credit card numbers | 16 digits, starts with 4/5 |
| 💰 **Bank Account** | Cyan | Bank account numbers | Banking format validation |

## 📦 Installation

### Prerequisites

- Python 3.8+
- OpenAI API key (for chat functionality)
- 4GB+ RAM recommended
- Modern web browser (Chrome, Firefox, Safari, Edge)

### 🔧 Setup Instructions

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/ner-pii-nlp.git
cd ner-pii-nlp
```

2. **Install dependencies**
```bash
pip install -r requirements.txt
```

3. **Configure environment**
Create a `.env` file in the root directory:
```env
OPENAI_API_KEY=your_openai_api_key_here
```

4. **Verify model checkpoint**
Ensure the model file exists at:
```
checkpoints/pii_shield_002v.pt
```

5. **Launch the application**
```bash
python src/main.py
```

The application will be accessible at `http://localhost:9000`

To use a different port:
```bash
python src/main.py --port 8001
```

## 🆕 Recent Updates

### Version 3.0 - Document Processing & Enhanced Chat
- ✅ **Document Upload**: Support for PDF, DOCX, TXT, CSV, MD files
- ✅ **In-Chat Attachments**: Send documents with messages for context-aware responses
- ✅ **Document Privacy Mode**: Automatic PII masking in uploaded documents
- ✅ **Attachment Cards**: Compact, clickable document cards in chat interface
- ✅ **Modal Preview**: Full document viewing with highlighted entities
- ✅ **Drag & Drop**: Intuitive file upload with visual feedback
- ✅ **Caption Support**: Add descriptive text with document attachments
- ✅ **Entity Splitting**: Smart detection of multiple organizations in lists

### Version 2.0 - Core Improvements
- ✅ **Enhanced Arabic Support**: Full detection of Arabic numerals in IDs
- ✅ **Improved Validation**: Smart filtering to reduce false positives
- ✅ **Obfuscation Detection**: Catches entities with spaces/dots
- ✅ **Passport Detection**: Fixed placeholder mapping
- ✅ **Phone Validation**: Omani-specific patterns with hotline support

## 🏗️ Architecture

### Project Structure
```
ner-pii-nlp/
├── src/
│   ├── main.py                     # FastAPI application core
│   ├── config.py                   # Configuration management
│   ├── chatbot.py                  # Chat interface handler
│   ├── models/
│   │   ├── pii_shield_model.py     # PII detection engine
│   │   ├── entity_processor.py     # Entity processing pipeline
│   │   ├── entity_config.py        # Entity type definitions
│   │   ├── document_processor.py   # Document parsing & extraction
│   │   ├── model_factory.py        # Model initialization
│   │   ├── model_interface.py      # Model abstractions
│   │   └── label_mapping.py        # Entity label mappings
│   ├── static/
│   │   ├── css/
│   │   │   ├── styles.css          # Global styling
│   │   │   ├── modern-chat.css     # Chat interface styles
│   │   │   ├── document-attachment.css # Document card styles
│   │   │   ├── document-manager.css    # Document modal styles
│   │   │   └── attachment-text-fix.css # Text layout fixes
│   │   ├── js/
│   │   │   ├── app.js              # Main detector app
│   │   │   ├── privacy_chat.js     # Chat functionality
│   │   │   ├── document-attachment-manager.js # Document handling
│   │   │   ├── document-manager.js # Document modal logic
│   │   │   └── entity-dictionary.js # Entity visualization
│   │   └── icons/                  # UI icons
│   └── templates/
│       ├── base.html               # Base template with theme
│       ├── index.html              # PII detector interface
│       ├── welcome.html            # Landing page
│       └── privacy_chat.html       # Chat interface
├── checkpoints/                    # Model weights
├── requirements.txt                # Python dependencies
├── .env                           # Environment variables
├── .env.example                   # Environment template
├── Dockerfile                     # Container configuration
├── docker-compose.yml             # Container orchestration
└── README.md                      # Documentation
```

### Core Components

#### 1. **PII Detection Engine** (`pii_shield_model.py`)
- Custom BERT-based model (PII-Shield v2)
- Real-time entity recognition
- Multi-language support (Arabic & English)
- Advanced validation pipeline
- High accuracy with low latency

#### 2. **Document Processor** (`document_processor.py`)
- Multi-format support (PDF, DOCX, TXT, CSV, MD)
- Text extraction with formatting preservation
- Metadata extraction (word count, pages)
- Entity detection in documents
- Batch processing capabilities

#### 3. **Privacy Chat System** (`privacy_chat.js`)
- GPT-4.1 integration
- Automatic PII masking before AI processing
- Entity mapping and restoration
- Streaming responses via SSE
- Document context awareness

#### 4. **Document Attachment Manager** (`document-attachment-manager.js`)
- File upload handling
- Drag-and-drop support
- Progress tracking
- Document card generation
- Preview modal management

## 🔌 API Reference

### Main Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Landing page redirect |
| GET | `/app` | PII detector interface |
| GET | `/privacy-chat` | Chat interface with document support |
| GET | `/welcome` | Welcome screen |

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/extract` | Extract entities from text |
| GET | `/api/models` | List available models |
| POST | `/api/privacy-chat` | Send chat message |
| POST | `/api/privacy-chat/stream` | Stream chat response |
| POST | `/api/privacy-chat/reset` | Reset chat session |
| POST | `/api/upload-document` | Upload and process document |
| POST | `/api/process-document` | Extract text from document |

### Example API Usage

```python
import requests

# Extract entities from text
response = requests.post('http://localhost:9000/api/extract', 
    json={'text': 'John Doe lives in New York, email: john@example.com'})
entities = response.json()

# Upload and process document
with open('document.pdf', 'rb') as f:
    files = {'file': f}
    response = requests.post('http://localhost:9000/api/upload-document', files=files)
    result = response.json()
    # Returns: processed text, entities, word count

# Chat with document context
response = requests.post('http://localhost:9000/api/privacy-chat',
    json={
        'message': 'Summarize this document',
        'attachment': {
            'filename': 'document.pdf',
            'text': 'document content here...'
        }
    })
```

## 💻 Usage Guide

### PII Detection Interface
1. Navigate to `/app`
2. Enter or paste text containing PII
3. Click "Extract Entities"
4. View highlighted entities with color coding
5. Check entity statistics panel

### Privacy Chat with Documents
1. Go to `/privacy-chat`
2. **Upload documents**:
   - Click the paperclip icon OR
   - Drag and drop files into the chat
3. **Send with caption**: Type a message with the attached document
4. **View document**: Click on attachment cards to preview full content
5. **Privacy toggle**: Switch between masked and original text
6. System automatically masks PII in both messages and documents

### Document Support
- **Supported formats**: PDF, DOCX, TXT, CSV, MD
- **Max file size**: 10MB
- **Processing**: Automatic text extraction and entity detection
- **Preview**: Click document cards to view content with highlighted entities

### Privacy Mode
- **🔒 Locked**: Shows masked placeholders (Person1, Location2, etc.)
- **🔓 Unlocked**: Shows original entities
- Applies to both chat messages and document content
- State persists across the session

## ⚙️ Configuration

### Model Settings
Configure in `src/models/model_config.py`:
```python
MODEL_CONFIG = {
    'model_name': 'pii_shield_002v',
    'max_length': 512,
    'batch_size': 32,
    'device': 'cuda' if torch.cuda.is_available() else 'cpu'
}
```

### Server Configuration
Adjust in `src/config.py`:
```python
PORT = 9000  # Default port
HOST = "0.0.0.0"  # Bind to all interfaces
WORKERS = 1  # Number of worker processes
```

### Entity Configuration
Customize in `src/models/entity_config.py`:
- Add new entity types
- Modify color schemes
- Adjust detection thresholds
- Configure validation rules

## 🐳 Docker Deployment

### Using Docker
```bash
# Build the image
docker build -t blot-pii .

# Run the container
docker run -p 9000:9000 --env-file .env blot-pii
```

### Using Docker Compose
```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## 🔐 Security Features

- **Zero Data Storage**: No persistent storage of user data or documents
- **Secure Masking**: Cryptographically secure placeholder generation
- **Session Isolation**: Independent chat sessions per user
- **API Key Protection**: Environment variable management
- **HTTPS Ready**: SSL/TLS support configured
- **Input Validation**: Multi-layer validation to prevent injection attacks
- **File Type Validation**: Strict file type checking for uploads
- **Size Limits**: Configurable file size restrictions

## 🧪 Development

### Running Development Server
```bash
# With auto-reload
uvicorn src.main:app --reload --port 9000

# With debugging
PYTHONPATH=. python src/main.py --port 9000 --debug
```

### Testing
```bash
# Run unit tests
pytest tests/

# Run with coverage
pytest --cov=src tests/
```

### Code Quality
```bash
# Format code
black src/

# Lint
pylint src/

# Type checking
mypy src/
```

## 📝 Requirements

Core dependencies:
```txt
fastapi==0.104.1
uvicorn==0.24.0
torch>=2.0.1
transformers==4.35.2
python-dotenv==1.0.0
openai>=1.3.0
pydantic==2.5.0
jinja2==3.1.2
python-multipart==0.0.6
pypdf2==3.0.1
python-docx==0.8.11
pandas==2.1.0
markdown==3.4.4
sse-starlette==1.6.5
```

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Guidelines
- Follow PEP 8 style guide
- Add unit tests for new features
- Update documentation
- Ensure all tests pass
- Test with both Arabic and English content

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- OpenAI for GPT-4 API
- Hugging Face Transformers
- FastAPI framework
- PyTorch community
- Contributors and testers

## 📧 Support

For issues, questions, or suggestions:
- Open an issue on [GitHub](https://github.com/yourusername/ner-pii-nlp/issues)
- Email: support@orki.ai

## ⚠️ Disclaimer

This application processes sensitive information. Always ensure:
- Proper security measures in production environments
- Compliance with data protection regulations (GDPR, CCPA, etc.)
- Regular security audits
- Encrypted connections (HTTPS) in production
- Secure handling of uploaded documents

---

<div align="center">
<strong>Built with ❤️ by the Orki Team</strong>
</div>
<div align="center">
<a href="https://orki.ai">https://orki.ai</a>
</div>