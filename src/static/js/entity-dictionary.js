/**
 * Entity Dictionary Management System
 * Advanced privacy-focused entity mapping and management
 */

class EntityDictionaryManager {
    constructor() {
        this.entityMappings = new Map(); // Original -> Masked mapping
        this.reverseMappings = new Map(); // Masked -> Original mapping
        this.entityCounts = new Map(); // Type -> count for naming
        this.sessionMappings = new Map(); // Session persistent mappings
        this.currentFilter = 'all';
        this.searchTerm = '';
        this.isCollapsed = false;
        
        this.entityTypes = {
            'PER': { emoji: '👤', name: 'Person', color: '#2563eb', description: 'Personal names and identities' },
            'LOC': { emoji: '📍', name: 'Location', color: '#10b981', description: 'Addresses and geographic locations' },
            'ORG': { emoji: '🏢', name: 'Organization', color: '#f59e0b', description: 'Company and institution names' },
            'URL': { emoji: '🔗', name: 'URL', color: '#ef4444', description: 'Web addresses and links' },
            'EMAIL': { emoji: '📧', name: 'Email', color: '#8b5cf6', description: 'Email addresses' },
            'PHONE': { emoji: '📱', name: 'Phone', color: '#06b6d4', description: 'Phone and mobile numbers' },
            'CIVIL-ID': { emoji: '🪪', name: 'Civil ID', color: '#22c55e', description: 'Government identification numbers' },
            'PASSPORT-ID': { emoji: '🛂', name: 'Passport', color: '#a855f7', description: 'Passport identification' },
            'CREDIT-CARD': { emoji: '💳', name: 'Credit Card', color: '#ec4899', description: 'Payment card information' }
        };
        
        this.init();
    }
    
    init() {
        this.bindEvents();
        // Don't auto-load persisted mappings - start fresh each session
        // this.loadPersistedMappings();
        this.setupCollapsiblePanel();
    }
    
