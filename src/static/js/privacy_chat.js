/**
 * Privacy Chat - ChatGPT-style interface with PII protection
 */

class PrivacyChat {
    constructor() {
        this.sessionCounter = 1;
        this.currentSession = 1;
        this.sessions = {};
        this.privacyMode = true;
        this.isTyping = false;
        
        this.init();
    }
    
    init() {
        this.cacheElements();
        this.setupEventListeners();
        this.initSession();
    }
    
    cacheElements() {
        this.elements = {
            chatMessages: document.getElementById('chat-messages'),
            chatInput: document.getElementById('chat-input'),
            sendBtn: document.getElementById('send-btn'),
            newChatBtn: document.getElementById('new-chat-btn'),
            chatList: document.getElementById('chat-list'),
            welcomeScreen: document.getElementById('welcome-screen'),
            privacyToggle: document.getElementById('privacy-toggle'),
            toggleSwitch: document.getElementById('toggle-switch')
        };
        
        // Debug: Check which elements were found
        console.log('Elements found:', {
            chatMessages: !!this.elements.chatMessages,
            chatInput: !!this.elements.chatInput,
            sendBtn: !!this.elements.sendBtn,
            newChatBtn: !!this.elements.newChatBtn,
            chatList: !!this.elements.chatList,
            welcomeScreen: !!this.elements.welcomeScreen,
            privacyToggle: !!this.elements.privacyToggle,
            toggleSwitch: !!this.elements.toggleSwitch
        });
    }
    
