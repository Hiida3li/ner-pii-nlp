# Blot - Advanced PII Detection & Privacy Protection Platform

<div align="center">
  <img src="https://img.shields.io/badge/Python-3.8%2B-blue" alt="Python">
  <img src="https://img.shields.io/badge/FastAPI-0.104%2B-green" alt="FastAPI">
  <img src="https://img.shields.io/badge/PyTorch-2.0%2B-orange" alt="PyTorch">
  <img src="https://img.shields.io/badge/OpenAI-GPT--4.1-purple" alt="OpenAI">
  <img src="https://img.shields.io/badge/License-MIT-red" alt="License">
</div>

## 🚀 Overview

**Blot** is an advanced AI-powered platform for detecting and protecting personally identifiable information (PII) in text. Built with FastAPI and state-of-the-art NLP models, it provides real-time entity detection, privacy-preserving chat with GPT-4.1, and comprehensive data masking capabilities.

### ✨ Key Features

- **🤖 Dual AI Integration**: 
  - Custom PII-Shield model for entity detection
  - GPT-4.1 integration for privacy-preserving conversations
- **🌐 Modern Web Interface**: Beautiful dark-themed UI with custom animations
- **⚡ Real-time Processing**: Instant PII detection with streaming chat responses
- **🔒 Privacy Mode**: One-click toggle between masked and unmasked views
- **🎨 Entity Highlighting**: Color-coded visualization for 10+ entity types
- **💬 Smart Chat**: AI assistant that respects privacy boundaries
- **📊 Entity Statistics**: Real-time tracking and visualization
- **🔄 Bidirectional Masking**: Seamless entity replacement and restoration

### 🛡️ Supported Entity Types

| Entity | Color | Description | Validation |
|--------|-------|-------------|------------|
| 👤 **Person** | Purple | Personal names | Arabic & English names |
| 📍 **Location** | Green | Cities, countries, addresses | Multi-language support |
| 🏢 **Organization** | Pink | Companies, institutions | Business entities |
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
- Modern web browser

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
Create a `.env` file:
```env
OPENAI_API_KEY=your_openai_api_key_here
```

4. **Verify model checkpoint**
Ensure the model file exists:
```
checkpoints/pii_shield_002v.pt
```

5. **Launch the application**
```bash
python src/main.py --port 8001
```

Access the application at `http://localhost:9000`

## 🏗️ Architecture

### Project Structure
```
ner-pii-nlp/
├── src/
│   ├── main.py                 # FastAPI application core
│   ├── config.py               # Configuration management
│   ├── models/
│   │   ├── pii_shield_model.py # PII detection engine
│   │   ├── entity_processor.py # Entity processing pipeline
│   │   ├── entity_config.py    # Entity type definitions
│   │   ├── model_factory.py    # Model initialization
│   │   └── model_interface.py  # Model abstractions
│   ├── static/
│   │   ├── css/
│   │   │   └── styles.css      # Global styling
│   │   └── js/
│   │       ├── app.js          # Main detector app
│   │       ├── privacy_chat.js # Chat functionality
│   │       └── entity-dictionary.js # Entity visualization
│   └── templates/
│       ├── base.html           # Base template with theme
│       ├── index.html          # PII detector interface
│       ├── welcome.html        # Landing page
│       └── privacy_chat.html   # Chat interface
├── checkpoints/                # Model weights
├── requirements.txt            # Python dependencies
├── .env                        # Environment variables
├── Dockerfile                  # Container configuration
└── README.md                   # Documentation
```

### Core Components

#### 1. **PII Detection Engine**
- Custom BERT-based model (PII-Shield)
- Real-time entity recognition
- Multi-language support
- High accuracy with low latency

#### 2. **Privacy Chat System**
- GPT-4.1 integration
- Automatic PII masking before AI processing
- Entity mapping and restoration
- Streaming responses via SSE

#### 3. **Frontend Interface**
- Responsive dark/light themes
- Custom cursor with magnification
- Real-time entity highlighting
- Interactive entity dictionary

## 🔌 API Reference

### Main Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Landing page redirect |
| GET | `/app` | PII detector interface |
| GET | `/privacy-chat` | Chat interface |
| GET | `/welcome` | Welcome screen |

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/extract` | Extract entities from text |
| GET | `/api/models` | List available models |
| POST | `/api/privacy-chat` | Send chat message |
| POST | `/api/privacy-chat/stream` | Stream chat response |
| POST | `/api/privacy-chat/reset` | Reset chat session |

### Example API Usage

```python
import requests

# Extract entities
response = requests.post('http://localhost:9000/api/extract', 
    json={'text': 'John Doe lives in New York'})
entities = response.json()

# Chat with privacy
response = requests.post('http://localhost:9000/api/privacy-chat',
    json={'message': 'My email is john@example.com'})
```

## 💻 Usage Guide

### PII Detection
1. Navigate to `/app`
2. Enter text containing PII
3. Click "Extract Entities"
4. View highlighted entities
5. Check entity statistics

### Privacy Chat
1. Go to `/privacy-chat`
2. Type messages with PII
3. System auto-masks sensitive data
4. Toggle privacy mode to view original
5. Entities remain highlighted

### Privacy Mode
- **🔒 Locked**: Shows masked placeholders
- **🔓 Unlocked**: Shows original entities
- Seamless switching with preserved context

## ⚙️ Configuration

### Model Settings
Configure in `src/models/model_config.py`:
- Model architecture
- Tokenizer settings
- Entity mappings

### Server Configuration
Adjust in `src/config.py`:
- Port: 9000 (default)
- Host: 0.0.0.0
- Workers: 1

### Entity Types
Customize in `src/models/entity_config.py`:
- Add new entity types
- Modify color schemes
- Adjust detection rules

## 🐳 Docker Deployment

```bash
# Build image
docker build -t blot-pii .

# Run container
docker run -p 9000:9000 --env-file .env blot-pii
```

### Docker Compose
```yaml
version: '3.8'
services:
  blot:
    build: .
    ports:
      - "9000:9000"
    env_file:
      - .env
    volumes:
      - ./checkpoints:/app/checkpoints
```

## 🔐 Security Features

- **No Data Storage**: Zero persistent storage of user data
- **Secure Masking**: Cryptographically secure placeholders
- **Session Isolation**: Independent chat sessions
- **API Key Protection**: Environment variable management
- **HTTPS Ready**: SSL/TLS support configured

## 🧪 Development

### Running Development Server
```bash
# With auto-reload
uvicorn src.main:app --reload --port 9000

# With debugging
PYTHONPATH=. python src/main.py --port 8001
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

```txt
fastapi==0.104.1
uvicorn==0.24.0
torch==2.0.1
transformers==4.35.2
python-dotenv==1.0.0
openai==1.3.0
pydantic==2.5.0
jinja2==3.1.2
python-multipart==0.0.6
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

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- OpenAI for GPT-4.1 API
- Hugging Face Transformers
- FastAPI framework
- PyTorch community
- All contributors

## 📧 Support

For issues, questions, or suggestions:
- Open an issue on [GitHub](https://github.com/yourusername/ner-pii-nlp/issues)
- Contact: support@example.com

## ⚠️ Disclaimer

This application processes sensitive information. Always ensure:
- Proper security measures in production
- Compliance with data protection regulations
- Regular security audits
- Encrypted connections (HTTPS)

---

<div align="center">
Made with ❤️ by the Blot Team
</div>