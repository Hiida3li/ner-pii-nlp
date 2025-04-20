
# ner-pii-nlp


A FastAPI application for identifying and extracting personally identifiable information (PII) from text using advanced NLP models.

## Features

- **Multiple PII Detection Models**:
  - PII-Shield-v1: Base model trained on custom PII dataset
  - PII-Shield-v2: Enhanced model with improved accuracy
  - CamelBert: Arabic-language NER detection

- **REST API**:
  - JSON-based API for PII extraction
  - Fully documented endpoints with Swagger UI

- **Interactive Web Interface**:
  - Real-time text analysis
  - Visual highlighting of detected entities
  - Entity statistics and summarization

- **Entity Detection Types**:
  - Person names
  - Locations
  - Organizations
  - URLs
  - Email addresses
  - Phone numbers
  - Civil IDs
  - Passport numbers
  - Credit card numbers

## Project Structure

```
NLP-PII-NLP/
├── src/
│   ├── __pycache__/
│   ├── main.py
│   ├── config.py
│   ├── models/
│   │   ├── __pycache__/
│   │   ├── __init__.py
│   │   ├── model_factory.py
│   │   ├── model_config.py
│   │   ├── model_interface.py
│   │   ├── pii_shield_model.py
│   │   ├── camel_bert_model.py
│   │   ├── entity_processor.py
│   │   ├── entity_config.py
│   │   └── label_mapping.py
│   ├── static/
│   │   ├── css/
│   │   │   └── styles.css
│   │   └── js/
│   │       └── app.js
│   └── templates/
│       ├── base.html
│       ├── index.html
│       └── welcome.html
├── checkpoints/
│   └── pii_shield_002v.pt         # v2 model
├── pii_shield_v001/
│   └── model.pt                   # v1 model
├── .env
├── .env.example
├── .gitignore
├── LICENSE
├── project_structure.txt
├── requirements.txt
└── README.md

```

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Hiida3li/pii-shield-api.git
   cd ner-pii-ner
   ```

2. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Download model checkpoints:
   - Place model files in the appropriate directories as configured in `models/model_config.py`

## Usage

### Starting the server

```bash
python main.py
```

Or with uvicorn directly:

```bash
uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```

### Web Interface

Access the web interface at [http://localhost:8001](http://localhost:8001)

### API Endpoints

- **GET /** - Web interface
- **POST /api/extract** - Extract entities from text
  ```json
  {
    "text": "Your text to analyze",
    "model_version": "v1"
  }
  ```
- **GET /api/models** - Get available models

### API Documentation

Interactive API documentation is available at:
- Swagger UI: [http://localhost:8001/docs](http://localhost:8001/docs)
- ReDoc: [http://localhost:8001/redoc](http://localhost:8001/redoc)

## Architecture

This application follows SOLID principles and utilizes several design patterns:

1. **Factory Pattern**: `ModelFactory` creates appropriate model instances
2. **Strategy Pattern**: Different models implementing the same interface
3. **Dependency Injection**: FastAPI dependency system for request handling

## License

This project is licensed under the Apache License - see the LICENSE file for details.

## Acknowledgements

- [FastAPI](https://fastapi.tiangolo.com/) for the web framework
- [Transformers](https://huggingface.co/docs/transformers/index) for NLP models
- [CamelBert](https://github.com/CAMeL-Lab/CAMeLBERT) for Arabic language model

