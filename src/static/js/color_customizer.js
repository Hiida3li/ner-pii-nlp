/**
 * Color Customizer Module for PII Entity Highlighting
 * Modern floating panel with advanced UI/UX
 */

class ColorCustomizer {
    constructor() {
        // Default color scheme
        this.defaultColors = {
            'person': '#a78bfa',      // Light purple
            'location': '#34d399',     // Light green  
            'organization': '#fb923c', // Light orange
            'date': '#60a5fa',        // Light blue
            'email': '#f472b6',       // Light pink
            'phone': '#facc15',       // Light yellow
            'url': '#2dd4bf',         // Light teal
            'civilid': '#c084fc',     // Light violet
            'passport': '#f87171',    // Light red
            'creditcard': '#818cf8',  // Light indigo
            'bankaccount': '#a3e635'  // Light lime
        };
        
        // Panel state
        this.isPanelOpen = false;
        this.searchQuery = '';

        // Preset color schemes
        this.presets = {
            default: { ...this.defaultColors },
            
            highContrast: {
                'person': '#ff00ff',      // Magenta
                'location': '#00ff00',     // Lime
                'organization': '#ffff00', // Yellow
                'date': '#00ffff',        // Cyan
                'email': '#ff00aa',       // Pink
                'phone': '#ffa500',       // Orange
                'url': '#00aaff',         // Sky blue
                'civilid': '#ff55ff',     // Light magenta
                'passport': '#ff5555',    // Light red
                'creditcard': '#5555ff',  // Light blue
                'bankaccount': '#55ff55'  // Light green
            },
            
            colorblindSafe: {
                'person': '#648FFF',      // Blue
                'location': '#785EF0',     // Purple
                'organization': '#DC267F', // Magenta
                'date': '#FE6100',        // Orange
                'email': '#FFB000',       // Gold
                'phone': '#648FFF',       // Blue (repeated intentionally)
                'url': '#785EF0',         // Purple (repeated)
                'civilid': '#DC267F',     // Magenta (repeated)
                'passport': '#FE6100',    // Orange (repeated)
                'creditcard': '#FFB000',  // Gold (repeated)
                'bankaccount': '#648FFF'  // Blue (repeated)
            },
            
            darkMode: {
                'person': '#9333ea',      // Purple
                'location': '#059669',     // Green
                'organization': '#ea580c', // Orange
                'date': '#0284c7',        // Blue
                'email': '#db2777',       // Pink
                'phone': '#ca8a04',       // Yellow
                'url': '#0891b2',         // Cyan
                'civilid': '#7c3aed',     // Violet
                'passport': '#dc2626',    // Red
                'creditcard': '#4f46e5',  // Indigo
                'bankaccount': '#65a30d'  // Lime
            },
            
            pastel: {
                'person': '#e9d5ff',      // Pastel purple
                'location': '#bbf7d0',     // Pastel green
                'organization': '#fed7aa', // Pastel orange
                'date': '#bfdbfe',        // Pastel blue
                'email': '#fce7f3',       // Pastel pink
                'phone': '#fef3c7',       // Pastel yellow
                'url': '#ccfbf1',         // Pastel teal
                'civilid': '#ddd6fe',     // Pastel violet
                'passport': '#fecaca',    // Pastel red
                'creditcard': '#c7d2fe',  // Pastel indigo
                'bankaccount': '#d9f99d'  // Pastel lime
            }
        };

        // Current active colors (loaded from localStorage or defaults)
        this.activeColors = this.loadColors();
        
        // Initialize
        this.init();
    }

    init() {
        // Apply saved colors on load
        this.applyColors();
        
        // Create the icon button and panel
        this.createIconButton();
        this.createFloatingPanel();
    }

    loadColors() {
        try {
            const saved = localStorage.getItem('pii-entity-colors');
            if (saved) {
                return JSON.parse(saved);
            }
        } catch (e) {
            console.error('Failed to load saved colors:', e);
        }
        return { ...this.defaultColors };
    }

    saveColors() {
        try {
            localStorage.setItem('pii-entity-colors', JSON.stringify(this.activeColors));
        } catch (e) {
            console.error('Failed to save colors:', e);
        }
    }

