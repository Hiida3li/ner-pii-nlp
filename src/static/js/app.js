/**
 * PII-Shield Pro - Advanced JavaScript Application
 * Modern ES6+ implementation with enhanced UX features
 */

class PIIShieldApp {
    constructor() {
        this.elements = {};
        this.state = {
            isProcessing: false,
            lastAnalysis: null,
            savedInput: '',
            totalEntities: 0,
            analysisHistory: []
        };
        
        this.entityConfig = {
            'PER': { color: '#667eea', emoji: '👤', name: 'Person', description: 'Personal names and identities' },
            'LOC': { color: '#764ba2', emoji: '📍', name: 'Location', description: 'Addresses and geographic locations' },
            'ORG': { color: '#f093fb', emoji: '🏢', name: 'Organization', description: 'Company and institution names' },
            'URL': { color: '#f5576c', emoji: '🔗', name: 'URL', description: 'Web addresses and links' },
            'EMAIL': { color: '#4facfe', emoji: '📧', name: 'Email', description: 'Email addresses' },
            'PHONE': { color: '#00f2fe', emoji: '📱', name: 'Phone', description: 'Phone and mobile numbers' },
            'CIVIL-ID': { color: '#43e97b', emoji: '🪪', name: 'Civil ID', description: 'Government identification numbers' },
            'PASSPORT-ID': { color: '#38f9d7', emoji: '🛂', name: 'Passport', description: 'Passport identification' },
            'CREDIT-CARD': { color: '#fa709a', emoji: '💳', name: 'Credit Card', description: 'Payment card information' }
        };
        
        this.init();
    }
    
    async init() {
        try {
            await this.cacheElements();
            await this.initModels();
            this.setupEventListeners();
            this.restoreState();
            this.initTooltips();
            this.setupKeyboardShortcuts();
            
            console.log('🚀 PII-Shield Pro initialized successfully');
        } catch (error) {
            console.error('❌ Initialization failed:', error);
            this.showError('Application initialization failed. Please refresh the page.');
        }
    }
    
    cacheElements() {
        const elementIds = [
            'extract-btn', 'clear-btn', 'input-text', 'result-text', 
            'model-selector', 'entity-badges', 'entity-stats',
            'total-counter', 'total-count'
        ];
        
        elementIds.forEach(id => {
            this.elements[id] = document.getElementById(id);
        });
        
        // Validate required elements
        const required = ['extract-btn', 'input-text', 'result-text'];
        const missing = required.filter(id => !this.elements[id]);
        
        if (missing.length > 0) {
            throw new Error(`Missing required elements: ${missing.join(', ')}`);
        }
    }
    
    async initModels() {
        try {
            const response = await fetch('/api/models');
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const data = await response.json();
            
            if (this.elements['model-selector'] && data.models) {
                this.populateModelSelector(data.models);
            }
        } catch (error) {
            console.warn('Could not load model information:', error);
            // Continue with default options if API fails
        }
    }
    
    populateModelSelector(models) {
        const selector = this.elements['model-selector'];
        selector.innerHTML = '';
        
        Object.entries(models).forEach(([version, modelInfo]) => {
            const option = document.createElement('option');
            option.value = version;
            option.textContent = modelInfo.name || version;
            option.title = modelInfo.description || '';
            
            if (version === 'v2') option.selected = true; // Default to v2
            selector.appendChild(option);
        });
    }
    
