/**
 * Security utility functions for preventing XSS and other vulnerabilities
 */

class SecurityUtils {
    /**
     * Escape HTML special characters to prevent XSS
     * @param {string} str - The string to escape
     * @returns {string} The escaped string
     */
    static escapeHtml(str) {
        if (typeof str !== 'string') return '';
        
        const htmlEscapeMap = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;',
            '/': '&#x2F;',
            '`': '&#x60;',
            '=': '&#x3D;'
        };
        
        return str.replace(/[&<>"'`=\/]/g, char => htmlEscapeMap[char]);
    }
    
    /**
     * Create safe HTML content with escaped text and allowed tags
     * @param {string} html - The HTML string to sanitize
     * @param {Array<string>} allowedTags - List of allowed HTML tags
     * @returns {string} Sanitized HTML
     */
    static sanitizeHtml(html, allowedTags = ['b', 'i', 'em', 'strong', 'span', 'br']) {
        if (typeof html !== 'string') return '';
        
        // First escape all HTML
        let sanitized = this.escapeHtml(html);
        
        // Then selectively unescape allowed tags
        allowedTags.forEach(tag => {
            // Opening tags
            const openTagRegex = new RegExp(`&lt;${tag}(\\s[^&]*)&gt;`, 'gi');
            sanitized = sanitized.replace(openTagRegex, `<${tag}$1>`);
            
            // Closing tags
            const closeTagRegex = new RegExp(`&lt;\\/${tag}&gt;`, 'gi');
            sanitized = sanitized.replace(closeTagRegex, `</${tag}>`);
            
            // Self-closing tags (like br)
            const selfClosingRegex = new RegExp(`&lt;${tag}\\s*\\/?&gt;`, 'gi');
            sanitized = sanitized.replace(selfClosingRegex, `<${tag} />`);
        });
        
        return sanitized;
    }
    
    /**
     * Safely set text content of an element
     * @param {HTMLElement} element - The DOM element
     * @param {string} text - The text to set
     */
    static setTextContent(element, text) {
        if (element && element.textContent !== undefined) {
            element.textContent = text;
        }
    }
    
    /**
     * Safely set HTML content of an element with sanitization
     * @param {HTMLElement} element - The DOM element
     * @param {string} html - The HTML to set
     * @param {Array<string>} allowedTags - List of allowed HTML tags
     */
    static setHtmlContent(element, html, allowedTags) {
        if (element && element.innerHTML !== undefined) {
            element.innerHTML = this.sanitizeHtml(html, allowedTags);
        }
    }
    
    /**
     * Validate and sanitize user input
     * @param {string} input - User input to validate
     * @param {number} maxLength - Maximum allowed length
     * @returns {string} Sanitized input
     */
    static sanitizeInput(input, maxLength = 10000) {
        if (typeof input !== 'string') return '';
        
        // Trim and limit length
        let sanitized = input.trim().substring(0, maxLength);
        
        // Remove null bytes and other control characters
        sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
        
        return sanitized;
    }
    
    /**
     * Validate email format
     * @param {string} email - Email to validate
     * @returns {boolean} True if valid email format
     */
    static isValidEmail(email) {
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return emailRegex.test(email);
    }
    
    /**
     * Validate URL format
     * @param {string} url - URL to validate
     * @returns {boolean} True if valid URL format
     */
    static isValidUrl(url) {
        try {
            const urlObj = new URL(url);
            return ['http:', 'https:'].includes(urlObj.protocol);
        } catch {
            return false;
        }
    }
    
    /**
     * Create a safe DOM element with text content
     * @param {string} tagName - HTML tag name
     * @param {string} textContent - Text content for the element
     * @param {Object} attributes - Optional attributes
     * @returns {HTMLElement} The created element
     */
    static createElement(tagName, textContent = '', attributes = {}) {
        const element = document.createElement(tagName);
        
        if (textContent) {
            element.textContent = textContent;
        }
        
        // Safely set attributes
        Object.keys(attributes).forEach(key => {
            if (key === 'className') {
                element.className = attributes[key];
            } else if (key === 'dataset') {
                Object.keys(attributes[key]).forEach(dataKey => {
                    element.dataset[dataKey] = attributes[key][dataKey];
                });
            } else if (!key.startsWith('on')) { // Prevent inline event handlers
                element.setAttribute(key, attributes[key]);
            }
        });
        
        return element;
    }
    
    /**
     * Sanitize JSON string before parsing
     * @param {string} jsonString - JSON string to parse
     * @returns {Object|null} Parsed object or null if invalid
     */
    static safeJsonParse(jsonString) {
        try {
            // Remove any potential BOM or invisible characters
            const cleaned = jsonString.replace(/^\uFEFF/, '').trim();
            return JSON.parse(cleaned);
        } catch (error) {
            console.error('Invalid JSON:', error);
            return null;
        }
    }
    
    /**
     * Create Content Security Policy meta tag
     * @returns {HTMLMetaElement} CSP meta element
     */
    static createCSPMeta() {
        const meta = document.createElement('meta');
        meta.httpEquiv = 'Content-Security-Policy';
        meta.content = "default-src 'self'; " +
                      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net; " +
                      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
                      "font-src 'self' https://fonts.gstatic.com; " +
                      "img-src 'self' data: https:; " +
                      "connect-src 'self' http://localhost:* http://127.0.0.1:*";
        return meta;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SecurityUtils;
}