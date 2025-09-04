/**
 * Document Manager - Handle document uploads and integration with PII chat
 * Integrates seamlessly with the existing privacy chat system
 */

class DocumentManager {
    constructor(privacyChat) {
        this.privacyChat = privacyChat;
        this.documents = [];
        this.activeDocument = null;
        this.isUploading = false;
        
        this.supportedFormats = {
            '.pdf': 'PDF Documents',
            '.docx': 'Word Documents',
            '.txt': 'Text Files',
            '.md': 'Markdown Files',
            '.xlsx': 'Excel Spreadsheets',
            '.csv': 'CSV Files'
        };
        
        this.init();
    }
    
    init() {
        this.createDocumentUI();
        this.bindEvents();
    }
    
    createDocumentUI() {
        // Only add the upload button to chat input areas - no other UI
        this.addUploadButtonToChat();
    }
    
    addUploadButtonToChat() {
        // Create file input element
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.id = 'chat-file-upload';
        fileInput.multiple = true;
        fileInput.accept = '.pdf,.docx,.txt,.md,.xlsx,.csv';
        fileInput.style.display = 'none';
        document.body.appendChild(fileInput);
        
        // Add to centered input area
        const centeredInputBox = document.querySelector('#centered-input .input-box');
        if (centeredInputBox) {
            const uploadBtn = this.createChatUploadButton();
            centeredInputBox.insertBefore(uploadBtn, centeredInputBox.firstChild);
        }
        
        // Add to bottom input area
        const bottomInputBox = document.querySelector('#bottom-input .input-box');
        if (bottomInputBox) {
            const uploadBtn = this.createChatUploadButton();
            bottomInputBox.insertBefore(uploadBtn, bottomInputBox.firstChild);
        }
        
    }
    
