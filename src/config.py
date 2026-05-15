"""
Application configuration with environment-based settings
"""
import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Config:
    """Main application configuration
    
    This class provides global configuration settings for the application.
    Maintains backward compatibility while adding new security features.
    """
    
    # Model configuration - needed for AutoTokenizer and AutoModelForTokenClassification
    MODEL_NAME = "CAMeL-Lab/bert-base-arabic-camelbert-msa-ner"
    
    # Server settings
    DEBUG = True
    HOST = "0.0.0.0"
    PORT = 8000
    
    # Model confidence threshold
    CONFIDENCE_THRESHOLD = 0.75
    
    # Server settings
    DEBUG = os.getenv('DEBUG', 'False').lower() == 'true'
    HOST = os.getenv('HOST', '0.0.0.0')
    PORT = int(os.getenv('PORT', 9000))

# Application Settings
DEBUG = Config.DEBUG
LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')
SECRET_KEY = os.getenv('SECRET_KEY', 'default-secret-key-change-in-production')

# API Keys
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
if not OPENAI_API_KEY and not DEBUG:
    raise ValueError("OPENAI_API_KEY environment variable is required")

# Server Configuration
HOST = os.getenv('HOST', '0.0.0.0')
PORT = int(os.getenv('PORT', 9000))

# Model Configuration
BASE_DIR = Path(__file__).parent.parent
MODEL_PATH = BASE_DIR / os.getenv('MODEL_PATH', 'checkpoints')
DEFAULT_MODEL_VERSION = os.getenv('DEFAULT_MODEL_VERSION', 'v2')

# Security Configuration
ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', 'localhost,127.0.0.1').split(',')
CORS_ORIGINS = os.getenv('CORS_ORIGINS', 'http://localhost:9000,http://127.0.0.1:9000').split(',')

# Session Configuration
SESSION_TIMEOUT = int(os.getenv('SESSION_TIMEOUT', 3600))  # seconds
MAX_SESSIONS = int(os.getenv('MAX_SESSIONS', 100))
SESSION_CLEANUP_INTERVAL = 300  # Clean up expired sessions every 5 minutes

# Rate Limiting
RATE_LIMIT = int(os.getenv('RATE_LIMIT', 60))  # requests per minute per IP
RATE_LIMIT_STORAGE = os.getenv('RATE_LIMIT_STORAGE', 'memory')  # memory or redis

# File Upload Configuration
MAX_UPLOAD_SIZE = int(os.getenv('MAX_UPLOAD_SIZE', 10 * 1024 * 1024))  # 10MB default
ALLOWED_EXTENSIONS = {'.txt', '.pdf', '.docx', '.xlsx', '.csv'}

# OpenAI Configuration
OPENAI_MODEL = os.getenv('OPENAI_MODEL', 'gpt-4-turbo-preview')
OPENAI_MAX_TOKENS = int(os.getenv('OPENAI_MAX_TOKENS', 2000))
OPENAI_TEMPERATURE = float(os.getenv('OPENAI_TEMPERATURE', 0.3))
OPENAI_TIMEOUT = int(os.getenv('OPENAI_TIMEOUT', 30))  # seconds

# Input Validation
MAX_TEXT_LENGTH = int(os.getenv('MAX_TEXT_LENGTH', 50000))  # characters
MAX_MESSAGE_LENGTH = int(os.getenv('MAX_MESSAGE_LENGTH', 10000))  # characters

# Logging Configuration
LOG_FORMAT = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
LOG_FILE = os.getenv('LOG_FILE', 'app.log')
LOG_MAX_SIZE = int(os.getenv('LOG_MAX_SIZE', 10 * 1024 * 1024))  # 10MB
LOG_BACKUP_COUNT = int(os.getenv('LOG_BACKUP_COUNT', 5))

# Production Security Headers
SECURITY_HEADERS = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:;"
}

# Feature Flags
ENABLE_DOCUMENT_UPLOAD = os.getenv('ENABLE_DOCUMENT_UPLOAD', 'True').lower() == 'true'
ENABLE_PRIVACY_MODE = os.getenv('ENABLE_PRIVACY_MODE', 'True').lower() == 'true'
ENABLE_ENTITY_EXPORT = os.getenv('ENABLE_ENTITY_EXPORT', 'True').lower() == 'true'

# Development vs Production
if DEBUG:
    # Development settings
    LOG_LEVEL = 'DEBUG'
    SECURITY_HEADERS = {}  # Disable strict headers in development
else:
    # Production settings
    if SECRET_KEY == 'default-secret-key-change-in-production':
        raise ValueError("SECRET_KEY must be set in production")
    
    # Ensure HTTPS in production
    if 'https' not in CORS_ORIGINS[0] and 'localhost' not in CORS_ORIGINS[0]:
        print("Warning: CORS_ORIGINS should use HTTPS in production")

# Export configuration
__all__ = [
    'DEBUG', 'LOG_LEVEL', 'SECRET_KEY', 'OPENAI_API_KEY',
    'HOST', 'PORT', 'MODEL_PATH', 'DEFAULT_MODEL_VERSION',
    'ALLOWED_HOSTS', 'CORS_ORIGINS', 'SESSION_TIMEOUT', 'MAX_SESSIONS',
    'RATE_LIMIT', 'MAX_UPLOAD_SIZE', 'ALLOWED_EXTENSIONS',
    'OPENAI_MODEL', 'OPENAI_MAX_TOKENS', 'OPENAI_TEMPERATURE',
    'MAX_TEXT_LENGTH', 'MAX_MESSAGE_LENGTH', 'SECURITY_HEADERS',
    'ENABLE_DOCUMENT_UPLOAD', 'ENABLE_PRIVACY_MODE', 'ENABLE_ENTITY_EXPORT'
]