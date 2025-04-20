from typing import Tuple, Dict

class LabelProcessor:
    """Process and map entity labels
    
    This class handles the creation of label mappings for the model.
    """
    
    def __init__(self):
        """Initialize the label processor with default PII entity labels"""
        self.entity_labels = [
            "PER", "LOC", "ORG", "URL", "EMAIL", 
            "PHONE", "CIVIL-ID", "PASSPORT-ID", "CREDIT-CARD"
        ]
    
    def create_mappings(self) -> Tuple[Dict[str, int], Dict[int, str]]:
        """Create label to id and id to label mappings
        
        Returns:
            A tuple of (label2id, id2label) dictionaries
        """
        # Initialize with "O" (Outside) label
        label2id = {"O": 0}
        id2label = {0: "O"}
        
        # Current ID tracker
        current_id = 1
        
        # Add B- (Beginning) and I- (Inside) prefixes for each entity label
        for label in self.entity_labels:
            b_label = f"B-{label}"
            i_label = f"I-{label}"
            
            label2id[b_label] = current_id
            id2label[current_id] = b_label
            current_id += 1
            
            label2id[i_label] = current_id
            id2label[current_id] = i_label
            current_id += 1
        
        return label2id, id2label
        