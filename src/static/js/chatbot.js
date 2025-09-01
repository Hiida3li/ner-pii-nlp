/**
 * PII Privacy Layer Demo - ChatBot
 * Demonstrates PII detection with real LLM (OpenAI) integration
 */

class PIIChatBot {
    constructor() {
        this.messages = [];
        this.isTyping = false;
        
        // PII Entity configuration
        this.entityConfig = {
            'PER': { class: 'pii-person', name: 'Person' },
            'LOC': { class: 'pii-location', name: 'Location' },
            'ORG': { class: 'pii-organization', name: 'Organization' },
            'EMAIL': { class: 'pii-email', name: 'Email' },
            'PHONE': { class: 'pii-phone', name: 'Phone' },
            'URL': { class: 'pii-url', name: 'URL' },
            'CIVIL-ID': { class: 'pii-person', name: 'Civil ID' },
            'PASSPORT-ID': { class: 'pii-person', name: 'Passport' },
            'CREDIT-CARD': { class: 'pii-organization', name: 'Credit Card' }
        };
        
        this.init();
    }
    
    init() {
        this.cacheElements();
        this.setupEventListeners();
        console.log('🛡️ PII Privacy Layer ChatBot initialized');
    }
    
    cacheElements() {
        this.elements = {
            chatMessages: document.getElementById('chat-messages'),
            chatEmpty: document.getElementById('chat-empty'),
            chatInput: document.getElementById('chat-input'),
            sendBtn: document.getElementById('send-btn'),
            newChatBtn: document.getElementById('new-chat-btn')
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
        
        // New chat
        this.elements.newChatBtn.addEventListener('click', () => {
            this.startNewChat();
        });
    }
    
    autoResizeTextarea() {
        const textarea = this.elements.chatInput;
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
    }
    
    async sendMessage() {
        const message = this.elements.chatInput.value.trim();
        if (!message || this.isTyping) return;
        
        // Hide empty state
        if (this.elements.chatEmpty) {
            this.elements.chatEmpty.style.display = 'none';
        }
        
        // Clear input
        this.elements.chatInput.value = '';
        this.autoResizeTextarea();
        
        // Process and add user message with PII highlighting
        const processedUserMessage = await this.detectAndHighlightPII(message);
        this.addMessage('user', processedUserMessage, message);
        
        // Show typing indicator
        this.showTypingIndicator();
        
        try {
            // Send to backend which will call OpenAI
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: message,
                    history: this.messages.slice(-10) // Send last 10 messages for context
                })
            });
            
            if (!response.ok) {
                throw new Error('Failed to get response');
            }
            
            const data = await response.json();
            
            // Hide typing indicator
            this.hideTypingIndicator();
            
            // Process AI response for PII and add to chat
            const processedAIMessage = await this.detectAndHighlightPII(data.response);
            this.addMessage('assistant', processedAIMessage, data.response);
            
        } catch (error) {
            console.error('Error:', error);
            this.hideTypingIndicator();
            this.addMessage('assistant', 'Sorry, I encountered an error. Please try again.', 'Error occurred');
        }
    }
    
    async detectAndHighlightPII(text) {
        try {
            const response = await fetch('/api/extract', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    text: text,
                    model_version: 'v2'
                })
            });
            
            if (!response.ok) {
                console.error('PII detection failed');
                return text;
            }
            
            const data = await response.json();
            
            if (data.entities && data.entities.length > 0) {
                return this.highlightEntities(text, data.entities);
            }
            
            return text;
            
        } catch (error) {
            console.error('PII detection error:', error);
            return text;
        }
    }
    
    highlightEntities(text, entities) {
        // Sort entities by position (descending) to avoid offset issues
        entities.sort((a, b) => b.start - a.start);
        
        let highlightedText = text;
        
        entities.forEach(entity => {
            const entityType = entity.entity_type;
            const config = this.entityConfig[entityType];
            
            if (config) {
                const before = highlightedText.substring(0, entity.start);
                const entityText = highlightedText.substring(entity.start, entity.end);
                const after = highlightedText.substring(entity.end);
                
                const highlightedEntity = `<span class="pii-entity ${config.class}" title="${config.name}: ${entityText}">${entityText}</span>`;
                
                highlightedText = before + highlightedEntity + after;
            }
        });
        
        return highlightedText;
    }
    
    addMessage(sender, displayContent, originalContent) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;
        
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.textContent = sender === 'user' ? 'U' : 'AI';
        
        const content = document.createElement('div');
        content.className = 'message-content';
        content.innerHTML = displayContent;
        
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(content);
        
        this.elements.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
        
        // Store message
        this.messages.push({
            role: sender === 'user' ? 'user' : 'assistant',
            content: originalContent,
            timestamp: Date.now()
        });
    }
    
    showTypingIndicator() {
        this.isTyping = true;
        
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message assistant';
        typingDiv.id = 'typing-indicator';
        
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.textContent = 'AI';
        
        const content = document.createElement('div');
        content.className = 'typing-indicator';
        content.innerHTML = `
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
        `;
        
        typingDiv.appendChild(avatar);
        typingDiv.appendChild(content);
        
        this.elements.chatMessages.appendChild(typingDiv);
        this.scrollToBottom();
    }
    
    hideTypingIndicator() {
        const indicator = document.getElementById('typing-indicator');
        if (indicator) {
            indicator.remove();
        }
        this.isTyping = false;
    }
    
    startNewChat() {
        // Clear messages
        this.messages = [];
        
        // Clear UI
        const messages = this.elements.chatMessages.querySelectorAll('.message');
        messages.forEach(msg => msg.remove());
        
        // Show empty state
        if (this.elements.chatEmpty) {
            this.elements.chatEmpty.style.display = 'flex';
        }
        
        console.log('New chat started');
    }
    
    scrollToBottom() {
        this.elements.chatMessages.scrollTop = this.elements.chatMessages.scrollHeight;
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.piiChatBot = new PIIChatBot();
});