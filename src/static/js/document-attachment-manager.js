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
        // Add drag and drop support
        this.addDragAndDropSupport();
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
        // console.log('Found input boxes:', inputBoxes.length);
        
        inputBoxes.forEach((box, index) => {
            // Check if button already exists
            if (box.querySelector('.chat-upload-btn')) {
                // console.log('Upload button already exists in box', index);
                return;
            }
            
            const uploadBtn = document.createElement('button');
            uploadBtn.className = 'chat-upload-btn';
            uploadBtn.type = 'button';
            uploadBtn.title = 'Upload a document';
            uploadBtn.innerHTML = `
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M7 18C4.79086 18 3 16.2091 3 14C3 11.7909 4.79086 10 7 10C7.16652 10 7.33073 10.0106 7.49173 10.0311M16.4917 10.0311C16.6607 10.0106 16.8335 10 17 10C19.2091 10 21 11.7909 21 14C21 16.2091 19.2091 18 17 18" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M7.49173 10.0311C7.86103 7.16347 10.2019 5 13 5C15.7981 5 18.139 7.16347 18.5083 10.0311M16.4917 10.0311C16.3307 10.0106 16.1665 10 16 10C15.8335 10 15.6693 10.0106 15.5083 10.0311" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M12 13V21M12 13L15 16M12 13L9 16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <div class="upload-spinner"></div>
                <div class="upload-progress">
                    <div class="upload-progress-bar"></div>
                </div>
            `;
            
            // Store button reference for later use
            uploadBtn.uploadButton = uploadBtn;
            
            uploadBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                // console.log('Upload button clicked');
                fileInput.click();
            });
            
            // Insert button as the first element (before textarea)
            const textarea = box.querySelector('textarea');
            if (textarea) {
                box.insertBefore(uploadBtn, textarea);
            } else {
                box.insertBefore(uploadBtn, box.firstChild);
            }
            // console.log('Added upload button to box', index);
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
        // console.log('Attaching document:', file.name);
        const startTime = Date.now();
        
        // Show loading state on all upload buttons
        const uploadButtons = document.querySelectorAll('.chat-upload-btn');
        uploadButtons.forEach(btn => {
            btn.classList.add('uploading');
            const progressBar = btn.querySelector('.upload-progress');
            if (progressBar) {
                progressBar.classList.add('active');
                const bar = progressBar.querySelector('.upload-progress-bar');
                if (bar) bar.style.width = '30%';
            }
        });
        
        try {
            // Upload the file
            const formData = new FormData();
            formData.append('file', file);
            formData.append('session_id', this.privacyChat.currentSession || 1);
            
            // console.log('Uploading to session:', this.privacyChat.currentSession || 1);
            
            // Update progress to 50%
            uploadButtons.forEach(btn => {
                const bar = btn.querySelector('.upload-progress-bar');
                if (bar) bar.style.width = '50%';
            });
            
            const response = await fetch(`/api/document/upload?session_id=${this.privacyChat.currentSession || 1}`, {
                method: 'POST',
                body: formData
            });
            
            // console.log('Upload response status:', response.status);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Upload failed with response:', errorText);
                throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
            }
            
            const result = await response.json();
            // console.log('Upload result:', result);
            
            if (result.success) {
                // Update progress to 70%
                uploadButtons.forEach(btn => {
                    const bar = btn.querySelector('.upload-progress-bar');
                    if (bar) bar.style.width = '70%';
                });
                
                // Get the document details
                // console.log('Fetching document details for ID:', result.document.id);
                const docResponse = await fetch(`/api/document/${this.privacyChat.currentSession || 1}/${result.document.id}`);
                
                if (!docResponse.ok) {
                    console.error('Failed to fetch document details:', docResponse.status);
                    throw new Error('Failed to get document details');
                }
                
                const docData = await docResponse.json();
                // console.log('Document data:', docData);
                
                // Store the attached document
                // Count total entities correctly
                let totalEntities = 0;
                if (docData.entities && Array.isArray(docData.entities)) {
                    totalEntities = docData.entities.length;
                    // console.log('Entity count from entities array:', totalEntities);
                } else if (docData.entity_count) {
                    totalEntities = docData.entity_count;
                    // console.log('Entity count from entity_count field:', totalEntities);
                } else if (docData.entity_counts) {
                    totalEntities = Object.values(docData.entity_counts).reduce((a, b) => a + b, 0);
                    // console.log('Entity count from entity_counts object:', totalEntities, docData.entity_counts);
                }
                // console.log('Total entities calculated:', totalEntities);
                
                this.attachedDocument = {
                    id: result.document.id,
                    filename: file.name,
                    text: docData.original_text,
                    originalText: docData.original_text,
                    maskedText: docData.masked_text || docData.original_text,
                    entities: docData.entities || [],
                    wordCount: docData.word_count,
                    entityCount: totalEntities
                };
                
                // Update progress to 100%
                uploadButtons.forEach(btn => {
                    const bar = btn.querySelector('.upload-progress-bar');
                    if (bar) bar.style.width = '100%';
                });
                
                const uploadTime = Date.now() - startTime;
                // console.log(`Document attached successfully in ${uploadTime}ms:`, this.attachedDocument);
                
                // Show attachment indicator
                this.showAttachmentIndicator();
                
                // Show success state
                uploadButtons.forEach(btn => {
                    btn.classList.remove('uploading');
                    btn.classList.add('success');
                    const progressBar = btn.querySelector('.upload-progress');
                    if (progressBar) {
                        progressBar.classList.remove('active');
                        const bar = progressBar.querySelector('.upload-progress-bar');
                        if (bar) bar.style.width = '0%';
                    }
                });
                
                // Remove success state after animation
                setTimeout(() => {
                    uploadButtons.forEach(btn => {
                        btn.classList.remove('success');
                    });
                }, 1000);
                
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
            
            // Remove loading state on error
            uploadButtons.forEach(btn => {
                btn.classList.remove('uploading');
                const progressBar = btn.querySelector('.upload-progress');
                if (progressBar) {
                    progressBar.classList.remove('active');
                    const bar = progressBar.querySelector('.upload-progress-bar');
                    if (bar) bar.style.width = '0%';
                }
            });
            
            alert(`Failed to upload document: ${error.message}`);
        }
    }
    
    showAttachmentIndicator() {
        if (!this.attachedDocument) return;
        
        // Remove any existing attachment indicators
        document.querySelectorAll('.attachment-preview').forEach(el => el.remove());
        
        // Add indicator inside both input boxes
        const inputBoxes = document.querySelectorAll('.input-box');
        inputBoxes.forEach(inputBox => {
            const preview = document.createElement('div');
            preview.className = 'attachment-preview';
            
            // Create the document attachment card
            const card = this.createDocumentCard(this.attachedDocument, true);
            preview.appendChild(card);
            
            // Insert at the beginning of input box (before the textarea)
            const textarea = inputBox.querySelector('.chat-input');
            if (textarea) {
                inputBox.insertBefore(preview, textarea);
            }
        });
    }
    
    createDocumentCard(doc, canRemove = false) {
        const card = document.createElement('div');
        card.className = 'document-attachment-card';
        
        // Store document text and metadata as data attributes for modal
        if (doc.text) {
            card.dataset.documentText = doc.text;
            card.dataset.documentName = doc.filename;
            card.dataset.originalText = doc.originalText || doc.text;
            card.dataset.maskedText = doc.maskedText || doc.text;
            card.dataset.entities = JSON.stringify(doc.entities || []);
            card.style.cursor = 'pointer';
            card.title = 'Click to view document content';
            
            // Add click handler to show modal
            card.addEventListener('click', (e) => {
                // Don't open modal if clicking the remove button
                if (!e.target.closest('.remove-doc-btn')) {
                    this.showDocumentModal(doc.filename, doc.text);
                }
            });
        }
        
        // Determine file extension for icon color
        const ext = doc.filename.split('.').pop().toLowerCase();
        let fileTypeClass = 'file-type-txt';
        if (ext === 'pdf') fileTypeClass = 'file-type-pdf';
        else if (['doc', 'docx'].includes(ext)) fileTypeClass = 'file-type-doc';
        else if (['csv', 'xlsx', 'xls'].includes(ext)) fileTypeClass = 'file-type-csv';
        
        // Add file type class to the card for styling
        card.classList.add(fileTypeClass);
        
        card.innerHTML = `
            <div class="doc-icon-wrapper ${fileTypeClass}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14,2 14,8 20,8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                    <polyline points="10 9 9 9 8 9"/>
                </svg>
            </div>
            <div class="doc-info">
                <div class="doc-filename">${doc.filename}</div>
                <div class="doc-metadata">
                    <span class="doc-size">${doc.wordCount} words</span>
                    ${doc.entityCount > 0 ? `<span class="doc-entities">• ${doc.entityCount} entities</span>` : ''}
                </div>
            </div>
            ${canRemove ? `
                <button class="remove-doc-btn" onclick="window.docAttachmentManager.removeAttachment()">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                </button>
            ` : ''}
        `;
        
        return card;
    }
    
    addDragAndDropSupport() {
        // Get the chat container
        const chatContainer = document.querySelector('.chat-container');
        if (!chatContainer) return;
        
        // Create drop zone overlay
        const dropZone = document.createElement('div');
        dropZone.className = 'upload-drop-zone';
        dropZone.innerHTML = `
            <div class="upload-drop-content">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                <p class="drop-text">Drop your document here</p>
                <p class="drop-subtext">PDF, DOCX, TXT, MD, XLSX, CSV</p>
            </div>
        `;
        chatContainer.appendChild(dropZone);
        
        // Drag counter to handle nested elements
        let dragCounter = 0;
        
        // Prevent default drag behaviors
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            document.addEventListener(eventName, (e) => {
                if (this.isDragFile(e)) {
                    e.preventDefault();
                    e.stopPropagation();
                }
            });
        });
        
        // Handle drag enter
        document.addEventListener('dragenter', (e) => {
            if (this.isDragFile(e)) {
                dragCounter++;
                dropZone.classList.add('active');
                chatContainer.classList.add('dragging');
            }
        });
        
        // Handle drag over
        document.addEventListener('dragover', (e) => {
            if (this.isDragFile(e)) {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'copy';
            }
        });
        
        // Handle drag leave
        document.addEventListener('dragleave', (e) => {
            if (this.isDragFile(e)) {
                dragCounter--;
                if (dragCounter === 0) {
                    dropZone.classList.remove('active');
                    chatContainer.classList.remove('dragging');
                }
            }
        });
        
        // Handle drop
        document.addEventListener('drop', async (e) => {
            if (this.isDragFile(e)) {
                e.preventDefault();
                dragCounter = 0;
                dropZone.classList.remove('active');
                chatContainer.classList.remove('dragging');
                
                const files = Array.from(e.dataTransfer.files);
                const validFile = files.find(file => {
                    const ext = file.name.split('.').pop().toLowerCase();
                    return ['pdf', 'docx', 'txt', 'md', 'xlsx', 'csv'].includes(ext);
                });
                
                if (validFile) {
                    await this.attachDocument(validFile);
                } else if (files.length > 0) {
                    alert('Please upload a supported document format: PDF, DOCX, TXT, MD, XLSX, or CSV');
                }
            }
        });
    }
    
    isDragFile(e) {
        if (e.dataTransfer) {
            const types = Array.from(e.dataTransfer.types);
            return types.includes('Files');
        }
        return false;
    }
    
    removeAttachment() {
        this.attachedDocument = null;
        document.querySelectorAll('.attachment-preview').forEach(el => el.remove());
        
        // Reset input placeholder
        const inputs = [document.getElementById('chat-input'), document.getElementById('chat-input-bottom')];
        inputs.forEach(input => {
            if (input) {
                input.placeholder = 'Type your message...';
            }
        });
    }
    
    showDocumentModal(filename, text) {
        const modal = document.getElementById('document-modal');
        const titleElement = document.getElementById('document-modal-title');
        const textElement = document.getElementById('document-modal-text');
        
        if (modal && titleElement && textElement) {
            titleElement.textContent = filename;
            textElement.textContent = text;
            
            // Detect if text is Arabic/RTL
            const isRTL = /[\u0600-\u06FF\u0750-\u077F]/.test(text.substring(0, 100));
            if (isRTL) {
                textElement.dir = 'rtl';
                textElement.lang = 'ar';
            } else {
                textElement.dir = 'ltr';
                textElement.lang = 'en';
            }
            
            modal.style.display = 'flex';
            
            // Add click handler to close on backdrop click
            modal.onclick = (e) => {
                if (e.target === modal) {
                    this.closeDocumentModal();
                }
            };
        }
    }
    
    closeDocumentModal() {
        const modal = document.getElementById('document-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    }
    
    overrideSendMessage() {
        // Store the original sendMessage function  
        if (this.privacyChat && this.privacyChat.sendMessage) {
            const originalSendMessage = this.privacyChat.sendMessage.bind(this.privacyChat);
            
            // Also override the addMessage to handle attachments
            const originalAddMessage = this.privacyChat.addMessage.bind(this.privacyChat);
            this.privacyChat.addMessage = (role, content, entities, messageData, attachment) => {
                // For user messages with attachment, ONLY show the user's message, not document content
                if (role === 'user' && attachment && attachment.filename) {
                    // First check if we have the stored user message
                    if (attachment.userMessage !== undefined) {
                        content = attachment.userMessage || '';
                    } else {
                        // Fallback: Remove document content from display
                        const docHeader = `[Document: ${attachment.filename}]`;
                        if (content.includes(docHeader)) {
                            const docIndex = content.indexOf(docHeader);
                            content = content.substring(0, docIndex).trim();
                        }
                    }
                    
                    // If no user message was provided, don't show any text
                    // The attachment card will be sufficient
                    if (!content) {
                        content = '';
                    }
                }
                return originalAddMessage(role, content, entities, messageData, attachment);
            };
            
            // Override sendMessage to include document
            this.privacyChat.sendMessage = async () => {
                // console.log('Document attachment manager sendMessage called');
                // console.log('Current attached document:', this.attachedDocument);
                
                // Get the user's message
                let input = document.getElementById('chat-input');
                if (!input || input.style.display === 'none' || input.offsetParent === null) {
                    input = document.getElementById('chat-input-bottom');
                }
                
                const userMessage = input ? input.value.trim() : '';
                // console.log('User message:', userMessage);
                
                // Store document for display
                const documentToDisplay = this.attachedDocument;
                
                // Store the attachment in privacy chat for use in addMessage
                if (documentToDisplay) {
                    this.privacyChat.pendingAttachment = documentToDisplay;
                }
                
                // If there's an attached document, combine it with the message for backend
                // But store original user message for display
                let originalUserMessage = userMessage;
                
                if (this.attachedDocument && this.attachedDocument.text) {
                    let combinedMessage = '';
                    
                    // Add user message first if provided
                    if (userMessage) {
                        combinedMessage = userMessage + '\n\n';
                    }
                    
                    // Add document header and content for backend processing
                    combinedMessage += `[Document: ${this.attachedDocument.filename}]\n\n`;
                    combinedMessage += this.attachedDocument.text;
                    
                    // Store the original user message to display (not the document content)
                    if (documentToDisplay) {
                        documentToDisplay.userMessage = originalUserMessage || '';
                    }
                    
                    // Set the combined message in the input (for backend)
                    if (input) {
                        input.value = combinedMessage;
                    }
                }
                
                // Call the original send message function
                // console.log('Calling original sendMessage');
                const result = await originalSendMessage();
                
                // DON'T clear the pending attachment here - it's needed for the streaming response
                // It will be cleared after the streaming response completes
                
                // Clear the attachment after sending
                if (documentToDisplay) {
                    this.removeAttachment();
                }
                
                return result;
            };
        }
    }
}

// Initialize when privacy chat is ready
document.addEventListener('DOMContentLoaded', () => {
    const initDocAttachmentManager = () => {
        if (window.privacyChat && window.privacyChat.sendMessage) {
            window.docAttachmentManager = new DocumentAttachmentManager(window.privacyChat);
            console.log('Document attachment manager initialized and overrides applied');
        } else {
            setTimeout(initDocAttachmentManager, 100);
        }
    };
    
    initDocAttachmentManager();
});