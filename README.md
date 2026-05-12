# PII Shield - Advanced Privacy Protection Platform

  
  <h3>AI-Powered PII Detection & Privacy-Preserving Chat</h3>
  
  <p>
    <img src="https://img.shields.io/badge/Python-3.8%2B-blue" alt="Python">
    <img src="https://img.shields.io/badge/FastAPI-0.104%2B-green" alt="FastAPI">
    <img src="https://img.shields.io/badge/PyTorch-2.0%2B-orange" alt="PyTorch">
    <img src="https://img.shields.io/badge/OpenAI-GPT--4-purple" alt="OpenAI">
    <img src="https://img.shields.io/badge/License-MIT-red" alt="License">
  </p>
/div>

## Overview

**PII Shield** is an enterprise-grade platform for detecting and protecting personally identifiable information (PII) in text and documents. Built with state-of-the-art NLP models and featuring a privacy-preserving chat interface powered by GPT-4, it provides real-time entity detection, document processing, and comprehensive data masking capabilities.

## Key Features

### Advanced AI Integration
- **Custom PII-Shield BERT Model**: Specialized for entity detection with high accuracy
- **GPT-4 Integration**: Privacy-preserving conversations with automatic PII masking
- **Real-time Processing**: Instant detection with streaming responses

###  Document Processing
- **Multi-format Support**: PDF, DOCX, TXT, CSV, MD files
- **Drag & Drop Interface**: Intuitive file upload with visual feedback
- **In-chat Attachments**: Send multiple documents with messages
- **Entity Detection**: Automatic PII identification in uploaded documents

###  Multi-Language Support
- **Arabic & English**: Full support for both languages
- **RTL Support**: Proper right-to-left text handling
- **Arabic Numerals**: Detection of Arabic numerals (١٢٣٤٥٦٧٨٩٠)

###  Privacy Features
- **One-click Privacy Toggle**: Switch between masked and unmasked views
- **Secure Masking**: Cryptographically secure placeholder generation
- **Zero Data Storage**: No persistent storage of user data
- **Session Isolation**: Independent chat sessions per user

###  Modern UI/UX
- **Dark Theme**: Elegant dark interface with smooth animations
- **Entity Color Coding**: Visual differentiation for 10+ entity types
- **Interactive Components**: Color customizer, entity tooltips, statistics
- **Responsive Design**: Works seamlessly across all devices

## Supported Entity Types

| Entity | Description | Examples                                            |
|--------|-------------|-----------------------------------------------------|
|  **Person** | Personal names | فاطمة بنت سالم بن حمد بن سلطان الرئيسي, احمد الكندي |
|  **Location** | Cities, countries, addresses | قرية السجورة, مسقط                                  |
|  **Organization** | Companies, institutions | هيئة تنمية المشروعات الصغيرة, بنك ضفار              |
|  **Email** | Email addresses | john@example.com                                    |
|  **Phone** | Phone numbers | 96784512, 2247588896                                |
|  **URL** | Web addresses | https://example.com                                 |
|  **Civil ID** | Civil identification | 9-12 digit patterns                                 |
|  **Passport** | Passport numbers | AA1234567                                           |
|  **Credit Card** | Card numbers | 4xxx xxxx xxxx xxxx                                 |
|  **Bank Account** | Account numbers | Banking formats                                     |

## Installation

### Prerequisites
- Python 3.8 or higher
- 4GB+ RAM recommended
- OpenAI API key (for chat functionality)

### Start

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
```bash
cp .env.example .env
# Edit .env and add your OpenAI API key
```

4. **Verify model checkpoint**
```
Ensure the model file exists at:
checkpoints/pii_shield_002v.pt
```

5. **Run the application**
```bash
python src/main.py
```

The application will be available at `http://localhost:9000`

To use a different port:
```bash
python src/main.py --port 8001
```

## Project Structure

```
ner-pii-nlp/
├── src/
│   ├── main.py                          # FastAPI application
│   ├── config.py                        # Configuration
│   ├── models/
│   │   ├── pii_shield_model.py         # PII detection engine
│   │   ├── entity_processor.py         # Entity processing
│   │   ├── document_processor.py       # Document handling
│   │   └── model_factory.py            # Model management
│   ├── static/
│   │   ├── css/                        # Stylesheets
│   │   ├── js/                         # JavaScript modules
│   │   └── icons/                      # UI icons
│   └── templates/                      # HTML templates
├── checkpoints/                         # Model weights
├── requirements.txt                     # Dependencies
└── README.md                           # Documentation
```

## API Reference

### Main Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Landing page |
| GET | `/app` | PII detector interface |
| GET | `/privacy-chat` | Privacy chat interface |

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/extract` | Extract entities from text |
| POST | `/api/privacy-chat` | Send chat message |
| POST | `/api/privacy-chat/stream` | Stream chat response |
| POST | `/api/upload-document` | Upload and process document |
| POST | `/api/process-document` | Extract text from document |

## Usage Guide

### PII Detection (what happened here? behind the scenes?)
1. Navigate to `/app`
2. Enter text containing PII
3. Click "Extract Entities"
4. View color-coded entities and statistics

### Privacy Chat
1. Go to `/privacy-chat`
2. Type messages - PII is automatically masked
3. Upload documents via drag & drop or paperclip icon
4. Toggle privacy mode with lock icon
5. Export conversation entities as needed

### Document Upload
- **Supported formats**: PDF, DOCX, TXT, CSV, MD
- **Max file size**: 10MB
- **Multiple files**: Select multiple files at once
- **Preview**: Click document cards to view content

## Docker Deployment

```bash
# Build image
docker build -t pii-shield .

# Run container
docker run -p 9000:9000 --env-file .env pii-shield

# Using docker-compose
docker-compose up -d
```

## Security Features

- **No Data Persistence**: Zero storage of user data
- **Secure Masking**: Cryptographic placeholder generation
- **Session Isolation**: Independent user sessions
- **Input Validation**: Multi-layer validation
- **File Type Checking**: Strict file type validation
- **Size Limits**: Configurable file size restrictions

## Recent Updates

### Version 3.1
-  Multi-document upload support
-  Document attachment cards in chat
-  Enhanced privacy mode for documents
-  Improved UI with customizable colors
-  Better Arabic/English support
-  Performance optimizations


## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- OpenAI for GPT-4 
- Hugging Face Transformers
- FastAPI framework
- PyTorch community

---
