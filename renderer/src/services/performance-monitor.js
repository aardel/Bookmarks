/**
 * Performance Monitor Service
 * Monitors and optimizes application performance
 */
class PerformanceMonitor {
    constructor(options = {}) {
        this.options = {
            enableMetrics: true,
            enableMemoryMonitoring: true,
            enableRenderMonitoring: true,
            logInterval: 30000, // 30 seconds
            memoryThreshold: 0.8, // 80% of available memory
            fpsThreshold: 30,
            ...options
        };
        
        this.metrics = {
            memory: [],
            renderTimes: [],
            fps: [],
            domNodes: [],
            networkRequests: [],
            errors: []
        };
        
        this.observers = {
            mutation: null,
            performance: null,
            memory: null
        };
        
        this.timers = new Map();
        this.counters = new Map();
        this.isMonitoring = false;
        
        if (this.options.enableMetrics) {
            this.init();
        }
    }

    init() {
        this.setupPerformanceObserver();
        this.setupMemoryMonitoring();
        this.setupRenderMonitoring();
        this.setupErrorTracking();
        this.startMonitoring();
    }

    setupPerformanceObserver() {
        if ('PerformanceObserver' in window) {
            try {
                this.observers.performance = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    entries.forEach(entry => {
                        this.processPerformanceEntry(entry);
                    });
                });

                this.observers.performance.observe({ 
                    entryTypes: ['measure', 'navigation', 'resource', 'paint'] 
                });
            } catch (error) {
                console.warn('PerformanceObserver not fully supported:', error);
            }
        }
    }

    setupMemoryMonitoring() {
        if (this.options.enableMemoryMonitoring && 'memory' in performance) {
            setInterval(() => {
                this.recordMemoryUsage();
            }, this.options.logInterval);
        }
    }

    setupRenderMonitoring() {
        if (this.options.enableRenderMonitoring) {
            // Monitor DOM mutations
            this.observers.mutation = new MutationObserver((mutations) => {
                this.recordDOMChanges(mutations);
            });

            this.observers.mutation.observe(document.body, {
                childList: true,
                subtree: true,
                attributes: true
            });

            // Monitor FPS
            this.startFPSMonitoring();
        }
    }

    setupErrorTracking() {
        window.addEventListener('error', (event) => {
            this.recordError({
                type: 'javascript',
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                timestamp: Date.now()
            });
        });

        window.addEventListener('unhandledrejection', (event) => {
            this.recordError({
                type: 'promise',
                message: event.reason?.message || 'Unhandled promise rejection',
                timestamp: Date.now()
            });
        });
    }

    processPerformanceEntry(entry) {
        switch (entry.entryType) {
            case 'measure':
                this.metrics.renderTimes.push({
                    name: entry.name,
                    duration: entry.duration,
                    timestamp: entry.startTime
                });
                break;
                
            case 'resource':
                this.metrics.networkRequests.push({
                    name: entry.name,
                    duration: entry.duration,
                    size: entry.transferSize || 0,
                    timestamp: entry.startTime
                });
                break;
                
            case 'paint':
                this.recordPaintMetric(entry);
                break;
        }

        // Keep metrics array sizes manageable
        this.pruneMetrics();
    }

    recordMemoryUsage() {
        if ('memory' in performance) {
            const memory = performance.memory;
            const usage = {
                used: memory.usedJSHeapSize,
                total: memory.totalJSHeapSize,
                limit: memory.jsHeapSizeLimit,
                timestamp: Date.now()
            };
            
            this.metrics.memory.push(usage);
            
            // Check for memory leaks
            const percentage = usage.used / usage.limit;
            if (percentage > this.options.memoryThreshold) {
                this.handleMemoryWarning(usage);
            }
        }
    }

    recordDOMChanges(mutations) {
        const nodeCount = document.querySelectorAll('*').length;
        this.metrics.domNodes.push({
            count: nodeCount,
            mutations: mutations.length,
            timestamp: Date.now()
        });
    }

    recordError(error) {
        this.metrics.errors.push(error);
        
        // Alert for critical errors
        if (error.type === 'javascript') {
            console.error('Performance Monitor - JS Error:', error);
        }
    }

    recordPaintMetric(entry) {
        // Track First Contentful Paint, Largest Contentful Paint, etc.
        console.log(`Paint metric: ${entry.name} - ${entry.startTime}ms`);
    }

    startFPSMonitoring() {
        let frames = 0;
        let lastTime = performance.now();
        
        const countFrames = (currentTime) => {
            frames++;
            
            if (currentTime - lastTime >= 1000) {
                const fps = Math.round((frames * 1000) / (currentTime - lastTime));
                this.metrics.fps.push({
                    value: fps,
                    timestamp: currentTime
                });
                
                if (fps < this.options.fpsThreshold) {
                    this.handleLowFPS(fps);
                }
                
                frames = 0;
                lastTime = currentTime;
            }
            
            if (this.isMonitoring) {
                requestAnimationFrame(countFrames);
            }
        };
        
        requestAnimationFrame(countFrames);
    }

    // Timing utilities
    startTimer(name) {
        this.timers.set(name, performance.now());
        
        if ('performance' in window && 'mark' in performance) {
            performance.mark(`${name}-start`);
        }
    }

    endTimer(name) {
        const startTime = this.timers.get(name);
        if (startTime) {
            const duration = performance.now() - startTime;
            this.timers.delete(name);
            
            if ('performance' in window && 'measure' in performance) {
                try {
                    performance.measure(name, `${name}-start`);
                } catch (error) {
                    // Fallback if mark doesn't exist
                    console.log(`Timer ${name}: ${duration.toFixed(2)}ms`);
                }
            }
            
            return duration;
        }
        return 0;
    }

    // Counter utilities
    incrementCounter(name) {
        const current = this.counters.get(name) || 0;
        this.counters.set(name, current + 1);
    }

    getCounter(name) {
        return this.counters.get(name) || 0;
    }

    resetCounter(name) {
        this.counters.set(name, 0);
    }

    // Warning handlers
    handleMemoryWarning(usage) {
        console.warn('High memory usage detected:', {
            percentage: Math.round((usage.used / usage.limit) * 100),
            used: Math.round(usage.used / 1024 / 1024),
            limit: Math.round(usage.limit / 1024 / 1024)
        });
        
        // Suggest garbage collection or cleanup
        this.suggestCleanup();
    }

    handleLowFPS(fps) {
        console.warn(`Low FPS detected: ${fps}fps`);
        
        // Suggest performance optimizations
        this.suggestOptimizations();
    }

    suggestCleanup() {
        // Dispatch event for application to handle cleanup
        document.dispatchEvent(new CustomEvent('performance:cleanup-suggested', {
            detail: { reason: 'high-memory' }
        }));
    }

    suggestOptimizations() {
        // Dispatch event for application to handle optimizations
        document.dispatchEvent(new CustomEvent('performance:optimization-suggested', {
            detail: { reason: 'low-fps' }
        }));
    }

    // Metrics management
    pruneMetrics() {
        const maxEntries = 1000;
        
        Object.keys(this.metrics).forEach(key => {
            if (this.metrics[key].length > maxEntries) {
                this.metrics[key] = this.metrics[key].slice(-maxEntries);
            }
        });
    }

    getMetrics() {
        return {
            ...this.metrics,
            summary: this.getSummary()
        };
    }

    getSummary() {
        const now = Date.now();
        const fiveMinutesAgo = now - (5 * 60 * 1000);
        
        return {
            memory: this.getMemorySummary(fiveMinutesAgo),
            performance: this.getPerformanceSummary(fiveMinutesAgo),
            errors: this.getErrorSummary(fiveMinutesAgo),
            fps: this.getFPSSummary(fiveMinutesAgo)
        };
    }

    getMemorySummary(since) {
        const recentMemory = this.metrics.memory.filter(m => m.timestamp > since);
        if (recentMemory.length === 0) return null;
        
        const latest = recentMemory[recentMemory.length - 1];
        const average = recentMemory.reduce((sum, m) => sum + m.used, 0) / recentMemory.length;
        
        return {
            current: Math.round(latest.used / 1024 / 1024),
            average: Math.round(average / 1024 / 1024),
            percentage: Math.round((latest.used / latest.limit) * 100)
        };
    }

    getPerformanceSummary(since) {
        const recentRenders = this.metrics.renderTimes.filter(r => r.timestamp > since);
        if (recentRenders.length === 0) return null;
        
        const average = recentRenders.reduce((sum, r) => sum + r.duration, 0) / recentRenders.length;
        const max = Math.max(...recentRenders.map(r => r.duration));
        
        return {
            averageRenderTime: Math.round(average * 100) / 100,
            maxRenderTime: Math.round(max * 100) / 100,
            renderCount: recentRenders.length
        };
    }

    getErrorSummary(since) {
        const recentErrors = this.metrics.errors.filter(e => e.timestamp > since);
        return {
            total: recentErrors.length,
            javascript: recentErrors.filter(e => e.type === 'javascript').length,
            promises: recentErrors.filter(e => e.type === 'promise').length
        };
    }

    getFPSSummary(since) {
        const recentFPS = this.metrics.fps.filter(f => f.timestamp > since);
        if (recentFPS.length === 0) return null;
        
        const average = recentFPS.reduce((sum, f) => sum + f.value, 0) / recentFPS.length;
        const min = Math.min(...recentFPS.map(f => f.value));
        
        return {
            average: Math.round(average),
            minimum: min,
            samples: recentFPS.length
        };
    }

    // Control methods
    startMonitoring() {
        this.isMonitoring = true;
        console.log('Performance monitoring started');
    }

    stopMonitoring() {
        this.isMonitoring = false;
        
        if (this.observers.performance) {
            this.observers.performance.disconnect();
        }
        
        if (this.observers.mutation) {
            this.observers.mutation.disconnect();
        }
        
        console.log('Performance monitoring stopped');
    }

    exportMetrics() {
        return JSON.stringify(this.getMetrics(), null, 2);
    }

    clearMetrics() {
        Object.keys(this.metrics).forEach(key => {
            this.metrics[key] = [];
        });
        this.counters.clear();
        this.timers.clear();
    }
}

// Singleton instance
let performanceMonitorInstance = null;

function createPerformanceMonitor(options = {}) {
    if (!performanceMonitorInstance) {
        performanceMonitorInstance = new PerformanceMonitor(options);
    }
    return performanceMonitorInstance;
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PerformanceMonitor, createPerformanceMonitor };
} else {
    window.PerformanceMonitor = PerformanceMonitor;
    window.createPerformanceMonitor = createPerformanceMonitor;
}