import os
import logging
from typing import Dict, Optional
from models.model_interface import ModelInterface
from models.pii_shield_model import PIIShieldModel
from models.camel_bert_model import CamelBertModel
from models.model_config import ModelConfig

logger = logging.getLogger(__name__)

class ModelFactory:
    """Factory class for creating and caching model instances
    
    This class follows the Factory design pattern to create appropriate
    model instances based on model version. It also implements caching
    for model reuse.
    """
    
    def __init__(self):
        """Initialize the model factory and cache"""
        self.model_cache: Dict[str, ModelInterface] = {}
    
    def get_model(self, model_version: str) -> Optional[ModelInterface]:
        """Get a model instance for the specified version
        
        Args:
            model_version: Version string ("v1", "v2", or "v3")
            
        Returns:
            Model instance or None if the version is invalid
        """
        # Return cached model if available
        if model_version in self.model_cache:
            logger.info(f"Using cached model for version: {model_version}")
            return self.model_cache[model_version]
        
        # Create new model instance based on version
        model_type = ModelConfig.get_model_type(model_version)
        model: Optional[ModelInterface] = None
        
        # Get model info
        model_info = ModelConfig.get_model_info(model_version)
        if not model_info:
            logger.error(f"Unknown model version: {model_version}")
            return None
            
        # Check if model files exist for PII Shield models
        checkpoint = model_info.get("checkpoint")
        if model_type == "pii_shield" and checkpoint and not os.path.exists(checkpoint):
            logger.error(f"Model checkpoint not found: {os.path.abspath(checkpoint)}")
            return None
        
        # Create model instance
        logger.info(f"Creating new model instance for version: {model_version}")
        if model_type == "pii_shield":
            model = PIIShieldModel(model_version)
        elif model_type == "camel_bert":
            model = CamelBertModel()
        else:
            logger.error(f"Unknown model type: {model_type}")
            return None
        
        # Load the model
        logger.info(f"Loading model: {model_version}")
        success = model.load_model()
        
        if success:
            # Cache the loaded model
            logger.info(f"Model loaded successfully: {model_version}")
            self.model_cache[model_version] = model
            return model
        else:
            logger.error(f"Failed to load model: {model_version}")
            return None
            