    createChatUploadButton() {
        const button = document.createElement('button');
        button.className = 'chat-upload-btn';
        button.title = 'Upload a file (PDF, DOCX, TXT, CSV, XLSX)';
        button.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
            </svg>
            <span class="upload-label">Upload a file</span>
        `;
        
        button.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            document.getElementById('chat-file-upload').click();
        });
        
        return button;
    }
    
    bindEvents() {
        // Just handle the file input change event
        const fileInput = document.getElementById('chat-file-upload');
        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                this.handleFileSelect(e.target.files);
                e.target.value = ''; // Reset input
            });
        }
    }
    
    async checkSupportedFormats() {
        try {
            const response = await fetch('/api/document/supported-formats');
            if (response.ok) {
                const data = await response.json();
                this.maxFileSize = data.max_file_size;
                this.maxTextLength = data.max_text_length;
                console.log('Document processing limits loaded:', data);
            }
        } catch (error) {
            console.error('Failed to load document format info:', error);
        }
    }
    
    async handleFileSelect(files) {
        if (this.isUploading) return;
        
        const validFiles = Array.from(files).filter(file => this.validateFile(file));
        
        if (validFiles.length === 0) {
            this.showNotification('No valid files selected. Please choose PDF, DOCX, TXT, MD, XLSX, or CSV files.', 'error');
            return;
        }
        
        // Process files one by one
        for (const file of validFiles) {
            await this.uploadDocument(file);
        }
    }
    
    validateFile(file) {
        const extension = '.' + file.name.split('.').pop().toLowerCase();
        
        if (!this.supportedFormats[extension]) {
            this.showNotification(`Unsupported file type: ${extension}`, 'error');
            return false;
        }
        
        if (this.maxFileSize && file.size > this.maxFileSize) {
            const maxSizeMB = (this.maxFileSize / (1024 * 1024)).toFixed(1);
            this.showNotification(`File too large: ${file.name}. Maximum size: ${maxSizeMB}MB`, 'error');
            return false;
        }
        
        return true;
    }
    
    async uploadDocument(file) {
        this.isUploading = true;
        
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('session_id', this.privacyChat.currentSession);
            
            const response = await fetch(`/api/document/upload?session_id=${this.privacyChat.currentSession}`, {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ detail: 'Upload failed' }));
                throw new Error(errorData.detail || 'Upload failed');
            }
            
            const result = await response.json();
            
            if (result.success) {
                // Immediately send the document content to chat
                await this.sendDocumentToChat(result.document.id);
            } else {
                throw new Error(result.error || 'Upload failed');
            }
            
        } catch (error) {
            console.error('Document upload error:', error);
            alert(`Failed to upload "${file.name}": ${error.message}`);
        } finally {
            this.isUploading = false;
        }
    }
    
    async loadDocuments() {
        try {
            const response = await fetch(`/api/document/${this.privacyChat.currentSession}`);
            if (response.ok) {
                const data = await response.json();
                this.documents = data.documents || [];
                this.activeDocument = data.active_doc;
                this.updateDocumentList();
                this.updateDocumentIndicator();
            }
        } catch (error) {
            console.error('Failed to load documents:', error);
        }
    }
    
    updateDocumentList() {
        const documentList = document.getElementById('document-list');
        const documentEmpty = document.getElementById('document-empty');
        
        if (!documentList) return;
        
        if (this.documents.length === 0) {
            if (documentEmpty) documentEmpty.style.display = 'block';
            return;
        }
        
        if (documentEmpty) documentEmpty.style.display = 'none';
        
        // Clear existing documents (except empty state)
        const existingDocs = documentList.querySelectorAll('.document-item');
        existingDocs.forEach(doc => doc.remove());
        
        // Add documents
        this.documents.forEach(doc => {
            const docElement = this.createDocumentItem(doc);
            documentList.appendChild(docElement);
        });
    }
    
    createDocumentItem(doc) {
        const isActive = doc.id === this.activeDocument;
        const uploadDate = new Date(doc.uploaded_at).toLocaleDateString();
        
        const docElement = document.createElement('div');
        docElement.className = `document-item ${isActive ? 'active' : ''}`;
        docElement.dataset.docId = doc.id;
        
        docElement.innerHTML = `
            <div class="doc-icon">
                ${this.getDocumentIcon(doc.filename)}
            </div>
            <div class="doc-content">
                <div class="doc-name" title="${doc.filename}">${this.truncateFilename(doc.filename)}</div>
                <div class="doc-info">
                    <span class="doc-size">${this.formatFileSize(doc.text_length)} chars</span>
                    <span class="doc-entities">${doc.entity_count} PII</span>
                </div>
                <div class="doc-date">${uploadDate}</div>
            </div>
            <div class="doc-actions">
                <button class="doc-action-btn doc-preview" title="Preview document">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                    </svg>
                </button>
                <button class="doc-action-btn doc-activate" title="Set as active document" ${isActive ? 'disabled' : ''}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M9 11l3 3L22 4"/>
                        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                    </svg>
                </button>
                <button class="doc-action-btn doc-delete" title="Delete document">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14zM10 11v6M14 11v6"/>
                    </svg>
                </button>
            </div>
        `;
        
        // Add event listeners
        const previewBtn = docElement.querySelector('.doc-preview');
        const activateBtn = docElement.querySelector('.doc-activate');
        const deleteBtn = docElement.querySelector('.doc-delete');
        
        if (previewBtn) {
            previewBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.previewDocument(doc.id, doc.filename);
            });
        }
        
        if (activateBtn && !isActive) {
            activateBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.setActiveDocument(doc.id);
            });
        }
        
        if (deleteBtn) {
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteDocument(doc.id, doc.filename);
            });
        }
        
        // Click to activate document
        docElement.addEventListener('click', () => {
            if (!isActive) this.setActiveDocument(doc.id);
        });
        
        return docElement;
    }
    
    getDocumentIcon(filename) {
        const extension = filename.split('.').pop().toLowerCase();
        const icons = {
            'pdf': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="9" y1="15" x2="15" y2="15"/></svg>',
            'docx': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="9" y1="9" x2="10" y2="9"/></svg>',
            'xlsx': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><path d="M9 9h6v6H9z"/></svg>',
            'txt': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>',
            'md': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/><path d="M10 13l-2 2 2 2"/></svg>',
            'csv': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/><path d="M9 15h6M9 18h6"/></svg>'
        };
        return icons[extension] || icons['txt'];
    }
    
    truncateFilename(filename, maxLength = 20) {
        if (filename.length <= maxLength) return filename;
        const extension = filename.split('.').pop();
        const name = filename.substring(0, filename.lastIndexOf('.'));
        const truncatedName = name.substring(0, maxLength - extension.length - 4);
        return `${truncatedName}...${extension}`;
    }
    
    formatFileSize(bytes) {
        if (bytes < 1000) return `${bytes}`;
        if (bytes < 1000000) return `${(bytes / 1000).toFixed(1)}k`;
        return `${(bytes / 1000000).toFixed(1)}M`;
    }
    
    async setActiveDocument(docId) {
        try {
            const response = await fetch(`/api/document/${this.privacyChat.currentSession}/set-active/${docId}`, {
                method: 'POST'
            });
            
            if (response.ok) {
                this.activeDocument = docId;
                this.updateDocumentList();
                this.updateDocumentIndicator();
                
                // Find document details
                const doc = this.documents.find(d => d.id === docId);
                if (doc) {
                    this.showNotification(`Active document: ${doc.filename} 📄`, 'success');
                    this.addDocumentActiveMessage(doc);
                }
            }
        } catch (error) {
            console.error('Failed to set active document:', error);
            this.showNotification('Failed to activate document', 'error');
        }
    }
    
    async deleteDocument(docId, filename) {
        if (!confirm(`Are you sure you want to delete "${filename}"?`)) return;
        
        try {
            const response = await fetch(`/api/document/${this.privacyChat.currentSession}/${docId}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                await this.loadDocuments();
                this.showNotification(`Document "${filename}" deleted`, 'info');
                
                if (docId === this.activeDocument) {
                    this.updateDocumentIndicator();
                }
            }
        } catch (error) {
            console.error('Failed to delete document:', error);
            this.showNotification('Failed to delete document', 'error');
        }
    }
    
    clearActiveDocument() {
        this.activeDocument = null;
        this.updateDocumentList();
        this.updateDocumentIndicator();
        // Could add API call to clear active document on backend
    }
    
    updateDocumentIndicator() {
        const indicator = document.getElementById('document-indicator');
        if (!indicator) return;
        
        // Also update badges in input areas
        this.updateInputAreaBadges();
        
        if (!this.activeDocument) {
            indicator.style.display = 'none';
            return;
        }
        
        const activeDoc = this.documents.find(d => d.id === this.activeDocument);
        if (!activeDoc) {
            indicator.style.display = 'none';
            return;
        }
        
        const docName = indicator.querySelector('.doc-name');
        const docInfo = indicator.querySelector('.doc-info');
        
        if (docName && docInfo) {
            docName.textContent = activeDoc.filename;
            docInfo.textContent = `${activeDoc.word_count} words • ${activeDoc.entity_count} PII entities detected`;
        }
        
        indicator.style.display = 'flex';
    }
    
    updateInputAreaBadges() {
        // Remove existing badges
        document.querySelectorAll('.active-document-badge').forEach(badge => badge.remove());
        
        if (!this.activeDocument) return;
        
        const activeDoc = this.documents.find(d => d.id === this.activeDocument);
        if (!activeDoc) return;
        
        // Add badge to centered input
        const centeredInputBox = document.querySelector('#centered-input .input-box');
        if (centeredInputBox) {
            const badge = this.createDocumentBadge(activeDoc);
            centeredInputBox.appendChild(badge);
        }
        
        // Add badge to bottom input
        const bottomInputBox = document.querySelector('#bottom-input .input-box');
        if (bottomInputBox) {
            const badge = this.createDocumentBadge(activeDoc);
            bottomInputBox.appendChild(badge);
        }
    }
    
    createDocumentBadge(doc) {
        const badge = document.createElement('div');
        badge.className = 'active-document-badge';
        badge.innerHTML = `
            📄 ${this.truncateFilename(doc.filename, 20)}
            <button class="close-badge" title="Remove document">✕</button>
        `;
        
        badge.querySelector('.close-badge').addEventListener('click', () => {
            this.clearActiveDocument();
        });
        
        return badge;
    }
    
    addDocumentUploadMessage(docInfo) {
        const messageHtml = `
            <div class="system-message document-upload">
                <div class="system-icon">📄</div>
                <div class="system-content">
                    <strong>Document uploaded:</strong> ${docInfo.filename}<br>
                    <small>${docInfo.word_count} words • ${docInfo.entity_count} PII entities detected</small><br>
                    <small>You can now ask questions about this document!</small>
                </div>
            </div>
        `;
        
        if (this.privacyChat && this.privacyChat.elements.chatMessages) {
            this.privacyChat.elements.chatMessages.insertAdjacentHTML('beforeend', messageHtml);
            this.privacyChat.scrollToBottom();
        }
    }
    
    addDocumentActiveMessage(docInfo) {
        const messageHtml = `
            <div class="system-message document-active">
                <div class="system-icon">✅</div>
                <div class="system-content">
                    <strong>Active document:</strong> ${docInfo.filename}<br>
                    <small>AI can now reference this document in responses</small>
                </div>
            </div>
        `;
        
        if (this.privacyChat && this.privacyChat.elements.chatMessages) {
            this.privacyChat.elements.chatMessages.insertAdjacentHTML('beforeend', messageHtml);
            this.privacyChat.scrollToBottom();
        }
    }
    
    showUploadStatus(show, message = '') {
        const statusDiv = document.getElementById('document-status');
        if (!statusDiv) return;
        
        if (show) {
            statusDiv.querySelector('.status-text').textContent = message;
            statusDiv.style.display = 'flex';
        } else {
            statusDiv.style.display = 'none';
        }
    }
    
    showNotification(message, type = 'info') {
        // Use the same notification system as the entity dictionary
        if (window.EntityDictionaryManager) {
            const entityDict = new window.EntityDictionaryManager();
            entityDict.showNotification(message, type);
        } else {
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    }
    
    // Public API for privacy chat integration
    hasActiveDocument() {
        return this.activeDocument !== null;
    }
    
    getActiveDocument() {
        return this.documents.find(d => d.id === this.activeDocument);
    }
    
    refreshDocuments() {
        return this.loadDocuments();
    }
    
    async previewDocument(docId, filename) {
        try {
            // Fetch full document content
            const response = await fetch(`/api/document/${this.privacyChat.currentSession}/${docId}`);
            if (!response.ok) throw new Error('Failed to fetch document');
            
            const docData = await response.json();
            
            // Create and show preview modal
            this.showDocumentPreview(docData);
            
        } catch (error) {
            console.error('Failed to preview document:', error);
            this.showNotification('Failed to load document preview', 'error');
        }
    }
    
    showDocumentPreview(docData) {
        // Remove existing preview modal
        const existingModal = document.getElementById('document-preview-modal');
        if (existingModal) existingModal.remove();
        
        // Create modal
        const modal = document.createElement('div');
        modal.id = 'document-preview-modal';
        modal.className = 'document-preview-modal';
        
        // Detect text direction
        const hasArabic = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(docData.original_text);
        const textDirection = hasArabic ? 'rtl' : 'ltr';
        
        modal.innerHTML = `
            <div class="preview-backdrop" onclick="this.closest('.document-preview-modal').remove()"></div>
            <div class="preview-container">
                <div class="preview-header">
                    <div class="preview-title">
                        <div class="preview-icon">
                            ${this.getDocumentIcon(docData.filename)}
                        </div>
                        <div class="preview-title-text">
                            <h3>${docData.filename}</h3>
                            <p>${docData.word_count} words • ${Object.values(docData.entity_counts || {}).reduce((a, b) => a + b, 0)} PII entities</p>
                        </div>
                    </div>
                    <div class="preview-actions">
                        <button class="preview-toggle-btn" onclick="this.closest('.preview-container').classList.toggle('show-original')" title="Toggle PII visibility">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                <circle cx="12" cy="12" r="3"/>
                            </svg>
                            <span>Show Original</span>
                        </button>
                        <button class="preview-close-btn" onclick="this.closest('.document-preview-modal').remove()" title="Close preview">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="18" y1="6" x2="6" y2="18"/>
                                <line x1="6" y1="6" x2="18" y2="18"/>
                            </svg>
                        </button>
                    </div>
                </div>
                
                <div class="preview-content">
                    <div class="preview-text highlighted-version" style="direction: ${textDirection}; text-align: ${textDirection === 'rtl' ? 'right' : 'left'}">
                        ${docData.highlighted_text}
                    </div>
                    <div class="preview-text original-version" style="direction: ${textDirection}; text-align: ${textDirection === 'rtl' ? 'right' : 'left'}">
                        ${this.escapeHtml(docData.original_text)}
                    </div>
                </div>
                
                <div class="preview-footer">
                    <div class="preview-stats">
                        <div class="stat-item">
                            <span class="stat-label">Characters:</span>
                            <span class="stat-value">${docData.text_length.toLocaleString()}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Words:</span>
                            <span class="stat-value">${docData.word_count.toLocaleString()}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">PII Entities:</span>
                            <span class="stat-value">${Object.values(docData.entity_counts || {}).reduce((a, b) => a + b, 0)}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Uploaded:</span>
                            <span class="stat-value">${new Date(docData.uploaded_at).toLocaleDateString()}</span>
                        </div>
                    </div>
                    
                    ${Object.keys(docData.entity_counts || {}).length > 0 ? `
                    <div class="preview-entities">
                        <h4>Detected PII Types:</h4>
                        <div class="entity-tags">
                            ${Object.entries(docData.entity_counts || {}).map(([type, count]) => `
                                <span class="entity-tag entity-${type.toLowerCase()}">${type}: ${count}</span>
                            `).join('')}
                        </div>
                    </div>
                    ` : ''}
                    
                    <div class="preview-actions-footer">
                        <button class="btn-secondary" onclick="this.closest('.document-preview-modal').remove()">Close</button>
                        <button class="btn-primary" onclick="window.documentManager.setActiveDocument('${docData.id}').then(() => this.closest('.document-preview-modal').remove())">Set as Active</button>
                    </div>
                </div>
            </div>
        `;
        
        // Add modal to body
        document.body.appendChild(modal);
        
        // Add CSS classes for PII entities
        this.addPIIEntityStyles();
        
        // Animate in
        requestAnimationFrame(() => {
            modal.classList.add('show');
        });
        
        // Close on Escape key
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                modal.remove();
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);
    }
    
    addPIIEntityStyles() {
        const existingStyles = document.getElementById('pii-entity-styles');
        if (existingStyles) return;
        
        const style = document.createElement('style');
        style.id = 'pii-entity-styles';
        style.textContent = `
            .entity-highlight {
                padding: 2px 4px;
                border-radius: 3px;
                font-weight: 500;
            }
            .entity-per { background: rgba(59, 130, 246, 0.2); color: #3b82f6; }
            .entity-loc { background: rgba(16, 185, 129, 0.2); color: #10b981; }
            .entity-org { background: rgba(245, 158, 11, 0.2); color: #f59e0b; }
            .entity-email { background: rgba(139, 92, 246, 0.2); color: #8b5cf6; }
            .entity-phone { background: rgba(6, 182, 212, 0.2); color: #06b6d4; }
            .entity-url { background: rgba(239, 68, 68, 0.2); color: #ef4444; }
            .entity-civil-id { background: rgba(34, 197, 94, 0.2); color: #22c55e; }
            .entity-passport-id { background: rgba(168, 85, 247, 0.2); color: #a855f7; }
            .entity-credit-card { background: rgba(236, 72, 153, 0.2); color: #ec4899; }
        `;
        document.head.appendChild(style);
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    async sendDocumentToChat(docId) {
        try {
            // Get the document content
            const response = await fetch(`/api/document/${this.privacyChat.currentSession}/${docId}`);
            if (!response.ok) throw new Error('Failed to fetch document');
            
            const docData = await response.json();
            
            // Simply send the document text as a user message
            // The PII detection will happen automatically in the privacy chat API
            const documentMessage = docData.original_text;
            
            // Send as a regular message through the chat system
            if (this.privacyChat && this.privacyChat.sendMessageProgrammatically) {
                this.privacyChat.sendMessageProgrammatically(documentMessage);
            } else {
                // Fallback: set the message in input and trigger send
                const input = document.getElementById('message-input') || 
                            document.querySelector('.message-input');
                if (input) {
                    input.value = documentMessage;
                    this.privacyChat.sendMessage();
                }
            }
            
        } catch (error) {
            console.error('Failed to send document to chat:', error);
            this.showNotification('Failed to send document to chat', 'error');
        }
    }
    
    async sendDocumentMessageDirectly(message) {
        try {
            // Send message directly to the privacy chat API
            const response = await fetch('/api/privacy-chat/stream', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: message,
                    session_id: this.privacyChat.currentSession
                })
            });
            
            if (!response.ok) {
                throw new Error('Failed to send message');
            }
            
            // Handle the streaming response
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let aiResponse = '';
            
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                
                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');
                
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const data = JSON.parse(line.slice(6));
                            if (data.type === 'chunk') {
                                aiResponse += data.unmasked_chunk || data.masked_chunk || '';
                            }
                        } catch (e) {
                            // Ignore JSON parse errors
                        }
                    }
                }
            }
            
            // Add the AI response to the chat
            if (aiResponse && this.privacyChat && this.privacyChat.elements && this.privacyChat.elements.chatMessages) {
                const messageHtml = `
                    <div class="message assistant-message">
                        <div class="message-avatar">🤖</div>
                        <div class="message-content">
                            <div class="message-text">${this.escapeHtml(aiResponse)}</div>
                        </div>
                    </div>
                `;
                this.privacyChat.elements.chatMessages.insertAdjacentHTML('beforeend', messageHtml);
                this.privacyChat.scrollToBottom();
            }
            
        } catch (error) {
            console.error('Failed to send document message directly:', error);
        }
    }
}

// Initialize document manager when privacy chat is ready
document.addEventListener('DOMContentLoaded', () => {
    // Wait for privacy chat to be initialized
    const initDocumentManager = () => {
        if (window.privacyChat) {
            window.documentManager = new DocumentManager(window.privacyChat);
            window.privacyChat.documentManager = window.documentManager;
            console.log('Document manager initialized with privacy chat');
        } else {
            // Retry after a short delay
            setTimeout(initDocumentManager, 100);
        }
    };
    
    initDocumentManager();
});