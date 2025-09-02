import torch
import os
import logging
import re
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
    
    def _detect_obfuscated_pii(self, text: str, existing_entities: list) -> list:
        """Detect obfuscated PII with spaces, dots, emojis, or symbols"""
        obfuscated_entities = []
        
        # Helper function to check if area is already detected
        def is_already_detected(start, end):
            return any(
                (e_start <= start < e_end) or (e_start < end <= e_end)
                for _, _, e_start, e_end in existing_entities
            ) or any(
                (e_start <= start < e_end) or (e_start < end <= e_end)
                for _, _, e_start, e_end in obfuscated_entities
            )
        
        # 1. Detect obfuscated URLs (e.g., "http : // orki . ai")
        # Look for patterns with spaces/symbols between URL parts
        obfuscated_url_pattern = r'(?:https?\s*:\s*/\s*/\s*)?(?:www\s*\.\s*)?([a-zA-Z0-9]+(?:\s*[.\-]\s*[a-zA-Z0-9]+)*\s*\.\s*(?:com|net|org|ai|co|io|dev|app|gov|edu|mil|int|uk|om))'
        for match in re.finditer(obfuscated_url_pattern, text, re.IGNORECASE):
            match_text = match.group()
            # Remove spaces and rejoin
            clean_url = re.sub(r'\s+', '', match_text)
            
            if self._is_valid_url(clean_url):
                start = match.start()
                end = match.end()
                if not is_already_detected(start, end):
                    obfuscated_entities.append((match_text, 'URL', start, end))
        
        # 2. Detect obfuscated emails (e.g., "ahmed @ gmail . com")
        # More flexible pattern that handles spaces around @ and dots
        obfuscated_email_pattern = r'\b([a-zA-Z0-9][a-zA-Z0-9._%-]*(?:\s*\.\s*[a-zA-Z0-9]+)*)\s*@\s*([a-zA-Z0-9][a-zA-Z0-9.-]*(?:\s*\.\s*[a-zA-Z0-9]+)*)\s*\.\s*([a-zA-Z]{2,})\b'
        for match in re.finditer(obfuscated_email_pattern, text, re.IGNORECASE):
            match_text = match.group()
            # Remove spaces
            clean_email = re.sub(r'\s+', '', match_text)
            
            if self._is_valid_email(clean_email):
                start = match.start()
                end = match.end()
                if not is_already_detected(start, end):
                    obfuscated_entities.append((match_text, 'EMAIL', start, end))
        
        # 3. Detect obfuscated Omani phone numbers (e.g., "94.21.67.81" or "94 21 67 81")
        # Pattern for numbers with dots, spaces, or dashes
        obfuscated_phone_patterns = [
            # With country code
            r'(?:\+?\s*9[\s.\-]*6[\s.\-]*8[\s.\-]*)?([97](?:[\s.\-]*\d){7})',  # Mobile
            r'(?:\+?\s*9[\s.\-]*6[\s.\-]*8[\s.\-]*)?(2(?:[\s.\-]*\d){7})',      # Landline
            # Toll-free
            r'(8[\s.\-]*0(?:[\s.\-]*\d){6})',
        ]
        
        for pattern in obfuscated_phone_patterns:
            for match in re.finditer(pattern, text):
                match_text = match.group()
                # Remove all non-digits
                clean_phone = re.sub(r'[^\d]', '', match_text)
                
                if self._is_valid_omani_phone(clean_phone):
                    start = match.start()
                    end = match.end()
                    if not is_already_detected(start, end):
                        obfuscated_entities.append((match_text, 'PHONE', start, end))
        
        # 4. Detect phone numbers with Arabic numerals mixed with spaces
        arabic_numeral_pattern = r'[\u0660-\u0669\s\.\-]+'
        for match in re.finditer(arabic_numeral_pattern, text):
            match_text = match.group()
            # Convert Arabic numerals to Western
            clean_phone = match_text
            for i, ar in enumerate('٠١٢٣٤٥٦٧٨٩'):
                clean_phone = clean_phone.replace(ar, str(i))
            # Remove spaces and symbols
            clean_phone = re.sub(r'[^\d]', '', clean_phone)
            
            if len(clean_phone) >= 7 and self._is_valid_omani_phone(clean_phone):
                start = match.start()
                end = match.end()
                if not is_already_detected(start, end):
                    obfuscated_entities.append((match_text, 'PHONE', start, end))
        
        return obfuscated_entities
    
    def _is_valid_omani_phone(self, phone_text: str) -> bool:
        """Validate if a phone number is in Omani format
        
        Valid formats:
        - +968XXXXXXXX (with country code)
        - 968XXXXXXXX (country code without +)
        - 9XXXXXXX or 7XXXXXXX (mobile)
        - 2XXXXXXX (landline)
        - 80XXXXXX (toll-free hotlines)
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
            r'^80\d{6}$',           # Toll-free hotlines (80077444, etc.)
        ]
        
        return any(re.match(pattern, phone_digits) for pattern in patterns)
    
    def _is_valid_email(self, email_text: str) -> bool:
        """Validate if text is a proper email address
        
        Requirements:
        - Must contain @ symbol
        - Must have something before and after @
        - Should end with common domain extension
        """
        import re
        
        # Remove spaces that tokenizer might have added
        email_text = email_text.replace(' @ ', '@').replace(' . ', '.').strip()
        
        # Must have @ symbol
        if '@' not in email_text:
            return False
        
        # Basic email pattern - more lenient for tokenized text
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        
        # Also check if it ends with common TLDs
        valid_tlds = ['com', 'net', 'org', 'ai', 'co', 'io', 'edu', 'gov', 'mil', 'info', 'biz', 'om', 'uk', 'us']
        has_valid_tld = any(email_text.lower().endswith(f'.{tld}') for tld in valid_tlds)
        
        return bool(re.match(email_pattern, email_text, re.IGNORECASE)) or has_valid_tld
    
    def _is_valid_url(self, url_text: str) -> bool:
        """Validate if text is a proper URL
        
        Requirements:
        - Must have valid domain extension
        - Cannot contain @ symbol (that would be email)
        - Should look like a domain/URL
        """
        import re
        
        # Remove spaces that tokenizer might have added
        url_text = url_text.replace(' . ', '.').replace(' / ', '/').strip().lower()
        
        # URLs should NOT contain @ (that's email)
        if '@' in url_text:
            return False
        
        # Must contain a dot for domain
        if '.' not in url_text:
            return False
        
        # Check for common TLDs
        valid_tlds = ['com', 'net', 'org', 'ai', 'co', 'io', 'edu', 'gov', 'mil', 'info', 'biz', 'om', 'uk', 'us']
        has_valid_tld = any(url_text.endswith(f'.{tld}') or f'.{tld}/' in url_text for tld in valid_tlds)
        
        # Also check for URL-like patterns
        looks_like_url = (
            url_text.startswith('http://') or 
            url_text.startswith('https://') or 
            url_text.startswith('www.') or
            has_valid_tld
        )
        
        # Filter out obvious non-URLs (random strings with dots)
        if not looks_like_url and not has_valid_tld:
            return False
        
        return True

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
                
                # Validate emails
                if entity_type == 'EMAIL':
                    if not self._is_valid_email(entity_text):
                        # Skip invalid emails
                        i = j
                        continue
                
                # Validate URLs
                if entity_type == 'URL':
                    if not self._is_valid_url(entity_text):
                        # Skip invalid URLs
                        i = j
                        continue
                
                # Validate PERSON entities - filter out single letters and random strings
                if entity_type == 'PERSON' or entity_type == 'PER':
                    clean_text = entity_text.strip()
                    # Skip single character detections
                    if len(clean_text) <= 1:
                        i = j
                        continue
                    # Skip if it's just random characters without proper vowel distribution
                    vowels = set('aeiouAEIOU')
                    vowel_count = sum(1 for c in clean_text if c in vowels)
                    consonant_count = sum(1 for c in clean_text if c.isalpha() and c not in vowels)
                    
                    # Names typically have 20-40% vowels
                    if len(clean_text) > 3:
                        alpha_chars = [c for c in clean_text if c.isalpha()]
                        if alpha_chars:
                            vowel_ratio = vowel_count / len(alpha_chars)
                            if vowel_ratio < 0.15:  # Less than 15% vowels is suspicious
                                i = j
                                continue
                    
                    # Skip if it contains too many consecutive consonants (likely random)
                    if re.search(r'[bcdfghjklmnpqrstvwxyz]{4,}', clean_text.lower()):
                        i = j
                        continue
                    
                    # Skip if it looks like random characters (high entropy check)
                    if len(clean_text) > 5 and re.match(r'^[a-z]+$', clean_text.lower()):
                        # Check for repeating patterns that indicate randomness
                        if re.search(r'([a-z])\1{3,}', clean_text.lower()):  # Same letter 4+ times
                            i = j
                            continue
                        # Check for unlikely letter combinations
                        if re.search(r'[jqxz]{2,}|[wfghj]{4,}', clean_text.lower()):
                            i = j
                            continue
                
                # Validate ORGANIZATION entities - filter out random strings
                if entity_type == 'ORGANIZATION' or entity_type == 'ORG':
                    clean_text = entity_text.strip()
                    # Skip very short detections
                    if len(clean_text) <= 1:
                        i = j
                        continue
                    
                    # Allow common short org names like IBM, AI, UN, etc.
                    if len(clean_text) <= 3 and clean_text.isupper():
                        # This is likely a valid acronym, keep it
                        pass
                    else:
                        # For longer names, apply vowel check
                        vowels = set('aeiouAEIOU')
                        vowel_count = sum(1 for c in clean_text if c in vowels)
                        
                        if len(clean_text) > 4:
                            alpha_chars = [c for c in clean_text if c.isalpha()]
                            if alpha_chars:
                                vowel_ratio = vowel_count / len(alpha_chars)
                                if vowel_ratio < 0.15:  # Less than 15% vowels
                                    i = j
                                    continue
                        
                        # Skip if it contains too many consecutive consonants
                        if re.search(r'[bcdfghjklmnpqrstvwxyz]{5,}', clean_text.lower()):
                            i = j
                            continue
                        
                        # Skip if it looks like random characters
                        if len(clean_text) > 8 and re.match(r'^[a-z]+$', clean_text.lower()):
                            # Check for unlikely patterns
                            if re.search(r'([a-z])\1{3,}|[jqxz]{2,}|[wfghj]{5,}', clean_text.lower()):
                                i = j
                                continue
                
                # Validate LOCATION entities - minimum length and filter common misspellings
                if entity_type == 'LOCATION' or entity_type == 'LOC':
                    clean_text = entity_text.strip()
                    # Skip very short locations (less than 3 chars)
                    if len(clean_text) <= 2:
                        i = j
                        continue
                    
                    # Filter out common misspellings
                    misspellings = ['englich', 'engish', 'enlish', 'englsh']
                    if clean_text.lower() in misspellings:
                        i = j
                        continue
                    
                    # Skip if it's just numbers
                    if clean_text.isdigit():
                        i = j
                        continue
                
                # General validation for all other entity types
                # Skip any entity that's just 1-2 characters or digits (except valid IDs)
                if entity_type not in ['PHONE', 'EMAIL', 'URL', 'CREDIT-CARD', 'CIVIL-ID', 'PASSPORT-ID']:
                    clean_text = entity_text.strip()
                    # Skip single/double character entities
                    if len(clean_text) <= 2:
                        i = j
                        continue
                    # Skip pure numbers unless it's an ID type
                    if clean_text.isdigit() and len(clean_text) < 4:
                        i = j
                        continue
                
                if entity_text:  # Only add non-empty entities
                    merged_entities.append((entity_text, entity_type, start, end))
                i = j

            # Fallback: Add regex-based detection for emails and URLs if model missed them
            text_lower = text.lower()
            
            # Detect emails with regex if not already found
            import re
            email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
            for match in re.finditer(email_pattern, text):
                email_text = match.group()
                email_start = match.start()
                email_end = match.end()
                
                # Check if this email is already detected
                already_detected = any(
                    start <= email_start < end or start < email_end <= end 
                    for _, _, start, end in merged_entities
                )
                
                if not already_detected and self._is_valid_email(email_text):
                    merged_entities.append((email_text, 'EMAIL', email_start, email_end))
            
            # Detect URLs with regex if not already found
            url_pattern = r'\b(?:https?://)?(?:www\.)?[a-zA-Z0-9-]+(?:\.[a-zA-Z]{2,})+(?:/[^\s]*)?\b'
            for match in re.finditer(url_pattern, text):
                url_text = match.group()
                url_start = match.start()
                url_end = match.end()
                
                # Check if this URL is already detected or is an email
                already_detected = any(
                    start <= url_start < end or start < url_end <= end 
                    for _, _, start, end in merged_entities
                )
                
                if not already_detected and '@' not in url_text and self._is_valid_url(url_text):
                    merged_entities.append((url_text, 'URL', url_start, url_end))
            
            # Detect obfuscated PII (with spaces, dots, symbols)
            merged_entities.extend(self._detect_obfuscated_pii(text, merged_entities))
            
            # Sort by start position
            merged_entities.sort(key=lambda x: x[2])
            
            return merged_entities
            
        except Exception as e:
            logger.exception(f"Error during prediction: {str(e)}")
            return []
            