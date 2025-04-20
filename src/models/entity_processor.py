from typing import List, Tuple, Dict
from models.entity_config import EntityConfig

class EntityProcessor:
    """Process and format entities for display
    
    This class is responsible for entity processing, following the Single
    Responsibility Principle by focusing only on entity processing logic.
    """

    def highlight_entities_in_text(self, text: str, entities: List[Tuple[str, str, int, int]]) -> str:
        """Highlight entities in text with HTML spans
        
        Args:
            text: Original input text
            entities: List of entity tuples (text, type, start, end)
            
        Returns:
            HTML string with highlighted entities
        """
        # Group adjacent entities of the same type
        grouped_entities = []
        current_group = []

        # Sort entities by start position
        sorted_by_pos = sorted(entities, key=lambda x: x[2])

        for entity, entity_type, start, end in sorted_by_pos:
            if entity_type in ['PASSPORT-ID', 'CIVIL-ID']:
                # If we have a current group and this entity is close enough, add to group
                if current_group and current_group[0][1] == entity_type and start - current_group[-1][3] <= 5:
                    current_group.append((entity, entity_type, start, end))
                else:
                    # Start a new group if we had one before
                    if current_group:
                        grouped_entities.append(current_group)
                    current_group = [(entity, entity_type, start, end)]
            else:
                # For non-ID entities, just add them individually
                if current_group:
                    grouped_entities.append(current_group)
                    current_group = []
                grouped_entities.append([(entity, entity_type, start, end)])

        # Add the last group if it exists
        if current_group:
            grouped_entities.append(current_group)

        # Process the groups in reverse to avoid position shifts
        result = text
        for group in reversed(grouped_entities):
            if len(group) == 1:
                # Single entity
                entity, entity_type, start, end = group[0]
                color = EntityConfig.get_entity_info(entity_type)['color']
                text_color = EntityConfig.get_text_color(entity_type)

                # Clean up entity text
                if entity_type in ['PASSPORT-ID', 'CIVIL-ID']:
                    display_entity = entity.replace('##', '')
                else:
                    display_entity = entity

                highlighted = f'<span class="entity-highlight" style="background-color: {color}; color: {text_color};">{display_entity}</span>'
                result = result[:start] + highlighted + result[end:]
            else:
                # Group of entities (for IDs)
                entity_type = group[0][1]  # All entities in group have same type
                start = group[0][2]  # First entity start
                end = group[-1][3]  # Last entity end

                # Extract the full text and join without spaces
                full_text = text[start:end].replace(' ', '')

                color = EntityConfig.get_entity_info(entity_type)['color']
                text_color = EntityConfig.get_text_color(entity_type)

                highlighted = f'<span class="entity-highlight" style="background-color: {color}; color: {text_color};">{full_text}</span>'
                result = result[:start] + highlighted + result[end:]

        return result

    def get_entity_stats(self, entities: List[Tuple[str, str, int, int]]) -> Dict[str, int]:
        """Get statistics about extracted entities
        
        Args:
            entities: List of entity tuples
            
        Returns:
            Dictionary with entity types as keys and counts as values
        """
        if not entities:
            return {}

        entity_counts = {}
        for _, entity_type, _, _ in entities:
            entity_counts[entity_type] = entity_counts.get(entity_type, 0) + 1

        return entity_counts