/**
 * System Status Dashboard
 * Provides comprehensive monitoring and health check for ContractPicker
 */

class SystemStatus {
    constructor() {
        this.metrics = {
            performance: {},
            memory: {},
            errors: [],
            features: {}
        };
        this.init();
    }

    init() {
        this.startPerformanceMonitoring();
        this.checkFeatureAvailability();
        this.setupHealthChecks();
    }

    /**
     * Monitor performance metrics
     */
    startPerformanceMonitoring() {
        // Track page load time
        window.addEventListener('load', () => {
            const perfData = performance.getEntriesByType('navigation')[0];
            this.metrics.performance.pageLoad = perfData.loadEventEnd - perfData.fetchStart;
        });

        // Track memory usage (if available)
        if (performance.memory) {
            setInterval(() => {
                this.metrics.memory = {
                    used: performance.memory.usedJSHeapSize,
                    total: performance.memory.totalJSHeapSize,
                    limit: performance.memory.jsHeapSizeLimit
                };
            }, 5000);
        }

        // Track operation times
        this.trackOperationTimes();
    }

    /**
     * Track operation execution times
     */
    trackOperationTimes() {
        const originalCreateOffer = window.ContractPicker?.createNewOffer;
        if (originalCreateOffer) {
            window.ContractPicker.createNewOffer = (...args) => {
                const start = performance.now();
                const result = originalCreateOffer.apply(this, args);
                const duration = performance.now() - start;
                
                this.recordMetric('createOffer', duration);
                return result;
            };
        }
    }

    /**
     * Check availability of key features
     */
    checkFeatureAvailability() {
        this.metrics.features = {
            localStorage: typeof Storage !== 'undefined',
            fileAPI: !!(window.File && window.FileReader && window.FileList && window.Blob),
            dragAndDrop: 'draggable' in document.createElement('div'),
            css3: this.checkCSS3Support(),
            es6: this.checkES6Support(),
            performance: !!window.performance,
            charts: typeof Chart !== 'undefined'
        };
    }

    /**
     * Check CSS3 support
     */
    checkCSS3Support() {
        const div = document.createElement('div');
        return 'transform' in div.style && 'transition' in div.style;
    }

    /**
     * Check ES6 support
     */
    checkES6Support() {
        try {
            new Function('(a = 0) => a');
            return true;
        } catch (err) {
            return false;
        }
    }

    /**
     * Setup periodic health checks
     */
    setupHealthChecks() {
        setInterval(() => {
            this.performHealthCheck();
        }, 30000); // Every 30 seconds
    }

    /**
     * Perform comprehensive health check
     */
    performHealthCheck() {
        const health = {
            timestamp: new Date().toISOString(),
            dom: this.checkDOMHealth(),
            storage: this.checkStorageHealth(),
            templates: this.checkTemplatesHealth(),
            offers: this.checkOffersHealth()
        };

        this.metrics.lastHealthCheck = health;
        
        // Log any issues
        const issues = Object.entries(health)
            .filter(([key, value]) => key !== 'timestamp' && !value.healthy)
            .map(([key, value]) => `${key}: ${value.message}`);

        if (issues.length > 0) {
            console.warn('Health check issues:', issues);
        }

        return health;
    }

    /**
     * Check DOM health
     */
    checkDOMHealth() {
        const requiredElements = [
            'offers-container',
            'export-csv-btn',
            'import-csv-btn',
            'add-offer-btn'
        ];

        const missing = requiredElements.filter(id => !document.getElementById(id));
        
        return {
            healthy: missing.length === 0,
            message: missing.length > 0 ? `Missing elements: ${missing.join(', ')}` : 'OK',
            elementsCount: document.querySelectorAll('*').length
        };
    }

    /**
     * Check storage health
     */
    checkStorageHealth() {
        try {
            const testKey = 'systemStatus_test';
            localStorage.setItem(testKey, 'test');
            localStorage.removeItem(testKey);
            
            const usage = this.getStorageUsage();
            
            return {
                healthy: true,
                message: 'OK',
                usage: usage
            };
        } catch (error) {
            return {
                healthy: false,
                message: `Storage error: ${error.message}`
            };
        }
    }

    /**
     * Get localStorage usage
     */
    getStorageUsage() {
        let total = 0;
        const items = {};
        
        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                const size = localStorage[key].length;
                items[key] = size;
                total += size;
            }
        }
        
        return { total, items };
    }

    /**
     * Check templates health
     */
    checkTemplatesHealth() {
        try {
            const templates = JSON.parse(localStorage.getItem('contractTemplates') || '[]');
            const currentTemplateId = localStorage.getItem('currentTemplateId');
            
            const hasDefault = templates.some(t => t.id === 'default');
            const currentExists = templates.some(t => t.id === currentTemplateId);
            
            return {
                healthy: hasDefault && currentExists,
                message: hasDefault && currentExists ? 'OK' : 'Template configuration issues',
                count: templates.length,
                current: currentTemplateId
            };
        } catch (error) {
            return {
                healthy: false,
                message: `Templates error: ${error.message}`
            };
        }
    }

    /**
     * Check offers health
     */
    checkOffersHealth() {
        const container = document.getElementById('offers-container');
        if (!container) {
            return {
                healthy: false,
                message: 'Offers container not found'
            };
        }

        const offers = container.querySelectorAll('.offer-card');
        const groupedOffers = container.querySelectorAll('.grouped-offer-card');
        
        return {
            healthy: true,
            message: 'OK',
            individualOffers: offers.length,
            groupedOffers: groupedOffers.length,
            total: offers.length + groupedOffers.length
        };
    }

    /**
     * Record a performance metric
     */
    recordMetric(operation, duration) {
        if (!this.metrics.performance[operation]) {
            this.metrics.performance[operation] = [];
        }
        
        this.metrics.performance[operation].push({
            timestamp: Date.now(),
            duration: duration
        });
        
        // Keep only last 50 measurements
        if (this.metrics.performance[operation].length > 50) {
            this.metrics.performance[operation].shift();
        }
    }

    /**
     * Get system status report
     */
    getStatusReport() {
        return {
            timestamp: new Date().toISOString(),
            metrics: this.metrics,
            health: this.performHealthCheck(),
            browser: {
                userAgent: navigator.userAgent,
                language: navigator.language,
                cookieEnabled: navigator.cookieEnabled,
                onLine: navigator.onLine
            },
            screen: {
                width: screen.width,
                height: screen.height,
                colorDepth: screen.colorDepth
            },
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight
            }
        };
    }

    /**
     * Export status report
     */
    exportStatusReport() {
        const report = this.getStatusReport();
        const blob = new Blob([JSON.stringify(report, null, 2)], {
            type: 'application/json'
        });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `contractpicker_status_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}

// Initialize system status monitoring
const systemStatus = new SystemStatus();

// Make available globally
window.SystemStatus = systemStatus;

// Log startup
console.log('🔍 System Status monitoring initialized');
