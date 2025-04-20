import torch
from transformers import AutoTokenizer, AutoModelForTokenClassification
from typing import List, Tuple
from models.model_interface import ModelInterface

class CamelBertModel(ModelInterface):
    """Model class for handling the CamelBert-based NER model
    
    This class is responsible for the CamelBert model implementation.
    It follows the Liskov Substitution Principle by properly implementing
    the ModelInterface.
    """

    def __init__(self):
        self.MODEL_NAME = "CAMeL-Lab/bert-base-arabic-camelbert-msa-ner"
        self.model = None
        self.tokenizer = None

        # Map CamelBert entities to PII types
        self.type_mapping = {
            "PERS": "PER",
            "LOC": "LOC",
            "ORG": "ORG"
        }

    def load_model(self) -> bool:
        """Load the tokenizer and model from HuggingFace
        
        Returns:
            True if loading was successful, False otherwise
        """
        try:
            self.tokenizer = AutoTokenizer.from_pretrained(
                self.MODEL_NAME,
                local_files_only=False
            )
            self.model = AutoModelForTokenClassification.from_pretrained(
                self.MODEL_NAME,
                local_files_only=False
            )
            self.model.eval()
            return True
        except Exception as e:
            print(f"Error loading CamelBert model: {str(e)}")
            return False

    def is_loaded(self) -> bool:
        """Check if the model is loaded and ready
        
        Returns:
            True if the model is loaded, False otherwise
        """
        return self.model is not None and self.tokenizer is not None

    def predict(self, text: str) -> List[Tuple[str, str, int, int]]:
        """Extract entities from text using CamelBert model
        
        Args:
            text: Input text to analyze
            
        Returns:
            List of tuples containing (entity_text, entity_type, start_position, end_position)
        """
        if not self.is_loaded() or not text.strip():
            return []

        # Tokenize input with offset mapping
        encoding = self.tokenizer(text, return_tensors="pt",
                                truncation=True, return_offsets_mapping=True)
        offset_mapping = encoding.pop("offset_mapping")

        if len(offset_mapping) == 0:
            return []

        # Run inference
        with torch.no_grad():
            outputs = self.model(**encoding)

        # Get predictions
        predictions = torch.argmax(outputs.logits, dim=2).squeeze().tolist()
        id2label = self.model.config.id2label

        # Convert to list if needed
        if isinstance(predictions, int):
            predictions = [predictions]

        # Process entities
        entities = []
        i = 0

        while i < len(predictions):
            if i >= len(offset_mapping[0]):
                break

            label = id2label[predictions[i]]

            # Skip non-entities
            if label == "O" or label.startswith("["):
                i += 1
                continue

            # Process B- tags (beginning of entity)
            if label.startswith("B-"):
                entity_type = label[2:]  # Remove B- prefix
                start_pos = int(offset_mapping[0][i][0])

                # Find end of entity
                j = i + 1
                while (j < len(predictions) and j < len(offset_mapping[0]) and
                      id2label[predictions[j]].startswith(f"I-{entity_type}")):
                    j += 1

                # Get end position
                end_pos = int(offset_mapping[0][j - 1][1]) if j > i else int(offset_mapping[0][i][1])

                # Extract entity text
                entity_text = text[start_pos:end_pos]

                # Map to PII type
                pii_type = self.type_mapping.get(entity_type, entity_type)

                if entity_text.strip():
                    entities.append((entity_text, pii_type, start_pos, end_pos))

                i = j
            else:
                i += 1

        return entities