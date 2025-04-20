from typing import Tuple, Dict

class LabelProcessor:
    """Process and map entity labels
    
    This class handles the creation of label mappings for the model.
    """
    
    def __init__(self):
        """Initialize the label processor with default PII entity labels"""
        pass
    
    def create_mappings(self) -> Tuple[Dict[str, int], Dict[int, str]]:
        """Create label to id and id to label mappings
        
        Returns:
            A tuple of (label2id, id2label) dictionaries
        """
        # Return fixed mappings to match the model's expectations
        label2id = {
            "O": 0,
            "B-EMAIL": 1,
            "B-LOC": 2,
            "B-ORG": 3,
            "B-PER": 4,
            "B-PHONE": 5,
            "B-URL": 6,
            "I-EMAIL": 9,
            "I-LOC": 10,
            "I-ORG": 11,
            "I-PER": 12,
            "I-PHONE": 13,
            "I-URL": 14,
            "B-CIVIL-ID": 7,
            "B-CREDIT-CARD": 8,
            "B-PASSPORT-ID": 15
        }
        
        id2label = {
            0: "O",
            1: "B-EMAIL",
            2: "B-LOC",
            3: "B-ORG",
            4: "B-PER",
            5: "B-PHONE",
            6: "B-URL",
            9: "I-EMAIL",
            10: "I-LOC",
            11: "I-ORG",
            12: "I-PER",
            13: "I-PHONE",
            14: "I-URL",
            7: "B-CIVIL-ID",
            8: "B-CREDIT-CARD",
            15: "B-PASSPORT-ID"
        }
        
        return label2id, id2label
        