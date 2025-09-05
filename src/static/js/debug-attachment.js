// Debug attachment placement issues
console.log('%c=== ATTACHMENT DEBUG MODE ===', 'color: #ff0000; font-size: 16px; font-weight: bold');

// Check every second
setInterval(() => {
    const attachments = document.querySelectorAll('.message-attachments');
    
    attachments.forEach((att, index) => {
        const parent = att.parentElement;
        const messageContent = att.closest('.message-content');
        const messageWrapper = att.closest('.message-wrapper');
        
        // Check if attachment is correctly placed
        const isInsideContent = parent && parent.classList.contains('message-content');
        
        if (!isInsideContent) {
            console.log(`%c❌ Attachment ${index} is OUTSIDE message-content!`, 'color: red; font-weight: bold');
            console.log('  Parent element:', parent);
            console.log('  Parent classes:', parent?.className);
            console.log('  Message content found:', messageContent);
            console.log('  Attachment HTML:', att.outerHTML.substring(0, 100) + '...');
            
            // Try to fix it
            if (messageContent) {
                console.log('%c  → Attempting to fix...', 'color: orange');
                const messageText = messageContent.querySelector('.message-text');
                messageContent.insertBefore(att, messageText);
                
                // Force styles
                att.style.cssText = 'display: block !important; margin: 0 0 8px 0 !important; padding: 0 !important; background: transparent !important; border: none !important;';
                
                console.log('%c  ✓ Fixed!', 'color: green');
            }
        } else {
            console.log(`%c✓ Attachment ${index} is correctly inside message-content`, 'color: green');
        }
    });
    
    if (attachments.length === 0) {
        console.log('No attachments found on page');
    }
}, 2000);