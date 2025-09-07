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
            'email': '#f472b6',       // Light pink
            'phone': '#facc15',       // Light yellow
            'url': '#2dd4bf',         // Light teal
            'civilid': '#c084fc',     // Light violet
            'passport': '#f87171',    // Light red
            'creditcard': '#818cf8'   // Light indigo
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
                'email': '#ff00aa',       // Pink
                'phone': '#ffa500',       // Orange
                'url': '#00aaff',         // Sky blue
                'civilid': '#ff55ff',     // Light magenta
                'passport': '#ff5555',    // Light red
                'creditcard': '#5555ff'   // Light blue
            },
            
            colorblindSafe: {
                'person': '#648FFF',      // Blue
                'location': '#785EF0',     // Purple
                'organization': '#DC267F', // Magenta
                'email': '#FFB000',       // Gold
                'phone': '#648FFF',       // Blue (repeated intentionally)
                'url': '#785EF0',         // Purple (repeated)
                'civilid': '#DC267F',     // Magenta (repeated)
                'passport': '#FE6100',    // Orange
                'creditcard': '#FFB000'   // Gold (repeated)
            },
            
            darkMode: {
                'person': '#9333ea',      // Purple
                'location': '#059669',     // Green
                'organization': '#ea580c', // Orange
                'email': '#db2777',       // Pink
                'phone': '#ca8a04',       // Yellow
                'url': '#0891b2',         // Cyan
                'civilid': '#7c3aed',     // Violet
                'passport': '#dc2626',    // Red
                'creditcard': '#4f46e5'   // Indigo
            },
            
            pastel: {
                'person': '#e9d5ff',      // Pastel purple
                'location': '#bbf7d0',     // Pastel green
                'organization': '#fed7aa', // Pastel orange
                'email': '#fce7f3',       // Pastel pink
                'phone': '#fef3c7',       // Pastel yellow
                'url': '#ccfbf1',         // Pastel teal
                'civilid': '#ddd6fe',     // Pastel violet
                'passport': '#fecaca',    // Pastel red
                'creditcard': '#c7d2fe'   // Pastel indigo
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

    createIconButton() {
        // Create the floating icon button
        const button = document.createElement('button');
        button.id = 'color-customizer-icon';
        button.className = 'color-customizer-icon';
        button.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 2v4"/>
                <path d="M12 18v4"/>
                <path d="M4.93 4.93l2.83 2.83"/>
                <path d="M16.24 16.24l2.83 2.83"/>
                <path d="M2 12h4"/>
                <path d="M18 12h4"/>
                <path d="M4.93 19.07l2.83-2.83"/>
                <path d="M16.24 7.76l2.83-2.83"/>
            </svg>
        `;
        
        // Add to body
        document.body.appendChild(button);
        
        // Add click event
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            this.togglePanel();
        });
    }
    
    createFloatingPanel() {
        // Create the floating panel with modern UI
        const panel = document.createElement('div');
        panel.id = 'color-customizer-panel';
        panel.className = 'color-customizer-panel';
        panel.innerHTML = `
            <div class="color-panel-backdrop"></div>
            <div class="color-panel-container">
                <div class="color-panel-header">
                    <h3>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"/>
                            <path d="M12 2v4"/>
                            <path d="M12 18v4"/>
                        </svg>
                        Entity Colors
                    </h3>
                    <button class="color-panel-close" id="color-panel-close">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"/>
                            <line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                    </button>
                </div>
                
                <div class="color-panel-search">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="11" cy="11" r="8"/>
                        <path d="m21 21-4.35-4.35"/>
                    </svg>
                    <input type="text" id="color-search" placeholder="Search entity types..." />
                </div>
                
                <div class="color-panel-tabs">
                    <button class="tab-btn active" data-tab="colors">Colors</button>
                    <button class="tab-btn" data-tab="presets">Presets</button>
                </div>
                
                <div class="color-panel-content" id="color-panel-content">
                    <div class="tab-content active" id="colors-tab">
                        <div class="color-items" id="color-items-container">
                            <!-- Color items will be added here -->
                        </div>
                    </div>
                    
                    <div class="tab-content" id="presets-tab">
                        <div class="preset-grid">
                            <div class="preset-card" data-preset="default">
                                <div class="preset-preview">
                                    <span style="background: #a78bfa"></span>
                                    <span style="background: #34d399"></span>
                                    <span style="background: #fb923c"></span>
                                    <span style="background: #f472b6"></span>
                                </div>
                                <div class="preset-name">Default</div>
                            </div>
                            <div class="preset-card" data-preset="highContrast">
                                <div class="preset-preview">
                                    <span style="background: #ff00ff"></span>
                                    <span style="background: #00ff00"></span>
                                    <span style="background: #ffff00"></span>
                                    <span style="background: #ff00aa"></span>
                                </div>
                                <div class="preset-name">High Contrast</div>
                            </div>
                            <div class="preset-card" data-preset="colorblindSafe">
                                <div class="preset-preview">
                                    <span style="background: #648FFF"></span>
                                    <span style="background: #785EF0"></span>
                                    <span style="background: #DC267F"></span>
                                    <span style="background: #FFB000"></span>
                                </div>
                                <div class="preset-name">Colorblind Safe</div>
                            </div>
                            <div class="preset-card" data-preset="darkMode">
                                <div class="preset-preview">
                                    <span style="background: #9333ea"></span>
                                    <span style="background: #059669"></span>
                                    <span style="background: #ea580c"></span>
                                    <span style="background: #db2777"></span>
                                </div>
                                <div class="preset-name">Dark Mode</div>
                            </div>
                            <div class="preset-card" data-preset="pastel">
                                <div class="preset-preview">
                                    <span style="background: #e9d5ff"></span>
                                    <span style="background: #bbf7d0"></span>
                                    <span style="background: #fed7aa"></span>
                                    <span style="background: #fce7f3"></span>
                                </div>
                                <div class="preset-name">Pastel</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="color-panel-footer">
                    <button class="footer-btn" id="reset-all-colors">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                            <path d="M3 3v5h5"/>
                        </svg>
                        Reset All Colors
                    </button>
                </div>
            </div>
        `;
        
        // Add to body
        document.body.appendChild(panel);
        
        // Add the CSS for the panel
        this.addPanelStyles();
        
        // Populate color items
        this.populateColorItems();
        
        // Setup event listeners
        this.setupPanelEventListeners();
    }
    
    togglePanel() {
        this.isPanelOpen = !this.isPanelOpen;
        const panel = document.getElementById('color-customizer-panel');
        const icon = document.getElementById('color-customizer-icon');
        
        if (this.isPanelOpen) {
            panel.classList.add('open');
            icon.classList.add('active');
        } else {
            panel.classList.remove('open');
            icon.classList.remove('active');
        }
    }

    addPanelStyles() {
        const style = document.createElement('style');
        style.id = 'color-customizer-styles';
        style.textContent = `
            /* Icon Button */
            .color-customizer-icon {
                position: fixed;
                left: 1.5rem;
                top: 18rem;
                width: 40px;
                height: 40px;
                background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05));
                backdrop-filter: blur(15px);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 12px;
                color: #e5e7eb;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 1002;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
            }
            
            .color-customizer-icon:hover {
                background: linear-gradient(135deg, rgba(167, 139, 250, 0.2), rgba(147, 51, 234, 0.1));
                border-color: rgba(167, 139, 250, 0.3);
                color: #a78bfa;
                transform: scale(1.08) translateY(-2px);
                box-shadow: 0 8px 30px rgba(147, 51, 234, 0.2);
            }
            
            .color-customizer-icon.active {
                background: linear-gradient(135deg, rgba(147, 51, 234, 0.4), rgba(167, 139, 250, 0.2));
                border-color: rgba(167, 139, 250, 0.5);
                color: #c4b5fd;
                box-shadow: 0 8px 30px rgba(147, 51, 234, 0.3);
            }
            
            .color-customizer-icon svg {
                transition: all 0.3s ease;
            }
            
            .color-customizer-icon:hover svg {
                transform: rotate(15deg) scale(1.1);
            }
            
            .color-customizer-icon.active svg {
                transform: rotate(45deg);
            }
            
            /* Floating Panel */
            .color-customizer-panel {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 9999;
                pointer-events: none;
                opacity: 0;
                transition: opacity 0.3s ease;
            }
            
            .color-customizer-panel.open {
                pointer-events: auto;
                opacity: 1;
            }
            
            .color-panel-backdrop {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                backdrop-filter: blur(4px);
            }
            
            .color-panel-container {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%) scale(0.85);
                width: 90%;
                max-width: 520px;
                max-height: 650px;
                background: linear-gradient(145deg, #2d2b3a, #252331);
                border: 1px solid rgba(167, 139, 250, 0.1);
                border-radius: 20px;
                box-shadow: 
                    0 25px 80px rgba(0, 0, 0, 0.6),
                    0 0 0 1px rgba(255, 255, 255, 0.05),
                    inset 0 1px 0 rgba(255, 255, 255, 0.1);
                display: flex;
                flex-direction: column;
                transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                opacity: 0;
            }
            
            .color-customizer-panel.open .color-panel-container {
                transform: translate(-50%, -50%) scale(1);
                opacity: 1;
            }

            .color-panel-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 1.5rem;
                background: linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.02));
                border-bottom: 1px solid rgba(167, 139, 250, 0.2);
                border-radius: 20px 20px 0 0;
                position: relative;
            }

            .color-panel-header::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 1px;
                background: linear-gradient(90deg, transparent, rgba(167, 139, 250, 0.5), transparent);
            }

            .color-panel-header h3 {
                color: #f8fafc;
                font-size: 1.2rem;
                font-weight: 700;
                margin: 0;
                display: flex;
                align-items: center;
                gap: 0.75rem;
                text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
            }

            .color-panel-header svg {
                color: #a78bfa;
                filter: drop-shadow(0 0 8px rgba(167, 139, 250, 0.3));
            }

            .color-panel-close {
                background: rgba(239, 68, 68, 0.1);
                border: 1px solid rgba(239, 68, 68, 0.2);
                color: #fca5a5;
                cursor: pointer;
                padding: 0.5rem;
                border-radius: 10px;
                transition: all 0.3s ease;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .color-panel-close:hover {
                background: rgba(239, 68, 68, 0.2);
                border-color: rgba(239, 68, 68, 0.4);
                color: #f87171;
                transform: scale(1.05);
                box-shadow: 0 4px 15px rgba(239, 68, 68, 0.2);
            }
            
            .color-panel-search {
                padding: 0 1.5rem;
                margin: 1.25rem 0;
                position: relative;
            }
            
            .color-panel-search svg {
                position: absolute;
                left: 2.25rem;
                top: 50%;
                transform: translateY(-50%);
                color: #a78bfa;
                pointer-events: none;
                transition: all 0.3s ease;
            }
            
            .color-panel-search input {
                width: 100%;
                padding: 0.75rem 0.75rem 0.75rem 2.75rem;
                background: linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.03));
                border: 2px solid rgba(167, 139, 250, 0.1);
                border-radius: 12px;
                color: #f1f5f9;
                font-size: 0.95rem;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                backdrop-filter: blur(10px);
            }
            
            .color-panel-search input:focus {
                outline: none;
                background: linear-gradient(135deg, rgba(255, 255, 255, 0.12), rgba(167, 139, 250, 0.08));
                border-color: rgba(167, 139, 250, 0.4);
                box-shadow: 0 0 0 3px rgba(167, 139, 250, 0.1), 0 4px 20px rgba(167, 139, 250, 0.2);
            }
            
            .color-panel-search input::placeholder {
                color: #94a3b8;
            }
            
            .color-panel-tabs {
                display: flex;
                padding: 0 1.5rem;
                gap: 0.75rem;
                margin-bottom: 1.5rem;
                background: rgba(0, 0, 0, 0.2);
                margin: 1rem 1.5rem;
                border-radius: 12px;
                padding: 0.5rem;
            }
            
            .tab-btn {
                flex: 1;
                padding: 0.75rem 1rem;
                background: transparent;
                border: none;
                border-radius: 8px;
                color: #94a3b8;
                font-size: 0.95rem;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                position: relative;
                overflow: hidden;
            }
            
            .tab-btn.active {
                background: linear-gradient(135deg, rgba(147, 51, 234, 0.3), rgba(167, 139, 250, 0.2));
                color: #c4b5fd;
                box-shadow: 0 2px 10px rgba(147, 51, 234, 0.3);
            }
            
            .tab-btn.active::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: linear-gradient(135deg, rgba(167, 139, 250, 0.1), transparent);
                border-radius: 8px;
            }
            
            .tab-btn:hover:not(.active) {
                background: rgba(255, 255, 255, 0.08);
                color: #e2e8f0;
                transform: translateY(-1px);
            }
            
            .color-panel-content {
                flex: 1;
                overflow-y: auto;
                padding: 0 1.25rem;
            }
            
            .tab-content {
                display: none;
            }
            
            .tab-content.active {
                display: block;
            }

            .color-items {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 1rem;
                padding: 0 1.5rem 1.5rem;
            }

            .color-item {
                display: flex;
                align-items: center;
                gap: 1rem;
                padding: 1rem;
                background: linear-gradient(135deg, rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0.02));
                border: 1px solid rgba(167, 139, 250, 0.1);
                border-radius: 16px;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                position: relative;
                backdrop-filter: blur(10px);
            }

            .color-item:hover {
                background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(167, 139, 250, 0.05));
                border-color: rgba(167, 139, 250, 0.3);
                transform: translateY(-2px);
                box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
            }

            .color-item.hidden {
                display: none;
            }

            .color-preview {
                width: 40px;
                height: 40px;
                border-radius: 12px;
                border: 3px solid rgba(255, 255, 255, 0.2);
                cursor: pointer;
                position: relative;
                overflow: hidden;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                box-shadow: 
                    0 4px 15px rgba(0, 0, 0, 0.2),
                    inset 0 1px 0 rgba(255, 255, 255, 0.2);
            }

            .color-preview:hover {
                transform: scale(1.15) rotate(5deg);
                border-color: rgba(255, 255, 255, 0.5);
                box-shadow: 
                    0 8px 25px rgba(0, 0, 0, 0.3),
                    0 0 20px var(--preview-color, currentColor),
                    inset 0 1px 0 rgba(255, 255, 255, 0.3);
            }

            .color-preview:active {
                transform: scale(1.05);
            }

            .color-input {
                position: absolute;
                width: 100%;
                height: 100%;
                opacity: 0;
                cursor: pointer;
            }

            .color-label {
                color: #f1f5f9;
                font-size: 0.9rem;
                font-weight: 600;
                flex: 1;
                display: flex;
                align-items: center;
                gap: 0.5rem;
                text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
            }

            .reset-color-btn {
                background: rgba(239, 68, 68, 0.1);
                border: 1px solid rgba(239, 68, 68, 0.2);
                color: #fca5a5;
                cursor: pointer;
                padding: 0.4rem;
                border-radius: 8px;
                font-size: 0.7rem;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: 0.7;
            }

            .color-item:hover .reset-color-btn {
                opacity: 1;
            }

            .reset-color-btn:hover {
                background: rgba(239, 68, 68, 0.2);
                border-color: rgba(239, 68, 68, 0.4);
                color: #f87171;
                transform: scale(1.1);
                box-shadow: 0 4px 15px rgba(239, 68, 68, 0.2);
            }
            
            /* Preset Grid */
            .preset-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 1rem;
            }
            
            .preset-card {
                background: rgba(255, 255, 255, 0.03);
                border: 2px solid rgba(255, 255, 255, 0.08);
                border-radius: 12px;
                padding: 1rem;
                cursor: pointer;
                transition: all 0.2s ease;
            }
            
            .preset-card:hover {
                background: rgba(255, 255, 255, 0.06);
                border-color: #a78bfa;
                transform: translateY(-2px);
            }
            
            .preset-preview {
                display: flex;
                gap: 0.25rem;
                margin-bottom: 0.75rem;
            }
            
            .preset-preview span {
                width: 24px;
                height: 24px;
                border-radius: 4px;
            }
            
            .preset-name {
                color: #e5e7eb;
                font-size: 0.9rem;
                font-weight: 500;
                text-align: center;
            }
            
            /* Footer */
            .color-panel-footer {
                padding: 1.25rem;
                border-top: 1px solid rgba(255, 255, 255, 0.1);
                display: flex;
                justify-content: center;
            }

            .footer-btn {
                padding: 0.6rem 1.5rem;
                background: rgba(239, 68, 68, 0.2);
                border: 1px solid rgba(239, 68, 68, 0.3);
                color: #f87171;
                border-radius: 8px;
                font-size: 0.9rem;
                cursor: pointer;
                transition: all 0.2s ease;
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }

            .footer-btn:hover {
                background: rgba(239, 68, 68, 0.3);
                border-color: rgba(239, 68, 68, 0.5);
                transform: scale(1.02);
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
            { key: 'person', label: 'Person' },
            { key: 'location', label: 'Location' },
            { key: 'organization', label: 'Org' },
            { key: 'email', label: 'Email' },
            { key: 'phone', label: 'Phone' },
            { key: 'url', label: 'URL' },
            { key: 'civilid', label: 'Civil ID' },
            { key: 'passport', label: 'Passport' },
            { key: 'creditcard', label: 'Card' }
        ];

        entityTypes.forEach(({ key, label }) => {
            const item = document.createElement('div');
            item.className = 'color-item';
            item.dataset.entityType = key;
            item.innerHTML = `
                <div class="color-preview" style="background-color: ${this.activeColors[key]}">
                    <input type="color" class="color-input" 
                           id="color-${key}" 
                           value="${this.activeColors[key]}"
                           data-entity="${key}">
                </div>
                <span class="color-label">${label}</span>
                <button class="reset-color-btn" data-entity="${key}" title="Reset">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                        <path d="M3 3v5h5"/>
                    </svg>
                </button>
            `;
            container.appendChild(item);
        });
    }

    setupPanelEventListeners() {
        // Close button
        const closeBtn = document.getElementById('color-panel-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.togglePanel();
            });
        }
        
        // Backdrop click to close
        const backdrop = document.querySelector('.color-panel-backdrop');
        if (backdrop) {
            backdrop.addEventListener('click', () => {
                this.togglePanel();
            });
        }
        
        // Tab switching
        const tabBtns = document.querySelectorAll('.tab-btn');
        const tabContents = document.querySelectorAll('.tab-content');
        
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const tabName = btn.dataset.tab;
                
                // Update active states
                tabBtns.forEach(b => b.classList.remove('active'));
                tabContents.forEach(c => c.classList.remove('active'));
                
                btn.classList.add('active');
                document.getElementById(`${tabName}-tab`).classList.add('active');
            });
        });
        
        // Search functionality
        const searchInput = document.getElementById('color-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchQuery = e.target.value.toLowerCase();
                this.filterColorItems();
            });
        }
        
        // Preset cards
        const presetCards = document.querySelectorAll('.preset-card');
        presetCards.forEach(card => {
            card.addEventListener('click', () => {
                const preset = card.dataset.preset;
                if (this.presets[preset]) {
                    this.activeColors = { ...this.presets[preset] };
                    this.saveColors();
                    this.applyColors();
                    this.populateColorItems();
                    this.setupColorInputListeners();
                    
                    // Switch to colors tab
                    document.querySelector('[data-tab="colors"]').click();
                }
            });
        });

        this.setupColorInputListeners();
        
        // Reset all colors
        const resetAllBtn = document.getElementById('reset-all-colors');
        if (resetAllBtn) {
            resetAllBtn.addEventListener('click', () => {
                this.activeColors = { ...this.defaultColors };
                this.saveColors();
                this.applyColors();
                this.populateColorItems();
                this.setupColorInputListeners();
            });
        }
        
        // ESC key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isPanelOpen) {
                this.togglePanel();
            }
        });
    }
    
    setupColorInputListeners() {
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
            });
        });
    }
    
    filterColorItems() {
        const items = document.querySelectorAll('.color-item');
        items.forEach(item => {
            const entityType = item.dataset.entityType;
            const label = item.querySelector('.color-label').textContent.toLowerCase();
            const shouldShow = !this.searchQuery || 
                              entityType.includes(this.searchQuery) || 
                              label.includes(this.searchQuery);
            
            item.classList.toggle('hidden', !shouldShow);
        });
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