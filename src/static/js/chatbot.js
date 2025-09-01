/**
 * Privacy ChatBot - Enterprise Demo
 * Real-time PII detection and masking for AI conversations
 */

class PrivacyChatBot {
    constructor() {
        this.messages = [];
        this.currentSessionId = 1;
        this.privacyMode = true;
        this.isTyping = false;
        
        // PII Entity configuration with colors and masking templates
        this.entityConfig = {
            'PER': { 
                color: 'person', 
                emoji: '👤', 
                name: 'Person',
                maskTemplate: 'person{index}'
            },
            'LOC': { 
                color: 'location', 
                emoji: '📍', 
                name: 'Location',
                maskTemplate: 'location{index}'
            },
            'ORG': { 
                color: 'organization', 
                emoji: '🏢', 
                name: 'Organization',
                maskTemplate: 'organization{index}'
            },
            'EMAIL': { 
                color: 'email', 
                emoji: '📧', 
                name: 'Email',
                maskTemplate: 'email{index}'
            },
            'PHONE': { 
                color: 'phone', 
                emoji: '📱', 
                name: 'Phone',
                maskTemplate: 'phone{index}'
            },
            'URL': { 
                color: 'organization', 
                emoji: '🔗', 
                name: 'URL',
                maskTemplate: 'url{index}'
            },
            'CIVIL-ID': { 
                color: 'person', 
                emoji: '🆔', 
                name: 'Civil ID',
                maskTemplate: 'civilid{index}'
            },
            'PASSPORT-ID': { 
                color: 'person', 
                emoji: '🛂', 
                name: 'Passport',
                maskTemplate: 'passport{index}'
            },
            'CREDIT-CARD': { 
                color: 'organization', 
                emoji: '💳', 
                name: 'Credit Card',
                maskTemplate: 'card{index}'
            }
        };
        
        this.entityMappings = new Map(); // Store original -> masked mappings
        this.entityCounters = {}; // Track entity type counters for masking
        
        this.init();
    }
    
    init() {
        this.cacheElements();
        this.setupEventListeners();
        this.setupExamplePrompts();
        console.log('🤖 Privacy ChatBot initialized');
    }
    
    cacheElements() {
        this.elements = {
            chatMessages: document.getElementById('chat-messages'),
            chatEmpty: document.getElementById('chat-empty'),
            chatInput: document.getElementById('chat-input'),
            sendBtn: document.getElementById('send-btn'),
            privacyToggle: document.getElementById('privacy-toggle'),
            toggleSwitch: document.getElementById('toggle-switch'),
            newChatBtn: document.getElementById('new-chat-btn'),
            chatSessions: document.getElementById('chat-sessions')
        };
    }
    
    setupEventListeners() {
        // Send message
        this.elements.sendBtn.addEventListener('click', () => this.sendMessage());
        
        // Enter to send (Shift+Enter for new line)
        this.elements.chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        
        // Auto-resize textarea
        this.elements.chatInput.addEventListener('input', () => {
            this.autoResizeTextarea();
        });
        
        // Privacy toggle
        this.elements.privacyToggle.addEventListener('click', () => {
            this.togglePrivacyMode();
        });
        
        // New chat
        this.elements.newChatBtn.addEventListener('click', () => {
            this.startNewChat();
        });
    }
    
    setupExamplePrompts() {
        const prompts = document.querySelectorAll('.example-prompt');
        prompts.forEach(prompt => {
            prompt.addEventListener('click', () => {
                const promptText = prompt.getAttribute('data-prompt');
                this.elements.chatInput.value = promptText;
                this.autoResizeTextarea();
                this.elements.chatInput.focus();
            });
        });
    }
    
    autoResizeTextarea() {
        const textarea = this.elements.chatInput;
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }
    
    async sendMessage() {
        const message = this.elements.chatInput.value.trim();
        if (!message || this.isTyping) return;
        
        // Hide empty state
        this.elements.chatEmpty.style.display = 'none';
        
        // Add user message
        this.addMessage('user', message);
        
        // Clear input
        this.elements.chatInput.value = '';
        this.autoResizeTextarea();
        
        // Show typing indicator
        this.showTypingIndicator();
        
        try {
            // Process message for PII detection
            const processedMessage = await this.processPIIInMessage(message);
            
            // Simulate AI response delay
            await this.delay(1000 + Math.random() * 1500);
            
            // Generate AI response
            const response = await this.generateAIResponse(processedMessage);
            
            // Hide typing indicator and add response
            this.hideTypingIndicator();
            this.addMessage('assistant', response);
            
        } catch (error) {
            console.error('Error processing message:', error);
            this.hideTypingIndicator();
            this.addMessage('assistant', 'I apologize, but I encountered an error processing your message. Please try again.');
        }
    }
    