    bindEvents() {
        // Toggle dictionary panel
        const toggleBtn = document.getElementById('toggle-dictionary');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => this.togglePanel());
        }
        
        // Search functionality
        const searchInput = document.getElementById('entity-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
            searchInput.addEventListener('keyup', (e) => {
                if (e.key === 'Escape') {
                    e.target.value = '';
                    this.handleSearch('');
                }
            });
        }
        
        // Filter buttons
        const filterButtons = document.querySelectorAll('.entity-filter-btn');
        filterButtons.forEach(btn => {
            btn.addEventListener('click', () => this.handleFilter(btn.dataset.type));
        });
        
        // Dictionary actions
        const exportBtn = document.getElementById('export-dictionary');
        const importBtn = document.getElementById('import-dictionary');
        const clearBtn = document.getElementById('clear-dictionary');
        
        if (exportBtn) exportBtn.addEventListener('click', () => this.exportDictionary());
        if (importBtn) importBtn.addEventListener('click', () => this.importDictionary());
        if (clearBtn) clearBtn.addEventListener('click', () => this.clearDictionary());
    }
    
    setupCollapsiblePanel() {
        const content = document.getElementById('entity-dictionary-content');
        const toggleBtn = document.getElementById('toggle-dictionary');
        
        if (!content || !toggleBtn) return;
        
        // Load collapsed state from localStorage
        const isCollapsed = localStorage.getItem('entity-dictionary-collapsed') === 'true';
        if (isCollapsed) {
            this.togglePanel(true);
        }
    }
    
    togglePanel(forceCollapse = false) {
        const content = document.getElementById('entity-dictionary-content');
        const toggleBtn = document.getElementById('toggle-dictionary');
        const card = document.querySelector('.entity-dictionary-card');
        
        if (!content || !toggleBtn) return;
        
        this.isCollapsed = forceCollapse || !this.isCollapsed;
        
        if (this.isCollapsed) {
            content.style.maxHeight = '0';
            content.style.opacity = '0';
            content.style.padding = '0 1.5rem';
            toggleBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="18,15 12,9 6,15"></polyline></svg>';
            card.style.maxHeight = '80px';
        } else {
            content.style.maxHeight = '600px';
            content.style.opacity = '1';
            content.style.padding = '0 1.5rem 1.5rem 1.5rem';
            toggleBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6,9 12,15 18,9"></polyline></svg>';
            card.style.maxHeight = 'calc(100vh - 200px)';
        }
        
        localStorage.setItem('entity-dictionary-collapsed', this.isCollapsed);
    }
    
    generateMaskedEntity(originalText, entityType) {
        const typeInfo = this.entityTypes[entityType];
        if (!typeInfo) return `[${entityType}]`;
        
        // Get or initialize count for this entity type
        if (!this.entityCounts.has(entityType)) {
            this.entityCounts.set(entityType, 0);
        }
        
        // Check if this exact text already has a mapping
        const existingMapping = this.entityMappings.get(`${originalText}:${entityType}`);
        if (existingMapping) {
            return existingMapping;
        }
        
        // Generate new masked entity
        const count = this.entityCounts.get(entityType) + 1;
        this.entityCounts.set(entityType, count);
        
        const maskedName = `${typeInfo.name}${count}`;
        
        // Store bidirectional mappings
        const key = `${originalText}:${entityType}`;
        this.entityMappings.set(key, maskedName);
        this.reverseMappings.set(maskedName, { original: originalText, type: entityType });
        
        return maskedName;
    }
    
    processEntities(entities) {
        console.log('ProcessEntities called with', entities?.length || 0, 'entities');
        console.log('Before clear - Current mappings:', this.entityMappings.size);
        
        // Clear all previous mappings for a fresh analysis
        this.clearMappings();
        
        console.log('After clear - Current mappings:', this.entityMappings.size);
        
        if (!entities || entities.length === 0) {
            this.updateDictionaryDisplay();
            return [];
        }
        
        const processedMappings = [];
        
        // Track unique entities to avoid duplicates in the same analysis
        const uniqueEntities = new Map();
        
        // First pass: collect unique entities by text+type combination
        entities.forEach(entity => {
            const key = `${entity.text}:${entity.entity_type}`;
            if (!uniqueEntities.has(key)) {
                uniqueEntities.set(key, entity);
            }
        });
        
        // Second pass: generate masked entities only for unique entries
        uniqueEntities.forEach((entity, key) => {
            const maskedName = this.generateMaskedEntity(entity.text, entity.entity_type);
            
            processedMappings.push({
                original: entity.text,
                masked: maskedName,
                type: entity.entity_type,
                start: entity.start,
                end: entity.end,
                timestamp: new Date().toISOString()
            });
        });
        
        console.log('Unique entities processed:', uniqueEntities.size);
        console.log('Final mappings count:', this.entityMappings.size);
        
        // Update UI
        this.updateDictionaryDisplay();
        this.persistMappings();
        
        return processedMappings;
    }
    
    clearMappings() {
        // Clear all mappings and reset counts
        this.entityMappings.clear();
        this.reverseMappings.clear();
        this.entityCounts.clear();
        this.sessionMappings.clear();
        
        // Also clear from localStorage
        localStorage.removeItem('pii-shield-entity-mappings');
        
        console.log('All mappings cleared');
    }
    
    handleSearch(searchTerm) {
        this.searchTerm = searchTerm.toLowerCase();
        this.updateDictionaryDisplay();
    }
    
    handleFilter(filterType) {
        this.currentFilter = filterType;
        
        // Update button states
        document.querySelectorAll('.entity-filter-btn').forEach(btn => {
            btn.classList.remove('active');
            btn.style.background = 'var(--surface)';
            btn.style.color = 'var(--text-primary)';
        });
        
        const activeBtn = document.querySelector(`[data-type="${filterType}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
            activeBtn.style.background = 'var(--primary)';
            activeBtn.style.color = 'white';
        }
        
        this.updateDictionaryDisplay();
    }
    
    updateDictionaryDisplay() {
        const container = document.getElementById('entity-mapping-list');
        if (!container) return;
        
        const mappings = this.getFilteredMappings();
        
        if (mappings.length === 0) {
            container.innerHTML = `
                <div class="dictionary-empty" style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 280px; opacity: 0.7;">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">📚</div>
                    <p style="font-size: 1rem; font-weight: 600; margin: 0; text-align: center;">
                        ${this.entityMappings.size === 0 ? 'No entity mappings yet' : 'No matches found'}
                    </p>
                    <small style="margin-top: 0.5rem; text-align: center;">
                        ${this.entityMappings.size === 0 ? 'Analyze text to see entity mappings' : 'Try adjusting your search or filter'}
                    </small>
                </div>
            `;
            return;
        }
        
        const groupedMappings = this.groupMappingsByType(mappings);
        let html = '';
        
        Object.entries(groupedMappings).forEach(([type, items]) => {
            const typeInfo = this.entityTypes[type] || { emoji: '🔍', name: type, color: '#64748b' };
            
            html += `
                <div class="entity-group" style="margin-bottom: 1.5rem;">
                    <div class="entity-group-header" style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.75rem; padding-bottom: 0.5rem; border-bottom: 1px solid var(--border);">
                        <span style="font-size: 1.2rem;">${typeInfo.emoji}</span>
                        <h4 style="font-size: 0.875rem; font-weight: 600; margin: 0; color: ${typeInfo.color};">${typeInfo.name}</h4>
                        <span style="font-size: 0.75rem; background: ${typeInfo.color}20; color: ${typeInfo.color}; padding: 2px 8px; border-radius: 12px; font-weight: 500;">${items.length}</span>
                    </div>
                    <div class="entity-items">
                        ${items.map(item => this.createEntityMappingItem(item)).join('')}
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
        
        // Add hover effects
        this.addMappingItemEvents(container);
    }
    
    createEntityMappingItem(mapping) {
        const typeInfo = this.entityTypes[mapping.type] || { color: '#64748b' };
        const isRecent = (Date.now() - new Date(mapping.timestamp).getTime()) < 60000; // Recent if less than 1 minute
        
        return `
            <div class="entity-mapping-item" data-original="${mapping.original}" data-type="${mapping.type}" style="
                display: flex; 
                align-items: center; 
                justify-content: space-between; 
                padding: 0.75rem; 
                margin-bottom: 0.5rem; 
                border-radius: 8px; 
                border: 1px solid var(--border); 
                background: var(--background);
                transition: all 0.2s ease;
                ${isRecent ? 'border-color: ' + typeInfo.color + '; box-shadow: 0 0 0 1px ' + typeInfo.color + '30;' : ''}
            ">
                <div class="mapping-content" style="flex: 1; min-width: 0;">
                    <div class="original-text" style="font-size: 0.875rem; font-weight: 600; color: var(--text-primary); word-break: break-all; margin-bottom: 2px;">
                        ${this.highlightSearchTerm(mapping.original)}
                    </div>
                    <div class="masked-text" style="font-size: 0.75rem; color: ${typeInfo.color}; font-weight: 500;">
                        → ${mapping.masked}
                    </div>
                </div>
                <div class="mapping-actions" style="display: flex; align-items: center; gap: 0.5rem;">
                    ${isRecent ? '<span style="width: 8px; height: 8px; border-radius: 50%; background: ' + typeInfo.color + '; animation: pulse 2s infinite;"></span>' : ''}
                    <button class="copy-mapping-btn" data-text="${mapping.masked}" style="padding: 4px; border: none; background: transparent; color: var(--text-muted); cursor: pointer; border-radius: 4px; transition: all 0.2s ease;" title="Copy masked name">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                        </svg>
                    </button>
                </div>
            </div>
        `;
    }
    
    highlightSearchTerm(text) {
        if (!this.searchTerm) return text;
        
        const regex = new RegExp(`(${this.searchTerm})`, 'gi');
        return text.replace(regex, '<mark style="background: rgba(59, 130, 246, 0.2); padding: 0 2px; border-radius: 2px;">$1</mark>');
    }
    
    addMappingItemEvents(container) {
        // Copy functionality
        container.querySelectorAll('.copy-mapping-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const text = btn.dataset.text;
                
                try {
                    await navigator.clipboard.writeText(text);
                    
                    // Visual feedback
                    const originalContent = btn.innerHTML;
                    btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="green" stroke-width="2"><polyline points="20,6 9,17 4,12"></polyline></svg>';
                    btn.style.color = 'green';
                    
                    setTimeout(() => {
                        btn.innerHTML = originalContent;
                        btn.style.color = 'var(--text-muted)';
                    }, 1500);
                } catch (err) {
                    console.error('Failed to copy text:', err);
                }
            });
            
            btn.addEventListener('mouseenter', function() {
                this.style.background = 'var(--surface)';
                this.style.color = 'var(--primary)';
            });
            
            btn.addEventListener('mouseleave', function() {
                this.style.background = 'transparent';
                this.style.color = 'var(--text-muted)';
            });
        });
        
        // Item hover effects
        container.querySelectorAll('.entity-mapping-item').forEach(item => {
            item.addEventListener('mouseenter', function() {
                this.style.transform = 'translateY(-1px)';
                this.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                this.style.borderColor = 'var(--primary)';
            });
            
            item.addEventListener('mouseleave', function() {
                this.style.transform = 'translateY(0)';
                this.style.boxShadow = 'none';
                this.style.borderColor = 'var(--border)';
            });
        });
    }
    
    getFilteredMappings() {
        const allMappings = Array.from(this.entityMappings.entries()).map(([key, masked]) => {
            const [original, type] = key.split(':');
            return {
                original,
                masked,
                type,
                timestamp: this.sessionMappings.get(key)?.timestamp || new Date().toISOString()
            };
        });
        
        return allMappings.filter(mapping => {
            const matchesFilter = this.currentFilter === 'all' || mapping.type === this.currentFilter;
            const matchesSearch = !this.searchTerm || 
                mapping.original.toLowerCase().includes(this.searchTerm) ||
                mapping.masked.toLowerCase().includes(this.searchTerm);
            
            return matchesFilter && matchesSearch;
        });
    }
    
    groupMappingsByType(mappings) {
        const grouped = {};
        mappings.forEach(mapping => {
            if (!grouped[mapping.type]) {
                grouped[mapping.type] = [];
            }
            grouped[mapping.type].push(mapping);
        });
        
        // Sort each group by timestamp (newest first)
        Object.values(grouped).forEach(group => {
            group.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        });
        
        return grouped;
    }
    
    exportDictionary() {
        const data = {
            version: '1.0',
            timestamp: new Date().toISOString(),
            totalMappings: this.entityMappings.size,
            mappings: Object.fromEntries(this.entityMappings),
            reverseMappings: Object.fromEntries(this.reverseMappings),
            entityCounts: Object.fromEntries(this.entityCounts),
            metadata: {
                userAgent: navigator.userAgent,
                exportedBy: 'PII-Shield Entity Dictionary Manager'
            }
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        
        a.href = url;
        a.download = `entity-dictionary-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        // Show feedback
        this.showNotification('Dictionary exported successfully!', 'success');
    }
    
    importDictionary() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    
                    // Validate data structure
                    if (!data.mappings || !data.version) {
                        throw new Error('Invalid dictionary file format');
                    }
                    
                    // Import mappings
                    this.entityMappings = new Map(Object.entries(data.mappings));
                    if (data.reverseMappings) {
                        this.reverseMappings = new Map(Object.entries(data.reverseMappings));
                    }
                    if (data.entityCounts) {
                        this.entityCounts = new Map(Object.entries(data.entityCounts));
                    }
                    
                    this.updateDictionaryDisplay();
                    this.persistMappings();
                    
                    this.showNotification(`Dictionary imported successfully! Loaded ${this.entityMappings.size} mappings.`, 'success');
                    
                } catch (error) {
                    console.error('Import failed:', error);
                    this.showNotification('Failed to import dictionary. Please check the file format.', 'error');
                }
            };
            
            reader.readAsText(file);
        });
        
        input.click();
    }
    
    clearDictionary() {
        if (this.entityMappings.size === 0) {
            this.showNotification('Dictionary is already empty.', 'info');
            return;
        }
        
        const confirmed = confirm(`Are you sure you want to clear all ${this.entityMappings.size} entity mappings? This action cannot be undone.`);
        
        if (confirmed) {
            this.clearMappings();
            
            this.updateDictionaryDisplay();
            this.clearPersistedMappings();
            
            this.showNotification('Dictionary cleared successfully!', 'success');
        }
    }
    
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 24px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 10000;
            animation: slideInRight 0.3s ease-out;
            max-width: 300px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        `;
        
        const colors = {
            success: '#10b981',
            error: '#ef4444',
            warning: '#f59e0b',
            info: '#3b82f6'
        };
        
        notification.style.background = colors[type] || colors.info;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease-in forwards';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
    
    persistMappings() {
        // Don't persist if empty
        if (this.entityMappings.size === 0) {
            localStorage.removeItem('pii-shield-entity-mappings');
            return;
        }
        
        const data = {
            mappings: Object.fromEntries(this.entityMappings),
            reverseMappings: Object.fromEntries(this.reverseMappings),
            entityCounts: Object.fromEntries(this.entityCounts),
            timestamp: Date.now()
        };
        
        localStorage.setItem('pii-shield-entity-mappings', JSON.stringify(data));
    }
    
    loadPersistedMappings() {
        try {
            const saved = localStorage.getItem('pii-shield-entity-mappings');
            if (saved) {
                const data = JSON.parse(saved);
                
                this.entityMappings = new Map(Object.entries(data.mappings || {}));
                this.reverseMappings = new Map(Object.entries(data.reverseMappings || {}));
                this.entityCounts = new Map(Object.entries(data.entityCounts || {}));
                
                this.updateDictionaryDisplay();
            }
        } catch (error) {
            console.error('Failed to load persisted mappings:', error);
        }
    }
    
    clearPersistedMappings() {
        localStorage.removeItem('pii-shield-entity-mappings');
    }
    
    // Public API methods
    getMappingForEntity(originalText, entityType) {
        return this.entityMappings.get(`${originalText}:${entityType}`);
    }
    
    getOriginalForMasked(maskedText) {
        return this.reverseMappings.get(maskedText);
    }
    
    getTotalMappings() {
        return this.entityMappings.size;
    }
    
    getMappingsByType(entityType) {
        const mappings = [];
        this.entityMappings.forEach((masked, key) => {
            const [original, type] = key.split(':');
            if (type === entityType) {
                mappings.push({ original, masked, type });
            }
        });
        return mappings;
    }
}

// Add required CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    @keyframes pulse {
        0%, 100% {
            opacity: 1;
        }
        50% {
            opacity: 0.5;
        }
    }
    
    .entity-mapping-item:hover {
        cursor: pointer;
    }
    
    .entity-filter-btn {
        transition: all 0.2s ease;
        cursor: pointer;
    }
    
    .entity-filter-btn:hover {
        transform: translateY(-1px);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    
    mark {
        animation: highlight 2s ease-in-out;
    }
    
    @keyframes highlight {
        0% {
            background: rgba(59, 130, 246, 0.4);
        }
        100% {
            background: rgba(59, 130, 246, 0.2);
        }
    }
`;
document.head.appendChild(style);

// Export for global use
window.EntityDictionaryManager = EntityDictionaryManager;