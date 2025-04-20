class ModelConfig:
    """Model configuration and metadata
    
    This class defines available models and their properties. It follows the
    Single Responsibility Principle by focusing only on model configuration.
    """
    
    MODELS = {
        "v1": {
            "name": "PII-Shield-v1",
            "checkpoint": "pii_shield_v001/model.pt",  # Relative to src
            "type": "pii_shield"
        },
        "v2": {
            "name": "PII-Shield-v2",
            "checkpoint": "checkpoints/pii_shield_002v.pt",  # Relative to src
            "type": "pii_shield"
        },
        "v3": {
            "name": "PII-Shield (Base-Version)",
            "checkpoint": None,  # Online model
            "type": "camel_bert"
        }
    }
    
    @classmethod
    def get_model_info(cls, model_version: str) -> dict:
        """Get model information by version
        
        Args:
            model_version: Model version key
            
        Returns:
            Dictionary with model information
        """
        return cls.MODELS.get(model_version, {})
    
    @classmethod
    def get_model_type(cls, model_version: str) -> str:
        """Get model type by version
        
        Args:
            model_version: Model version key
            
        Returns:
            Model type string or empty string if not found
        """
        model_info = cls.get_model_info(model_version)
        return model_info.get("type", "")