    async processPIIInMessage(message) {
        try {
            const response = await fetch('/api/extract', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: message,
                    model_version: 'v2'
                })
            });
            
            if (!response.ok) {
                throw new Error(`PII detection failed: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            // Store the entities for this message
            if (data.entities && data.entities.length > 0) {
                // Process and store entity mappings
                this.processEntities(data.entities);
                
                // Return highlighted message
                return this.highlightPIIInText(message, data.entities);
            }
            
            return message;
            
        } catch (error) {
            console.error('PII detection error:', error);
            return message; // Return original message if PII detection fails
        }
    }
    
    processEntities(entities) {
        entities.forEach(entity => {
            const entityType = entity.label;
            const originalText = entity.text;
            
            if (!this.entityMappings.has(originalText)) {
                // Initialize counter for this entity type
                if (!this.entityCounters[entityType]) {
                    this.entityCounters[entityType] = 0;
                }
                this.entityCounters[entityType]++;
                
                // Create masked version
                const config = this.entityConfig[entityType];
                if (config) {
                    const maskedText = config.maskTemplate.replace('{index}', this.entityCounters[entityType]);
                    this.entityMappings.set(originalText, {
                        masked: maskedText,
                        type: entityType,
                        original: originalText
                    });
                }
            }
        });
    }
    
    highlightPIIInText(text, entities) {
        if (!entities || entities.length === 0) return text;
        
        // Sort entities by start position (descending) to avoid offset issues
        entities.sort((a, b) => b.start - a.start);
        
        let highlightedText = text;
        
        entities.forEach(entity => {
            const entityType = entity.label;
            const originalText = entity.text;
            const config = this.entityConfig[entityType];
            
            if (config) {
                const entityClass = `pii-${config.color}`;
                const before = highlightedText.substring(0, entity.start);
                const after = highlightedText.substring(entity.end);
                
                const highlightedEntity = this.privacyMode && this.entityMappings.has(originalText)
                    ? `<span class="pii-entity pii-masked" data-original="${originalText}" data-type="${entityType}" title="Original: ${originalText}">${this.entityMappings.get(originalText).masked}</span>`
                    : `<span class="pii-entity ${entityClass}" data-original="${originalText}" data-type="${entityType}" title="${config.name}: ${originalText}">${originalText}</span>`;
                
                highlightedText = before + highlightedEntity + after;
            }
        });
        
        return highlightedText;
    }
    
    async generateAIResponse(message) {
        // Simulate AI response based on message content
        const responses = [
            "I understand you're sharing information that may contain personal data. With privacy mode enabled, I can see that sensitive information has been automatically protected. How can I assist you while maintaining your privacy?",
            
            "Thank you for your message. I notice some personally identifiable information that has been masked for your protection. I'm here to help while ensuring your sensitive data remains secure.",
            
            "I can help you with your request. The PII detection system has identified and protected sensitive information in your message. This ensures your privacy while we continue our conversation.",
            
            "Your message contains information that our privacy layer has automatically protected. This is working as designed to keep your sensitive data secure. How can I assist you further?",
            
            "I see that our privacy protection system has identified sensitive information in your message and applied appropriate masking. This demonstrates how the system works in real-time to protect your data. What would you like to know more about?"
        ];
        
        // Add contextual responses based on detected PII types
        const hasPersonInfo = message.includes('person') || message.includes('👤');
        const hasLocationInfo = message.includes('location') || message.includes('📍');
        const hasContactInfo = message.includes('email') || message.includes('phone');
        
        if (hasPersonInfo && hasLocationInfo) {
            responses.push("I can see that both personal and location information has been detected and protected in your message. This comprehensive protection ensures all sensitive data types are secured.");
        }
        
        if (hasContactInfo) {
            responses.push("Contact information like emails and phone numbers has been automatically masked to protect your privacy while still allowing me to understand the context of your request.");
        }
        
        return responses[Math.floor(Math.random() * responses.length)];
    }
    
    addMessage(sender, content) {
        const messageElement = document.createElement('div');
        messageElement.className = `message ${sender}`;
        
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.textContent = sender === 'user' ? 'U' : '🤖';
        
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        messageContent.innerHTML = content;
        
        messageElement.appendChild(avatar);
        messageElement.appendChild(messageContent);
        
        this.elements.chatMessages.appendChild(messageElement);
        this.scrollToBottom();
        
        // Store message
        this.messages.push({ sender, content, timestamp: Date.now() });
        
        // Add click listeners for PII entities
        this.setupPIIEntityListeners(messageElement);
    }
    
    setupPIIEntityListeners(messageElement) {
        const entities = messageElement.querySelectorAll('.pii-entity');
        entities.forEach(entity => {
            entity.addEventListener('click', () => {
                const original = entity.getAttribute('data-original');
                const type = entity.getAttribute('data-type');
                const config = this.entityConfig[type];
                
                if (config) {
                    const tooltip = `${config.emoji} ${config.name}: ${original}`;
                    // You could implement a proper tooltip here
                    console.log(tooltip);
                }
            });
        });
    }
    
    showTypingIndicator() {
        this.isTyping = true;
        
        const typingElement = document.createElement('div');
        typingElement.className = 'message assistant';
        typingElement.id = 'typing-indicator';
        
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.textContent = '🤖';
        
        const typingContent = document.createElement('div');
        typingContent.className = 'typing-indicator';
        typingContent.innerHTML = `
            <span>AI is thinking</span>
            <div class="typing-dots">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            </div>
        `;
        
        typingElement.appendChild(avatar);
        typingElement.appendChild(typingContent);
        
        this.elements.chatMessages.appendChild(typingElement);
        this.scrollToBottom();
    }
    
    hideTypingIndicator() {
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
        this.isTyping = false;
    }
    
    togglePrivacyMode() {
        this.privacyMode = !this.privacyMode;
        
        const toggle = this.elements.privacyToggle;
        const toggleSwitch = this.elements.toggleSwitch;
        
        if (this.privacyMode) {
            toggle.classList.add('enabled');
            toggleSwitch.classList.add('enabled');
        } else {
            toggle.classList.remove('enabled');
            toggleSwitch.classList.remove('enabled');
        }
        
        // Re-render all messages with new privacy mode
        this.rerenderMessages();
        
        console.log(`Privacy mode: ${this.privacyMode ? 'ON' : 'OFF'}`);
    }
    
    rerenderMessages() {
        // Clear current messages display
        const messages = this.elements.chatMessages.querySelectorAll('.message');
        messages.forEach(msg => msg.remove());
        
        // Re-render all stored messages
        this.messages.forEach(message => {
            this.addMessage(message.sender, message.content);
        });
    }
    
    startNewChat() {
        // Clear messages
        this.messages = [];
        this.entityMappings.clear();
        this.entityCounters = {};
        
        // Clear UI
        const messages = this.elements.chatMessages.querySelectorAll('.message');
        messages.forEach(msg => msg.remove());
        
        // Show empty state
        this.elements.chatEmpty.style.display = 'flex';
        
        // Create new session
        this.currentSessionId++;
        this.addChatSession(`Conversation ${this.currentSessionId}`, 'New chat session');
        
        console.log('New chat started');
    }
    
    addChatSession(title, preview) {
        const sessionElement = document.createElement('div');
        sessionElement.className = 'chat-session';
        sessionElement.setAttribute('data-session-id', this.currentSessionId);
        
        sessionElement.innerHTML = `
            <div class="session-icon">💬</div>
            <div class="session-info">
                <div class="session-title">${title}</div>
                <div class="session-preview">${preview}</div>
            </div>
        `;
        
        // Remove active from all sessions
        const sessions = this.elements.chatSessions.querySelectorAll('.chat-session');
        sessions.forEach(session => session.classList.remove('active'));
        
        // Add new session and make it active
        sessionElement.classList.add('active');
        this.elements.chatSessions.appendChild(sessionElement);
    }
    
    scrollToBottom() {
        this.elements.chatMessages.scrollTop = this.elements.chatMessages.scrollHeight;
    }
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Initialize the chatbot when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.privacyChatBot = new PrivacyChatBot();
});