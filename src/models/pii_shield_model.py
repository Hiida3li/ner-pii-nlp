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
        
        # 1. Detect obfuscated emails FIRST (e.g., "ahmed @ gmail . com")
        # Must check emails before URLs since emails can look like domains
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
        
        # 2. Detect obfuscated URLs (e.g., "http : // orki . ai")
        # Look for patterns with spaces/symbols between URL parts
        # Check AFTER emails to avoid false positives
        obfuscated_url_pattern = r'(?:https?\s*:\s*/\s*/\s*)?(?:www\s*\.\s*)?([a-zA-Z0-9]+(?:\s*[.\-]\s*[a-zA-Z0-9]+)*\s*\.\s*(?:com|net|org|ai|co|io|dev|app|gov|edu|mil|int|uk|om))'
        for match in re.finditer(obfuscated_url_pattern, text, re.IGNORECASE):
            match_text = match.group()
            # Skip if it contains @ (likely an email)
            if '@' in text[max(0, match.start()-20):match.end()+20]:
                continue
            # Remove spaces and rejoin
            clean_url = re.sub(r'\s+', '', match_text)
            
            if self._is_valid_url(clean_url):
                start = match.start()
                end = match.end()
                if not is_already_detected(start, end):
                    obfuscated_entities.append((match_text, 'URL', start, end))
        
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
    
    def _is_valid_civil_id(self, id_text: str) -> bool:
        """Validate Civil ID format
        
        Requirements:
        - 9-12 digits total
        - Must start with: 10, 12, 13, 8, 1, or 9
        """
        # Remove any spaces or dashes
        clean_id = ''.join(c for c in id_text if c.isdigit())
        
        # Check length (9-12 digits)
        if len(clean_id) < 9 or len(clean_id) > 12:
            return False
        
        # Check starting patterns
        valid_starts = ['10', '12', '13', '8', '1', '9']
        return any(clean_id.startswith(start) for start in valid_starts)
    
    def _is_valid_credit_card(self, card_text: str) -> bool:
        """Validate Credit Card format
        
        Requirements:
        - Exactly 16 digits
        - Must start with 4 (Visa) or 5 (Mastercard)
        """
        # Remove any spaces, dashes, or dots
        clean_card = ''.join(c for c in card_text if c.isdigit())
        
        # Must be exactly 16 digits
        if len(clean_card) != 16:
            return False
        
        # Must start with 4 or 5
        return clean_card[0] in ['4', '5']
    
    def _is_valid_passport(self, passport_text: str) -> bool:
        """Validate Passport format
        
        Requirements:
        - Starts with 1-2 capital letters
        - Followed by 7-9 digits
        """
        
        # Remove spaces
        clean_passport = passport_text.replace(' ', '').replace('-', '')
        
        # Pattern: 1-2 uppercase letters followed by 7-9 digits
        passport_pattern = r'^[A-Z]{1,2}\d{7,9}$'
        
        return bool(re.match(passport_pattern, clean_passport))

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
                
                # Validate Credit Cards
                if entity_type == 'CREDIT-CARD' or entity_type == 'CREDITCARD':
                    if not self._is_valid_credit_card(entity_text):
                        # Skip invalid credit cards
                        i = j
                        continue
                
                # Validate Civil IDs
                if entity_type == 'CIVIL-ID' or entity_type == 'CIVILID':
                    if not self._is_valid_civil_id(entity_text):
                        # Skip invalid civil IDs
                        i = j
                        continue
                
                # Validate Passport IDs
                if entity_type == 'PASSPORT-ID' or entity_type == 'PASSPORT':
                    if not self._is_valid_passport(entity_text):
                        # Skip invalid passport numbers
                        i = j
                        continue
                
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
                
                # Validate PERSON entities - only filter extreme cases
                if entity_type == 'PERSON' or entity_type == 'PER':
                    clean_text = entity_text.strip()
                    # Only skip single character detections
                    if len(clean_text) <= 1:
                        i = j
                        continue
                
                # Validate ORGANIZATION entities - only filter extreme cases
                if entity_type == 'ORGANIZATION' or entity_type == 'ORG':
                    clean_text = entity_text.strip()
                    # Only skip single character detections
                    if len(clean_text) <= 1:
                        i = j
                        continue
                
                # Validate LOCATION entities - only filter extreme cases
                if entity_type == 'LOCATION' or entity_type == 'LOC':
                    clean_text = entity_text.strip()
                    # Only skip single character locations
                    if len(clean_text) <= 1:
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
            
            # Fallback detection for IDs that model might miss
            # IMPORTANT: Check these BEFORE obfuscated detection to avoid phone conflicts
            # Detect Civil IDs - broader pattern to catch more cases
            civil_id_patterns = [
                r'\b(?:civil\s*(?:id)?|id\s*(?:number)?)[:\s]+(\d{9,12})\b',
                r'\b(?:civil|id)[:\s]*(\d{9,12})\b',
                r'\b(\d{9,12})\b'  # Any 9-12 digit number that passes validation
            ]
            for pattern in civil_id_patterns:
                for match in re.finditer(pattern, text, re.IGNORECASE):
                    id_text = match.group(1)
                    if self._is_valid_civil_id(id_text):
                        start = match.start(1) if match.lastindex else match.start()
                        end = match.end(1) if match.lastindex else match.end()
                        already_detected = any(
                            s <= start < e or s < end <= e 
                            for _, _, s, e in merged_entities
                        )
                        if not already_detected:
                            merged_entities.append((id_text, 'CIVIL-ID', start, end))
                            break  # Found one, no need to check other patterns
            
            # Detect Credit Cards
            credit_card_pattern = r'\b([45]\d{3}[\s\-]?\d{4}[\s\-]?\d{4}[\s\-]?\d{4})\b'
            for match in re.finditer(credit_card_pattern, text):
                card_text = match.group(1)
                if self._is_valid_credit_card(card_text):
                    start = match.start()
                    end = match.end()
                    already_detected = any(
                        s <= start < e or s < end <= e 
                        for _, _, s, e in merged_entities
                    )
                    if not already_detected:
                        merged_entities.append((card_text, 'CREDIT-CARD', start, end))
            
            # Detect Passport numbers - look for context or pattern
            passport_patterns = [
                (r'\b(?:passport|pass|id)[:\s]+([A-Z]{1,2}\d{7,9})\b', True),  # With "passport" context
                (r'\b([A-Z]{1,2}\d{7,9})\b', False)  # Just the pattern
            ]
            for pattern, case_insensitive in passport_patterns:
                flags = re.IGNORECASE if case_insensitive else 0
                for match in re.finditer(pattern, text, flags):
                    passport_text = match.group(1) if match.lastindex else match.group()
                    if self._is_valid_passport(passport_text):
                        start = match.start(1) if match.lastindex else match.start()
                        end = match.end(1) if match.lastindex else match.end()
                        already_detected = any(
                            s <= start < e or s < end <= e 
                            for _, _, s, e in merged_entities
                        )
                        if not already_detected:
                            merged_entities.append((passport_text, 'PASSPORT', start, end))
                            break  # Found one, stop checking patterns
            
            # Detect obfuscated PII (with spaces, dots, symbols) - do this AFTER ID detection
            merged_entities.extend(self._detect_obfuscated_pii(text, merged_entities))
            
            # Sort by start position
            merged_entities.sort(key=lambda x: x[2])
            
            return merged_entities
            
        except Exception as e:
            logger.exception(f"Error during prediction: {str(e)}")
            return []
            