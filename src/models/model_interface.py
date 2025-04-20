from abc import ABC, abstractmethod
from typing import List, Tuple

class ModelInterface(ABC):
    """Interface for PII extraction models
    
    This interface defines the contract for all models that extract PII entities
    from text. Follows the Interface Segregation Principle from SOLID.
    """
    
    @abstractmethod
    def load_model(self) -> bool:
        """Load the model resources
        
        Returns:
            True if loading was successful, False otherwise
        """
        pass
    
    @abstractmethod
    def predict(self, text: str) -> List[Tuple[str, str, int, int]]:
        """Extract entities from text
        
        Args:
            text: Input text to analyze
            
        Returns:
            List of tuples containing (entity_text, entity_type, start_position, end_position)
        """
        pass
    
    @abstractmethod
    def is_loaded(self) -> bool:
        """Check if the model is loaded and ready to use
        
        Returns:
            True if the model is loaded, False otherwise
        """
        pass