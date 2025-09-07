/**
 * Compact Color Customizer Module for PII Entity Highlighting
 * Inline sidebar panel with minimal UI
 */

class CompactColorCustomizer {
    constructor() {
        // Default color scheme
        this.defaultColors = {
            'person': '#a78bfa',
            'location': '#34d399',
            'organization': '#fb923c',
            'email': '#f472b6',
            'phone': '#facc15',
            'url': '#2dd4bf',
            'civilid': '#c084fc',
            'passport': '#f87171',
            'creditcard': '#818cf8'
        };
        
        // Panel state
        this.isPanelOpen = false;

        // Preset color schemes
        this.presets = {
            default: { ...this.defaultColors },
            highContrast: {
                'person': '#ff00ff',
                'location': '#00ff00',
                'organization': '#ffff00',
                'email': '#ff00aa',
                'phone': '#ffa500',
                'url': '#00aaff',
                'civilid': '#ff55ff',
                'passport': '#ff5555',
                'creditcard': '#5555ff'
            },
            colorblindSafe: {
                'person': '#648FFF',
                'location': '#785EF0',
                'organization': '#DC267F',
                'email': '#FFB000',
                'phone': '#648FFF',
                'url': '#785EF0',
                'civilid': '#DC267F',
                'passport': '#FE6100',
                'creditcard': '#FFB000'
            },
            darkMode: {
                'person': '#9333ea',
                'location': '#059669',
                'organization': '#ea580c',
                'email': '#db2777',
                'phone': '#ca8a04',
                'url': '#0891b2',
                'civilid': '#7c3aed',
                'passport': '#dc2626',
                'creditcard': '#4f46e5'
            },
            pastel: {
                'person': '#e9d5ff',
                'location': '#bbf7d0',
                'organization': '#fed7aa',
                'email': '#fce7f3',
                'phone': '#fef3c7',
                'url': '#ccfbf1',
                'civilid': '#ddd6fe',
                'passport': '#fecaca',
                'creditcard': '#c7d2fe'
            }
        };

        // Current active colors
        this.activeColors = this.loadColors();
        
        // Initialize
        this.init();
    }

    init() {
        // Apply saved colors on load
        this.applyColors();
        
        // Create the compact inline panel
        this.createCompactPanel();
    }

    loadColors() {
        try {
            const saved = localStorage.getItem('pii-entity-colors');
            if (saved) {
                return JSON.parse(saved);
            }
        } catch (e) {
            console.error('Error loading colors:', e);
        }
        return { ...this.defaultColors };
    }

    saveColors() {
        try {
            localStorage.setItem('pii-entity-colors', JSON.stringify(this.activeColors));
        } catch (e) {
            console.error('Error saving colors:', e);
        }
    }

    applyColors() {
        // Apply colors to CSS custom properties
        const root = document.documentElement;
        Object.entries(this.activeColors).forEach(([entityType, color]) => {
            root.style.setProperty(`--pii-${entityType}`, color);
        });
        
        // Also apply to existing classes for backward compatibility
        const style = document.getElementById('pii-colors-style') || document.createElement('style');
        style.id = 'pii-colors-style';
        
        const css = Object.entries(this.activeColors).map(([entityType, color]) => 
            `.pii-${entityType} { color: ${color} !important; }`
        ).join('\n');
        
        style.textContent = css;
        
        if (!style.parentNode) {
            document.head.appendChild(style);
        }
    }

    createCompactPanel() {
        // Find existing color customizer icon and modify it
        const existingIcon = document.getElementById('color-customizer-icon');
        if (existingIcon) {
            existingIcon.remove();
        }

        // Create icon button
        const iconContainer = document.createElement('div');
        iconContainer.className = 'compact-color-container';
        iconContainer.innerHTML = `
            <button class="compact-color-icon" id="compact-color-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="3"/>
                    <path d="M12 1v6M12 17v6M4.22 4.22l4.24 4.24M15.54 15.54l4.24 4.24M1 12h6M17 12h6M4.22 19.78l4.24-4.24M15.54 8.46l4.24-4.24"/>
                </svg>
            </button>
            
            <div class="compact-color-panel" id="compact-color-panel">
                <div class="compact-panel-header">
                    <span>Entity Colors</span>
                    <button class="compact-close-btn" id="compact-close-btn">×</button>
                </div>
                
                <div class="compact-color-grid" id="compact-color-grid">
                    <!-- Color items will be added here -->
                </div>
                
                <div class="compact-panel-footer">
                    <select class="compact-preset-select" id="compact-preset-select">
                        <option value="">Presets</option>
                        <option value="default">Default</option>
                        <option value="highContrast">High Contrast</option>
                        <option value="colorblindSafe">Colorblind Safe</option>
                        <option value="darkMode">Dark Theme</option>
                        <option value="pastel">Pastels</option>
                    </select>
                    <button class="compact-reset-btn" id="compact-reset-btn">Reset</button>
                </div>
            </div>
        `;

        // Position it in the left sidebar
        iconContainer.style.cssText = `
            position: fixed;
            left: 1.5rem;
            top: 14.5rem;
            z-index: 1002;
        `;

        document.body.appendChild(iconContainer);
        
        // Add compact styles
        this.addCompactStyles();
        
        // Populate color items
        this.populateCompactColors();
        
        // Setup event listeners
        this.setupCompactEventListeners();
    }

