/**
 * Privacy Chat Modern UI - Purple Gradient Theme
 */

class ModernPrivacyChat {
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
        this.updateConversationsList();
    }
    
    cacheElements() {
        this.elements = {
            messagesContainer: document.getElementById('messages-container'),
            messageInput: document.getElementById('message-input'),
            sendBtn: document.getElementById('send-btn'),
            conversationsList: document.getElementById('conversations-list'),
            welcomeScreen: document.getElementById('welcome-screen'),
            privacyIndicator: document.getElementById('privacy-indicator'),
            clearChatBtn: document.getElementById('clear-chat-btn'),
            togglePrivacyBtn: document.getElementById('toggle-privacy-btn')
        };
    }
    
    setupEventListeners() {
        // Send message
        if (this.elements.sendBtn) {
            this.elements.sendBtn.addEventListener('click', () => this.sendMessage());
        }
        
        // Enter to send
        if (this.elements.messageInput) {
            this.elements.messageInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });
            
            // Auto-resize textarea
            this.elements.messageInput.addEventListener('input', () => {
                this.autoResizeTextarea();
            });
        }
        
        // Clear chat
        if (this.elements.clearChatBtn) {
            this.elements.clearChatBtn.addEventListener('click', () => {
                this.clearCurrentChat();
            });
        }
        
        // Toggle privacy
        if (this.elements.togglePrivacyBtn) {
            this.elements.togglePrivacyBtn.addEventListener('click', () => {
                this.togglePrivacyMode();
            });
        }
        
        // Navigation items
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
                e.target.classList.add('active');
            });
        });
    }
    
    initSession() {
        const now = new Date();
        const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        
        this.sessions[this.currentSession] = {
            messages: [],
            name: `New Chat`,
            timestamp: time,
            firstMessage: null,
            unread: 0
        };
    }
    
    updateConversationsList() {
        const html = Object.keys(this.sessions)
            .sort((a, b) => b - a)
            .map(id => {
                const session = this.sessions[id];
                const lastMessage = session.messages.length > 0 ? 
                    session.messages[session.messages.length - 1].text.substring(0, 50) + '...' :
                    'Start a new conversation';
                
                const displayName = session.firstMessage ? 
                    this.truncateText(session.firstMessage, 20) : 
                    session.name;
                
                return `
                    <div class="conversation-item ${id == this.currentSession ? 'active' : ''}" data-session="${id}">
                        <div class="avatar">
                            ${displayName.charAt(0).toUpperCase()}
                            <span class="online-indicator"></span>
                        </div>
                        <div class="conversation-info">
                            <div class="conversation-header">
                                <span class="conversation-name">${displayName}</span>
                                <span class="conversation-time">${session.timestamp}</span>
                            </div>
                            <div class="conversation-preview">${lastMessage}</div>
                        </div>
                        ${session.unread > 0 ? `<span class="unread-badge">${session.unread}</span>` : ''}
                    </div>
                `;
            }).join('');
        
        if (this.elements.conversationsList) {
            this.elements.conversationsList.innerHTML = html || '<div style="padding: 2rem; text-align: center; color: #9ca3af;">No conversations yet</div>';
            
            // Add click handlers
            document.querySelectorAll('.conversation-item').forEach(item => {
                item.addEventListener('click', () => {
                    this.switchSession(item.dataset.session);
                });
            });
        }
    }
    
    switchSession(sessionId) {
        // Save current session messages
        const messages = this.elements.messagesContainer.querySelectorAll('.message');
        this.sessions[this.currentSession].messages = Array.from(messages).map(m => ({
            html: m.outerHTML,
            text: m.querySelector('.message-text').textContent
        }));
        
        // Switch to new session
        this.currentSession = sessionId;
        
        // Load session messages
        this.clearChat();
        if (this.sessions[sessionId].messages.length > 0) {
            const welcome = document.getElementById('welcome-screen');
            if (welcome) welcome.style.display = 'none';
            
            this.sessions[sessionId].messages.forEach(msg => {
                this.elements.messagesContainer.insertAdjacentHTML('beforeend', msg.html);
            });
        }
        
        // Reset unread count
        this.sessions[sessionId].unread = 0;
        
        // Update UI
        this.updateConversationsList();
    }
    
    clearCurrentChat() {
        if (confirm('Are you sure you want to clear this chat?')) {
            this.sessions[this.currentSession].messages = [];
            this.sessions[this.currentSession].firstMessage = null;
            this.clearChat();
            this.updateConversationsList();
            this.resetChatEndpoint();
        }
    }
    
    clearChat() {
        this.elements.messagesContainer.innerHTML = `
            <div class="welcome-screen" id="welcome-screen">
                <h1 class="welcome-title">Privacy Shield ChatBot</h1>
                <p class="welcome-subtitle">
                    Your conversations are protected by advanced PII detection. 
                    All personal information is automatically masked before processing.
                </p>
            </div>
        `;
    }
    
    autoResizeTextarea() {
        const textarea = this.elements.messageInput;
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }
    
    async sendMessage() {
        const message = this.elements.messageInput.value.trim();
        if (!message || this.isTyping) return;
        
        // Hide welcome screen
        const welcome = document.getElementById('welcome-screen');
        if (welcome) welcome.style.display = 'none';
        
        // Clear input
        this.elements.messageInput.value = '';
        this.autoResizeTextarea();
        
        // Add user message immediately
        this.addMessage('sent', message, 'You');
        
        // Show typing indicator
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
            
            // Store first message for session naming
            if (!this.sessions[this.currentSession].firstMessage) {
                this.sessions[this.currentSession].firstMessage = message;
                this.updateConversationsList();
            }
            
            // Hide typing indicator
            this.hideTypingIndicator();
            
            // Add AI response with entity highlighting
            this.addMessage('received', data.display_response, 'AI', data.response_entities);
            
        } catch (error) {
            console.error('Error:', error);
            this.hideTypingIndicator();
            this.addMessage('received', 'Sorry, I encountered an error. Please try again.', 'AI');
        }
    }
    
    addMessage(type, content, sender, entities = null) {
        const now = new Date();
        const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        
        // Process content for entity highlighting
        let displayContent = content;
        if (entities && entities.length > 0) {
            displayContent = this.highlightEntities(content, entities);
        }
        
        const messageHtml = `
            <div class="message ${type}">
                <div class="message-avatar">${sender === 'You' ? 'U' : 'AI'}</div>
                <div class="message-content">
                    <div class="message-text">${displayContent}</div>
                    <div class="message-time">${time}</div>
                </div>
            </div>
        `;
        
        this.elements.messagesContainer.insertAdjacentHTML('beforeend', messageHtml);
        this.scrollToBottom();
        
        // Save to session
        this.sessions[this.currentSession].messages.push({
            html: messageHtml,
            text: content
        });
    }
    
    highlightEntities(text, entities) {
        let highlightedText = text;
        
        // Find all placeholders
        const placeholderRegex = /(person|location|organization|email|phone|url|civilid|passport|creditcard|bankaccount)\d*/gi;
        
        highlightedText = highlightedText.replace(placeholderRegex, (match) => {
            const baseType = match.replace(/\d+$/, '').toLowerCase();
            const cssClass = this.getEntityCssClass(baseType);
            return `<span class="pii-entity ${cssClass}">${match}</span>`;
        });
        
        return highlightedText;
    }
    
    getEntityCssClass(entityType) {
        const typeMap = {
            'person': 'pii-person',
            'location': 'pii-location',
            'organization': 'pii-organization',
            'email': 'pii-email',
            'phone': 'pii-phone'
        };
        
        return typeMap[entityType.toLowerCase()] || 'pii-entity';
    }
    
    showTypingIndicator() {
        this.isTyping = true;
        const typingHtml = `
            <div class="message received" id="typing-indicator">
                <div class="message-avatar">AI</div>
                <div class="message-content">
                    <div class="typing-indicator">
                        <div class="typing-dot"></div>
                        <div class="typing-dot"></div>
                        <div class="typing-dot"></div>
                    </div>
                </div>
            </div>
        `;
        
        this.elements.messagesContainer.insertAdjacentHTML('beforeend', typingHtml);
        this.scrollToBottom();
    }
    
    hideTypingIndicator() {
        const indicator = document.getElementById('typing-indicator');
        if (indicator) indicator.remove();
        this.isTyping = false;
    }
    
    togglePrivacyMode() {
        this.privacyMode = !this.privacyMode;
        
        const indicator = this.elements.privacyIndicator;
        if (indicator) {
            if (this.privacyMode) {
                indicator.classList.remove('off');
                indicator.innerHTML = '🔒 Privacy Mode Active';
            } else {
                indicator.classList.add('off');
                indicator.innerHTML = '🔓 Privacy Mode Off';
            }
        }
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
        this.elements.messagesContainer.scrollTop = this.elements.messagesContainer.scrollHeight;
    }
    
    truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.modernPrivacyChat = new ModernPrivacyChat();
});