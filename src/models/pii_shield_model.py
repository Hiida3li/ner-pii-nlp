import torch
from transformers import AutoTokenizer, AutoModelForTokenClassification
from typing import List, Tuple, Dict, Optional
from models.model_interface import ModelInterface
from models.model_config import ModelConfig
from config import Config
from models.label_mapping import LabelProcessor

class PIIShieldModel(ModelInterface):
    """Model class for handling the PII Shield models
    
    This class is responsible for the PII Shield model implementation.
    It follows the Liskov Substitution Principle by properly implementing
    the ModelInterface.
    """

    def __init__(self, model_version: str):
        """Initialize the model
        
        Args:
            model_version: Version string ("v1" or "v2")
        """
        self.model = None
        self.tokenizer = None
        self.id2label = None
        self.model_version = model_version
        self.model_info = ModelConfig.get_model_info(model_version)

    def load_model(self) -> bool:
        """Load the PII Shield model based on version
        
        Returns:
            True if loading was successful, False otherwise
        """
        # Load v1 or v2 model
        processor = LabelProcessor()
        label2id, id2label = processor.create_mappings()
        
        try:
            model = AutoModelForTokenClassification.from_pretrained(
                Config.MODEL_NAME,
                num_labels=len(label2id),
                ignore_mismatched_sizes=True,
                local_files_only=True
            )
            
            checkpoint_path = self.model_info.get("checkpoint")
            if not checkpoint_path:
                return False
                
            checkpoint = torch.load(checkpoint_path, map_location="cpu")
            model.load_state_dict(checkpoint["model_state_dict"])
            model.eval()
            
            self.tokenizer = AutoTokenizer.from_pretrained(Config.MODEL_NAME, local_files_only=True)
            self.id2label = id2label
            self.model = model
            return True
        except Exception as e:
            print(f"Error loading model: {str(e)}")
            return False

    def is_loaded(self) -> bool:
        """Check if the model is loaded and ready
        
        Returns:
            True if the model is loaded, False otherwise
        """
        return self.model is not None and self.tokenizer is not None and self.id2label is not None

    def predict(self, text: str) -> List[Tuple[str, str, int, int]]:
        """Extract entities from text with their positions
        
        Args:
            text: Input text to analyze
            
        Returns:
            List of tuples containing (entity_text, entity_type, start_position, end_position)
        """
        if not self.is_loaded() or not text.strip():
            return []

        # Tokenize like in the NERPredictor class
        tokens = self.tokenizer.tokenize(text)
        input_ids = self.tokenizer.convert_tokens_to_ids(['[CLS]'] + tokens + ['[SEP]'])
        attention_mask = [1] * len(input_ids)

        # Convert to tensors
        input_ids_tensor = torch.tensor([input_ids])
        attention_mask_tensor = torch.tensor([attention_mask])

        # Get predictions
        with torch.no_grad():
            outputs = self.model(input_ids=input_ids_tensor, attention_mask=attention_mask_tensor)
            predictions = torch.argmax(outputs.logits, dim=2)

        # Get labels (excluding [CLS] and [SEP])
        pred_labels = [self.id2label[pred.item()] for pred in predictions[0][1:-1]]

        # Now process entities similar to NERPredictor
        entities = []
        current_entity = []
        current_label = None
        start_pos = None
        offset = 0

        # Create a mapping from tokens to positions in original text
        # This is approximate but works for most cases
        token_spans = []
        for token in tokens:
            # Find token in text, starting from the current offset
            token_text = token.replace("##", "")
            idx = text.find(token_text, offset)
            if idx >= 0:
                token_spans.append((idx, idx + len(token_text)))
                offset = idx + len(token_text)
            else:
                # Fallback if token can't be found exactly
                token_spans.append((offset, offset + len(token_text)))
                offset += len(token_text)

        # Process tokens with their spans
        for i, (token, label) in enumerate(zip(tokens, pred_labels)):
            if label == 'O':
                if current_entity:
                    # End of entity - create entity from accumulated tokens
                    entity_text = self.tokenizer.convert_tokens_to_string(current_entity).replace(" ##", "")
                    entity_type = current_label
                    end_pos = token_spans[i - 1][1]
                    entities.append((entity_text, entity_type, start_pos, end_pos))
                    current_entity = []
                    current_label = None
                    start_pos = None
            elif label.startswith('B-'):
                if current_entity:
                    # End previous entity if exists
                    entity_text = self.tokenizer.convert_tokens_to_string(current_entity).replace(" ##", "")
                    entity_type = current_label
                    end_pos = token_spans[i - 1][1]
                    entities.append((entity_text, entity_type, start_pos, end_pos))

                # Start new entity
                current_entity = [token]
                current_label = label[2:]  # Remove 'B-' prefix
                start_pos = token_spans[i][0]
            elif label.startswith('I-') and current_label == label[2:]:
                # Continue current entity
                current_entity.append(token)
            else:
                # Unexpected I- tag or label mismatch, treat as new entity
                if current_entity:
                    entity_text = self.tokenizer.convert_tokens_to_string(current_entity).replace(" ##", "")
                    entity_type = current_label
                    end_pos = token_spans[i - 1][1]
                    entities.append((entity_text, entity_type, start_pos, end_pos))

                if label.startswith('I-'):
                    # Treat unexpected I- as B-
                    current_entity = [token]
                    current_label = label[2:]
                    start_pos = token_spans[i][0]
                else:
                    current_entity = []
                    current_label = None
                    start_pos = None

        # Process any remaining entity
        if current_entity:
            entity_text = self.tokenizer.convert_tokens_to_string(current_entity).replace(" ##", "")
            entity_type = current_label
            end_pos = token_spans[-1][1]
            entities.append((entity_text, entity_type, start_pos, end_pos))

        return entities