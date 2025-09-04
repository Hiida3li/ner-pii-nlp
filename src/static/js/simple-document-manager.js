/**
 * Simple Document Upload for PII Chat
 * Just upload and send document text to chat
 */

class SimpleDocumentManager {
    constructor(privacyChat) {
        this.privacyChat = privacyChat;
        this.init();
    }
    
    init() {
        // Add upload button to chat input areas
        this.addUploadButton();
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
            uploadBtn.type = 'button'; // Prevent form submission
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
                await this.uploadFile(e.target.files[0]);
                e.target.value = ''; // Reset
            }
        });
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    async uploadFile(file) {
        console.log('Uploading file:', file.name);
        try {
            // Upload the file
            const formData = new FormData();
            formData.append('file', file);
            formData.append('session_id', this.privacyChat.currentSession || 1);
            
            console.log('Sending to API with session:', this.privacyChat.currentSession || 1);
            const response = await fetch(`/api/document/upload?session_id=${this.privacyChat.currentSession || 1}`, {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                throw new Error('Upload failed');
            }
            
            const result = await response.json();
            console.log('Upload result:', result);
            
            if (result.success) {
                // Get the document text
                const docResponse = await fetch(`/api/document/${this.privacyChat.currentSession || 1}/${result.document.id}`);
                const docData = await docResponse.json();
                console.log('Document data:', docData);
                
                // Send document text as a message
                const message = docData.original_text;
                console.log('Sending message to chat:', message.substring(0, 100) + '...');
                
                // Use the normal sendMessage flow which will handle displaying the message
                let input = document.getElementById('chat-input');
                if (!input || input.style.display === 'none' || input.offsetParent === null) {
                    input = document.getElementById('chat-input-bottom');
                }
                
                if (input) {
                    input.value = message;
                    
                    // Trigger the normal send message flow
                    if (this.privacyChat && this.privacyChat.sendMessage) {
                        console.log('Using sendMessage');
                        this.privacyChat.sendMessage();
                    } else {
                        console.log('Fallback: triggering Enter key');
                        // Fallback: trigger enter key
                        const event = new KeyboardEvent('keydown', {
                            key: 'Enter',
                            code: 'Enter', 
                            which: 13,
                            keyCode: 13,
                            bubbles: true
                        });
                        input.dispatchEvent(event);
                    }
                } else {
                    console.error('Could not find chat input element');
                }
            }
        } catch (error) {
            console.error('Upload error:', error);
            alert('Failed to upload document');
        }
    }
}

// Initialize when privacy chat is ready
document.addEventListener('DOMContentLoaded', () => {
    const initSimpleDocManager = () => {
        if (window.privacyChat) {
            window.simpleDocManager = new SimpleDocumentManager(window.privacyChat);
            console.log('Simple document manager initialized');
        } else {
            setTimeout(initSimpleDocManager, 100);
        }
    };
    
    initSimpleDocManager();
});