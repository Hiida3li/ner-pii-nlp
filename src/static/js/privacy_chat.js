/**
 * Privacy Chat - ChatGPT-style interface with PII protection
 */

class PrivacyChat {
    constructor() {
        this.sessionCounter = 1;
        this.currentSession = 1;
        this.sessions = {};
        // Load privacy mode from localStorage or default to true
        const storedPrivacyMode = localStorage.getItem('privacyMode');
        this.privacyMode = storedPrivacyMode !== null ? storedPrivacyMode === 'true' : true;
        console.log('Initialized privacy mode from storage:', this.privacyMode);
        this.isTyping = false;
        
        this.init();
    }
    
    init() {
        this.cacheElements();
        this.setupEventListeners();
        this.initSession();
        this.updateSessionList();
        // Reset backend session on page load to clear entity mappings
        this.resetChatEndpoint();
        // Initialize privacy toggle state
        this.initializePrivacyToggle();
    }
    
    cacheElements() {
        this.elements = {
            chatMessages: document.getElementById('chat-messages'),
            chatInput: document.getElementById('chat-input'),
            sendBtn: document.getElementById('send-btn'),
            chatInputBottom: document.getElementById('chat-input-bottom'),
            sendBtnBottom: document.getElementById('send-btn-bottom'),
            newChatBtn: document.getElementById('new-chat-btn'),
            newChatIcon: document.getElementById('new-chat-icon'),
            chatList: document.getElementById('chat-list'),
            welcomeScreen: document.getElementById('welcome-screen'),
            privacyToggle: document.getElementById('privacy-toggle'),
            sidebarToggle: document.getElementById('sidebar-toggle'),
            sidebar: document.getElementById('sidebar'),
            centeredInput: document.getElementById('centered-input'),
            bottomInput: document.getElementById('bottom-input')
        };
        
        // Log privacy toggle element status
        console.log('Privacy toggle element in cacheElements:', this.elements.privacyToggle);
        
        // Debug: Check which elements were found
        console.log('Elements found:', {
            chatMessages: !!this.elements.chatMessages,
            chatInput: !!this.elements.chatInput,
            sendBtn: !!this.elements.sendBtn,
            chatInputBottom: !!this.elements.chatInputBottom,
            sendBtnBottom: !!this.elements.sendBtnBottom,
            newChatBtn: !!this.elements.newChatBtn,
            chatList: !!this.elements.chatList,
            welcomeScreen: !!this.elements.welcomeScreen,
            privacyToggle: !!this.elements.privacyToggle,
            bottomInput: !!this.elements.bottomInput
        });
    }
    
