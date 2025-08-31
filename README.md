# PII Detector - Advanced Privacy Protection Platform

<div align="center">
  <img src="https://img.shields.io/badge/Python-3.8%2B-blue" alt="Python">
  <img src="https://img.shields.io/badge/FastAPI-0.104%2B-green" alt="FastAPI">
  <img src="https://img.shields.io/badge/PyTorch-2.0%2B-orange" alt="PyTorch">
  <img src="https://img.shields.io/badge/License-Apache%202.0-red" alt="License">
</div>

## 🚀 Overview

PII Detector is an advanced AI-powered platform for detecting and protecting personally identifiable information (PII) in text. Built with FastAPI and state-of-the-art NLP models, it provides real-time entity detection with a beautiful, intuitive interface and **bidirectional PII masking** for privacy-preserving LLM interactions.

###  Key Features

- **🤖 Advanced AI Models**: PII-NER-v2 model with superior accuracy
- **🌐 Web Interface**: Modern, responsive UI with dark/light themes  
- **⚡ Real-time Detection**: Instant PII identification and highlighting
- **🔒 Privacy Mode**: Automatic masking of sensitive information
- **🛡️ Bidirectional Masking**: Forward masking (PII → generic labels) and reverse unmasking for LLM workflows
- **📚 Entity Dictionary**: Smart mapping system maintaining consistent entity numbering (Person1, Person2, etc.)
- **📊 Entity Statistics**: Detailed breakdown of detected entities
- **🎯 Multi-language Support**: Optimized for English and Arabic text (including Omani dialect)
- **🔌 RESTful API**: Full-featured API with comprehensive documentation
- **🔄 Privacy-Preserving LLM Workflow**: Send masked text to LLMs, receive responses, unmask back to original entities

###  Supported Entity Types

- 👤 **Person Names** (PER)
- 📍 **Locations** (LOC)
- 🏢 **Organizations** (ORG)
- 🔗 **URLs**
- 📧 **Email Addresses**
- 📱 **Phone Numbers**
- 🆔 **Civil IDs**
- 🛂 **Passport Numbers**
- 💳 **Credit Card Numbers**

## 📦 Quick Start

### Prerequisites

- Python 3.8 or higher
- pip package manager
- 4GB+ RAM recommended
- Git

### 🔧 Installation

1. **Clone the repository**
```bash
git clone https://github.com/Hiida3li/ner-pii-nlp.git
cd ner-pii-nlp
```

2. **Create virtual environment**
```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate

# On Windows:
venv\Scripts\activate
```

3. **Install dependencies**
```bash
pip install -r requirements.txt
```

4. **Download model files**
```bash
# Create required directories
mkdir -p checkpoints
mkdir -p PII-NER-V2

# Download model files (contact repository owner for access)
# Place pii_shield_002v.pt in checkpoints/
# Place model.pt in pii_shield_v001/
```

###  Running the Application

```bash
# Run the application (from project root)
python -m uvicorn src.main:app --reload --port 9000
```

### 🌐 Accessing the Application

Once running, access the application at:

- **Web Interface**: http://localhost:9000
- **API Documentation**: http://localhost:9000/docs
- **Alternative API Docs**: http://localhost:9000/redoc

## 🛡️ Privacy-Preserving LLM Workflow

### How Bidirectional Masking Works

1. **🔍 Analysis & Mapping**: Detect entities and create bidirectional mappings
   - `احمد` ↔ `Person1`
   - `0501234567` ↔ `Phone1`

2. **🔒 Forward Masking**: Convert original text to masked version
   - Input: `"مرحبا اسمي احمد ورقمي 0501234567"`
   - Output: `"مرحبا اسمي Person1 ورقمي Phone1"`

3. **🤖 LLM Interaction**: Send masked text to any LLM service
   - LLM processes without seeing real PII
   - Privacy guaranteed: No sensitive data leaves your system

4. **🔓 Reverse Unmasking**: Convert LLM response back to original entities
   - LLM Response: `"Person1's number Phone1 is valid"`
   - Final Result: `"احمد's number 0501234567 is valid"`

### Using the Privacy Tools

1. **Analyze Text**: Enter text and click "Analyze" to detect entities
2. **Copy Masked Text**: Click the "Copy Masked" button in the Entity Dictionary panel
3. **Send to LLM**: Paste masked text into any LLM service (ChatGPT, Claude, etc.)
4. **Unmask Response**: Paste LLM response in the unmask field and click "Unmask"

## 🛠️ Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Server Configuration
HOST=0.0.0.0
PORT=9000

# Model Configuration  
DEFAULT_MODEL=v2
MODEL_CACHE_SIZE=3

# Security
CORS_ORIGINS=["http://localhost:3000", "http://localhost:9000"]

# Logging
LOG_LEVEL=INFO
```

### Model Configuration

The application now uses a single high-performance model:

```python
MODELS = {
    "v2": {
        "name": "PII-Shield",
        "checkpoint": "checkpoints/pii_shield_002v.pt",
        "type": "pii_shield"
    }
}
```

##  API Documentation

### Core Endpoints

#### 1. Extract Entities
```http
POST /api/extract
Content-Type: application/json

