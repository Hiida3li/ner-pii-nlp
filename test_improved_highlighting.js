// Test the improved highlighting function
function testImprovedHighlighting() {
    // Updated function with better accuracy
    function highlightStreamingEntities(text) {
        console.log('highlightStreamingEntities called with:', text);
        
        // Avoid processing if text already contains HTML spans
        if (text.includes('<span class=\"pii-entity')) {
            console.log('Text already contains highlights, skipping');
            return text;
        }
        
        let highlightedText = text;
        
        // Email pattern - most reliable
        highlightedText = highlightedText.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, (match) => {
            console.log('Highlighting email:', match);
            return `<span class="pii-entity pii-email">${match}</span>`;
        });
        
        // Names - be more restrictive
        highlightedText = highlightedText.replace(/\b[A-Z][a-z]{2,}\s+[A-Z][a-z]{2,}\b/g, (match) => {
            const commonWords = [
                'The United', 'United States', 'New York', 'Los Angeles', 'San Francisco',
                'Hello John', 'Dear Sir', 'Thank You', 'Best Regards', 'Good Morning',
                'Nice To', 'How Are', 'Can You', 'Will You', 'What Is'
            ];
            
            const words = match.split(' ');
            const firstWord = words[0].toLowerCase();
            const commonFirstWords = ['hello', 'dear', 'hi', 'hey', 'good', 'nice', 'thank', 'best', 'how', 'what', 'can', 'will', 'please'];
            
            if (!commonWords.some(pattern => match.includes(pattern)) && !commonFirstWords.includes(firstWord)) {
                console.log('Highlighting name:', match);
                return `<span class="pii-entity pii-person">${match}</span>`;
            }
            return match;
        });
        
        if (highlightedText !== text) {
            console.log('Highlighting applied. Result:', highlightedText);
        }
        
        return highlightedText;
    }
    
    // Test cases
    console.log('\\n=== Test 1: Email only ===');
    console.log(highlightStreamingEntities('My email is john@test.com'));
    
    console.log('\\n=== Test 2: False positive greeting ===');  
    console.log(highlightStreamingEntities('Hello John'));
    
    console.log('\\n=== Test 3: Real name ===');
    console.log(highlightStreamingEntities('Contact John Smith'));
    
    console.log('\\n=== Test 4: Combined realistic ===');
    console.log(highlightStreamingEntities('Nice to meet you! Contact John Smith at john@test.com for details.'));
    
    console.log('\\n=== Test 5: Streaming simulation ===');
    const streamText = 'Nice to meet you! Contact John Smith at john@test.com';
    const words = streamText.split(' ');
    let building = '';
    
    for (let i = 0; i < words.length; i++) {
        building += (i > 0 ? ' ' : '') + words[i];
        const result = highlightStreamingEntities(building);
        console.log(`Step ${i+1}: "${building}" → "${result}"`);
    }
}

testImprovedHighlighting();