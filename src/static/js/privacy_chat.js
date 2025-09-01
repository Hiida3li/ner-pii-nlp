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
    }
    
    setupEventListeners() {
        // Send message
        this.elements.sendBtn.addEventListener('click', () => this.sendMessage());
        
        // Enter to send
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
        const message = this.elements.chatInput.value.trim();
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
                userMessage: true
            };
            
            // Add user message (show masked or original based on privacy mode)
            const userMessageToShow = this.privacyMode ? data.masked_message : data.original_message;
            this.addMessage('user', userMessageToShow, null, messageData);
            
            // Hide typing indicator
            this.hideTypingIndicator();
            
            // Add assistant message with highlighted entities
            this.addMessage('assistant', data.display_response, data.entities);
            
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
            displayContent = this.highlightEntities(content, entities);
        }
        
        // Prepare data attributes for user messages with privacy data
        let dataAttributes = '';
        if (messageData && messageData.userMessage) {
            dataAttributes = `data-original="${messageData.original}" data-masked="${messageData.masked}"`;
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
    
    highlightEntities(text, entities) {
        let highlightedText = text;
        
        // Replace placeholders with highlighted spans
        const entityTypes = {
            'person': 'pii-person',
            'location': 'pii-location',
            'organization': 'pii-organization',
            'email': 'pii-person',
            'phone': 'pii-person',
            'url': 'pii-organization'
        };
        
        // Find all placeholders in text
        const placeholderRegex = /(person|location|organization|email|phone|url|civilid|passport|creditcard)\d+/gi;
        
        highlightedText = highlightedText.replace(placeholderRegex, (match) => {
            const baseType = match.replace(/\d+/, '');
            const cssClass = this.privacyMode ? 'pii-masked' : (entityTypes[baseType] || 'pii-masked');
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
        
        console.log(`Privacy mode: ${this.privacyMode ? 'ON' : 'OFF'}`);
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