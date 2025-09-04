/**
 * Document Attachment Manager for PII Chat
 * Upload documents and attach them to messages (like ChatGPT/Claude)
 */

class DocumentAttachmentManager {
    constructor(privacyChat) {
        this.privacyChat = privacyChat;
        this.attachedDocument = null; // Store the currently attached document
        this.init();
    }
    
    init() {
        // Add upload button to chat input areas
        this.addUploadButton();
        // Override the send message to include document if attached
        this.overrideSendMessage();
    }
    
    addUploadButton() {
        // Create hidden file input
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.id = 'doc-upload';
        fileInput.accept = '.pdf,.docx,.txt,.md,.xlsx,.csv';
        fileInput.style.display = 'none';
        document.body.appendChild(fileInput);
        
        // Add upload button to both input areas
        const inputBoxes = document.querySelectorAll('.input-box');
        console.log('Found input boxes:', inputBoxes.length);
        
        inputBoxes.forEach((box, index) => {
            // Check if button already exists
            if (box.querySelector('.chat-upload-btn')) {
                console.log('Upload button already exists in box', index);
                return;
            }
            
            const uploadBtn = document.createElement('button');
            uploadBtn.className = 'chat-upload-btn';
            uploadBtn.type = 'button';
            uploadBtn.title = 'Upload a document';
            uploadBtn.style.cssText = `
                background: none;
                border: none;
                padding: 8px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #6b7280;
                transition: color 0.2s;
            `;
            uploadBtn.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
                </svg>
            `;
            
            // Add hover effect
            uploadBtn.addEventListener('mouseenter', () => {
                uploadBtn.style.color = '#8b5cf6';
            });
            uploadBtn.addEventListener('mouseleave', () => {
                uploadBtn.style.color = '#6b7280';
            });
            
            uploadBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Upload button clicked');
                fileInput.click();
            });
            
            box.insertBefore(uploadBtn, box.firstChild);
            console.log('Added upload button to box', index);
        });
        
        // Handle file selection
        fileInput.addEventListener('change', async (e) => {
            if (e.target.files.length > 0) {
                await this.attachDocument(e.target.files[0]);
                e.target.value = ''; // Reset
            }
        });
    }
    
    async attachDocument(file) {
        console.log('Attaching document:', file.name);
        try {
            // Upload the file
            const formData = new FormData();
            formData.append('file', file);
            formData.append('session_id', this.privacyChat.currentSession || 1);
            
            console.log('Uploading to session:', this.privacyChat.currentSession || 1);
            const response = await fetch(`/api/document/upload?session_id=${this.privacyChat.currentSession || 1}`, {
                method: 'POST',
                body: formData
            });
            
            console.log('Upload response status:', response.status);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Upload failed with response:', errorText);
                throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
            }
            
            const result = await response.json();
            console.log('Upload result:', result);
            
            if (result.success) {
                // Get the document details
                console.log('Fetching document details for ID:', result.document.id);
                const docResponse = await fetch(`/api/document/${this.privacyChat.currentSession || 1}/${result.document.id}`);
                
                if (!docResponse.ok) {
                    console.error('Failed to fetch document details:', docResponse.status);
                    throw new Error('Failed to get document details');
                }
                
                const docData = await docResponse.json();
                console.log('Document data:', docData);
                
                // Store the attached document
                this.attachedDocument = {
                    id: result.document.id,
                    filename: file.name,
                    text: docData.original_text,
                    wordCount: docData.word_count,
                    entityCount: docData.entity_count || Object.values(docData.entity_counts || {}).reduce((a, b) => a + b, 0)
                };
                
                console.log('Document attached successfully:', this.attachedDocument);
                
                // Show attachment indicator
                this.showAttachmentIndicator();
                
                // Focus on input so user can type their message
                const input = document.getElementById('chat-input') || 
                            document.getElementById('chat-input-bottom');
                if (input) {
                    input.focus();
                    input.placeholder = `Message about ${file.name}...`;
                }
            } else {
                console.error('Upload result indicates failure:', result);
                throw new Error(result.error || 'Upload failed');
            }
        } catch (error) {
            console.error('Upload error details:', error);
            console.error('Error stack:', error.stack);
            alert(`Failed to upload document: ${error.message}`);
        }
    }
    
    showAttachmentIndicator() {
        if (!this.attachedDocument) return;
        
        // Remove any existing attachment indicators
        document.querySelectorAll('.attachment-indicator').forEach(el => el.remove());
        
        // Add indicator to both input areas
        const inputContainers = document.querySelectorAll('.input-container');
        inputContainers.forEach(container => {
            const indicator = document.createElement('div');
            indicator.className = 'attachment-indicator';
            indicator.style.cssText = `
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 8px 12px;
                background: #f3f4f6;
                border-radius: 8px;
                margin-bottom: 8px;
                font-size: 14px;
            `;
            indicator.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" stroke-width="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14,2 14,8 20,8"/>
                </svg>
                <span style="color: #4b5563; flex: 1;">
                    ${this.attachedDocument.filename} 
                    <span style="color: #9ca3af;">(${this.attachedDocument.wordCount} words)</span>
                </span>
                <button onclick="window.docAttachmentManager.removeAttachment()" style="background: none; border: none; color: #9ca3af; cursor: pointer; padding: 4px;">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                </button>
            `;
            
            // Insert before the input wrapper
            const inputWrapper = container.querySelector('.input-wrapper');
            if (inputWrapper) {
                container.insertBefore(indicator, inputWrapper);
            } else {
                // Fallback: append to container if wrapper not found
                container.appendChild(indicator);
            }
        });
    }
    
    removeAttachment() {
        this.attachedDocument = null;
        document.querySelectorAll('.attachment-indicator').forEach(el => el.remove());
        
        // Reset input placeholder
        const inputs = [document.getElementById('chat-input'), document.getElementById('chat-input-bottom')];
        inputs.forEach(input => {
            if (input) {
                input.placeholder = 'Type your message...';
            }
        });
    }
    
    overrideSendMessage() {
        // Store the original sendMessage function
        if (this.privacyChat) {
            const originalSendMessage = this.privacyChat.sendMessage.bind(this.privacyChat);
            
            // Override with our version that includes document
            this.privacyChat.sendMessage = async () => {
                // Get the user's message
                let input = document.getElementById('chat-input');
                if (!input || input.style.display === 'none' || input.offsetParent === null) {
                    input = document.getElementById('chat-input-bottom');
                }
                
                const userMessage = input ? input.value.trim() : '';
                
                // If there's an attached document, combine it with the message
                if (this.attachedDocument) {
                    let combinedMessage = '';
                    
                    // Add user message first if provided
                    if (userMessage) {
                        combinedMessage = userMessage + '\n\n';
                    }
                    
                    // Add just the document content without header
                    combinedMessage += this.attachedDocument.text;
                    
                    // Set the combined message in the input
                    if (input) {
                        input.value = combinedMessage;
                    }
                    
                    // Clear the attachment after sending
                    this.removeAttachment();
                }
                
                // Call the original send message function
                return originalSendMessage();
            };
        }
    }
}

// Initialize when privacy chat is ready
document.addEventListener('DOMContentLoaded', () => {
    const initDocAttachmentManager = () => {
        if (window.privacyChat) {
            window.docAttachmentManager = new DocumentAttachmentManager(window.privacyChat);
            console.log('Document attachment manager initialized');
        } else {
            setTimeout(initDocAttachmentManager, 100);
        }
    };
    
    initDocAttachmentManager();
});