    setupEventListeners() {
        // Send message
        if (this.elements.sendBtn) {
            this.elements.sendBtn.addEventListener('click', () => {
                console.log('Send button clicked');
                this.sendMessage();
            });
        } else {
            console.error('Send button not found!');
        }
        
        // Enter to send
        if (this.elements.chatInput) {
            this.elements.chatInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    console.log('Enter key pressed');
                    this.sendMessage();
                }
            });
        } else {
            console.error('Chat input not found!');
        }
        
        // Auto-resize textarea
        if (this.elements.chatInput) {
            this.elements.chatInput.addEventListener('input', () => {
                this.autoResizeTextarea();
            });
        }
        
        // New chat
        this.elements.newChatBtn.addEventListener('click', () => {
            this.createNewSession();
        });
        
        // Privacy toggle
        this.elements.privacyToggle.addEventListener('click', () => {
            this.togglePrivacyMode();
        });
        
        // Example prompts
        document.querySelectorAll('.example-prompt').forEach(prompt => {
            prompt.addEventListener('click', () => {
                const text = prompt.dataset.prompt;
                this.elements.chatInput.value = text;
                this.autoResizeTextarea();
                this.elements.chatInput.focus();
            });
        });
    }
    
    initSession() {
        this.sessions[this.currentSession] = {
            messages: [],
            name: `Session ${this.currentSession}`
        };
    }
    
    createNewSession() {
        // Save current session
        const messages = this.elements.chatMessages.querySelectorAll('.message-wrapper');
        this.sessions[this.currentSession].messages = Array.from(messages).map(m => m.outerHTML);
        
        // Create new session
        this.sessionCounter++;
        this.currentSession = this.sessionCounter;
        this.initSession();
        
        // Update UI
        this.clearChat();
        this.updateSessionList();
        
        // Reset chat endpoint
        this.resetChatEndpoint();
    }
    
    updateSessionList() {
        const sessionHtml = Object.keys(this.sessions).map(id => `
            <div class="chat-item ${id == this.currentSession ? 'active' : ''}" data-session="${id}">
                <svg class="chat-icon" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                </svg>
                Session ${id}
            </div>
        `).join('');
        
        this.elements.chatList.innerHTML = sessionHtml;
        
        // Add click handlers
        document.querySelectorAll('.chat-item').forEach(item => {
            item.addEventListener('click', () => {
                this.switchSession(item.dataset.session);
            });
        });
    }
    
    switchSession(sessionId) {
        // Save current session
        const messages = this.elements.chatMessages.querySelectorAll('.message-wrapper');
        this.sessions[this.currentSession].messages = Array.from(messages).map(m => m.outerHTML);
        
        // Switch to new session
        this.currentSession = sessionId;
        
        // Load session messages
        this.clearChat();
        if (this.sessions[sessionId].messages.length > 0) {
            this.elements.chatMessages.innerHTML = this.sessions[sessionId].messages.join('');
        }
        
        // Update UI
        this.updateSessionList();
    }
    
    clearChat() {
        this.elements.chatMessages.innerHTML = `
            <div class="welcome-screen" id="welcome-screen">
                <h1 class="welcome-title">Privacy-Protected ChatBot</h1>
                <p class="welcome-subtitle">
                    Your conversations are protected by real-time PII detection. 
                    Personal information is masked before reaching the AI.
                </p>
                
                <div class="privacy-info">
                    🛡️ <strong>Privacy Layer Active:</strong> All personal information (names, locations, emails, etc.) 
                    is automatically replaced with secure placeholders before being sent to the AI model.
                </div>
            </div>
        `;
    }
    
    autoResizeTextarea() {
        const textarea = this.elements.chatInput;
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
    }
    
    async sendMessage() {
        console.log('sendMessage called');
        const message = this.elements.chatInput.value.trim();
        console.log('Message:', message, 'IsTyping:', this.isTyping);
        if (!message || this.isTyping) return;
        
        // Hide welcome screen
        const welcome = document.getElementById('welcome-screen');
        if (welcome) welcome.remove();
        
        // Clear input
        this.elements.chatInput.value = '';
        this.autoResizeTextarea();
        
        // Show typing indicator (don't show user message yet)
        this.showTypingIndicator();
        
        try {
            // Send to backend
            console.log('Sending to backend:', { message, privacy_mode: this.privacyMode, session_id: this.currentSession });
            const response = await fetch('/api/privacy-chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: message,
                    privacy_mode: this.privacyMode,
                    session_id: this.currentSession
                })
            });
            
            if (!response.ok) {
                throw new Error('Failed to get response');
            }
            
            const data = await response.json();
            
            // Store both original and masked versions for the current message
            const messageData = {
                original: data.original_message,
                masked: data.masked_message,
                userMessage: true,
                userEntities: data.user_entities || []
            };
            
            // Add user message (show masked or original based on privacy mode)
            const userMessageToShow = this.privacyMode ? data.masked_message : data.original_message;
            this.addMessage('user', userMessageToShow, messageData.userEntities, messageData);
            
            // Hide typing indicator
            this.hideTypingIndicator();
            
            // Add assistant message with highlighted entities
            this.addMessage('assistant', data.display_response, data.response_entities || []);
            
            // Show what was sent to AI if in privacy mode
            if (this.privacyMode && data.masked_message) {
                console.log('🔒 Sent to AI (masked):', data.masked_message);
            }
            
        } catch (error) {
            console.error('Error:', error);
            this.hideTypingIndicator();
            this.addMessage('assistant', 'Sorry, I encountered an error. Please try again.');
        }
    }
    
    addMessage(role, content, entities = null, messageData = null) {
        // Process content for PII highlighting if entities provided
        let displayContent = content;
        if (entities && entities.length > 0) {
            if (role === 'user' && messageData && messageData.userMessage) {
                // For user messages, highlight based on current privacy mode
                displayContent = this.highlightUserMessage(content, entities, messageData);
            } else {
                // For AI responses, use standard highlighting
                displayContent = this.highlightEntities(content, entities);
            }
        }
        
        // Prepare data attributes for user messages with privacy data
        let dataAttributes = '';
        if (messageData && messageData.userMessage) {
            const escapedOriginal = messageData.original.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
            const escapedMasked = messageData.masked.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
            const entitiesJson = JSON.stringify(messageData.userEntities || []).replace(/"/g, '&quot;');
            dataAttributes = `data-original="${escapedOriginal}" data-masked="${escapedMasked}" data-entities="${entitiesJson}"`;
        }
        
        const messageHtml = `
            <div class="message-wrapper" ${dataAttributes}>
                <div class="message ${role}">
                    <div class="message-avatar">
                        ${role === 'user' ? 'U' : 'AI'}
                    </div>
                    <div class="message-content">
                        ${displayContent}
                    </div>
                </div>
            </div>
        `;
        
        this.elements.chatMessages.insertAdjacentHTML('beforeend', messageHtml);
        this.scrollToBottom();
    }
    
    highlightUserMessage(text, entities, messageData) {
        // Determine which text to highlight and what entities to use
        const isShowingMasked = this.privacyMode;
        let textToHighlight = isShowingMasked ? messageData.masked : messageData.original;
        
        if (isShowingMasked) {
            // Highlighting masked text with placeholders
            return this.highlightMaskedEntities(textToHighlight, entities);
        } else {
            // Highlighting original text with actual PII
            return this.highlightOriginalEntities(textToHighlight, entities);
        }
    }
    
    highlightMaskedEntities(text, entities) {
        let highlightedText = text;
        
        console.log('Highlighting masked entities in text:', text);
        console.log('Available entities:', entities);
        
        // Create a more comprehensive regex that matches all possible placeholder patterns
        const placeholderRegex = /(person|location|organization|email|phone|url|civilid|passport|creditcard|bankaccount)\d*/gi;
        
        highlightedText = highlightedText.replace(placeholderRegex, (match) => {
            const baseType = match.replace(/\d+$/, '').toLowerCase().replace(/\s+/g, '');
            const cssClass = this.getEntityCssClass(baseType);
            console.log(`Found placeholder: '${match}', baseType: '${baseType}', cssClass: '${cssClass}'`);
            return `<span class="pii-entity ${cssClass}">${match}</span>`;
        });
        
        return highlightedText;
    }
    
    highlightOriginalEntities(text, entities) {
        let highlightedText = text;
        
        console.log('Highlighting original entities in text:', text);
        console.log('Available entities:', entities);
        
        // Sort entities by position (reverse) to maintain correct positions when replacing
        const sortedEntities = [...entities].sort((a, b) => b.start - a.start);
        
        for (const entity of sortedEntities) {
            const cssClass = this.getEntityCssClass(entity.entity_type.toLowerCase());
            const start = entity.start;
            const end = entity.end;
            const originalText = entity.text;
            
            console.log(`Highlighting entity: '${originalText}' (${entity.entity_type}) at ${start}-${end} with class '${cssClass}'`);
            
            highlightedText = 
                highlightedText.slice(0, start) + 
                `<span class="pii-entity ${cssClass}">${originalText}</span>` +
                highlightedText.slice(end);
        }
        
        return highlightedText;
    }
    
    getEntityCssClass(entityType) {
        const entityTypeMap = {
            // Person entities
            'per': 'pii-person',
            'person': 'pii-person',
            
            // Location entities  
            'loc': 'pii-location',
            'location': 'pii-location',
            
            // Organization entities
            'org': 'pii-organization',
            'organization': 'pii-organization',
            
            // Email entities
            'email': 'pii-email',
            
            // Phone entities
            'phone': 'pii-phone',
            
            // URL entities
            'url': 'pii-url',
            
            // Civil ID entities
            'civilid': 'pii-civilid',
            'civil-id': 'pii-civilid',
            
            // Passport entities
            'passport': 'pii-passport',
            'passport-id': 'pii-passport',
            
            // Credit Card entities
            'creditcard': 'pii-creditcard',
            'credit-card': 'pii-creditcard',
            
            // Bank Account entities
            'bankaccount': 'pii-bankaccount',
            'bank-account': 'pii-bankaccount',
            'account': 'pii-bankaccount'
        };
        
        const mappedClass = entityTypeMap[entityType.toLowerCase()];
        if (mappedClass) {
            console.log(`Mapping entity type '${entityType}' to CSS class '${mappedClass}'`);
            return mappedClass;
        }
        
        console.warn(`Unknown entity type '${entityType}', using default 'pii-masked'`);
        return 'pii-masked';
    }
    
    highlightEntities(text, entities) {
        // For AI responses with placeholders
        let highlightedText = text;
        
        console.log('Highlighting AI response entities in text:', text);
        console.log('Available entities:', entities);
        
        // Find all placeholders in text using comprehensive regex
        const placeholderRegex = /(person|location|organization|email|phone|url|civilid|passport|creditcard|bankaccount)\d*/gi;
        
        highlightedText = highlightedText.replace(placeholderRegex, (match) => {
            const baseType = match.replace(/\d+$/, '').toLowerCase().replace(/\s+/g, '');
            const cssClass = this.getEntityCssClass(baseType);
            console.log(`Found AI response placeholder: '${match}', baseType: '${baseType}', cssClass: '${cssClass}'`);
            return `<span class="pii-entity ${cssClass}">${match}</span>`;
        });
        
        return highlightedText;
    }
    
    showTypingIndicator() {
        this.isTyping = true;
        
        const typingHtml = `
            <div class="message-wrapper" id="typing-indicator">
                <div class="message assistant">
                    <div class="message-avatar">AI</div>
                    <div class="message-content">
                        <div class="typing-indicator">
                            <div class="typing-dot"></div>
                            <div class="typing-dot"></div>
                            <div class="typing-dot"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        this.elements.chatMessages.insertAdjacentHTML('beforeend', typingHtml);
        this.scrollToBottom();
    }
    
    hideTypingIndicator() {
        const indicator = document.getElementById('typing-indicator');
        if (indicator) indicator.remove();
        this.isTyping = false;
    }
    
    togglePrivacyMode() {
        this.privacyMode = !this.privacyMode;
        
        // Update UI
        const toggle = this.elements.privacyToggle;
        const toggleSwitch = this.elements.toggleSwitch;
        
        if (this.privacyMode) {
            toggle.classList.remove('off');
            toggleSwitch.classList.remove('off');
        } else {
            toggle.classList.add('off');
            toggleSwitch.classList.add('off');
        }
        
        // Update all user messages to show/hide original data
        this.updateMessagesPrivacyView();
        
        console.log(`Privacy mode: ${this.privacyMode ? 'ON (Masked)' : 'OFF (Original data shown)'}`);
    }
    
    updateMessagesPrivacyView() {
        // Find all user message wrappers that have privacy data
        const userMessages = this.elements.chatMessages.querySelectorAll('.message-wrapper[data-original]');
        
        userMessages.forEach(messageWrapper => {
            const originalMessage = this.unescapeHtml(messageWrapper.getAttribute('data-original'));
            const maskedMessage = this.unescapeHtml(messageWrapper.getAttribute('data-masked'));
            const entitiesData = messageWrapper.getAttribute('data-entities');
            const messageContent = messageWrapper.querySelector('.message-content');
            
            if (originalMessage && maskedMessage && messageContent) {
                // Parse entities data if available
                let entities = [];
                try {
                    entities = entitiesData ? JSON.parse(entitiesData) : [];
                } catch (e) {
                    console.warn('Failed to parse entities data:', e);
                }
                
                // Create message data for highlighting
                const messageData = {
                    original: originalMessage,
                    masked: maskedMessage,
                    userMessage: true,
                    userEntities: entities
                };
                
                // Show and highlight content based on privacy mode
                const contentToShow = this.privacyMode ? maskedMessage : originalMessage;
                
                if (entities && entities.length > 0) {
                    const highlightedContent = this.highlightUserMessage(contentToShow, entities, messageData);
                    messageContent.innerHTML = highlightedContent;
                } else {
                    messageContent.textContent = contentToShow;
                }
            }
        });
    }
    
    unescapeHtml(text) {
        if (!text) return text;
        return text.replace(/&quot;/g, '"').replace(/&#39;/g, "'");
    }
    
    async resetChatEndpoint() {
        try {
            await fetch('/api/privacy-chat/reset', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    session_id: this.currentSession
                })
            });
        } catch (error) {
            console.error('Error resetting chat:', error);
        }
    }
    
    scrollToBottom() {
        this.elements.chatMessages.scrollTop = this.elements.chatMessages.scrollHeight;
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.privacyChat = new PrivacyChat();
});