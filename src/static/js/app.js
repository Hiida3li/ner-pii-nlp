// Main application JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Initialize models dropdown
    initModelsDropdown();
    
    // Setup event listeners
    setupEventListeners();
});

/**
 * Initialize models dropdown with data from API
 */
async function initModelsDropdown() {
    try {
        const response = await fetch('/api/models');
        if (!response.ok) {
            console.error('Failed to load models');
            return;
        }
        
        const data = await response.json();
        const selector = document.getElementById('model-selector');
        
        if (selector && data.models) {
            // Clear existing options
            selector.innerHTML = '';
            
            // Add options for each model
            Object.entries(data.models).forEach(([version, modelInfo]) => {
                const option = document.createElement('option');
                option.value = version;
                option.textContent = modelInfo.name;
                selector.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading models:', error);
    }
}

/**
 * Set up event listeners for user interactions
 */
function setupEventListeners() {
    const extractBtn = document.getElementById('extract-btn');
    const clearBtn = document.getElementById('clear-btn');
    
    if (extractBtn) {
        extractBtn.addEventListener('click', handleExtract);
    }
    
    if (clearBtn) {
        clearBtn.addEventListener('click', handleClear);
    }
}

/**
 * Handle extract button click
 */
async function handleExtract() {
    const inputText = document.getElementById('input-text');
    const resultText = document.getElementById('result-text');
    const modelSelector = document.getElementById('model-selector');
    const extractBtn = document.getElementById('extract-btn');
    const entityBadges = document.getElementById('entity-badges');
    
    if (!inputText || !resultText || !modelSelector || !extractBtn || !entityBadges) {
        console.error('Required DOM elements not found');
        return;
    }
    
    const text = inputText.value.trim();
    if (!text) {
        // Show validation error
        resultText.innerHTML = '<div class="alert alert-warning">Please enter some text to analyze</div>';
        return;
    }
    
    // Show loading state
    extractBtn.disabled = true;
    extractBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Processing...';
    
    try {
        const response = await fetch('/api/extract', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                text: text,
                model_version: modelSelector.value
            })
        });
        
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Update result text
        resultText.innerHTML = data.highlighted_text || '<div class="text-muted">No entities found</div>';
        
        // Update entity stats
        updateEntityStats(data.entity_counts, entityBadges);
        
    } catch (error) {
        console.error('Error:', error);
        resultText.innerHTML = `<div class="alert alert-danger">An error occurred during processing: ${error.message}</div>`;
    } finally {
        // Reset button state
        extractBtn.disabled = false;
        extractBtn.innerHTML = 'Extract Entities';
    }
}

/**
 * Handle clear button click
 */
function handleClear() {
    const inputText = document.getElementById('input-text');
    const resultText = document.getElementById('result-text');
    const entityBadges = document.getElementById('entity-badges');
    
    if (inputText) inputText.value = '';
    if (resultText) resultText.innerHTML = '';
    if (entityBadges) entityBadges.innerHTML = '';
}

/**
 * Update entity statistics with badges
 * @param {Object} counts - Entity counts by type
 * @param {HTMLElement} container - Container for entity badges
 */
function updateEntityStats(counts, container) {
    if (!container) return;
    container.innerHTML = '';
    
    if (!counts || Object.keys(counts).length === 0) {
        return;
    }
    
    // Entity information mapping
    const ENTITY_INFO = {
        'PER': {'color': '#FF5252', 'emoji': '👤', 'name': 'Person'},
        'LOC': {'color': '#2196F3', 'emoji': '📍', 'name': 'Location'},
        'ORG': {'color': '#4CAF50', 'emoji': '🏢', 'name': 'Organization'},
        'URL': {'color': '#FF9800', 'emoji': '🔗', 'name': 'URL'},
        'EMAIL': {'color': '#9C27B0', 'emoji': '📧', 'name': 'Email'},
        'PHONE': {'color': '#FFC107', 'emoji': '📱', 'name': 'Phone'},
        'CIVIL-ID': {'color': '#009688', 'emoji': '🪪', 'name': 'Civil ID'},
        'PASSPORT-ID': {'color': '#E91E63', 'emoji': '🛂', 'name': 'Passport'},
        'CREDIT-CARD': {'color': '#673AB7', 'emoji': '💳', 'name': 'Credit Card'}
    };
    
    // Create badges for each entity type
    for (const [entityType, count] of Object.entries(counts)) {
        const info = ENTITY_INFO[entityType] || {'color': '#adb5bd', 'emoji': '🔍', 'name': entityType};
        
        const badge = document.createElement('div');
        badge.className = 'col-md-4 mb-2';
        badge.innerHTML = `
            <div style="
                background-color: ${info.color}; 
                color: white; 
                padding: 8px 12px; 
                border-radius: 20px; 
                display: flex; 
                align-items: center;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                font-size: 14px;
            ">
                <span style="font-size: 16px; margin-right: 8px;">${info.emoji}</span>
                <span style="font-weight: 500;">${info.name}</span>
                <span style="
                    background: rgba(255,255,255,0.2); 
                    padding: 2px 8px; 
                    border-radius: 10px; 
                    margin-left: 8px; 
                    font-size: 12px;
                ">${count}</span>
            </div>
        `;
        
        container.appendChild(badge);
    }
}
