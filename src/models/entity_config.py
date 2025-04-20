from typing import Dict

class EntityConfig:
    """Entity configuration with styling information
    
    This class defines styling, emoji, and display names for different entity types.
    It follows the Single Responsibility Principle by focusing only on entity display config.
    """
    
    ENTITY_INFO = {
        'PER': {'color': '#FF5252', 'emoji': '👤', 'name': 'Person'},
        'LOC': {'color': '#2196F3', 'emoji': '📍', 'name': 'Location'},
        'ORG': {'color': '#4CAF50', 'emoji': '🏢', 'name': 'Organization'},
        'URL': {'color': '#FF9800', 'emoji': '🔗', 'name': 'URL'},
        'EMAIL': {'color': '#9C27B0', 'emoji': '📧', 'name': 'Email'},
        'PHONE': {'color': '#FFC107', 'emoji': '📱', 'name': 'Phone'},
        'CIVIL-ID': {'color': '#009688', 'emoji': '🪪', 'name': 'Civil ID'},
        'PASSPORT-ID': {'color': '#E91E63', 'emoji': '🛂', 'name': 'Passport'},
        'CREDIT-CARD': {'color': '#673AB7', 'emoji': '💳', 'name': 'Credit Card'}
    }

    @classmethod
    def get_entity_info(cls, entity_type: str) -> Dict:
        """Get entity styling information with fallback for unknown types
        
        Args:
            entity_type: Entity type identifier
            
        Returns:
            Dictionary with styling information
        """
        return cls.ENTITY_INFO.get(entity_type, {'color': '#adb5bd', 'emoji': '🔍', 'name': entity_type})

    @classmethod
    def get_text_color(cls, entity_type: str) -> str:
        """Determine if entity needs light or dark text based on background color
        
        Args:
            entity_type: Entity type identifier
            
        Returns:
            Hex color code for text
        """
        dark_bg_entities = ['PER', 'ORG', 'PASSPORT-ID', 'CREDIT-CARD']
        return '#ffffff' if entity_type in dark_bg_entities else '#212529'