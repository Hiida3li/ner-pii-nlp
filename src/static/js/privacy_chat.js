/**
 * Privacy Chat - ChatGPT-style interface with PII protection
 */

class PrivacyChat {
    constructor() {
        this.sessionCounter = 1;
        this.currentSession = 1;
        this.sessions = {};
        // Always start with privacy mode enabled (no localStorage)
        this.privacyMode = true;
        console.log('Initialized privacy mode:', this.privacyMode);
        this.isTyping = false;
        this.animatedSessions = new Set(); // Track which sessions have been animated
        this.currentStreamController = null; // Track the current stream abort controller
        this.activeStreamSession = null; // Track which session the stream is for
        
        // Array of creative greeting messages
        this.greetings = [
            "What's today's adventure?",
            "Shall we make some magic happen?",
            "Tell me, what's the mission briefing?",
            "Who's in charge today—you or me?",
            "What puzzle are we solving first?",
            "What's the headline of your day?",
            "Ready to dive in, or should we just float around?",
            "Should we start with brilliance or chaos?"
        ];
        
        this.init();
    }
    
    init() {
        this.cacheElements();
        this.setupEventListeners();
        this.initSession();
        this.updateSessionList();
        
        // Set random greeting on page load
        this.setInitialGreeting();
        
        // Reset backend session on page load to clear entity mappings
        this.resetChatEndpoint();
        // Initialize privacy toggle state
        this.initializePrivacyToggle();
        // Initialize textarea heights
        this.initializeTextareas();
    }
    