    applyColors() {
        // Remove existing style element if it exists
        const existingStyle = document.getElementById('pii-entity-colors-style');
        if (existingStyle) {
            existingStyle.remove();
        }

        // Create new style element with current colors
        const style = document.createElement('style');
        style.id = 'pii-entity-colors-style';
        
        let css = '';
        for (const [entityType, color] of Object.entries(this.activeColors)) {
            css += `
                .pii-${entityType} {
                    color: ${color} !important;
                }
                .assistant .pii-${entityType} {
                    color: ${color} !important;
                }
            `;
        }
        
        style.textContent = css;
        document.head.appendChild(style);
    }

    createCustomizerPanel() {
        // Create the panel HTML
        const panel = document.createElement('div');
        panel.id = 'color-customizer-panel';
        panel.className = 'color-customizer-panel';
        panel.innerHTML = `
            <div class="color-panel-header">
                <h3>Entity Colors</h3>
                <button class="color-panel-toggle" id="color-panel-toggle">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M4 6L8 10L12 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                </button>
            </div>
            <div class="color-panel-content" id="color-panel-content">
                <div class="color-presets">
                    <label>Presets:</label>
                    <select id="color-preset-selector">
                        <option value="">Custom</option>
                        <option value="default">Default</option>
                        <option value="highContrast">High Contrast</option>
                        <option value="colorblindSafe">Colorblind Safe</option>
                        <option value="darkMode">Dark Mode</option>
                        <option value="pastel">Pastel</option>
                    </select>
                </div>
                <div class="color-items" id="color-items-container">
                    <!-- Color items will be added here -->
                </div>
                <div class="color-panel-actions">
                    <button class="reset-all-btn" id="reset-all-colors">Reset All</button>
                    <button class="export-btn" id="export-colors">Export</button>
                    <button class="import-btn" id="import-colors">Import</button>
                </div>
            </div>
        `;

        // Add to sidebar if it exists, otherwise add to body
        const sidebar = document.getElementById('sidebar');
        if (sidebar) {
            // Insert after the session list
            const sessionList = sidebar.querySelector('.session-list');
            if (sessionList) {
                sessionList.parentNode.insertBefore(panel, sessionList.nextSibling);
            } else {
                sidebar.appendChild(panel);
            }
        } else {
            document.body.appendChild(panel);
        }

        // Add the CSS for the panel
        this.addPanelStyles();

        // Populate color items
        this.populateColorItems();

        // Setup event listeners
        this.setupPanelEventListeners();
    }

