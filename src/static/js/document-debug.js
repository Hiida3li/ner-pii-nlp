// Document Upload Debug Script
// This script traces the complete document upload and display flow

(function() {
    console.log('%c=== DOCUMENT DEBUG SCRIPT LOADED ===', 'background: #8b5cf6; color: white; padding: 5px; font-weight: bold;');
    
    // Monitor document attachment manager
    let originalAttachDocument = null;
    let originalSendMessage = null;
    let originalAddMessage = null;
    
    // Wait for document attachment manager to be initialized
    const waitForManager = setInterval(() => {
        if (window.docAttachmentManager) {
            console.log('%c✅ Document Attachment Manager Found', 'color: #10b981; font-weight: bold;');
            clearInterval(waitForManager);
            setupDebugHooks();
        }
    }, 100);
    
    function setupDebugHooks() {
        // Hook into attachDocument
        if (window.docAttachmentManager.attachDocument) {
            const original = window.docAttachmentManager.attachDocument.bind(window.docAttachmentManager);
            window.docAttachmentManager.attachDocument = async function(file) {
                console.group('%c📎 ATTACH DOCUMENT', 'color: #3b82f6; font-weight: bold;');
                console.log('File:', file.name);
                console.log('Size:', file.size, 'bytes');
                const result = await original(file);
                console.log('Attached document:', window.docAttachmentManager.attachedDocument);
                console.groupEnd();
                return result;
            };
        }
        
        // Monitor privacy chat
        if (window.privacyChat) {
            console.log('%c✅ Privacy Chat Found', 'color: #10b981; font-weight: bold;');
            
            // Hook into sendMessage
            const originalSend = window.privacyChat.sendMessage;
            if (originalSend) {
                window.privacyChat.sendMessage = async function() {
                    console.group('%c📤 SEND MESSAGE', 'color: #f59e0b; font-weight: bold;');
                    
                    const input = document.getElementById('chat-input') || document.getElementById('chat-input-bottom');
                    console.log('Input value before send:', input ? input.value.substring(0, 100) + '...' : 'No input');
                    console.log('Has attachment:', !!window.docAttachmentManager?.attachedDocument);
                    
                    const result = await originalSend.call(this);
                    console.groupEnd();
                    return result;
                };
            }
            
            // Hook into addMessage
            const originalAdd = window.privacyChat.addMessage;
            if (originalAdd) {
                window.privacyChat.addMessage = function(role, content, entities, messageData, attachment) {
                    console.group('%c💬 ADD MESSAGE', 'color: #8b5cf6; font-weight: bold;');
                    console.log('Role:', role);
                    console.log('Content length:', content.length);
                    console.log('Content preview:', content.substring(0, 100) + '...');
                    console.log('Has attachment:', !!attachment);
                    if (attachment) {
                        console.log('Attachment:', attachment);
                    }
                    
                    const result = originalAdd.call(this, role, content, entities, messageData, attachment);
                    
                    // Check what was actually added to DOM
                    setTimeout(() => {
                        const messages = document.querySelectorAll('.message-wrapper');
                        const lastMessage = messages[messages.length - 1];
                        if (lastMessage) {
                            const hasAttachment = lastMessage.querySelector('.message-attachments');
                            const messageText = lastMessage.querySelector('.message-text');
                            console.log('DOM Check:');
                            console.log('  - Has attachment element:', !!hasAttachment);
                            console.log('  - Message text:', messageText ? messageText.textContent.substring(0, 100) : 'No text');
                        }
                    }, 100);
                    
                    console.groupEnd();
                    return result;
                };
            }
        } else {
            console.log('%c❌ Privacy Chat Not Found', 'color: #ef4444; font-weight: bold;');
        }
        
        // Monitor document clicks
        document.addEventListener('click', function(e) {
            const card = e.target.closest('.document-attachment-card');
            if (card) {
                console.group('%c🖱️ DOCUMENT CARD CLICKED', 'color: #a78bfa; font-weight: bold;');
                console.log('Card element:', card);
                console.log('Has dataset.documentText:', !!card.dataset.documentText);
                console.log('Has dataset.documentName:', !!card.dataset.documentName);
                
                // Check if modal exists
                const modal = document.getElementById('document-modal');
                console.log('Modal element exists:', !!modal);
                if (modal) {
                    console.log('Modal display style:', modal.style.display);
                }
                console.groupEnd();
            }
        });
    }
    
    // Monitor streaming responses
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
        const url = args[0];
        if (typeof url === 'string' && url.includes('/api/privacy-chat/stream')) {
            console.group('%c🌊 STREAMING RESPONSE', 'color: #06b6d4; font-weight: bold;');
            console.log('Request URL:', url);
            
            return originalFetch.apply(this, args).then(response => {
                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let buffer = '';
                
                const originalRead = reader.read.bind(reader);
                reader.read = function() {
                    return originalRead().then(result => {
                        if (!result.done) {
                            const chunk = decoder.decode(result.value, { stream: true });
                            buffer += chunk;
                            
                            // Parse SSE data
                            const lines = buffer.split('\n');
                            for (const line of lines) {
                                if (line.startsWith('data: ')) {
                                    try {
                                        const data = JSON.parse(line.slice(6));
                                        if (data.type === 'init') {
                                            console.log('Init data:', {
                                                hasOriginal: !!data.original_message,
                                                hasMasked: !!data.masked_message,
                                                originalLength: data.original_message?.length,
                                                maskedLength: data.masked_message?.length
                                            });
                                        }
                                    } catch (e) {
                                        // Ignore parse errors
                                    }
                                }
                            }
                        }
                        return result;
                    });
                };
                
                // Return modified response with wrapped reader
                return new Response(new ReadableStream({
                    start(controller) {
                        function push() {
                            reader.read().then(({ done, value }) => {
                                if (done) {
                                    controller.close();
                                    console.groupEnd();
                                    return;
                                }
                                controller.enqueue(value);
                                push();
                            });
                        }
                        push();
                    }
                }), response);
            });
        }
        return originalFetch.apply(this, args);
    };
    
    console.log('%cDebug hooks installed. Upload a document to see the flow.', 'color: #60a5fa; font-style: italic;');
})();