{
  "text": "John Doe lives in New York and his email is john@example.com",
  "model_version": "v2"
}
```

**Response:**
```json
{
  "entities": [
    {
      "text": "John Doe",
      "entity_type": "PER",
      "start": 0,
      "end": 8,
      "confidence": 0.98
    },
    {
      "text": "New York",
      "entity_type": "LOC",
      "start": 18,
      "end": 26,
      "confidence": 0.95
    }
  ],
  "entity_counts": {
    "PER": 1,
    "LOC": 1,
    "EMAIL": 1
  },
  "highlighted_text": "<span class='entity-PER'>John Doe</span> lives in..."
}
```

#### 2. Get Available Models
```http
GET /api/models
```

**Response:**
```json
{
  "models": {
    "v2": {
      "name": "PII-Shield",
      "checkpoint": "checkpoints/pii_shield_002v.pt",
      "type": "pii_shield"
    }
  }
}
```

#### 3. Privacy Features

The application includes built-in privacy tools for secure LLM interactions:

- **Entity Dictionary Management**: Automatic mapping of PII to generic labels
- **Bidirectional Masking**: Forward and reverse text transformation
- **Session Isolation**: Mappings clear between analyses for privacy
- **Export/Import**: Save and restore entity dictionaries

## 🧪 Testing

### Running Tests
```bash
# Run all tests
pytest tests/

# Run with coverage
pytest --cov=src tests/

# Run specific test file
pytest tests/test_api.py
```

### Manual Testing

1. **Test with sample text:**
```bash
curl -X POST "http://localhost:9000/api/extract" \
  -H "Content-Type: application/json" \
  -d '{"text": "Contact Sarah at sarah@email.com or 555-0123", "model_version": "v2"}'
```

2. **Test Arabic text with PII:**
```bash
curl -X POST "http://localhost:9000/api/extract" \
  -H "Content-Type: application/json" \
  -d '{"text": "مرحبا اسمي احمد ورقمي 0501234567", "model_version": "v2"}'
```

3. **Test bidirectional masking workflow:**
```bash
# 1. Analyze text to create mappings
curl -X POST "http://localhost:9000/api/extract" \
  -H "Content-Type: application/json" \
  -d '{"text": "احمد يعمل في Microsoft", "model_version": "v2"}'

# 2. Use the web interface to:
#    - Copy masked version: "Person1 يعمل في Organization1"
#    - Send to LLM, get response
#    - Unmask LLM response back to original entities
```

## 📁 Project Structure

```
ner-pii-nlp/
├── src/
│   ├── main.py                    # FastAPI application entry point
│   ├── config.py                   # Application configuration
│   ├── models/
│   │   ├── model_factory.py       # Model creation factory
│   │   ├── model_config.py        # Model configurations
│   │   ├── model_interface.py     # Base model interface
│   │   ├── pii_shield_model.py    # PII Shield implementation
│   │   ├── entity_processor.py    # Entity processing logic
│   │   └── entity_config.py       # Entity type configurations
│   ├── static/
│   │   ├── css/
│   │   │   └── styles.css         # Application styles
│   │   └── js/
│   │       ├── app.js             # Main application logic
│   │       └── entity-dictionary.js # Entity dictionary & masking system
│   └── templates/
│       ├── base.html               # Base template
│       ├── index.html              # Main application page
│       └── welcome.html            # Welcome screen
├── checkpoints/
│   └── pii_shield_002v.pt         # PII-NER-v2 model
├── requirements.txt                # Python dependencies
├── .gitignore                      # Git ignore file
├── LICENSE                         # Apache 2.0 License
└── README.md                       # This file
```

## 🐛 Troubleshooting

### Common Issues

#### 1. Model files not found
```
Error: Model file not found at path...
```
**Solution**: Ensure model files are placed in correct directories:
- `checkpoints/pii_shield_002v.pt` for PII-NER-v2 model

#### 2. Port already in use
```
Error: [Errno 48] Address already in use
```
**Solution**: Change port in command or kill existing process:
```bash
# Find process using port 9000
lsof -i :9000
# Kill the process
kill -9 <PID>
```

#### 3. Memory issues with large texts
```
Error: CUDA out of memory...
```
**Solution**: Reduce batch size or text length in model configuration

#### 4. Import errors
```
ModuleNotFoundError: No module named 'transformers'
```
**Solution**: Reinstall dependencies:
```bash
pip install -r requirements.txt --upgrade
```

## 🚀 Deployment

### Docker Deployment

```dockerfile
# Dockerfile
FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

WORKDIR /app/src

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "9000"]
```

Build and run:
```bash
docker build -t pii-detector .
docker run -p 9000:9000 pii-detector
```

### Cloud Deployment (AWS/GCP/Azure)

1. **Prepare for production:**
```bash
# Set production environment variables
export ENVIRONMENT=production
export LOG_LEVEL=WARNING
```

2. **Use production server:**
```bash
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:9000
```

##  Performance Optimization

### Tips for Better Performance

1. **Enable model caching** in `config.py`
2. **Use batch processing** for multiple texts
3. **Implement Redis** for caching results
4. **Use CDN** for static files
5. **Enable gzip compression** in nginx/Apache

##  Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

##  Acknowledgments

- [FastAPI](https://fastapi.tiangolo.com/) - Modern web framework
- [Transformers](https://huggingface.co/transformers) - State-of-the-art NLP
- [PyTorch](https://pytorch.org/) - Deep learning framework
- [ArabertV2](https://huggingface.co/aubmindlab/bert-base-arabertv2) - Arabic language model

##  Support

For issues, questions, or suggestions:
- Open an issue on GitHub
---

<div align="center">
  Made by Orki Team
  https://orki.ai
</div>