# PII Detector - Advanced Privacy Protection Platform

<div align="center">
  <img src="https://img.shields.io/badge/Python-3.8%2B-blue" alt="Python">
  <img src="https://img.shields.io/badge/FastAPI-0.104%2B-green" alt="FastAPI">
  <img src="https://img.shields.io/badge/PyTorch-2.0%2B-orange" alt="PyTorch">
  <img src="https://img.shields.io/badge/License-Apache%202.0-red" alt="License">
</div>

## 🚀 Overview

PII Detector is an advanced AI-powered platform for detecting and protecting personally identifiable information (PII) in text. Built with FastAPI and state-of-the-art NLP models, it provides real-time entity detection with a beautiful, intuitive interface.

### ✨ Key Features

- **🤖 Advanced AI Models**: PII-NER-v2 model with superior accuracy
- **🌐 Web Interface**: Modern, responsive UI with dark/light themes
- **⚡ Real-time Detection**: Instant PII identification and highlighting
- **🔒 Privacy Mode**: Automatic masking of sensitive information
- **📊 Entity Statistics**: Detailed breakdown of detected entities
- **🎯 Multi-language Support**: Optimized for English and Arabic text
- **🔌 RESTful API**: Full-featured API with comprehensive documentation

### 🏷️ Supported Entity Types

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

### 🏃 Running the Application

#### Option 1: Using the main script (Recommended)
```bash
cd src
python main.py
```

#### Option 2: Using Uvicorn directly
```bash
cd src
uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```

#### Option 3: Production deployment
```bash
cd src
uvicorn main:app --host 0.0.0.0 --port 8001 --workers 4
```

### 🌐 Accessing the Application

Once running, access the application at:

- **Web Interface**: http://localhost:8001
- **API Documentation**: http://localhost:8001/docs
- **Alternative API Docs**: http://localhost:8001/redoc

## 🛠️ Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Server Configuration
HOST=0.0.0.0
PORT=8001

# Model Configuration  
DEFAULT_MODEL=v2
MODEL_CACHE_SIZE=3

# Security
CORS_ORIGINS=["http://localhost:3000", "http://localhost:8001"]

# Logging
LOG_LEVEL=INFO
```

### Model Configuration

Edit `src/models/model_config.py` to customize model paths:

```python
MODEL_CONFIGS = {
    "v2": {
        "model_path": "../checkpoints/pii_shield_002v.pt",
        "model_name": "aubmindlab/bert-base-arabertv2",
        "max_length": 512
    }
}
```

## 📚 API Documentation

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
  "models": [
    {
      "id": "v2",
      "name": "PII-NER-v2",
      "description": "Best accuracy & performance"
    }
  ]
}
```

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
curl -X POST "http://localhost:8001/api/extract" \
  -H "Content-Type: application/json" \
  -d '{"text": "Contact Sarah at sarah@email.com or 555-0123", "model_version": "v2"}'
```

2. **Test Arabic text:**
```bash
curl -X POST "http://localhost:8000/api/extract" \
  -H "Content-Type: application/json" \
  -d '{"text": "اسمي محمد من الرياض", "model_version": "v2"}'
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
│   │   └── css/
│   │       └── styles.css         # Application styles
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
# Find process using port 8000
lsof -i :8001
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

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001"]
```

Build and run:
```bash
docker build -t pii-detector .
docker run -p 8000:8000 pii-detector
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
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8001
```

## 📈 Performance Optimization

### Tips for Better Performance

1. **Enable model caching** in `config.py`
2. **Use batch processing** for multiple texts
3. **Implement Redis** for caching results
4. **Use CDN** for static files
5. **Enable gzip compression** in nginx/Apache

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [FastAPI](https://fastapi.tiangolo.com/) - Modern web framework
- [Transformers](https://huggingface.co/transformers) - State-of-the-art NLP
- [PyTorch](https://pytorch.org/) - Deep learning framework
- [ArabertV2](https://huggingface.co/aubmindlab/bert-base-arabertv2) - Arabic language model

## 📞 Support

For issues, questions, or suggestions:
- Open an issue on GitHub
---

<div align="center">
  Made with ❤️ by the PII Detector Team
</div>