    setupEventListeners() {
        // Main action buttons
        this.elements['extract-btn']?.addEventListener('click', () => this.handleExtract());
        this.elements['clear-btn']?.addEventListener('click', () => this.handleClear());
        
        // Input auto-save
        this.elements['input-text']?.addEventListener('input', 
            this.debounce(() => this.saveInput(), 300)
        );
        
        // Model selector change
        this.elements['model-selector']?.addEventListener('change', () => {
            this.showModelInfo();
        });
        
        // Prevent form submission on Enter
        this.elements['input-text']?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                this.handleExtract();
            }
        });
    }
    
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 'Enter':
                        e.preventDefault();
                        if (!this.state.isProcessing) this.handleExtract();
                        break;
                    case 'k':
                        e.preventDefault();
                        this.handleClear();
                        break;
                }
            }
        });
    }
    
    initTooltips() {
        // Add tooltips to buttons
        const tooltips = {
            'extract-btn': 'Analyze text for PII (Ctrl+Enter)',
            'clear-btn': 'Clear all content (Ctrl+K)',
            'model-selector': 'Choose AI model for analysis'
        };
        
        Object.entries(tooltips).forEach(([id, tooltip]) => {
            const element = this.elements[id];
            if (element) {
                element.title = tooltip;
                element.setAttribute('data-tooltip', tooltip);
            }
        });
    }
    
    async handleExtract() {
        if (this.state.isProcessing) return;
        
        const text = this.elements['input-text']?.value.trim();
        if (!text) {
            this.showValidationError('Please enter some text to analyze');
            return;
        }
        
        this.state.isProcessing = true;
        this.setLoadingState(true);
        
        try {
            const modelVersion = this.elements['model-selector']?.value || 'v2';
            
            const response = await fetch('/api/extract', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify({
                    text: text,
                    model_version: modelVersion
                })
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }
            
            const data = await response.json();
            
            // Store analysis
            this.state.lastAnalysis = {
                timestamp: Date.now(),
                model: modelVersion,
                results: data,
                textLength: text.length
            };
            
            // Update UI
            this.updateResults(data);
            this.updateEntityStats(data.entity_counts);
            this.updateTotalCounter(data.entity_counts);
            
            // Add to history
            this.addToHistory(this.state.lastAnalysis);
            
            // Success feedback
            this.showSuccessFeedback();
            
        } catch (error) {
            console.error('Analysis error:', error);
            this.showError(`Analysis failed: ${error.message}`);
        } finally {
            this.state.isProcessing = false;
            this.setLoadingState(false);
        }
    }
    
    handleClear() {
        // Clear input
        if (this.elements['input-text']) {
            this.elements['input-text'].value = '';
            this.elements['input-text'].focus();
        }
        
        // Reset results
        this.resetResults();
        
        // Clear state
        this.state.lastAnalysis = null;
        this.state.totalEntities = 0;
        localStorage.removeItem('pii-shield-input');
        
        // Animate clear action
        this.animateElement(this.elements['input-text'], 'fadeInScale');
    }
    
    updateResults(data) {
        const container = this.elements['result-text'];
        if (!container) return;
        
        if (data.highlighted_text) {
            container.innerHTML = `<div class="results-text">${data.highlighted_text}</div>`;
        } else {
            container.innerHTML = `
                <div class="results-empty">
                    <div class="results-empty-icon">✅</div>
                    <p><strong>No sensitive information detected</strong></p>
                    <small>Your text appears to be clean of personally identifiable information</small>
                </div>
            `;
        }
        
        this.animateElement(container, 'fadeInScale');
    }
    
    updateEntityStats(counts) {
        const container = this.elements['entity-badges'];
        const statsSection = this.elements['entity-stats'];
        
        if (!container) return;
        
        container.innerHTML = '';
        
        if (!counts || Object.keys(counts).length === 0) {
            if (statsSection) statsSection.style.display = 'none';
            return;
        }
        
        if (statsSection) statsSection.style.display = 'block';
        
        // Create entity badges with enhanced design
        Object.entries(counts).forEach(([entityType, count], index) => {
            const config = this.entityConfig[entityType] || {
                color: '#718096', 
                emoji: '🔍', 
                name: entityType, 
                description: 'Unknown entity type'
            };
            
            const badge = this.createEntityBadge(config, count);
            
            // Staggered animation
            setTimeout(() => {
                badge.style.animation = 'slideInUp 0.5s ease-out forwards';
                badge.style.opacity = '1';
            }, index * 100);
            
            container.appendChild(badge);
        });
    }
    
    createEntityBadge(config, count) {
        const badge = document.createElement('div');
        badge.className = 'stat-badge';
        badge.style.opacity = '0';
        badge.innerHTML = `
            <div class="stat-icon" style="background: ${config.color}20; color: ${config.color};">
                ${config.emoji}
            </div>
            <div class="stat-content">
                <p class="stat-label" title="${config.description}">${config.name}</p>
                <p class="stat-value">${count}</p>
            </div>
        `;
        
        // Add hover effects
        badge.addEventListener('mouseenter', () => {
            badge.style.transform = 'translateY(-4px)';
            badge.style.borderColor = config.color;
        });
        
        badge.addEventListener('mouseleave', () => {
            badge.style.transform = '';
            badge.style.borderColor = '';
        });
        
        return badge;
    }
    
    updateTotalCounter(counts) {
        const total = Object.values(counts || {}).reduce((sum, count) => sum + count, 0);
        this.state.totalEntities = total;
        
        const counter = this.elements['total-counter'];
        const countDisplay = this.elements['total-count'];
        
        if (total > 0 && counter && countDisplay) {
            counter.style.display = 'block';
            this.animateCounter(countDisplay, 0, total);
        } else if (counter) {
            counter.style.display = 'none';
        }
    }
    
    animateCounter(element, start, end) {
        const duration = 1000;
        const increment = (end - start) / (duration / 16);
        let current = start;
        
        const timer = setInterval(() => {
            current += increment;
            if (current >= end) {
                current = end;
                clearInterval(timer);
                element.classList.add('total-counter-animate');
                setTimeout(() => element.classList.remove('total-counter-animate'), 600);
            }
            element.textContent = Math.round(current);
        }, 16);
    }
    
    setLoadingState(isLoading) {
        const btn = this.elements['extract-btn'];
        if (!btn) return;
        
        if (isLoading) {
            btn.disabled = true;
            btn.innerHTML = `
                <div class="loading-spinner"></div>
                <span>Analyzing...</span>
            `;
            btn.style.cursor = 'not-allowed';
        } else {
            btn.disabled = false;
            btn.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 12L11 14L15 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <span>Analyze Text</span>
            `;
            btn.style.cursor = 'pointer';
        }
    }
    
    resetResults() {
        if (this.elements['result-text']) {
            this.elements['result-text'].innerHTML = `
                <div class="results-empty">
                    <div class="results-empty-icon">🔍</div>
                    <p>Enter text above to start PII analysis</p>
                    <small>Our AI will detect and highlight sensitive information</small>
                </div>
            `;
        }
        
        if (this.elements['entity-badges']) {
            this.elements['entity-badges'].innerHTML = '';
        }
        
        if (this.elements['entity-stats']) {
            this.elements['entity-stats'].style.display = 'none';
        }
        
        if (this.elements['total-counter']) {
            this.elements['total-counter'].style.display = 'none';
        }
    }
    
    showValidationError(message) {
        const container = this.elements['result-text'];
        if (!container) return;
        
        container.innerHTML = `
            <div class="alert-error">
                <div class="alert-icon">⚠️</div>
                <div class="alert-content">
                    <strong>Input Required</strong>
                    <p>${message}</p>
                </div>
            </div>
        `;
        
        this.animateElement(container, 'pulse');
        
        // Focus input
        setTimeout(() => this.elements['input-text']?.focus(), 100);
    }
    
    showError(message) {
        const container = this.elements['result-text'];
        if (!container) return;
        
        container.innerHTML = `
            <div class="alert-error">
                <div class="alert-icon">❌</div>
                <div class="alert-content">
                    <strong>Analysis Failed</strong>
                    <p>${message}</p>
                    <small>Please try again or contact support if the issue persists.</small>
                </div>
            </div>
        `;
        
        this.animateElement(container, 'fadeInScale');
    }
    
    showSuccessFeedback() {
        const btn = this.elements['extract-btn'];
        if (btn) {
            btn.style.animation = 'glow 0.8s ease-out';
            setTimeout(() => btn.style.animation = '', 800);
        }
    }
    
    saveInput() {
        const text = this.elements['input-text']?.value || '';
        this.state.savedInput = text;
        
        if (text.trim()) {
            localStorage.setItem('pii-shield-input', text);
        } else {
            localStorage.removeItem('pii-shield-input');
        }
    }
    
    restoreState() {
        const savedInput = localStorage.getItem('pii-shield-input');
        if (savedInput && this.elements['input-text']) {
            this.elements['input-text'].value = savedInput;
            this.state.savedInput = savedInput;
        }
    }
    
    addToHistory(analysis) {
        this.state.analysisHistory.unshift(analysis);
        if (this.state.analysisHistory.length > 10) {
            this.state.analysisHistory = this.state.analysisHistory.slice(0, 10);
        }
    }
    
    showModelInfo() {
        const selector = this.elements['model-selector'];
        if (!selector) return;
        
        const selectedOption = selector.options[selector.selectedIndex];
        if (selectedOption && selectedOption.title) {
            // Could show a tooltip or info panel here
            console.log('Model info:', selectedOption.title);
        }
    }
    
    animateElement(element, animationClass) {
        if (!element) return;
        
        element.style.animation = 'none';
        setTimeout(() => {
            element.style.animation = `${animationClass} 0.5s ease-out`;
        }, 10);
    }
    
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    // Public API methods
    getState() {
        return { ...this.state };
    }
    
    getLastAnalysis() {
        return this.state.lastAnalysis;
    }
    
    exportResults() {
        if (!this.state.lastAnalysis) return null;
        
        return {
            timestamp: this.state.lastAnalysis.timestamp,
            model: this.state.lastAnalysis.model,
            totalEntities: this.state.totalEntities,
            entityBreakdown: this.state.lastAnalysis.results.entity_counts,
            textLength: this.state.lastAnalysis.textLength
        };
    }
}

// Initialize application when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.piiShieldApp = new PIIShieldApp();
    });
} else {
    window.piiShieldApp = new PIIShieldApp();
}

// Export for potential external use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PIIShieldApp;
}
