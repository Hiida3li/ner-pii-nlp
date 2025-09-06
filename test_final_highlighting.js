// Test the final, highly accurate highlighting function
function testFinalHighlighting() {
    function highlightStreamingEntities(text) {
        console.log('highlightStreamingEntities called with:', text);
        
        if (text.includes('<span class=\"pii-entity')) {
            return text;
        }
        
        let highlightedText = text;\n        \n        // Email pattern - most reliable\n        highlightedText = highlightedText.replace(/\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b/g, (match) => {\n            console.log('Highlighting email:', match);\n            return `<span class=\"pii-entity pii-email\">${match}</span>`;\n        });\n        \n        // Names - VERY restrictive approach\n        const namePatterns = [\n            // After contact/call/email context words\n            /\\b(?:contact|call|email|reach|meet)\\s+([A-Z][a-z]{2,}\\s+[A-Z][a-z]{2,})\\b/gi,\n            // After \"I am\" or \"My name is\"\n            /\\b(?:I am|my name is|this is)\\s+([A-Z][a-z]{2,}\\s+[A-Z][a-z]{2,})\\b/gi,\n            // After \"Dear\" in formal contexts\n            /\\bDear\\s+([A-Z][a-z]{2,}\\s+[A-Z][a-z]{2,})\\b/gi,\n            // Standalone names in clear contexts\n            /\\b([A-Z][a-z]{2,}\\s+[A-Z][a-z]{2,})\\s+(?:said|wrote|called|emailed|works|lives)\\b/gi\n        ];\n        \n        namePatterns.forEach(pattern => {\n            highlightedText = highlightedText.replace(pattern, (fullMatch, nameMatch) => {\n                console.log('Highlighting contextual name:', nameMatch);\n                return fullMatch.replace(nameMatch, `<span class=\"pii-entity pii-person\">${nameMatch}</span>`);\n            });\n        });\n        \n        // For standalone names, be extremely careful\n        highlightedText = highlightedText.replace(/\\b([A-Z][a-z]{2,}\\s+[A-Z][a-z]{2,})(?=\\s*[.!,]|\\s*$|\\s+(?:at|from|in|on|with)\\b)/g, (match) => {\n            const excludeList = [\n                'New York', 'Los Angeles', 'San Francisco', 'Las Vegas', 'Salt Lake',\n                'Dear Sir', 'Thank You', 'Best Regards', 'Good Morning', 'Good Evening',\n                'Hello There', 'Nice Meeting', 'Great Job', 'Contact Us', 'Call Us',\n                'Email Us', 'Visit Us', 'Join Us', 'Follow Us', 'See You'\n            ];\n            \n            if (!excludeList.includes(match)) {\n                const words = match.split(' ');\n                const commonNonNames = ['Contact', 'Email', 'Call', 'Visit', 'Hello', 'Thank', 'Best', 'Good', 'Nice', 'Great', 'Please', 'Can', 'Will', 'Should', 'Must', 'Have', 'Need'];\n                \n                if (!commonNonNames.includes(words[0])) {\n                    console.log('Highlighting standalone name:', match);\n                    return `<span class=\"pii-entity pii-person\">${match}</span>`;\n                }\n            }\n            return match;\n        });
        
        if (highlightedText !== text) {
            console.log('Final result:', highlightedText);
        }
        
        return highlightedText;
    }
    
    // Comprehensive test cases
    const testCases = [
        'My email is john@test.com',
        'Hello John',  // Should NOT highlight
        'Contact John Smith',  // Should highlight John Smith
        'Meet John Smith at the office',  // Should highlight John Smith
        'John Smith works here',  // Should highlight John Smith
        'Nice to meet you! Contact John Smith at john@test.com',
        'I am Mary Johnson',  // Should highlight Mary Johnson
        'Thank You Very Much',  // Should NOT highlight
        'Good Morning Everyone',  // Should NOT highlight
        'Visit New York',  // Should NOT highlight
        'Dear Sarah Williams,',  // Should highlight Sarah Williams
        'Hello there! My name is David Brown and my email is david@test.com'
    ];
    
    testCases.forEach((test, i) => {
        console.log(`\\n=== Test ${i+1}: "${test}" ===`);
        const result = highlightStreamingEntities(test);
        console.log('Result:', result);
    });
    
    console.log('\\n=== Streaming Simulation ===');
    const streamText = 'Nice to meet you! Contact John Smith at john@test.com';
    const words = streamText.split(' ');
    let building = '';
    
    for (let i = 0; i < words.length; i++) {\n        building += (i > 0 ? ' ' : '') + words[i];\n        const result = highlightStreamingEntities(building);\n        const hasHighlight = result !== building;\n        console.log(`Step ${i+1}: "${building}" ${hasHighlight ? '→ HIGHLIGHTED' : '→ no change'}`);\n        if (hasHighlight) console.log(`  Result: "${result}"`);\n    }
}

testFinalHighlighting();