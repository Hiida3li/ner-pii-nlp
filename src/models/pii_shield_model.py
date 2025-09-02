import torch
import os
import logging
from transformers import AutoTokenizer, AutoModelForTokenClassification
from typing import List, Tuple, Dict, Optional
from src.models.model_interface import ModelInterface
from src.models.model_config import ModelConfig
from src.config import Config
from src.models.label_mapping import LabelProcessor

logger = logging.getLogger(__name__)

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
    
    def _is_valid_omani_phone(self, phone_text: str) -> bool:
        """Validate if a phone number is in Omani format
        
        Valid formats:
        - +968XXXXXXXX (with country code)
        - 968XXXXXXXX (country code without +)
        - 9XXXXXXX or 7XXXXXXX (mobile)
        - 2XXXXXXX (landline)
        - Arabic numerals
        """
        import re
        
        # Convert Arabic numerals to English
        arabic_to_english = str.maketrans('٠١٢٣٤٥٦٧٨٩', '0123456789')
        phone_digits = phone_text.translate(arabic_to_english)
        
        # Remove spaces, dashes, parentheses
        phone_digits = re.sub(r'[\s\-\(\)\.]', '', phone_digits)
        
        # Omani phone patterns
        patterns = [
            r'^\+?968[97]\d{7}$',  # Mobile with country code
            r'^\+?9682\d{7}$',      # Landline with country code
            r'^[97]\d{7}$',         # Mobile without country code
            r'^2\d{7}$',            # Landline without country code
        ]
        
        return any(re.match(pattern, phone_digits) for pattern in patterns)

    def load_model(self) -> bool:
        """Load the PII Shield model based on version
        
        Returns:
            True if loading was successful, False otherwise
        """
        try:
            # Verify config is properly set
            if not hasattr(Config, 'MODEL_NAME') or not Config.MODEL_NAME:
                logger.error("Config.MODEL_NAME is not properly defined")
                return False
                
            # Verify model path
            checkpoint_path = self.model_info.get("checkpoint")
            if not checkpoint_path:
                logger.error(f"Checkpoint path is None for model version {self.model_version}")
                return False
                
            # Ensure checkpoint file exists
            if not os.path.exists(checkpoint_path):
                logger.error(f"Checkpoint file does not exist: {os.path.abspath(checkpoint_path)}")
                return False
                
            logger.info(f"Loading model with: MODEL_NAME={Config.MODEL_NAME}, checkpoint={checkpoint_path}")
            
            # Create label mappings
            processor = LabelProcessor()
            label2id, id2label = processor.create_mappings()
            logger.debug(f"Created label mappings with {len(label2id)} labels")
            
            # First load tokenizer - if this fails, no point in continuing
            try:
                self.tokenizer = AutoTokenizer.from_pretrained(
                    Config.MODEL_NAME,
                    local_files_only=False  # Try to download if not available locally
                )
                logger.info("Tokenizer loaded successfully")
            except Exception as e:
                logger.error(f"Failed to load tokenizer: {str(e)}")
                return False
            
            # Load base model
            model = AutoModelForTokenClassification.from_pretrained(
                Config.MODEL_NAME,
                num_labels=len(label2id),
                ignore_mismatched_sizes=True,
                local_files_only=False  # Try to download if not available locally
            )
            logger.info("Base model loaded successfully")
            
            # Load checkpoint weights
            try:
                checkpoint = torch.load(checkpoint_path, map_location="cpu")
                if "model_state_dict" not in checkpoint:
                    logger.error(f"Invalid checkpoint file: 'model_state_dict' not found in {checkpoint_path}")
                    return False
                    
                model.load_state_dict(checkpoint["model_state_dict"])
                logger.info("Model weights loaded successfully")
            except Exception as e:
                logger.error(f"Error loading checkpoint: {str(e)}")
                return False
                
            model.eval()
            
            # Store model components
            self.id2label = id2label
            self.model = model
            
            logger.info(f"Model {self.model_version} loaded successfully")
            return True
            
        except Exception as e:
            logger.exception(f"Error loading model: {str(e)}")
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

        try:
            # Tokenize text
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

            # Create a mapping from tokens to positions in original text
            token_spans = []
            offset = 0
            for token in tokens:
                token_text = token.replace("##", "")
                idx = text.find(token_text, offset)
                if idx >= 0:
                    token_spans.append((idx, idx + len(token_text)))
                    offset = idx + len(token_text)
                else:
                    # Fallback if token can't be found exactly
                    token_spans.append((offset, offset + len(token_text)))
                    offset += len(token_text)

            # Process entities with improved subtoken merging
            entities = []
            current_entity = []
            current_label = None
            start_pos = None

            # Extract entities based on BIO tagging scheme with subtoken handling
            for i, (token, label) in enumerate(zip(tokens, pred_labels)):
                if label == 'O':  # Outside any entity
                    if current_entity:
                        # End of entity - create entity from accumulated tokens
                        entity_text = self.tokenizer.convert_tokens_to_string(current_entity).replace(" ##", "")
                        entity_type = current_label
                        end_pos = token_spans[i - 1][1]
                        
                        # Apply confidence threshold if available
                        confidence = 1.0  # Default high confidence
                        if hasattr(Config, 'CONFIDENCE_THRESHOLD') and confidence < Config.CONFIDENCE_THRESHOLD:
                            # Skip low-confidence entity
                            pass
                        else:
                            entities.append((entity_text, entity_type, start_pos, end_pos))
                            
                        # Reset entity tracking
                        current_entity = []
                        current_label = None
                        start_pos = None
                        
                elif label.startswith('B-'):  # Beginning of entity
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
                    
                elif label.startswith('I-'):  # Inside entity
                    # For I- tags, check if we should continue or start new
                    entity_type = label[2:]
                    
                    if current_label == entity_type:
                        # Continue current entity
                        current_entity.append(token)
                    else:
                        # Different entity type or no current entity
                        if current_entity:
                            # Save previous entity
                            entity_text = self.tokenizer.convert_tokens_to_string(current_entity).replace(" ##", "")
                            end_pos = token_spans[i - 1][1]
                            entities.append((entity_text, current_label, start_pos, end_pos))
                        
                        # Start new entity with I- tag (common for subtokens)
                        current_entity = [token]
                        current_label = entity_type
                        start_pos = token_spans[i][0]
                    
                elif label != 'O':  # Handle any other label format
                    # Check if it's just the entity type without B-/I- prefix
                    if current_entity and current_label == label:
                        # Continue current entity
                        current_entity.append(token)
                    else:
                        if current_entity:
                            # Save previous entity
                            entity_text = self.tokenizer.convert_tokens_to_string(current_entity).replace(" ##", "")
                            entity_type = current_label
                            end_pos = token_spans[i - 1][1]
                            entities.append((entity_text, entity_type, start_pos, end_pos))
                        
                        # Start new entity
                        current_entity = [token]
                        current_label = label
                        start_pos = token_spans[i][0]

            # Process any remaining entity
            if current_entity:
                entity_text = self.tokenizer.convert_tokens_to_string(current_entity).replace(" ##", "")
                entity_type = current_label
                end_pos = token_spans[-1][1]
                entities.append((entity_text, entity_type, start_pos, end_pos))

            # Post-process to merge adjacent entities of same type (for handling subtokens)
            # Also merge entities that are credit cards, phone numbers, or IDs split by separators
            merged_entities = []
            i = 0
            while i < len(entities):
                entity_text, entity_type, start, end = entities[i]
                
                # Special handling for numeric entity types that might be split
                numeric_types = ['CREDIT-CARD', 'PHONE', 'CIVIL-ID', 'PASSPORT-ID']
                
                # Look ahead to merge adjacent entities
                j = i + 1
                while j < len(entities):
                    next_text, next_type, next_start, next_end = entities[j]
                    
                    # Check if we should merge
                    should_merge = False
                    
                    # Case 1: Same type and adjacent or very close
                    if next_type == entity_type and next_start - end <= 2:
                        should_merge = True
                    
                    # Case 2: Numeric types that might be part of same number
                    elif entity_type in numeric_types and next_type in numeric_types:
                        # Check if there's only a separator between them (-, space, etc.)
                        gap_text = text[end:next_start]
                        if len(gap_text) <= 2 and all(c in '- ' for c in gap_text):
                            # Merge and use the most specific type
                            should_merge = True
                            # Prioritize CREDIT-CARD and PASSPORT-ID over PHONE and CIVIL-ID
                            priority = {'CREDIT-CARD': 4, 'PASSPORT-ID': 3, 'CIVIL-ID': 2, 'PHONE': 1}
                            if priority.get(next_type, 0) > priority.get(entity_type, 0):
                                entity_type = next_type
                    
                    if should_merge:
                        # Merge entities by extending the end position
                        # Get the actual text span from original text
                        full_text = text[start:next_end]
                        # Remove any ## artifacts
                        full_text = full_text.replace('##', '')
                        entity_text = full_text
                        end = next_end
                        j += 1
                    else:
                        break
                
                # Clean up the entity text
                entity_text = entity_text.replace('##', '').strip()
                
                # Additional validation for specific entity types
                if entity_type == 'CREDIT-CARD':
                    # Credit cards should have 13-19 digits
                    digits_only = ''.join(c for c in entity_text if c.isdigit())
                    if len(digits_only) < 13:
                        # Might be misclassified, check if it's a phone number
                        if len(digits_only) >= 7 and len(digits_only) <= 15:
                            entity_type = 'PHONE'
                
                # Validate Omani phone numbers
                if entity_type == 'PHONE':
                    if not self._is_valid_omani_phone(entity_text):
                        # Skip non-Omani phone numbers
                        i = j
                        continue
                
                if entity_text:  # Only add non-empty entities
                    merged_entities.append((entity_text, entity_type, start, end))
                i = j

            return merged_entities
            
        except Exception as e:
            logger.exception(f"Error during prediction: {str(e)}")
            return []
            