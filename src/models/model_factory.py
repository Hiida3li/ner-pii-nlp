from typing import Dict, Optional
from models.model_interface import ModelInterface
from models.pii_shield_model import PIIShieldModel
from models.camel_bert_model import CamelBertModel
from models.model_config import ModelConfig

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
            return self.model_cache[model_version]
        
        # Create new model instance based on version
        model_type = ModelConfig.get_model_type(model_version)
        model: Optional[ModelInterface] = None
        
        if model_type == "pii_shield":
            model = PIIShieldModel(model_version)
        elif model_type == "camel_bert":
            model = CamelBertModel()
        else:
            return None
        
        # Load the model
        if model.load_model():
            # Cache the loaded model
            self.model_cache[model_version] = model
            return model
        
        return None