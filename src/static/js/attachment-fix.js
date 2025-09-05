// Force attachments to stay inside message bubbles
(function() {
    'use strict';
    
    function fixAttachmentPlacement() {
        // Find all message attachments
        const attachments = document.querySelectorAll('.message-attachments');
        
        attachments.forEach(attachment => {
            // Find the parent message content
            const messageContent = attachment.closest('.message-content');
            const messageWrapper = attachment.closest('.message-wrapper');
            
            if (messageWrapper && messageContent) {
                // Check if attachment is not inside message-content
                if (attachment.parentElement !== messageContent) {
                    console.log('Fixing attachment placement...');
                    
                    // Find message text
                    const messageText = messageContent.querySelector('.message-text');
                    
                    // Move attachment inside message-content, before the text
                    if (messageText) {
                        messageContent.insertBefore(attachment, messageText);
                    } else {
                        messageContent.appendChild(attachment);
                    }
                }
                
                // Apply inline styles to ensure proper display
                attachment.style.display = 'block';
                attachment.style.margin = '0 0 8px 0';
                attachment.style.padding = '0';
                attachment.style.background = 'none';
                attachment.style.border = 'none';
                attachment.style.width = 'auto';
                attachment.style.position = 'static';
                
                // Style the card
                const card = attachment.querySelector('.document-attachment-card');
                if (card) {
                    card.style.display = 'inline-block';
                    card.style.background = 'rgba(139, 92, 246, 0.1)';
                    card.style.border = '1px solid rgba(139, 92, 246, 0.2)';
                    card.style.borderRadius = '6px';
                    card.style.padding = '6px 10px';
                    card.style.fontSize = '12px';
                    card.style.maxWidth = '100%';
                    card.style.boxSizing = 'border-box';
                    card.style.margin = '0';
                }
            }
        });
    }
    
    // Run fix immediately
    fixAttachmentPlacement();
    
    // Watch for new messages
    const observer = new MutationObserver((mutations) => {
        let shouldFix = false;
        mutations.forEach(mutation => {
            if (mutation.addedNodes.length > 0) {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === 1 && (
                        node.classList?.contains('message-wrapper') ||
                        node.querySelector?.('.message-attachments')
                    )) {
                        shouldFix = true;
                    }
                });
            }
        });
        
        if (shouldFix) {
            setTimeout(fixAttachmentPlacement, 50);
        }
    });
    
    // Start observing
    const chatMessages = document.querySelector('.chat-messages');
    if (chatMessages) {
        observer.observe(chatMessages, {
            childList: true,
            subtree: true
        });
    }
    
    // Also fix on various events
    document.addEventListener('DOMContentLoaded', fixAttachmentPlacement);
    window.addEventListener('load', fixAttachmentPlacement);
    
    // Fix periodically for safety
    setInterval(fixAttachmentPlacement, 500);
    
    // Also intercept any DOM manipulation that might mess with attachments
    const originalAppendChild = Node.prototype.appendChild;
    const originalInsertBefore = Node.prototype.insertBefore;
    
    Node.prototype.appendChild = function(...args) {
        const result = originalAppendChild.apply(this, args);
        if (args[0]?.classList?.contains('message-attachments')) {
            setTimeout(fixAttachmentPlacement, 10);
        }
        return result;
    };
    
    Node.prototype.insertBefore = function(...args) {
        const result = originalInsertBefore.apply(this, args);
        if (args[0]?.classList?.contains('message-attachments')) {
            setTimeout(fixAttachmentPlacement, 10);
        }
        return result;
    };
    
    console.log('Attachment fix script loaded and running');
})();