    setInitialGreeting() {
        // Set a random greeting on the initial welcome screen
        const greetingElement = document.getElementById('welcome-greeting');
        if (greetingElement) {
            greetingElement.textContent = this.getRandomGreeting();
        }
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
        
        // Auto-resize textarea and toggle send button - both inputs
        if (this.elements.chatInput) {
            this.elements.chatInput.addEventListener('input', () => {
                this.autoResizeTextarea();
                this.toggleSendButton();
            });
            // Also trigger on paste and cut events
            this.elements.chatInput.addEventListener('paste', () => {
                setTimeout(() => this.autoResizeTextarea(), 0);
            });
            this.elements.chatInput.addEventListener('cut', () => {
                setTimeout(() => this.autoResizeTextarea(), 0);
            });
        }
        
        if (this.elements.chatInputBottom) {
            this.elements.chatInputBottom.addEventListener('input', () => {
                this.autoResizeTextarea();
                this.toggleSendButton();
            });
            // Also trigger on paste and cut events
            this.elements.chatInputBottom.addEventListener('paste', () => {
                setTimeout(() => this.autoResizeTextarea(), 0);
            });
            this.elements.chatInputBottom.addEventListener('cut', () => {
                setTimeout(() => this.autoResizeTextarea(), 0);
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
                // Removed container class modifications to prevent content shifting
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
        // Don't abort stream - let it continue in the background for that session
        // Only abort if the active stream is for the current session we're leaving
        if (this.activeStreamSession === this.currentSession) {
            this.abortCurrentStream();
        }
        
        // Check if current session is empty (no messages)
        const messages = this.elements.chatMessages.querySelectorAll('.message-wrapper');
        if (messages.length === 0) {
            // Current session is already empty, just clear input and reset
            this.clearChat();
            this.resetChatEndpoint();
            return; // Don't create a new session
        }
        
        // Show chat sessions container when creating new session
        this.showChatSessionsContainer();
        
        // Save current session
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
    
    showChatSessionsContainer() {
        const container = document.getElementById('chat-sessions-container');
        if (container && container.style.display === 'none') {
            container.style.display = 'block';
        }
    }
    
    updateSessionList() {
        const sessionHtml = Object.keys(this.sessions)
            .sort((a, b) => b - a) // Show newest first
            .map(id => {
                const session = this.sessions[id];
                const displayName = session.firstMessage ? 
                    this.truncateText(session.firstMessage, 25) : 
                    session.name;
                
                // Check if this session name should be animated
                const sessionKey = `${id}-${displayName}`;
                const shouldAnimate = session.firstMessage && !this.animatedSessions.has(sessionKey);
                
                if (shouldAnimate) {
                    this.animatedSessions.add(sessionKey);
                }
                
                return `
                    <div class="chat-item ${id == this.currentSession ? 'active' : ''}" data-session="${id}">
                        <div class="chat-item-content">
                            <svg class="chat-icon" width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <path d="M21 11.5C21 16.75 16.75 21 11.5 21C9.8 21 8.21 20.53 6.84 19.71L3 21L4.29 17.16C3.47 15.79 3 14.2 3 12.5C3 7.25 7.25 3 12.5 3C16.06 3 19.11 5.04 20.5 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.8"/>
                                <circle cx="8" cy="12" r="1" fill="currentColor" opacity="0.6"/>
                                <circle cx="12" cy="12" r="1" fill="currentColor" opacity="0.6"/>
                                <circle cx="16" cy="12" r="1" fill="currentColor" opacity="0.6"/>
                            </svg>
                            <span class="chat-name ${shouldAnimate ? 'streaming-text' : ''}" title="${displayName}" data-text="${displayName}">${shouldAnimate ? '' : displayName}</span>
                        </div>
                        <div class="chat-actions">
                            <button class="chat-action-btn rename" data-session="${id}" title="Rename">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z" fill="currentColor" opacity="0.3"/>
                                    <path d="M20.71 5.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" fill="currentColor"/>
                                    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                            </button>
                            <button class="chat-action-btn delete" data-session="${id}" title="Delete">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                    <path d="M6 19C6 20.1 6.9 21 8 21H16C17.1 21 18 20.1 18 19V7H6V19Z" fill="currentColor" opacity="0.3"/>
                                    <path d="M19 4H15.5L14.5 3H9.5L8.5 4H5V6H19V4Z" fill="currentColor" opacity="0.5"/>
                                    <path d="M10 9V17M14 9V17" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
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
        
        // Animate new chat names with streaming effect
        document.querySelectorAll('.streaming-text').forEach(element => {
            const text = element.dataset.text;
            if (text) {
                this.streamText(element, text, 30); // 30ms per character
            }
        });
    }
    
    streamText(element, text, speed = 50) {
        element.textContent = '';
        let index = 0;
        
        const typeCharacter = () => {
            if (index < text.length) {
                element.textContent += text[index];
                index++;
                setTimeout(typeCharacter, speed);
            } else {
                // Remove streaming class after animation completes
                element.classList.remove('streaming-text');
            }
        };
        
        typeCharacter();
    }
    
    truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }
    
    renameSession(sessionId) {
        this.currentRenameSessionId = sessionId;
        const session = this.sessions[sessionId];
        
        // Show custom modal
        const modal = document.getElementById('rename-modal');
        const input = document.getElementById('chat-name-input');
        
        input.value = session.name;
        modal.style.display = 'flex';
        
        // Add show class after a brief delay for animation
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);
        
        // Focus input and select text
        setTimeout(() => {
            input.focus();
            input.select();
        }, 100);
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
        // Don't abort stream - let it continue in the background
        // Streams will write to their target session's saved messages
        
        // Save current session
        const messages = this.elements.chatMessages.querySelectorAll('.message-wrapper');
        this.sessions[this.currentSession].messages = Array.from(messages).map(m => m.outerHTML);
        
        // Switch to new session
        this.currentSession = sessionId;
        
        // Load session messages
        if (this.sessions[sessionId].messages.length > 0) {
            // Has messages - restore them and show bottom input
            this.elements.chatMessages.innerHTML = this.sessions[sessionId].messages.join('');
            
            // Hide welcome screen/centered input
            const welcomeScreen = document.getElementById('welcome-screen');
            const centeredInput = document.getElementById('centered-input');
            if (welcomeScreen) welcomeScreen.style.display = 'none';
            if (centeredInput) centeredInput.style.display = 'none';
            
            // Show bottom input
            const bottomInput = document.getElementById('bottom-input');
            if (bottomInput) {
                bottomInput.style.display = 'flex';
                // Re-cache bottom input elements
                this.elements.chatInputBottom = document.getElementById('chat-input-bottom');
                this.elements.sendBtnBottom = document.getElementById('send-btn-bottom');
                // Re-attach event listeners for bottom input
                this.setupEventListeners();
            }
        } else {
            // No messages - show welcome screen with centered input
            this.clearChat();
            
            // Hide bottom input
            const bottomInput = document.getElementById('bottom-input');
            if (bottomInput) bottomInput.style.display = 'none';
        }
        
        // Update UI
        this.updateSessionList();
    }
    
    getRandomGreeting() {
        // Select a random greeting from the array
        const randomIndex = Math.floor(Math.random() * this.greetings.length);
        return this.greetings[randomIndex];
    }
    
    clearChat() {
        // Get a random greeting for this session
        const greeting = this.getRandomGreeting();
        
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
                    ${greeting}
                </p>
                
                <!-- Centered Input Area -->
                <div class="input-container" id="centered-input">
                    <div class="input-wrapper">
                        <div class="input-box">
                            <textarea 
                                class="chat-input" 
                                id="chat-input" 
                                placeholder="Ask anything"
                                rows="1"
                                style="text-align: left !important; direction: ltr !important;"
                            ></textarea>
                            <button class="send-btn" id="send-btn">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" class="send-icon">
                                    <path class="send-arrow" d="M12 5L12 19M12 5L7 10M12 5L17 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
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
            
            // Also trigger on paste and cut events for dynamic resizing
            this.elements.chatInput.addEventListener('paste', () => {
                setTimeout(() => this.autoResizeTextarea(), 0);
            });
            this.elements.chatInput.addEventListener('cut', () => {
                setTimeout(() => this.autoResizeTextarea(), 0);
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
            setTimeout(() => {
                this.elements.chatInput.focus();
                // Reset height for new chat
                this.elements.chatInput.style.height = 'auto';
                this.autoResizeTextarea();
            }, 100);
        }
        
        // Re-add upload buttons after DOM changes
        if (window.docAttachmentManager) {
            setTimeout(() => {
                window.docAttachmentManager.addUploadButton();
            }, 150);
        }
    }
    
    autoResizeTextarea() {
        // Resize whichever textarea is active
        const activeInput = this.elements.welcomeScreen && this.elements.welcomeScreen.style.display !== 'none' ? 
            this.elements.chatInput : this.elements.chatInputBottom;
        if (activeInput) {
            // Reset height to auto to get the correct scrollHeight
            activeInput.style.height = 'auto';
            
            // Calculate new height based on content
            const newHeight = activeInput.scrollHeight;
            const minHeight = 40; // Minimum height in pixels
            const maxHeight = 200; // Maximum height in pixels
            
            // Apply the calculated height within min/max bounds
            const finalHeight = Math.min(Math.max(newHeight, minHeight), maxHeight);
            activeInput.style.height = finalHeight + 'px';
            
            // Add or remove scrollbar based on content
            if (newHeight > maxHeight) {
                activeInput.style.overflowY = 'auto';
            } else {
                activeInput.style.overflowY = 'hidden';
            }
            
            // Auto-detect and set text direction for input field
            const text = activeInput.value;
            if (text) {
                const direction = this.detectTextDirection(text);
                activeInput.dir = direction;
                activeInput.style.textAlign = direction === 'rtl' ? 'right' : 'left';
                activeInput.style.direction = direction;
            }
        }
    }
    
    toggleSendButton() {
        // Get active input and send button
        let input = this.elements.chatInput;
        let sendBtn = this.elements.sendBtn;
        
        if (!input || input.style.display === 'none' || input.offsetParent === null) {
            input = this.elements.chatInputBottom;
            sendBtn = this.elements.sendBtnBottom;
        }
        
        if (input && sendBtn) {
            const hasText = input.value.trim().length > 0;
            const hasAttachment = document.querySelector('.attachment-preview') !== null;
            
            if (hasText || hasAttachment) {
                sendBtn.classList.add('show');
            } else {
                sendBtn.classList.remove('show');
            }
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
            bottomInput.style.display = 'flex';
        }
        
        // Add class to adjust padding
        this.elements.chatMessages.classList.add('has-messages');
        
        // Focus on bottom input
        if (this.elements.chatInputBottom) {
            setTimeout(() => {
                this.elements.chatInputBottom.focus();
                // Ensure proper initial height
                this.elements.chatInputBottom.style.height = '40px';
                this.autoResizeTextarea();
            }, 100);
        }
    }
    
    async sendMessageProgrammatically(message) {
        // Method to send a message programmatically (used by document upload)
        if (!message || !message.trim() || this.isTyping) return;
        
        // Determine which input to use
        const isWelcomeVisible = document.getElementById('welcome-screen') !== null;
        
        // Set the message in the appropriate input
        if (isWelcomeVisible && this.elements.chatInput) {
            this.elements.chatInput.value = message;
        } else if (this.elements.chatInputBottom) {
            this.elements.chatInputBottom.value = message;
        } else {
            console.error('No input element available');
            return;
        }
        
        // Call the main sendMessage method which handles everything
        await this.sendMessage();
    }
    
    async sendMessage() {
        console.log('sendMessage called');
        
        // Only abort if there's an active stream for the CURRENT session
        if (this.activeStreamSession === this.currentSession) {
            this.abortCurrentStream();
        }
        
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
            // Reset height after clearing
            this.elements.chatInputBottom.style.height = 'auto';
        }
        this.autoResizeTextarea();
        
        // Don't show typing indicator yet - will show after user message
        
        try {
            // Create a new abort controller for this stream
            this.currentStreamController = new AbortController();
            const targetSession = this.currentSession; // Capture the session ID at the start
            this.activeStreamSession = targetSession;
            
            // Use streaming endpoint
            console.log('Sending to backend (streaming):', { message, privacy_mode: this.privacyMode, session_id: this.currentSession });
            
            const response = await fetch('/api/privacy-chat/stream', {
                signal: this.currentStreamController.signal,
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
                                
                                // Add user message with attachment if present
                                let userMessageToShow = this.privacyMode ? data.masked_message : data.original_message;
                                const attachment = this.pendingAttachment || null;
                                
                                // If there's an attachment, strip the document content from the display
                                if (attachment && attachment.filename) {
                                    console.log('Stripping document content, initial message length:', userMessageToShow.length);
                                    console.log('First 200 chars:', userMessageToShow.substring(0, 200));
                                    
                                    // Use regex to find any document header pattern
                                    const docHeaderPattern = new RegExp(`\\[Doc[^\\]]*${attachment.filename}\\]`, 'i');
                                    const match = userMessageToShow.match(docHeaderPattern);
                                    
                                    if (match) {
                                        console.log('Found document header:', match[0]);
                                        const docIndex = userMessageToShow.indexOf(match[0]);
                                        
                                        // Extract only the caption before the document header
                                        const caption = userMessageToShow.substring(0, docIndex).trim();
                                        console.log('Extracted caption:', caption);
                                        
                                        userMessageToShow = caption;
                                        
                                        // Store the caption in the attachment
                                        if (attachment) {
                                            attachment.userMessage = caption;
                                        }
                                    }
                                    
                                    // If message is empty after stripping, clear the text data
                                    if (!userMessageToShow || userMessageToShow.trim() === '') {
                                        console.log('No caption, clearing text data');
                                        userMessageData.original = '';
                                        userMessageData.masked = '';
                                        userMessageToShow = '';
                                    } else {
                                        // Also update the messageData to only contain the caption
                                        console.log('Updating messageData to only contain caption');
                                        // Find the document header in the original message too
                                        const originalMatch = userMessageData.original.match(/\[Document:[^\]]*\]/);
                                        if (originalMatch) {
                                            const origIndex = userMessageData.original.indexOf(originalMatch[0]);
                                            userMessageData.original = userMessageData.original.substring(0, origIndex).trim();
                                        }
                                        
                                        // Do the same for masked message
                                        const maskedMatch = userMessageData.masked.match(docHeaderPattern);
                                        if (maskedMatch) {
                                            const maskIndex = userMessageData.masked.indexOf(maskedMatch[0]);
                                            userMessageData.masked = userMessageData.masked.substring(0, maskIndex).trim();
                                        }
                                    }
                                    
                                    console.log('Final message to display:', userMessageToShow);
                                    console.log('Final message length:', userMessageToShow.length);
                                }
                                
                                console.log('About to add user message with attachment:', attachment ? attachment.filename : 'none');
                                this.addMessage('user', userMessageToShow, userMessageData.userEntities, userMessageData, attachment);
                                
                                // Now show typing indicator AFTER user message
                                this.showTypingIndicator();
                                
                                // Clear the attachment display from the message box when AI starts responding
                                if (window.docAttachmentManager) {
                                    window.docAttachmentManager.removeAttachment();
                                }
                                
                                // Don't create assistant message yet - wait for first chunk
                                
                            } else if (data.type === 'chunk') {
                                // On first chunk, hide typing indicator and create message box
                                if (!assistantMessageWrapper) {
                                    // Double-check we're still in the right session
                                    if (targetSession !== this.currentSession) {
                                        console.log('Session changed before creating message, aborting');
                                        reader.cancel();
                                        break;
                                    }
                                    this.hideTypingIndicator();
                                    assistantMessageWrapper = this.createStreamingMessage();
                                    assistantMessageContent = assistantMessageWrapper.querySelector('.message-text');
                                }
                                
                                // Append chunk to response
                                maskedResponse += data.masked_chunk;
                                unmaskedResponse += data.unmasked_chunk;
                                
                                // Store current entities if provided with chunk
                                if (data.current_entities) {
                                    responseEntities = data.current_entities;
                                }
                                
                                // Update displayed content based on privacy mode
                                const displayText = this.privacyMode ? maskedResponse : unmaskedResponse;
                                if (assistantMessageContent) {
                                    // Detect and set text direction
                                    const textDirection = this.detectTextDirection(displayText);
                                    assistantMessageContent.classList.remove('ltr', 'rtl');
                                    assistantMessageContent.classList.add(textDirection);
                                    
                                    // Apply highlighting during streaming for both modes
                                    if (this.privacyMode) {
                                        // Highlight placeholders in masked mode
                                        assistantMessageContent.innerHTML = this.highlightPlaceholders(displayText);
                                    } else {
                                        // Apply real-time highlighting for unmasked mode during streaming
                                        assistantMessageContent.innerHTML = this.highlightStreamingEntities(displayText);
                                    }
                                }
                            
                                
                            } else if (data.type === 'full_response') {
                                // Handle full response with proper unmask
                                maskedResponse = data.masked_response;
                                unmaskedResponse = data.unmasked_response;
                                
                                // Continue showing highlighted version during transition
                                const displayText = this.privacyMode ? maskedResponse : unmaskedResponse;
                                if (assistantMessageContent) {
                                    if (this.privacyMode) {
                                        assistantMessageContent.innerHTML = this.highlightPlaceholders(displayText);
                                    } else {
                                        // Keep streaming highlights active
                                        assistantMessageContent.innerHTML = this.highlightStreamingEntities(displayText);
                                    }
                                }
                                
                            } else if (data.type === 'complete') {
                                // Store response entities for later use
                                responseEntities = data.response_entities || [];
                                console.log('Complete message received with entities:', responseEntities);
                                console.log('Number of entities:', responseEntities.length);
                                console.log('Entities have unmasked positions?', responseEntities.length > 0 && responseEntities[0].unmasked_start !== undefined);
                                
                                // Add data attributes to assistant message for privacy toggle
                                if (assistantMessageWrapper) {
                                    // Store the plain text versions without HTML
                                    // Use a safer approach to store entities - encode them first
                                    const entitiesString = JSON.stringify(responseEntities);
                                    
                                    assistantMessageWrapper.setAttribute('data-original', unmaskedResponse);
                                    assistantMessageWrapper.setAttribute('data-masked', maskedResponse);
                                    assistantMessageWrapper.setAttribute('data-entities', entitiesString);
                                    assistantMessageWrapper.setAttribute('data-role', 'assistant');
                                    
                                    // Verify what was stored
                                    const storedEntities = assistantMessageWrapper.getAttribute('data-entities');
                                    console.log('Entities string stored:', entitiesString);
                                    console.log('Entities string retrieved:', storedEntities);
                                    console.log('Are they equal?', entitiesString === storedEntities);
                                    
                                    console.log('Stored entities in DOM:', JSON.stringify(responseEntities));
                                    console.log('Stored original text:', unmaskedResponse);
                                    console.log('Stored masked text:', maskedResponse);
                                    
                                    // Final highlighting
                                    const finalDisplay = this.privacyMode ? maskedResponse : unmaskedResponse;
                                    if (this.privacyMode) {
                                        console.log('Initial display: masked with placeholders');
                                        assistantMessageContent.innerHTML = this.highlightPlaceholders(finalDisplay);
                                    } else {
                                        console.log('Initial display: unmasked with entity highlighting');
                                        const highlightedContent = this.highlightEntities(finalDisplay, responseEntities);
                                        console.log('Highlighted content sample:', highlightedContent ? highlightedContent.substring(0, 200) : 'empty');
                                        assistantMessageContent.innerHTML = highlightedContent;
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
            
            // Clear the stream controller once done
            this.currentStreamController = null;
            this.activeStreamSession = null;
            
            // Clear the pending attachment now that streaming is complete
            if (this.pendingAttachment) {
                console.log('Clearing pending attachment after streaming complete');
                delete this.pendingAttachment;
            }
            
        } catch (error) {
            // Check if it was an abort error
            if (error.name === 'AbortError') {
                console.log('Stream was aborted');
                this.hideTypingIndicator();
                // Clean up any partial message that was created
                const streamingMessages = document.querySelectorAll('[data-streaming="true"]');
                streamingMessages.forEach(msg => msg.remove());
                return;
            }
            
            console.error('Error:', error);
            this.hideTypingIndicator();
            this.addMessage('assistant', 'Sorry, I encountered an error. Please try again.');
            // Also clear pending attachment on error
            if (this.pendingAttachment) {
                delete this.pendingAttachment;
            }
        }
    }
    
    abortCurrentStream() {
        if (this.currentStreamController) {
            console.log('Aborting current stream');
            this.currentStreamController.abort();
            this.currentStreamController = null;
            this.activeStreamSession = null;
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
    
    createStreamingMessage() {
        // Create a placeholder message for streaming content
        const messageHtml = `
            <div class="message-wrapper" data-streaming="true">
                <div class="message assistant">
                    <div class="message-avatar">AI</div>
                    <div class="message-content">
                        <div class="message-text"></div>
                    </div>
                </div>
            </div>
        `;
        
        this.elements.chatMessages.insertAdjacentHTML('beforeend', messageHtml);
        this.scrollToBottom();
        
        // Return the created element
        const messages = this.elements.chatMessages.querySelectorAll('.message-wrapper');
        return messages[messages.length - 1];
    }
    
    addMessage(role, content, entities = null, messageData = null, attachment = null) {
        // Show chat sessions container when first message is added
        if (role === 'user') {
            this.showChatSessionsContainer();
        }
        
        // Process content for PII highlighting if entities provided
        let displayContent = content;
        
        // Skip entity highlighting if there's an attachment and no content
        if (attachment && !content) {
            displayContent = '';
        } else if (entities && entities.length > 0) {
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
        
        // Build attachment HTML if provided
        let attachmentHtml = '';
        if (attachment && attachment.filename) {
            console.log('Building attachment HTML for:', attachment.filename);
            console.log('DocAttachmentManager exists:', !!window.docAttachmentManager);
            console.log('CreateDocumentCard exists:', !!(window.docAttachmentManager && window.docAttachmentManager.createDocumentCard));
            
            // Create attachment HTML directly if manager not available
            if (window.docAttachmentManager && window.docAttachmentManager.createDocumentCard) {
                console.log('Using docAttachmentManager.createDocumentCard');
                const card = window.docAttachmentManager.createDocumentCard(attachment, false);
                const tempDiv = document.createElement('div');
                tempDiv.appendChild(card);
                attachmentHtml = `<div class="message-attachments">${tempDiv.innerHTML}</div>`;
                console.log('Created attachment HTML via manager:', attachmentHtml.substring(0, 100));
            } else {
                console.log('Using fallback attachment HTML');
                // Fallback: create simple attachment card
                attachmentHtml = `
                    <div class="message-attachments">
                        <div class="document-attachment-card" 
                             data-document-text="${(attachment.text || '').replace(/"/g, '&quot;')}"
                             data-document-name="${attachment.filename}"
                             style="cursor: pointer;"
                             title="Click to view document">
                            <div class="doc-icon-wrapper">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                    <polyline points="14,2 14,8 20,8"/>
                                </svg>
                            </div>
                            <div class="doc-info">
                                <div class="doc-filename">${attachment.filename}</div>
                                <div class="doc-metadata">
                                    <span class="doc-size">${attachment.wordCount || 0} words</span>
                                    <span class="doc-entities">• ${attachment.entityCount || 0} entities</span>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
                console.log('Created fallback attachment HTML');
            }
            console.log('Final attachmentHtml length:', attachmentHtml.length);
        } else {
            console.log('No attachment to display');
        }
        
        // Only include message-text div if there's actual content to display
        const textHtml = displayContent ? `<div class="message-text ${dirClass}">${displayContent}</div>` : '';
        
        // When there's both attachment and text, structure them properly
        let contentHtml = '';
        if (attachmentHtml && textHtml) {
            // Both attachment and text - ensure proper layout
            contentHtml = attachmentHtml + '\n' + textHtml;
        } else if (attachmentHtml) {
            // Only attachment
            contentHtml = attachmentHtml;
        } else if (textHtml) {
            // Only text
            contentHtml = textHtml;
        }
        
        const messageHtml = `
            <div class="message-wrapper" ${dataAttributes}>
                <div class="message ${role}">
                    <div class="message-avatar">
                        ${role === 'user' ? 'U' : 'AI'}
                    </div>
                    <div class="message-content">
                        ${contentHtml}
                    </div>
                </div>
            </div>
        `;
        
        console.log('Inserting message HTML with attachment:', !!attachmentHtml);
        if (attachmentHtml) {
            console.log('Message HTML preview:', messageHtml.substring(0, 500));
        }
        
        this.elements.chatMessages.insertAdjacentHTML('beforeend', messageHtml);
        this.scrollToBottom();
        
        // Return the added message element for further manipulation if needed
        const messages = this.elements.chatMessages.querySelectorAll('.message-wrapper');
        return messages[messages.length - 1];
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
        // Convert newlines to <br> tags for basic line break preservation
        let formattedText = text.replace(/\n/g, '<br>');
        
        // Highlight ONLY actual placeholders (with numbers), not regular words
        // Must have a number after the entity type to be a placeholder
        const placeholderRegex = /\b(Person|Location|Organization|Email|Phone|URL|CivilID|Passport|CreditCard|BankAccount)\d+\b/gi;
        
        // Use a map to track replacements to avoid double replacement
        let highlightedText = formattedText;
        const matches = [];
        let match;
        
        // First, collect all matches from the original text
        while ((match = placeholderRegex.exec(text)) !== null) {
            matches.push({
                text: match[0],
                index: match.index,
                type: match[1].toLowerCase()
            });
        }
        
        // Sort matches by index in reverse order to replace from end to start
        matches.sort((a, b) => b.index - a.index);
        
        // Replace each match in the formatted text
        matches.forEach(m => {
            const cssClass = this.getEntityCssClass(m.type);
            // Wrap in <bdi> to isolate bidirectional text flow
            const replacement = `<bdi><span class="pii-entity ${cssClass}">${m.text}</span></bdi>`;
            // Use global replace to catch all instances in the formatted text
            const regex = new RegExp(`\\b${m.text}\\b`, 'g');
            highlightedText = highlightedText.replace(regex, replacement);
        });
        
        return highlightedText;
    }
    
    highlightStreamingEntities(text) {
        // Provide real-time highlighting during streaming for common PII patterns
        console.log('highlightStreamingEntities called with:', text);
        
        // Convert newlines to <br> tags for basic line break preservation
        let highlightedText = text.replace(/\n/g, '<br>');
        
        // Avoid processing if text already contains HTML spans to prevent double-highlighting
        if (highlightedText.includes('<span class="pii-entity')) {
            console.log('Text already contains highlights, skipping');
            return highlightedText;
        }
        
        // Email pattern - most reliable
        highlightedText = highlightedText.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, (match) => {
            console.log('Highlighting email:', match);
            return `<span class="pii-entity pii-email">${match}</span>`;
        });
        
        // URL pattern
        highlightedText = highlightedText.replace(/https?:\/\/[^\s]+/g, (match) => {
            console.log('Highlighting URL:', match);
            return `<span class="pii-entity pii-url">${match}</span>`;
        });
        
        // Phone patterns - be more specific
        highlightedText = highlightedText.replace(/\b(?:\+?1[-.]?)?\(?[2-9]\d{2}\)?[-.]?\d{3}[-.]?\d{4}\b/g, (match) => {
            console.log('Highlighting US phone:', match);
            return `<span class="pii-entity pii-phone">${match}</span>`;
        });
        
        // International phone (more restrictive)
        highlightedText = highlightedText.replace(/\+\d{1,3}[-\s]?\d{3,4}[-\s]?\d{3,4}[-\s]?\d{3,4}/g, (match) => {
            console.log('Highlighting intl phone:', match);
            return `<span class="pii-entity pii-phone">${match}</span>`;
        });
        
        // Credit card pattern - be very specific
        highlightedText = highlightedText.replace(/\b(?:4\d{3}|5[1-5]\d{2}|3[47]\d{2}|6011)[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g, (match) => {
            console.log('Highlighting credit card:', match);
            return `<span class="pii-entity pii-creditcard">${match}</span>`;
        });
        
        // Names - VERY restrictive approach: only highlight when we're confident it's a name
        // Look for patterns that are clearly First Name + Last Name with specific contexts
        const namePatterns = [
            // After contact/call/email context words
            /\b(?:contact|call|email|reach|meet)\s+([A-Z][a-z]{2,}\s+[A-Z][a-z]{2,})\b/gi,
            // After "I am" or "My name is"
            /\b(?:I am|my name is|this is)\s+([A-Z][a-z]{2,}\s+[A-Z][a-z]{2,})\b/gi,
            // After "Dear" in formal contexts
            /\bDear\s+([A-Z][a-z]{2,}\s+[A-Z][a-z]{2,})\b/gi,
            // Standalone names that are clearly in name context (very restrictive)
            /\b([A-Z][a-z]{2,}\s+[A-Z][a-z]{2,})\s+(?:said|wrote|called|emailed|works|lives)\b/gi
        ];
        
        namePatterns.forEach(pattern => {
            highlightedText = highlightedText.replace(pattern, (fullMatch, nameMatch) => {
                console.log('Highlighting contextual name:', nameMatch);
                return fullMatch.replace(nameMatch, `<span class="pii-entity pii-person">${nameMatch}</span>`);
            });
        });
        
        // For standalone "FirstName LastName" patterns, be extremely careful
        // Only if it's clearly isolated and follows name conventions
        highlightedText = highlightedText.replace(/\b([A-Z][a-z]{2,}\s+[A-Z][a-z]{2,})(?=\s*[.!,]|\s*$|\s+(?:at|from|in|on|with)\b)/g, (match) => {
            // Exclude common false positives
            const excludeList = [
                'New York', 'Los Angeles', 'San Francisco', 'Las Vegas', 'Salt Lake',
                'Dear Sir', 'Thank You', 'Best Regards', 'Good Morning', 'Good Evening',
                'Hello There', 'Nice Meeting', 'Great Job', 'Contact Us', 'Call Us',
                'Email Us', 'Visit Us', 'Join Us', 'Follow Us', 'See You'
            ];
            
            if (!excludeList.includes(match)) {
                // Additional check: both words should be likely names (not common verbs/nouns)
                const words = match.split(' ');
                const commonNonNames = ['Contact', 'Email', 'Call', 'Visit', 'Hello', 'Thank', 'Best', 'Good', 'Nice', 'Great', 'Please', 'Can', 'Will', 'Should', 'Must', 'Have', 'Need'];
                
                if (!commonNonNames.includes(words[0])) {
                    console.log('Highlighting standalone name:', match);
                    return `<span class="pii-entity pii-person">${match}</span>`;
                }
            }
            return match;
        });
        
        // Arabic names - specific known names only
        const arabicNames = ['محمد', 'أحمد', 'علي', 'حسن', 'حسين', 'فاطمة', 'عائشة', 'زينب', 'خالد', 'سعيد', 'عمر', 'يوسف', 'إبراهيم', 'مريم', 'نور', 'سارة'];
        arabicNames.forEach(name => {
            const regex = new RegExp(`\\b${name}\\b`, 'g');
            highlightedText = highlightedText.replace(regex, (match) => {
                console.log('Highlighting Arabic name:', match);
                return `<span class="pii-entity pii-person">${match}</span>`;
            });
        });
        
        // Arabic locations
        const arabicLocations = ['عمان', 'مسقط', 'صلالة', 'نزوى', 'صحار', 'السلطنة', 'الإمارات', 'السعودية', 'الكويت', 'البحرين', 'قطر'];
        arabicLocations.forEach(location => {
            const regex = new RegExp(`\\b${location}\\b`, 'g');
            highlightedText = highlightedText.replace(regex, (match) => {
                console.log('Highlighting Arabic location:', match);
                return `<span class="pii-entity pii-location">${match}</span>`;
            });
        });
        
        // Arabic organizations
        highlightedText = highlightedText.replace(/جمعية\s+[\u0600-\u06FF\s]+/g, (match) => {
            console.log('Highlighting Arabic organization:', match);
            return `<span class="pii-entity pii-organization">${match.trim()}</span>`;
        });
        
        if (highlightedText !== text) {
            console.log('Highlighting applied. Result:', highlightedText);
        }
        
        return highlightedText;
    }
    
    escapeRegExp(str) {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
    
    highlightMaskedEntities(text, entities) {
        let highlightedText = text;
        
        console.log('Highlighting masked entities in text:', text);
        console.log('Available entities:', entities);
        
        // Create a more comprehensive regex that matches all possible placeholder patterns
        // MUST have a number after the entity type to be a valid placeholder
        const placeholderRegex = /(person|location|organization|email|phone|url|civilid|passport|creditcard|bankaccount)\d+/gi;
        
        highlightedText = highlightedText.replace(placeholderRegex, (match) => {
            const baseType = match.replace(/\d+$/, '').toLowerCase().replace(/\s+/g, '');
            const cssClass = this.getEntityCssClass(baseType);
            console.log(`Found placeholder: '${match}', baseType: '${baseType}', cssClass: '${cssClass}'`);
            return `<span class="pii-entity ${cssClass}">${match}</span>`;
        });
        
        return highlightedText;
    }
    
    highlightOriginalEntities(text, entities) {
        if (!entities || entities.length === 0) {
            return text;
        }
        
        console.log('Highlighting original entities in text:', text);
        console.log('Available entities:', entities);
        
        // Create array to track which characters should be highlighted
        const highlights = new Array(text.length).fill(null);
        
        // Mark positions for each entity
        for (const entity of entities) {
            const cssClass = this.getEntityCssClass(entity.entity_type.toLowerCase());
            const start = entity.start;
            const end = entity.end;
            
            console.log(`Marking entity: '${entity.text}' (${entity.entity_type}) at ${start}-${end} with class '${cssClass}'`);
            
            // Mark all positions in this range with the entity info
            for (let i = start; i < end && i < text.length; i++) {
                highlights[i] = { cssClass, entityStart: start, entityEnd: end, entityText: entity.text };
            }
        }
        
        // Build the highlighted text - improved to handle entity boundaries
        let result = '';
        let i = 0;
        let highlightCount = 0;
        
        console.log('Building highlighted text from highlights array');
        console.log('Text length:', text.length);
        console.log('Highlights array length:', highlights.length);
        
        while (i < text.length) {
            if (highlights[i]) {
                // Start of an entity
                const entityInfo = highlights[i];
                const entityStart = entityInfo.entityStart;
                const entityEnd = entityInfo.entityEnd;
                
                // Extract the exact entity text
                const entityText = text.substring(entityStart, entityEnd);
                
                // Detect direction of the entity text itself
                const entityDirection = this.detectTextDirection(entityText);
                const dirClass = entityDirection === 'rtl' ? 'rtl-entity' : 'ltr-entity';
                
                // Add the highlighted entity with direction class
                result += `<span class="pii-entity ${entityInfo.cssClass} ${dirClass}">${entityText}</span>`;
                highlightCount++;
                console.log(`Added highlight #${highlightCount}: '${entityText}' with class '${entityInfo.cssClass}'`);
                
                // Skip to the end of this entity
                i = entityEnd;
                
                // Important: Check if the next position starts a new entity
                // This prevents merging adjacent entities
                if (i < text.length && highlights[i] && 
                    highlights[i].entityStart === i) {
                    // Next entity starts immediately, continue to handle it
                    continue;
                }
            } else {
                // Regular character
                result += text[i];
                i++;
            }
        }
        
        console.log('Final highlighted text with', highlightCount, 'highlights');
        console.log('Result sample:', result.substring(0, 200));
        return result;
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
            
            // Date entities
            'date': 'pii-date',
            
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
        // For unmasked AI responses - highlight actual entity values
        console.log('=== highlightEntities called ===');
        console.log('Text to highlight:', text);
        console.log('Number of entities:', entities ? entities.length : 0);
        console.log('Entities:', JSON.stringify(entities, null, 2));
        
        // Convert newlines to <br> tags for basic line break preservation
        let formattedText = text.replace(/\n/g, '<br>');
        
        if (!entities || entities.length === 0) {
            console.log('No entities to highlight, returning formatted text');
            return formattedText;
        }
        
        // Sort entities by length (longest first) to prevent substring issues
        const sortedEntities = [...entities].sort((a, b) => {
            const aLen = (a.text || '').length;
            const bLen = (b.text || '').length;
            return bLen - aLen;
        });
        
        // Create a map to track replacements
        const replacementMap = new Map();
        let workingText = formattedText;
        
        console.log('Starting entity processing...');
        console.log('Working text sample:', workingText.substring(0, 200));
        
        // Process each entity
        sortedEntities.forEach((entity, index) => {
            console.log(`Processing entity ${index}:`, entity);
            
            if (entity.text && entity.text !== entity.placeholder) {
                const entityType = (entity.entity_type || entity.type || '').toLowerCase();
                const cssClass = this.getEntityCssClass(entityType);
                const tempMarker = `__ENTITY_${index}_${Date.now()}__`;
                
                console.log(`Entity text: "${entity.text}", Type: ${entityType}, CSS: ${cssClass}`);
                
                // For Arabic text, we need a simpler approach
                // Just do a global replace without complex boundaries
                const escapedText = this.escapeRegExp(entity.text);
                
                // Try simple global replacement first
                let regex = new RegExp(escapedText, 'gu');
                let matches = workingText.match(regex);
                
                if (!matches) {
                    // If no matches, log what we're searching for
                    console.log(`No matches with simple pattern for: "${entity.text}"`);
                    console.log('Text contains this string?', workingText.includes(entity.text));
                    
                    // Try with word boundaries for non-Arabic text
                    if (!/[\u0600-\u06FF\u0750-\u077F]/.test(entity.text)) {
                        const pattern = `\\b${escapedText}\\b`;
                        regex = new RegExp(pattern, 'gu');
                        matches = workingText.match(regex);
                        console.log(`Trying with word boundaries: ${pattern}`);
                    }
                }
                
                // Store the replacement
                replacementMap.set(tempMarker, `<span class="pii-entity ${cssClass}">${entity.text}</span>`);
                
                // Replace with temporary marker
                if (matches) {
                    workingText = workingText.replace(regex, tempMarker);
                    console.log(`✓ Replaced ${matches.length} occurrence(s) of '${entity.text}' with marker ${tempMarker}`);
                } else {
                    console.log(`✗ No matches found for '${entity.text}'`);
                    // Log the first 100 chars around where we expect to find it
                    const searchIndex = workingText.indexOf(entity.text.substring(0, 5));
                    if (searchIndex >= 0) {
                        console.log('Context around expected location:', workingText.substring(Math.max(0, searchIndex - 20), searchIndex + 50));
                    }
                }
            } else {
                console.log(`Skipping entity: text="${entity.text}", placeholder="${entity.placeholder}"`);
            }
        });
        
        console.log('All replacements prepared, applying highlights...');
        
        // Replace all temporary markers with actual highlighted spans
        replacementMap.forEach((highlightedSpan, marker) => {
            const beforeLength = workingText.length;
            workingText = workingText.replace(new RegExp(marker, 'g'), highlightedSpan);
            const afterLength = workingText.length;
            if (beforeLength !== afterLength) {
                console.log(`Applied highlight for marker ${marker}`);
            }
        });
        
        console.log('Highlighting complete');
        console.log('Final text sample:', workingText.substring(0, 200));
        return workingText;
    }
    
    // Simplified highlightEntities backup (removed complex position-based logic)
    highlightEntitiesOld(text, entities) {
        // Old implementation kept for reference but not used
        const isRTL = this.detectTextDirection(text) === 'rtl';
        
        // Create array to track which characters should be highlighted
        const highlights = new Array(text.length).fill(null);
        
        // Sort entities by start position to process them in order
        const sortedEntities = [...entities].sort((a, b) => {
            const aStart = a.unmasked_start !== undefined ? a.unmasked_start : a.start;
            const bStart = b.unmasked_start !== undefined ? b.unmasked_start : b.start;
            return aStart - bStart;
        });
        
        console.log('Sorted entities by position:', sortedEntities);
        
        // Process each entity
        sortedEntities.forEach((entity, idx) => {
            console.log(`\n--- Processing entity ${idx + 1}/${sortedEntities.length} ---`);
            console.log('Entity:', entity);
            
            if (entity.text && entity.text !== entity.placeholder) {
                const entityType = (entity.entity_type || entity.type || '').toLowerCase();
                const cssClass = this.getEntityCssClass(entityType);
                
                // Use unmasked positions for highlighting
                const startPos = entity.unmasked_start !== undefined ? entity.unmasked_start : entity.start;
                const endPos = entity.unmasked_end !== undefined ? entity.unmasked_end : entity.end;
                
                console.log(`Using positions: start=${startPos}, end=${endPos}`);
                console.log(`Text length: ${text.length}`);
                
                // Check if positions are within bounds
                if (startPos < 0 || endPos > text.length || startPos >= endPos) {
                    console.warn(`Invalid positions for entity '${entity.text}': start=${startPos}, end=${endPos}, text.length=${text.length}`);
                    // Fall through to search logic below
                } else {
                    // Verify the text matches at this position
                    const actualText = text.substring(startPos, endPos);
                    
                    // Clean up entity text for comparison (remove markdown artifacts and extra spaces)
                    const cleanEntityText = entity.text
                        .replace(/\*+/g, '')  // Remove all asterisks
                        .replace(/\s+/g, ' ')  // Normalize spaces
                        .trim();
                    const cleanActualText = actualText
                        .replace(/\*+/g, '')  // Remove all asterisks
                        .replace(/\s+/g, ' ')  // Normalize spaces
                        .trim();
                    
                    console.log(`Checking entity at ${startPos}-${endPos}: expected '${entity.text}', found '${actualText}'`);
                    
                    // Accept match if either exact match or clean match
                    if (actualText === entity.text || cleanActualText === cleanEntityText) {
                        // Mark all positions in this range with the entity info
                        // Use priority to handle overlapping entities - later entities take precedence
                        for (let i = startPos; i < endPos && i < text.length; i++) {
                            highlights[i] = { 
                                cssClass, 
                                entityStart: startPos, 
                                entityEnd: endPos, 
                                entityText: entity.text,
                                priority: Date.now() // Add timestamp for priority
                            };
                        }
                        console.log(`✓ Marked '${entity.text}' at position ${startPos}-${endPos}`);
                        return; // Continue to next entity
                    }
                }
                
                // If we get here, position was wrong or out of bounds - try to find the entity in the text
                console.warn(`Position mismatch or invalid for '${entity.text}', searching in text`);
                
                // Try multiple search strategies for entities with markdown
                const baseText = entity.text
                    .replace(/\s*\*\s*\*/g, '')  // Remove " * *" pattern
                    .replace(/\*+/g, '')          // Remove all remaining asterisks
                    .replace(/\s+/g, ' ')         // Normalize spaces
                    .trim();
                
                console.log(`Base text after cleanup: '${baseText}'`);
                
                const searchTerms = [
                    baseText,                             // Clean base text
                    baseText + '**',                      // With markdown bold
                    '**' + baseText + '**',              // Wrapped in bold
                    entity.text,                          // Original text as fallback
                    entity.text.replace(/\s*\*\s*\*/g, '**')  // Convert " * *" to "**"
                ];
                
                let searchStart = 0;
                let foundCount = 0;
                let foundMatch = false;
                
                // Try each search term
                for (const searchTerm of searchTerms) {
                    searchStart = 0;
                    while (searchStart < text.length) {
                        const pos = text.indexOf(searchTerm, searchStart);
                        if (pos === -1) break;
                        
                        // Check word boundaries to avoid partial matches
                        // This is especially important for Arabic text
                        const beforeChar = pos > 0 ? text[pos - 1] : ' ';
                        const afterChar = pos + searchTerm.length < text.length ? 
                            text[pos + searchTerm.length] : ' ';
                        
                        // Check if this is a word boundary (space, punctuation, or different script)
                        const isWordBoundary = (char) => {
                            return /[\s\.,!?;:\-\"'()\[\]{}\/\\]/.test(char) || 
                                   char === '\u200F' || // RTL mark
                                   char === '\u200E' || // LTR mark
                                   char === '\u061F' || // Arabic question mark
                                   char === '\u060C' || // Arabic comma
                                   char === '\u061B';   // Arabic semicolon
                        };
                        
                        // Only proceed if we have proper word boundaries
                        // or if the characters before/after are from a different script
                        const hasProperBoundaries = isWordBoundary(beforeChar) || isWordBoundary(afterChar) ||
                            (this.detectTextDirection(beforeChar) !== this.detectTextDirection(searchTerm[0])) ||
                            (this.detectTextDirection(afterChar) !== this.detectTextDirection(searchTerm[searchTerm.length - 1]));
                        
                        if (!hasProperBoundaries) {
                            searchStart = pos + 1;
                            continue;
                        }
                        
                        // Check if this position overlaps with an already marked entity
                        let hasOverlap = false;
                        const entityLength = searchTerm.length;
                        
                        // More strict overlap checking - don't merge adjacent entities
                        for (let i = pos; i < pos + entityLength && i < text.length; i++) {
                            if (highlights[i] && highlights[i].entityText) {
                                // Check if this is truly the same entity or a different one
                                const existingEntity = highlights[i];
                                // If the new entity would extend beyond the existing one's boundaries,
                                // or if they have different start positions, they're different entities
                                if (existingEntity.entityStart !== pos || 
                                    existingEntity.entityEnd !== pos + entityLength) {
                                    hasOverlap = true;
                                    break;
                                }
                            }
                        }
                        
                        if (!hasOverlap) {
                            // Mark this occurrence
                            for (let i = pos; i < pos + entityLength && i < text.length; i++) {
                                highlights[i] = { 
                                    cssClass, 
                                    entityStart: pos, 
                                    entityEnd: pos + entityLength, 
                                    entityText: searchTerm,
                                    priority: Date.now()
                                };
                            }
                            foundCount++;
                            foundMatch = true;
                            console.log(`✓ Found and marked occurrence ${foundCount} of '${searchTerm}' at position ${pos}`);
                            break; // Only mark first occurrence for this term
                        }
                        searchStart = pos + searchTerm.length; // Skip past this occurrence instead of just +1
                    }
                    if (foundMatch) break; // Stop if we found a match
                }
            }
        });
        
        // Build the highlighted text - improved to handle entity boundaries
        let result = '';
        let i = 0;
        let highlightCount = 0;
        
        console.log('Building highlighted text from highlights array');
        console.log('Text length:', text.length);
        console.log('Highlights array length:', highlights.length);
        
        while (i < text.length) {
            if (highlights[i]) {
                // Start of an entity
                const entityInfo = highlights[i];
                const entityStart = entityInfo.entityStart;
                const entityEnd = entityInfo.entityEnd;
                
                // Extract the exact entity text
                const entityText = text.substring(entityStart, entityEnd);
                
                // Detect direction of the entity text itself
                const entityDirection = this.detectTextDirection(entityText);
                const dirClass = entityDirection === 'rtl' ? 'rtl-entity' : 'ltr-entity';
                
                // Add the highlighted entity with direction class
                result += `<span class="pii-entity ${entityInfo.cssClass} ${dirClass}">${entityText}</span>`;
                highlightCount++;
                console.log(`Added highlight #${highlightCount}: '${entityText}' with class '${entityInfo.cssClass}'`);
                
                // Skip to the end of this entity
                i = entityEnd;
                
                // Important: Check if the next position starts a new entity
                // This prevents merging adjacent entities
                if (i < text.length && highlights[i] && 
                    highlights[i].entityStart === i) {
                    // Next entity starts immediately, continue to handle it
                    continue;
                }
            } else {
                // Regular character
                result += text[i];
                i++;
            }
        }
        
        console.log('Final highlighted text with', highlightCount, 'highlights');
        console.log('Result sample:', result.substring(0, 200));
        return result;
    }
    
    showTypingIndicator() {
        this.isTyping = true;
        
        // Create typing indicator in the same position as assistant messages
        const typingHtml = `
            <div class="message-wrapper" id="typing-indicator">
                <div class="message assistant">
                    <div class="message-content">
                        <div class="typing-indicator-standalone">
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
            const lockIcon = toggle.querySelector('.lock-icon');
            const unlockIcon = toggle.querySelector('.unlock-icon');
            if (this.privacyMode) {
                toggle.classList.add('active');
                if (lockIcon) lockIcon.style.display = 'block';
                if (unlockIcon) unlockIcon.style.display = 'none';
            } else {
                toggle.classList.remove('active');
                if (lockIcon) lockIcon.style.display = 'none';
                if (unlockIcon) unlockIcon.style.display = 'block';
            }
        }
    }
    
    initializeTextareas() {
        // Initialize textareas with proper height and alignment
        if (this.elements.chatInput) {
            this.elements.chatInput.style.height = '40px';
            this.elements.chatInput.style.overflowY = 'hidden';
            // Set default alignment to left for English
            this.elements.chatInput.style.textAlign = 'left';
            this.elements.chatInput.style.direction = 'ltr';
            this.elements.chatInput.dir = 'ltr';
        }
        if (this.elements.chatInputBottom) {
            this.elements.chatInputBottom.style.height = '40px';
            this.elements.chatInputBottom.style.overflowY = 'hidden';
            // Set default alignment to left for English
            this.elements.chatInputBottom.style.textAlign = 'left';
            this.elements.chatInputBottom.style.direction = 'ltr';
            this.elements.chatInputBottom.dir = 'ltr';
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
        
        const lockIcon = toggle.querySelector('.lock-icon');
        const unlockIcon = toggle.querySelector('.unlock-icon');
        
        if (this.privacyMode) {
            toggle.classList.add('active');
            if (lockIcon) {
                lockIcon.style.display = 'block';
                console.log('Set toggle to locked (privacy ON)');
            }
            if (unlockIcon) {
                unlockIcon.style.display = 'none';
            }
        } else {
            toggle.classList.remove('active');
            if (lockIcon) {
                lockIcon.style.display = 'none';
            }
            if (unlockIcon) {
                unlockIcon.style.display = 'block';
                console.log('Set toggle to unlocked (privacy OFF)');
            }
        }
        
        // Update all user messages to show/hide original data
        console.log('Updating messages privacy view...');
        
        // Add no-animation class to prevent flicker during toggle
        this.elements.chatMessages.classList.add('no-animation');
        
        // Update messages directly without delays or re-highlighting
        this.updateMessagesPrivacyView();
        
        // Remove no-animation class after a brief delay to re-enable animations for future highlights
        setTimeout(() => {
            this.elements.chatMessages.classList.remove('no-animation');
        }, 50);
        
        console.log(`Privacy mode: ${this.privacyMode ? 'ON (Masked)' : 'OFF (Original data shown)'}`);
        
        // Removed localStorage to prevent caching issues
    }
    
    
    updateMessagesPrivacyView() {
        console.log('=== updateMessagesPrivacyView called, privacyMode:', this.privacyMode);
        
        // Find all message wrappers that have privacy data
        const allMessages = this.elements.chatMessages.querySelectorAll('.message-wrapper[data-original]');
        console.log('Found', allMessages.length, 'messages to update');
        
        allMessages.forEach((messageWrapper, idx) => {
            const role = messageWrapper.getAttribute('data-role');
            const messageContent = messageWrapper.querySelector('.message-content');
            if (!messageContent) return;
            
            const originalMessage = messageWrapper.getAttribute('data-original');
            const maskedMessage = messageWrapper.getAttribute('data-masked');
            const entitiesData = messageWrapper.getAttribute('data-entities');
            
            console.log(`Processing message ${idx + 1}, role: ${role}`);
            
            // Get or create message-text element
            let messageText = messageContent.querySelector('.message-text');
            if (!messageText) {
                messageText = document.createElement('div');
                messageText.className = 'message-text';
                messageContent.insertBefore(messageText, messageContent.firstChild);
            }
            
            // Parse entities fresh every time (no caching)
            let entities = [];
            if (entitiesData && entitiesData !== 'undefined' && entitiesData !== 'null') {
                try {
                    entities = JSON.parse(entitiesData);
                    console.log(`Message ${idx + 1} has ${entities.length} entities`);
                } catch (e) {
                    console.error('Error parsing entities for message', idx + 1, ':', e);
                    console.error('Entity data was:', entitiesData);
                    entities = [];
                }
            }
            
            // Determine content to show based on privacy mode
            const contentToShow = this.privacyMode ? maskedMessage : originalMessage;
            
            // Update text direction class while preserving existing classes
            const textDirection = this.detectTextDirection(contentToShow);
            
            // Preserve existing classes, only update direction
            messageText.classList.remove('ltr', 'rtl');
            messageText.classList.add(textDirection === 'rtl' ? 'rtl' : 'ltr');
            
            // Apply highlighting based on role and mode
            if (role === 'assistant') {
                if (this.privacyMode) {
                    // Show masked version with placeholder highlighting
                    console.log('Highlighting placeholders for masked assistant message');
                    messageText.innerHTML = this.highlightPlaceholders(maskedMessage);
                } else {
                    // Show unmasked version with entity highlighting
                    console.log('Highlighting entities for unmasked assistant message');
                    if (entities && entities.length > 0) {
                        messageText.innerHTML = this.highlightEntities(originalMessage, entities);
                    } else {
                        console.log('No entities to highlight, showing plain text');
                        messageText.textContent = originalMessage;
                    }
                }
            } else if (role === 'user') {
                // For user messages, highlight based on current mode
                if (entities && entities.length > 0) {
                    const messageData = {
                        original: originalMessage,
                        masked: maskedMessage,
                        userMessage: true,
                        userEntities: entities
                    };
                    messageText.innerHTML = this.highlightUserMessage(contentToShow, entities, messageData);
                } else {
                    messageText.textContent = contentToShow;
                }
            } else {
                // Unknown role, just show text
                messageText.textContent = contentToShow;
            }
        });
        
        console.log('=== updateMessagesPrivacyView complete');
    }
    
    unescapeHtml(text) {
        if (!text) return text;
        return text.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
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

// Modal control functions
function closeRenameModal() {
    const modal = document.getElementById('rename-modal');
    modal.classList.remove('show');
    
    setTimeout(() => {
        modal.style.display = 'none';
        window.privacyChat.currentRenameSessionId = null;
    }, 300);
}

function saveRename() {
    const input = document.getElementById('chat-name-input');
    const newName = input.value.trim();
    
    if (!newName) {
        return;
    }
    
    const sessionId = window.privacyChat.currentRenameSessionId;
    if (sessionId) {
        const session = window.privacyChat.sessions[sessionId];
        session.name = newName;
        session.firstMessage = null; // Clear first message to use custom name
        window.privacyChat.updateSessionList();
    }
    
    closeRenameModal();
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.privacyChat = new PrivacyChat();
    
    // Handle Enter key in rename input
    const input = document.getElementById('chat-name-input');
    if (input) {
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                saveRename();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                closeRenameModal();
            }
        });
    }
    
    // Close modal when clicking outside
    const modal = document.getElementById('rename-modal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeRenameModal();
            }
        });
    }
});