    addCompactStyles() {
        const style = document.createElement('style');
        style.id = 'compact-color-styles';
        style.textContent = `
            .compact-color-container {
                position: relative;
            }
            
            .compact-color-icon {
                width: 32px;
                height: 32px;
                background: rgba(255, 255, 255, 0.08);
                border: 1px solid rgba(255, 255, 255, 0.12);
                border-radius: 8px;
                color: #9ca3af;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s ease;
                backdrop-filter: blur(8px);
            }
            
            .compact-color-icon:hover {
                background: rgba(167, 139, 250, 0.15);
                border-color: rgba(167, 139, 250, 0.25);
                color: #a78bfa;
                transform: scale(1.05);
            }
            
            .compact-color-icon.active {
                background: rgba(167, 139, 250, 0.2);
                border-color: rgba(167, 139, 250, 0.4);
                color: #a78bfa;
            }
            
            .compact-color-panel {
                position: absolute;
                top: 100%;
                left: 0;
                width: 240px;
                max-height: 320px;
                background: linear-gradient(145deg, #2d2b3a, #252331);
                border: 1px solid rgba(167, 139, 250, 0.2);
                border-radius: 12px;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
                opacity: 0;
                visibility: hidden;
                transform: translateY(-8px);
                transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                backdrop-filter: blur(20px);
                overflow: hidden;
                z-index: 1003;
                margin-top: 8px;
            }
            
            .compact-color-panel.open {
                opacity: 1;
                visibility: visible;
                transform: translateY(0);
            }
            
            .compact-panel-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 0.75rem;
                border-bottom: 1px solid rgba(167, 139, 250, 0.1);
                font-size: 0.8rem;
                font-weight: 500;
                color: #e5e7eb;
            }
            
            .compact-close-btn {
                background: none;
                border: none;
                color: #9ca3af;
                cursor: pointer;
                font-size: 1.2rem;
                line-height: 1;
                padding: 0;
                transition: color 0.2s ease;
            }
            
            .compact-close-btn:hover {
                color: #f87171;
            }
            
            .compact-color-grid {
                padding: 0.75rem;
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 0.5rem;
                max-height: 200px;
                overflow-y: auto;
            }
            
            .compact-color-item {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                padding: 0.4rem;
                border-radius: 6px;
                transition: background 0.2s ease;
                font-size: 0.7rem;
            }
            
            .compact-color-item:hover {
                background: rgba(255, 255, 255, 0.05);
            }
            
            .compact-color-preview {
                width: 16px;
                height: 16px;
                border-radius: 4px;
                border: 1px solid rgba(255, 255, 255, 0.1);
                cursor: pointer;
                flex-shrink: 0;
                transition: all 0.2s ease;
                position: relative;
            }
            
            .compact-color-preview:hover {
                transform: scale(1.2);
                border-color: rgba(255, 255, 255, 0.3);
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
            }
            
            .compact-color-preview:active {
                transform: scale(1.1);
            }
            
            .compact-color-label {
                color: #d1d5db;
                font-weight: 400;
                text-transform: capitalize;
                flex: 1;
                min-width: 0;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }
            
            .compact-panel-footer {
                display: flex;
                gap: 0.5rem;
                padding: 0.75rem;
                border-top: 1px solid rgba(167, 139, 250, 0.1);
            }
            
            .compact-preset-select {
                flex: 1;
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 6px;
                color: #d1d5db;
                font-size: 0.7rem;
                padding: 0.4rem;
                cursor: pointer;
                transition: all 0.2s ease;
            }
            
            .compact-preset-select:hover,
            .compact-preset-select:focus {
                background: rgba(255, 255, 255, 0.08);
                border-color: rgba(167, 139, 250, 0.3);
                outline: none;
            }
            
            .compact-reset-btn {
                background: rgba(239, 68, 68, 0.15);
                border: 1px solid rgba(239, 68, 68, 0.3);
                border-radius: 6px;
                color: #fca5a5;
                font-size: 0.7rem;
                padding: 0.4rem 0.6rem;
                cursor: pointer;
                transition: all 0.2s ease;
                white-space: nowrap;
            }
            
            .compact-reset-btn:hover {
                background: rgba(239, 68, 68, 0.25);
                border-color: rgba(239, 68, 68, 0.5);
                color: #f87171;
            }
            
            /* Custom scrollbar for color grid */
            .compact-color-grid::-webkit-scrollbar {
                width: 4px;
            }
            
            .compact-color-grid::-webkit-scrollbar-track {
                background: rgba(255, 255, 255, 0.05);
                border-radius: 2px;
            }
            
            .compact-color-grid::-webkit-scrollbar-thumb {
                background: rgba(167, 139, 250, 0.3);
                border-radius: 2px;
            }
            
            .compact-color-grid::-webkit-scrollbar-thumb:hover {
                background: rgba(167, 139, 250, 0.5);
            }
        `;
        
        document.head.appendChild(style);
    }

