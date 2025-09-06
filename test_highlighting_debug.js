// Test the highlighting function directly
function testHighlightStreamingEntities() {
    
    // Copy the exact function from the code
    function highlightStreamingEntities(text) {
        // Provide real-time highlighting during streaming for common PII patterns
        // Enhanced to handle both Arabic and English content
        
        // Store original text to avoid re-escaping HTML entities
        let highlightedText = text;
        
        console.log('Input text:', text);
        
        // Email pattern - works for both Arabic and English contexts
        highlightedText = highlightedText.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, (match) => {
            console.log('Found email:', match);
            return `<span class="pii-entity pii-email">${match}</span>`;
        });
        
        // Phone pattern (various formats including Arabic numerals)
        highlightedText = highlightedText.replace(/[\u0660-\u0669\d]{3,}[-\s.]?[\u0660-\u0669\d]{3,}[-\s.]?[\u0660-\u0669\d]{4,}/g, (match) => {
            console.log('Found Arabic phone:', match);
            return `<span class="pii-entity pii-phone">${match}</span>`;
        });
        
        // Also match standard phone patterns
        highlightedText = highlightedText.replace(/\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}\b/g, (match) => {
            const digits = match.replace(/\D/g, '');
            if (digits.length >= 7) {
                console.log('Found phone:', match);
                return `<span class="pii-entity pii-phone">${match}</span>`;
            }
            return match;
        });
        
        // English names pattern
        highlightedText = highlightedText.replace(/\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/g, (match) => {
            const excludePatterns = ['The United', 'United States', 'New York', 'Los Angeles'];
            if (!excludePatterns.some(pattern => match.includes(pattern))) {
                console.log('Found name:', match);
                return `<span class="pii-entity pii-person">${match}</span>`;
            }
            return match;
        });
        
        console.log('Output:', highlightedText);
        return highlightedText;
    }
    
    // Test cases
    console.log('\n=== Testing Email ===');
    console.log(highlightStreamingEntities('My email is john@test.com'));
    
    console.log('\n=== Testing Name ===');  
    console.log(highlightStreamingEntities('Hello John Smith'));
    
    console.log('\n=== Testing Combined ===');
    console.log(highlightStreamingEntities('Nice to meet you, John Smith! How can I help with john@test.com?'));
    
    console.log('\n=== Testing Incremental (as streaming would work) ===');
    const streamingText = 'Nice to meet you, John Smith! How can I help with john@test.com?';
    const words = streamingText.split(' ');
    let buildingText = '';
    
    for (let i = 0; i < words.length; i++) {
        buildingText += (i > 0 ? ' ' : '') + words[i];
        console.log(`Word ${i+1}:`, highlightStreamingEntities(buildingText));
    }
}

// Run the test
testHighlightStreamingEntities();