    addPanelStyles() {
        const style = document.createElement('style');
        style.id = 'color-customizer-styles';
        style.textContent = `
            .color-customizer-panel {
                background: rgba(255, 255, 255, 0.05);
                border-radius: 8px;
                margin: 1rem;
                overflow: hidden;
                transition: all 0.3s ease;
            }

            .color-panel-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 0.75rem 1rem;
                background: rgba(255, 255, 255, 0.08);
                cursor: pointer;
                user-select: none;
            }

            .color-panel-header h3 {
                color: #e5e7eb;
                font-size: 0.9rem;
                font-weight: 600;
                margin: 0;
            }

            .color-panel-toggle {
                background: none;
                border: none;
                color: #9ca3af;
                cursor: pointer;
                padding: 0;
                display: flex;
                align-items: center;
                transition: transform 0.3s ease;
            }

            .color-panel-toggle.collapsed {
                transform: rotate(-90deg);
            }

            .color-panel-content {
                padding: 1rem;
                max-height: 400px;
                overflow-y: auto;
                transition: max-height 0.3s ease;
            }

            .color-panel-content.collapsed {
                max-height: 0;
                padding: 0 1rem;
                overflow: hidden;
            }

            .color-presets {
                margin-bottom: 1rem;
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }

            .color-presets label {
                color: #9ca3af;
                font-size: 0.85rem;
            }

            .color-presets select {
                flex: 1;
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.2);
                color: #e5e7eb;
                padding: 0.25rem 0.5rem;
                border-radius: 4px;
                font-size: 0.85rem;
            }

            .color-items {
                display: flex;
                flex-direction: column;
                gap: 0.5rem;
            }

            .color-item {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                padding: 0.25rem;
                border-radius: 4px;
                transition: background 0.2s ease;
            }

            .color-item:hover {
                background: rgba(255, 255, 255, 0.05);
            }

            .color-preview {
                width: 24px;
                height: 24px;
                border-radius: 4px;
                border: 2px solid rgba(255, 255, 255, 0.2);
                cursor: pointer;
                position: relative;
                overflow: hidden;
            }

            .color-input {
                position: absolute;
                width: 100%;
                height: 100%;
                opacity: 0;
                cursor: pointer;
            }

            .color-label {
                color: #e5e7eb;
                font-size: 0.85rem;
                flex: 1;
                text-transform: capitalize;
            }

            .reset-color-btn {
                background: none;
                border: none;
                color: #6b7280;
                cursor: pointer;
                padding: 0.25rem;
                border-radius: 4px;
                font-size: 0.75rem;
                opacity: 0;
                transition: opacity 0.2s ease;
            }

            .color-item:hover .reset-color-btn {
                opacity: 1;
            }

            .reset-color-btn:hover {
                background: rgba(255, 255, 255, 0.1);
                color: #9ca3af;
            }

            .color-panel-actions {
                display: flex;
                gap: 0.5rem;
                margin-top: 1rem;
                padding-top: 1rem;
                border-top: 1px solid rgba(255, 255, 255, 0.1);
            }

            .color-panel-actions button {
                flex: 1;
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.2);
                color: #e5e7eb;
                padding: 0.35rem 0.5rem;
                border-radius: 4px;
                font-size: 0.8rem;
                cursor: pointer;
                transition: all 0.2s ease;
            }

            .color-panel-actions button:hover {
                background: rgba(255, 255, 255, 0.15);
            }

            /* Scrollbar styling for color panel */
            .color-panel-content::-webkit-scrollbar {
                width: 6px;
            }

            .color-panel-content::-webkit-scrollbar-track {
                background: rgba(255, 255, 255, 0.05);
                border-radius: 3px;
            }

            .color-panel-content::-webkit-scrollbar-thumb {
                background: rgba(255, 255, 255, 0.2);
                border-radius: 3px;
            }

            .color-panel-content::-webkit-scrollbar-thumb:hover {
                background: rgba(255, 255, 255, 0.3);
            }
        `;
        document.head.appendChild(style);
    }

    populateColorItems() {
        const container = document.getElementById('color-items-container');
        if (!container) return;

        container.innerHTML = '';
        
        const entityTypes = [
            { key: 'person', label: 'Person', icon: '👤' },
            { key: 'location', label: 'Location', icon: '📍' },
            { key: 'organization', label: 'Organization', icon: '🏢' },
            { key: 'date', label: 'Date', icon: '📅' },
            { key: 'email', label: 'Email', icon: '✉️' },
            { key: 'phone', label: 'Phone', icon: '📞' },
            { key: 'url', label: 'URL', icon: '🔗' },
            { key: 'civilid', label: 'Civil ID', icon: '🆔' },
            { key: 'passport', label: 'Passport', icon: '📘' },
            { key: 'creditcard', label: 'Credit Card', icon: '💳' },
            { key: 'bankaccount', label: 'Bank Account', icon: '🏦' }
        ];

        entityTypes.forEach(({ key, label, icon }) => {
            const item = document.createElement('div');
            item.className = 'color-item';
            item.innerHTML = `
                <div class="color-preview" style="background-color: ${this.activeColors[key]}">
                    <input type="color" class="color-input" 
                           id="color-${key}" 
                           value="${this.activeColors[key]}"
                           data-entity="${key}">
                </div>
                <span class="color-label">${icon} ${label}</span>
                <button class="reset-color-btn" data-entity="${key}">Reset</button>
            `;
            container.appendChild(item);
        });
    }