    setupEventListeners() {
        // Send message - centered button
        if (this.elements.sendBtn) {
            this.elements.sendBtn.addEventListener('click', () => {
                console.log('Send button clicked');
                this.sendMessage();
            });
        }
        
        // Send message - bottom button
        if (this.elements.sendBtnBottom) {
            this.elements.sendBtnBottom.addEventListener('click', () => {
                console.log('Bottom send button clicked');
                this.sendMessage();
            });
        }
        
        // Enter to send - centered input
        if (this.elements.chatInput) {
            this.elements.chatInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    console.log('Enter key pressed in centered input');
                    this.sendMessage();
                }
            });
        }
        
        // Enter to send - bottom input
        if (this.elements.chatInputBottom) {
            this.elements.chatInputBottom.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    console.log('Enter key pressed in bottom input');
                    this.sendMessage();
                }
            });
        }
        
        // Auto-resize textarea - both inputs
        if (this.elements.chatInput) {
            this.elements.chatInput.addEventListener('input', () => {
                this.autoResizeTextarea();
            });
        }
        
        if (this.elements.chatInputBottom) {
            this.elements.chatInputBottom.addEventListener('input', () => {
                this.autoResizeTextarea();
            });
        }
        
        // New chat button in sidebar
        if (this.elements.newChatBtn) {
            this.elements.newChatBtn.addEventListener('click', () => {
                this.createNewSession();
            });
        }
        
        // New chat icon button (fixed position)
        if (this.elements.newChatIcon) {
            this.elements.newChatIcon.addEventListener('click', () => {
                this.createNewSession();
            });
        }
        
        // Privacy toggle
        if (this.elements.privacyToggle) {
            console.log('Privacy toggle element found:', this.elements.privacyToggle);
            this.elements.privacyToggle.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Privacy toggle clicked');
                this.togglePrivacyMode();
            });
        } else {
            console.error('Privacy toggle element NOT found');
        }
        
        // Sidebar toggle
        if (this.elements.sidebarToggle && this.elements.sidebar) {
            this.elements.sidebarToggle.addEventListener('click', () => {
                this.elements.sidebar.classList.toggle('collapsed');
                this.elements.sidebarToggle.classList.toggle('active');
                
                // Update container padding
                const container = document.getElementById('container');
                if (container) {
                    if (this.elements.sidebar.classList.contains('collapsed')) {
                        container.classList.add('sidebar-closed');
                        container.classList.remove('sidebar-open');
                    } else {
                        container.classList.add('sidebar-open');
                        container.classList.remove('sidebar-closed');
                    }
                }
            });
        }
    }
    
    initSession() {
        const timestamp = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        this.sessions[this.currentSession] = {
            messages: [],
            name: `Chat ${this.currentSession}`,
            timestamp: timestamp,
            firstMessage: null
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
        const sessionHtml = Object.keys(this.sessions)
            .sort((a, b) => b - a) // Show newest first
            .map(id => {
                const session = this.sessions[id];
                const displayName = session.firstMessage ? 
                    this.truncateText(session.firstMessage, 25) : 
                    session.name;
                
                return `
                    <div class="chat-item ${id == this.currentSession ? 'active' : ''}" data-session="${id}">
                        <div class="chat-item-content">
                            <svg class="chat-icon" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                            </svg>
                            <span class="chat-name" title="${displayName}">${displayName}</span>
                        </div>
                        <div class="chat-actions">
                            <button class="chat-action-btn rename" data-session="${id}" title="Rename">
                                <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                </svg>
                            </button>
                            <button class="chat-action-btn delete" data-session="${id}" title="Delete">
                                <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                    <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14zM10 11v6M14 11v6"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                `;
            }).join('');
        
        this.elements.chatList.innerHTML = sessionHtml || '<div style="padding: 1rem; color: #666; text-align: center;">No chats yet</div>';
        
        // Add click handlers for sessions
        document.querySelectorAll('.chat-item').forEach(item => {
            item.addEventListener('click', (e) => {
                // Don't switch session if clicking on action buttons
                if (!e.target.closest('.chat-actions')) {
                    this.switchSession(item.dataset.session);
                }
            });
        });
        
        // Add handlers for rename buttons
        document.querySelectorAll('.chat-action-btn.rename').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.renameSession(btn.dataset.session);
            });
        });
        
        // Add handlers for delete buttons
        document.querySelectorAll('.chat-action-btn.delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteSession(btn.dataset.session);
            });
        });
    }
    
    truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }
    
    renameSession(sessionId) {
        const session = this.sessions[sessionId];
        const newName = prompt('Enter new name for this chat:', session.name);
        if (newName && newName.trim()) {
            session.name = newName.trim();
            session.firstMessage = null; // Clear first message to use custom name
            this.updateSessionList();
        }
    }
    
    deleteSession(sessionId) {
        if (Object.keys(this.sessions).length === 1) {
            alert('Cannot delete the last session');
            return;
        }
        
        if (confirm('Are you sure you want to delete this chat?')) {
            delete this.sessions[sessionId];
            
            // If deleting current session, switch to another
            if (sessionId == this.currentSession) {
                const remainingSessions = Object.keys(this.sessions);
                this.currentSession = remainingSessions[remainingSessions.length - 1];
                this.switchSession(this.currentSession);
            } else {
                this.updateSessionList();
            }
        }
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
                <div class="robot-wrapper">
                    <div class="lightning"></div>
                    <div class="robot-head">
                        <div class="robot-face">
                            <div class="eyes">
                                <div class="eye"></div>
                                <div class="eye"></div>
                            </div>
                            <div class="mouth"></div>
                        </div>
                    </div>
                </div>
                <p class="welcome-subtitle">
                    Good to see you! How can I help?
                </p>
                
                <!-- Centered Input Area -->
                <div class="input-container" id="centered-input">
                    <div class="input-wrapper">
                        <div class="input-box">
                            <textarea 
                                class="chat-input" 
                                id="chat-input" 
                                placeholder="Send a message..."
                                rows="1"
                            ></textarea>
                            <button class="send-btn" id="send-btn">
                                <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Re-cache welcome screen element since we just recreated it
        this.elements.welcomeScreen = document.getElementById('welcome-screen');
        
        // Re-cache the new input elements
        this.elements.chatInput = document.getElementById('chat-input');
        this.elements.sendBtn = document.getElementById('send-btn');
        
        // Re-attach event listeners to the new elements
        if (this.elements.sendBtn) {
            this.elements.sendBtn.addEventListener('click', () => {
                console.log('Send button clicked (new chat)');
                this.sendMessage();
            });
        }
        
        if (this.elements.chatInput) {
            this.elements.chatInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });
            
            this.elements.chatInput.addEventListener('input', () => {
                this.autoResizeTextarea();
            });
        }
        
        // Always ensure centered input is visible for new chat
        const centeredInput = document.getElementById('centered-input');
        if (centeredInput) {
            centeredInput.style.display = 'block';
        }
        
        // Hide bottom input for new chat
        const bottomInput = document.getElementById('bottom-input');
        if (bottomInput) {
            bottomInput.style.display = 'none';
        }
        
        // Remove has-messages class
        this.elements.chatMessages.classList.remove('has-messages');
        
        // Re-focus the input for better UX
        if (this.elements.chatInput) {
            setTimeout(() => this.elements.chatInput.focus(), 100);
        }
    }
    
    autoResizeTextarea() {
        // Resize whichever textarea is active
        const activeInput = this.elements.welcomeScreen && this.elements.welcomeScreen.style.display !== 'none' ? 
            this.elements.chatInput : this.elements.chatInputBottom;
        if (activeInput) {
            activeInput.style.height = 'auto';
            activeInput.style.height = Math.min(activeInput.scrollHeight, 200) + 'px';
        }
    }
    
    moveInputToBottom() {
        // Hide centered input container completely
        const centeredInput = document.getElementById('centered-input');
        if (centeredInput) {
            centeredInput.style.display = 'none';
        }
        
        // Show bottom input
        const bottomInput = document.getElementById('bottom-input');
        if (bottomInput) {
            bottomInput.style.display = 'block';
        }
        
        // Add class to adjust padding
        this.elements.chatMessages.classList.add('has-messages');
        
        // Focus on bottom input
        if (this.elements.chatInputBottom) {
            setTimeout(() => {
                this.elements.chatInputBottom.focus();
            }, 100);
        }
    }
    
    async sendMessage() {
        console.log('sendMessage called');
        
        // Determine which input is active
        const isWelcomeVisible = document.getElementById('welcome-screen') !== null;
        let message;
        
        if (isWelcomeVisible) {
            // Get message from centered input
            message = this.elements.chatInput ? this.elements.chatInput.value.trim() : '';
        } else {
            // Get message from bottom input
            message = this.elements.chatInputBottom ? this.elements.chatInputBottom.value.trim() : '';
        }
        
        console.log('Message:', message, 'IsTyping:', this.isTyping);
        if (!message || this.isTyping) return;
        
        // If on welcome screen, move input to bottom first
        if (isWelcomeVisible) {
            // Hide welcome screen
            const welcome = document.getElementById('welcome-screen');
            if (welcome) welcome.remove();
            
            // Move input to bottom
            this.moveInputToBottom();
        }
        
        // Clear the appropriate input
        if (this.elements.chatInputBottom) {
            this.elements.chatInputBottom.value = '';
        }
        this.autoResizeTextarea();
        
        // Show typing indicator (don't show user message yet)
        this.showTypingIndicator();
        
        try {
            // Use streaming endpoint
            console.log('Sending to backend (streaming):', { message, privacy_mode: this.privacyMode, session_id: this.currentSession });
            
            const response = await fetch('/api/privacy-chat/stream', {
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
            
            // Process streaming response
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';
            let userMessageData = null;
            let assistantMessageWrapper = null;
            let assistantMessageContent = null;
            let maskedResponse = '';
            let unmaskedResponse = '';
            let responseEntities = [];
            
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';
                
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const data = JSON.parse(line.slice(6));
                            
                            if (data.type === 'init') {
                                // Process initial data with user message info
                                userMessageData = {
                                    original: data.original_message,
                                    masked: data.masked_message,
                                    userMessage: true,
                                    userEntities: data.user_entities || []
                                };
                                
                                // Store first message for session naming
                                if (!this.sessions[this.currentSession].firstMessage) {
                                    this.sessions[this.currentSession].firstMessage = message;
                                    this.updateSessionList();
                                }
                                
                                // Add user message
                                const userMessageToShow = this.privacyMode ? data.masked_message : data.original_message;
                                this.addMessage('user', userMessageToShow, userMessageData.userEntities, userMessageData);
                                
                                // Hide typing indicator
                                this.hideTypingIndicator();
                                
                                // Create assistant message placeholder for streaming
                                assistantMessageWrapper = this.createStreamingMessage();
                                assistantMessageContent = assistantMessageWrapper.querySelector('.message-text');
                                
                            } else if (data.type === 'chunk') {
                                // Append chunk to response
                                maskedResponse += data.masked_chunk;
                                unmaskedResponse += data.unmasked_chunk;
                                
                                // Update displayed content based on privacy mode
                                const displayText = this.privacyMode ? maskedResponse : unmaskedResponse;
                                if (assistantMessageContent) {
                                    // Apply highlighting to placeholders if in privacy mode
                                    if (this.privacyMode) {
                                        assistantMessageContent.innerHTML = this.highlightPlaceholders(displayText);
                                    } else {
                                        assistantMessageContent.textContent = displayText;
                                    }
                                }
                                
                            } else if (data.type === 'complete') {
                                // Store response entities for later use
                                responseEntities = data.response_entities || [];
                                
                                // Add data attributes to assistant message for privacy toggle
                                if (assistantMessageWrapper) {
                                    assistantMessageWrapper.setAttribute('data-original', unmaskedResponse);
                                    assistantMessageWrapper.setAttribute('data-masked', maskedResponse);
                                    assistantMessageWrapper.setAttribute('data-entities', JSON.stringify(responseEntities));
                                    assistantMessageWrapper.setAttribute('data-role', 'assistant');
                                    
                                    // Final highlighting
                                    const finalDisplay = this.privacyMode ? maskedResponse : unmaskedResponse;
                                    if (this.privacyMode) {
                                        assistantMessageContent.innerHTML = this.highlightPlaceholders(finalDisplay);
                                    } else {
                                        assistantMessageContent.innerHTML = this.highlightEntities(finalDisplay, responseEntities);
                                    }
                                }
                            }
                        } catch (e) {
                            console.error('Error parsing streaming data:', e);
                        }
                    }
                }
            }
            
            // Show what was sent to AI if in privacy mode
            if (this.privacyMode && userMessageData) {
                console.log('🔒 Sent to AI (masked):', userMessageData.masked);
            }
            
        } catch (error) {
            console.error('Error:', error);
            this.hideTypingIndicator();
            this.addMessage('assistant', 'Sorry, I encountered an error. Please try again.');
        }
    }
    
    detectTextDirection(text) {
        // Regular expression to detect Arabic characters
        const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
        // Regular expression to detect Hebrew characters
        const hebrewRegex = /[\u0590-\u05FF]/;
        
        // Check if text contains Arabic or Hebrew
        if (arabicRegex.test(text) || hebrewRegex.test(text)) {
            return 'rtl';
        }
        return 'ltr';
    }
    
    addMessage(role, content, entities = null, messageData = null) {
        // Process content for PII highlighting if entities provided
        let displayContent = content;
        if (entities && entities.length > 0) {
            if (role === 'user' && messageData && messageData.userMessage) {
                // For user messages, highlight based on current privacy mode
                displayContent = this.highlightUserMessage(content, entities, messageData);
            } else if (role === 'assistant') {
                // For AI responses, show appropriate version based on privacy mode
                if (this.privacyMode) {
                    // Show masked version with placeholders highlighted
                    displayContent = this.highlightPlaceholders(content);
                } else {
                    // Show original with entities highlighted
                    displayContent = this.highlightEntities(content, entities);
                }
            }
        }
        
        // Detect text direction
        const textDirection = this.detectTextDirection(content);
        const dirClass = textDirection === 'rtl' ? 'rtl' : 'ltr';
        
        // Prepare data attributes for messages with privacy data
        let dataAttributes = '';
        if (messageData) {
            if (messageData.userMessage) {
                const escapedOriginal = messageData.original.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
                const escapedMasked = messageData.masked.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
                const entitiesJson = JSON.stringify(messageData.userEntities || []).replace(/"/g, '&quot;');
                dataAttributes = `data-original="${escapedOriginal}" data-masked="${escapedMasked}" data-entities="${entitiesJson}" data-role="user"`;
            } else if (messageData.isAssistant) {
                const escapedOriginal = (messageData.original || '').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
                const escapedMasked = (messageData.masked || '').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
                const entitiesJson = JSON.stringify(messageData.entities || []).replace(/"/g, '&quot;');
                dataAttributes = `data-original="${escapedOriginal}" data-masked="${escapedMasked}" data-entities="${entitiesJson}" data-role="assistant"`;
            }
        }
        
        const messageHtml = `
            <div class="message-wrapper" ${dataAttributes}>
                <div class="message ${role}">
                    <div class="message-avatar">
                        ${role === 'user' ? 'U' : 'AI'}
                    </div>
                    <div class="message-content">
                        <div class="message-text ${dirClass}">${displayContent}</div>
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
    
    highlightPlaceholders(text) {
        // Highlight placeholders in masked text
        const placeholderRegex = /(person|location|organization|email|phone|url|civilid|passport|creditcard|bankaccount)\d*/gi;
        
        return text.replace(placeholderRegex, (match) => {
            const baseType = match.replace(/\d+$/, '').toLowerCase();
            const cssClass = this.getEntityCssClass(baseType);
            return `<span class="pii-entity ${cssClass}">${match}</span>`;
        });
    }
    
    escapeRegExp(str) {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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
    
    initializePrivacyToggle() {
        // Set initial state of privacy toggle
        const toggle = this.elements.privacyToggle;
        if (toggle) {
            const slider = toggle.querySelector('.privacy-toggle-slider');
            if (this.privacyMode) {
                toggle.classList.add('active');
                if (slider) slider.textContent = '🔒';
            } else {
                toggle.classList.remove('active');
                if (slider) slider.textContent = '🔓';
            }
        }
    }
    
    togglePrivacyMode() {
        console.log('togglePrivacyMode called, current state:', this.privacyMode);
        this.privacyMode = !this.privacyMode;
        console.log('New privacy mode state:', this.privacyMode);
        
        // Update UI
        const toggle = this.elements.privacyToggle;
        if (!toggle) {
            console.error('Privacy toggle element not found');
            return;
        }
        
        const slider = toggle.querySelector('.privacy-toggle-slider');
        
        if (this.privacyMode) {
            toggle.classList.add('active');
            if (slider) {
                slider.textContent = '🔒';
                console.log('Set toggle to locked (privacy ON)');
            }
        } else {
            toggle.classList.remove('active');
            if (slider) {
                slider.textContent = '🔓';
                console.log('Set toggle to unlocked (privacy OFF)');
            }
        }
        
        // Update all user messages to show/hide original data
        console.log('Updating messages privacy view...');
        this.updateMessagesPrivacyView();
        
        console.log(`Privacy mode: ${this.privacyMode ? 'ON (Masked)' : 'OFF (Original data shown)'}`);
        
        // Store the preference
        localStorage.setItem('privacyMode', this.privacyMode ? 'true' : 'false');
    }
    
    updateMessagesPrivacyView() {
        // Find all message wrappers that have privacy data
        const allMessages = this.elements.chatMessages.querySelectorAll('.message-wrapper[data-original]');
        console.log('Found messages with privacy data:', allMessages.length);
        
        allMessages.forEach((messageWrapper, index) => {
            console.log(`Processing message ${index + 1}`);
            const role = messageWrapper.getAttribute('data-role');
            const originalMessage = this.unescapeHtml(messageWrapper.getAttribute('data-original'));
            const maskedMessage = this.unescapeHtml(messageWrapper.getAttribute('data-masked'));
            const entitiesData = messageWrapper.getAttribute('data-entities');
            const messageContent = messageWrapper.querySelector('.message-content');
            
            if (role === 'user' && originalMessage && maskedMessage && messageContent) {
                // Parse entities data if available
                let entities = [];
                try {
                    entities = entitiesData ? JSON.parse(entitiesData) : [];
                } catch (e) {
                    console.warn('Failed to parse entities data:', e);
                }
                
                // Determine which message to show
                const messageToShow = this.privacyMode ? maskedMessage : originalMessage;
                console.log('Privacy mode:', this.privacyMode, 'Showing:', this.privacyMode ? 'masked' : 'original');
                console.log('Original:', originalMessage);
                console.log('Masked:', maskedMessage);
                console.log('Entities:', entities);
                
                // Detect text direction for the current message
                const textDirection = this.detectTextDirection(messageToShow);
                const dirClass = textDirection === 'rtl' ? 'rtl' : 'ltr';
                
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
                    messageContent.innerHTML = `<div class="message-text ${dirClass}">${highlightedContent}</div>`;
                } else {
                    messageContent.innerHTML = `<div class="message-text ${dirClass}">${contentToShow}</div>`;
                }
            } else if (role === 'assistant' && originalMessage && messageContent) {
                // Handle assistant messages
                const maskedMessage = this.unescapeHtml(messageWrapper.getAttribute('data-masked'));
                let entities = [];
                try {
                    entities = entitiesData ? JSON.parse(entitiesData) : [];
                } catch (e) {
                    console.warn('Failed to parse entities data:', e);
                }
                
                // Choose which version to show based on privacy mode
                const messageToShow = this.privacyMode ? maskedMessage : originalMessage;
                const textDirection = this.detectTextDirection(messageToShow);
                const dirClass = textDirection === 'rtl' ? 'rtl' : 'ltr';
                
                let displayContent;
                if (this.privacyMode) {
                    // Show masked version with placeholders highlighted
                    displayContent = this.highlightPlaceholders(maskedMessage);
                } else {
                    // Show original with entities highlighted
                    displayContent = this.highlightEntities(originalMessage, entities);
                }
                
                messageContent.innerHTML = `<div class="message-text ${dirClass}">${displayContent}</div>`;
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