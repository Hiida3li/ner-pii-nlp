/**
 * Production-safe logging utility
 * Provides logging methods that can be easily disabled in production
 */

class Logger {
    constructor(isProduction = false, logLevel = 'INFO') {
        this.isProduction = isProduction;
        this.levels = {
            'DEBUG': 0,
            'INFO': 1,
            'WARN': 2,
            'ERROR': 3
        };
        this.currentLevel = this.levels[logLevel] || 1;
    }
    
    debug(...args) {
        if (!this.isProduction && this.currentLevel <= this.levels.DEBUG) {
            console.log('[DEBUG]', ...args);
        }
    }
    
    info(...args) {
        if (!this.isProduction && this.currentLevel <= this.levels.INFO) {
            console.info('[INFO]', ...args);
        }
    }
    
    warn(...args) {
        if (this.currentLevel <= this.levels.WARN) {
            console.warn('[WARN]', ...args);
        }
    }
    
    error(...args) {
        if (this.currentLevel <= this.levels.ERROR) {
            console.error('[ERROR]', ...args);
        }
    }
    
    // Group logging for better organization
    group(label) {
        if (!this.isProduction) {
            console.group(label);
        }
    }
    
    groupEnd() {
        if (!this.isProduction) {
            console.groupEnd();
        }
    }
    
    // Table logging for structured data
    table(data) {
        if (!this.isProduction && console.table) {
            console.table(data);
        }
    }
    
    // Performance timing
    time(label) {
        if (!this.isProduction) {
            console.time(label);
        }
    }
    
    timeEnd(label) {
        if (!this.isProduction) {
            console.timeEnd(label);
        }
    }
}

// Create global logger instance
// Set to production mode based on hostname or environment
const isProduction = window.location.hostname !== 'localhost' && 
                    window.location.hostname !== '127.0.0.1' &&
                    !window.location.hostname.startsWith('192.168.');

// Get log level from meta tag or default to INFO
const logLevelMeta = document.querySelector('meta[name="log-level"]');
const logLevel = logLevelMeta ? logLevelMeta.content : 'INFO';

// Global logger instance
window.logger = new Logger(isProduction, logLevel);

// Override console methods in production
if (isProduction) {
    console.log = function() {};
    console.debug = function() {};
    console.info = function() {};
    // Keep console.warn and console.error for important messages
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Logger;
}