    populateCompactColors() {
        const container = document.getElementById('compact-color-grid');
        container.innerHTML = '';
        
        Object.entries(this.activeColors).forEach(([entityType, color]) => {
            const item = document.createElement('div');
            item.className = 'compact-color-item';
            
            const preview = document.createElement('div');
            preview.className = 'compact-color-preview';
            preview.style.backgroundColor = color;
            preview.dataset.entity = entityType;
            preview.title = `Click to change ${entityType} color`;
            
            const label = document.createElement('span');
            label.className = 'compact-color-label';
            label.textContent = entityType;
            
            // Add click handler directly to the preview
            preview.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.openColorPicker(entityType);
            });
            
            item.appendChild(preview);
            item.appendChild(label);
            container.appendChild(item);
        });
    }

    openColorPicker(entityType) {
        console.log('Opening color picker for:', entityType);
        
        // Create color input
        const input = document.createElement('input');
        input.type = 'color';
        input.value = this.activeColors[entityType];
        input.style.position = 'absolute';
        input.style.left = '-9999px';
        input.style.opacity = '0';
        input.style.pointerEvents = 'none';
        
        // Add to document
        document.body.appendChild(input);
        
        // Handle color change
        input.addEventListener('change', (event) => {
            console.log(`Color changed for ${entityType}:`, event.target.value);
            this.activeColors[entityType] = event.target.value;
            this.saveColors();
            this.applyColors();
            this.populateCompactColors();
            
            // Clean up
            setTimeout(() => {
                if (document.body.contains(input)) {
                    document.body.removeChild(input);
                }
            }, 100);
        });
        
        // Handle cancel (when user closes color picker without selecting)
        input.addEventListener('blur', () => {
            setTimeout(() => {
                if (document.body.contains(input)) {
                    document.body.removeChild(input);
                }
            }, 100);
        });
        
        // Trigger the color picker
        setTimeout(() => {
            input.focus();
            input.click();
        }, 10);
    }

    setupCompactEventListeners() {
        // Toggle panel
        const icon = document.getElementById('compact-color-icon');
        if (icon) {
            icon.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleCompactPanel();
            });
        }

        // Close panel
        const closeBtn = document.getElementById('compact-close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.closeCompactPanel();
            });
        }

        // Color input changes are now handled directly in populateCompactColors()

        // Preset selection
        document.getElementById('compact-preset-select').addEventListener('change', (e) => {
            const preset = e.target.value;
            if (preset && this.presets[preset]) {
                this.activeColors = { ...this.presets[preset] };
                this.saveColors();
                this.applyColors();
                this.populateCompactColors();
            }
            e.target.value = '';
        });

        // Reset button
        document.getElementById('compact-reset-btn').addEventListener('click', () => {
            this.activeColors = { ...this.defaultColors };
            this.saveColors();
            this.applyColors();
            this.populateCompactColors();
        });

        // Close panel when clicking outside
        document.addEventListener('click', (e) => {
            const container = document.querySelector('.compact-color-container');
            if (container && !container.contains(e.target)) {
                this.closeCompactPanel();
            }
        });
    }

    toggleCompactPanel() {
        this.isPanelOpen = !this.isPanelOpen;
        const panel = document.getElementById('compact-color-panel');
        const icon = document.getElementById('compact-color-icon');
        
        if (this.isPanelOpen) {
            panel.classList.add('open');
            icon.classList.add('active');
        } else {
            panel.classList.remove('open');
            icon.classList.remove('active');
        }
    }

    closeCompactPanel() {
        this.isPanelOpen = false;
        const panel = document.getElementById('compact-color-panel');
        const icon = document.getElementById('compact-color-icon');
        
        panel.classList.remove('open');
        icon.classList.remove('active');
    }

    getColors() {
        return { ...this.activeColors };
    }
}

// Initialize compact color customizer when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.compactColorCustomizer = new CompactColorCustomizer();
    });
} else {
    window.compactColorCustomizer = new CompactColorCustomizer();
}