class Config:
    """Main application configuration
    
    This class provides global configuration settings for the application.
    """
    
    # Model configuration - needed for AutoTokenizer and AutoModelForTokenClassification
    MODEL_NAME = "CAMeL-Lab/bert-base-arabic-camelbert-msa-ner"
    
    # Server settings
    DEBUG = True
    HOST = "0.0.0.0"
    PORT = 8001
    
    # Model confidence threshold
    CONFIDENCE_THRESHOLD = 0.75
    