    setupPanelEventListeners() {
        // Toggle panel collapse
        const toggleBtn = document.getElementById('color-panel-toggle');
        const content = document.getElementById('color-panel-content');
        
        if (toggleBtn && content) {
            toggleBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                toggleBtn.classList.toggle('collapsed');
                content.classList.toggle('collapsed');
            });
        }

        // Preset selector
        const presetSelector = document.getElementById('color-preset-selector');
        if (presetSelector) {
            presetSelector.addEventListener('change', (e) => {
                const preset = e.target.value;
                if (preset && this.presets[preset]) {
                    this.activeColors = { ...this.presets[preset] };
                    this.saveColors();
                    this.applyColors();
                    this.populateColorItems();
                    this.setupPanelEventListeners(); // Re-setup listeners after repopulating
                }
            });
        }

        // Color inputs
        document.querySelectorAll('.color-input').forEach(input => {
            input.addEventListener('input', (e) => {
                const entityType = e.target.dataset.entity;
                const color = e.target.value;
                this.activeColors[entityType] = color;
                
                // Update preview
                e.target.parentElement.style.backgroundColor = color;
                
                // Save and apply
                this.saveColors();
                this.applyColors();
                
                // Update preset selector to "Custom"
                if (presetSelector) {
                    presetSelector.value = '';
                }
            });
        });

        // Reset individual colors
        document.querySelectorAll('.reset-color-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const entityType = e.target.dataset.entity;
                this.activeColors[entityType] = this.defaultColors[entityType];
                
                // Update UI
                const colorInput = document.getElementById(`color-${entityType}`);
                if (colorInput) {
                    colorInput.value = this.defaultColors[entityType];
                    colorInput.parentElement.style.backgroundColor = this.defaultColors[entityType];
                }
                
                // Save and apply
                this.saveColors();
                this.applyColors();
                
                // Update preset selector
                if (presetSelector) {
                    presetSelector.value = '';
                }
            });
        });

        // Reset all colors
        const resetAllBtn = document.getElementById('reset-all-colors');
        if (resetAllBtn) {
            resetAllBtn.addEventListener('click', () => {
                this.activeColors = { ...this.defaultColors };
                this.saveColors();
                this.applyColors();
                this.populateColorItems();
                this.setupPanelEventListeners();
                
                if (presetSelector) {
                    presetSelector.value = 'default';
                }
            });
        }

        // Export colors
        const exportBtn = document.getElementById('export-colors');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                const data = JSON.stringify(this.activeColors, null, 2);
                const blob = new Blob([data], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'pii-entity-colors.json';
                a.click();
                URL.revokeObjectURL(url);
            });
        }

        // Import colors
        const importBtn = document.getElementById('import-colors');
        if (importBtn) {
            importBtn.addEventListener('click', () => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.json';
                input.onchange = (e) => {
                    const file = e.target.files[0];
                    if (file) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                            try {
                                const colors = JSON.parse(event.target.result);
                                // Validate the imported colors
                                if (this.validateColors(colors)) {
                                    this.activeColors = colors;
                                    this.saveColors();
                                    this.applyColors();
                                    this.populateColorItems();
                                    this.setupPanelEventListeners();
                                    
                                    if (presetSelector) {
                                        presetSelector.value = '';
                                    }
                                    
                                    alert('Colors imported successfully!');
                                } else {
                                    alert('Invalid color file format');
                                }
                            } catch (error) {
                                alert('Failed to import colors: ' + error.message);
                            }
                        };
                        reader.readAsText(file);
                    }
                };
                input.click();
            });
        }
    }

    validateColors(colors) {
        // Check if it's an object with expected keys
        if (typeof colors !== 'object' || colors === null) {
            return false;
        }
        
        // Check if all values are valid hex colors
        const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
        for (const value of Object.values(colors)) {
            if (typeof value !== 'string' || !hexColorRegex.test(value)) {
                return false;
            }
        }
        
        return true;
    }

    // Public method to update a single color
    setEntityColor(entityType, color) {
        if (this.activeColors.hasOwnProperty(entityType)) {
            this.activeColors[entityType] = color;
            this.saveColors();
            this.applyColors();
        }
    }

    // Public method to get current colors
    getColors() {
        return { ...this.activeColors };
    }

    // Public method to apply a preset
    applyPreset(presetName) {
        if (this.presets[presetName]) {
            this.activeColors = { ...this.presets[presetName] };
            this.saveColors();
            this.applyColors();
            this.populateColorItems();
            this.setupPanelEventListeners();
        }
    }
}

// Initialize the color customizer when the DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.colorCustomizer = new ColorCustomizer();
    });
} else {
    window.colorCustomizer = new ColorCustomizer();
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ColorCustomizer;
}