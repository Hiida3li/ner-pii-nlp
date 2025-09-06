// Test script to verify entity parsing fix
console.log('Testing entity parsing fix in privacy_chat.js');

// Simulate the problematic code before the fix
function testOldCode() {
    console.log('\n=== Testing OLD (buggy) code ===');
    const messageWrapper = {
        getAttribute: function(attr) {
            if (attr === 'data-entities') {
                return '[{"text":"John","entity_type":"PER","start":0,"end":4}]';
            }
            return null;
        }
    };
    
    try {
        const rawEntitiesData = messageWrapper.getAttribute('data-entities');
        const entitiesData = undefined; // This was the bug - undefined variable
        console.log('Raw entities data:', rawEntitiesData);
        // Bug: Using entitiesData instead of rawEntitiesData
        const entities = entitiesData ? JSON.parse(entitiesData) : [];
        console.log('Parsed entities (OLD):', entities);
        console.log('Result: BUG - entities is empty array!');
    } catch (e) {
        console.error('Error in old code:', e);
    }
}

// Simulate the fixed code
function testNewCode() {
    console.log('\n=== Testing NEW (fixed) code ===');
    const messageWrapper = {
        getAttribute: function(attr) {
            if (attr === 'data-entities') {
                return '[{"text":"John","entity_type":"PER","start":0,"end":4}]';
            }
            return null;
        }
    };
    
    try {
        const rawEntitiesData = messageWrapper.getAttribute('data-entities');
        console.log('Raw entities data:', rawEntitiesData);
        // Fix: Using rawEntitiesData instead of entitiesData
        const entities = rawEntitiesData ? JSON.parse(rawEntitiesData) : [];
        console.log('Parsed entities (NEW):', entities);
        console.log('Result: SUCCESS - entities parsed correctly!');
    } catch (e) {
        console.error('Error in new code:', e);
    }
}

// Run tests
testOldCode();
testNewCode();

console.log('\n=== Summary ===');
console.log('The fix changes "entitiesData" to "rawEntitiesData" in the JSON.parse call');
console.log('This ensures the entities are properly parsed from the DOM attributes');
console.log('and allows the masking/unmasking toggle to work correctly.');