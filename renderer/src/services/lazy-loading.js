/**
 * Lazy Loading Service
 * Handles lazy loading of images, icons, and other resources
 */
class LazyLoading {
    constructor(options = {}) {
        this.options = {
            rootMargin: '50px 0px',
            threshold: 0.1,
            placeholderClass: 'lazy-placeholder',
            loadedClass: 'lazy-loaded',
            errorClass: 'lazy-error',
            ...options
        };
        
        this.observer = null;
        this.loadingQueue = new Map();
        this.cache = new Map();
        this.retryAttempts = new Map();
        this.maxRetries = 3;
        
        this.init();
    }

    init() {
        if ('IntersectionObserver' in window) {
            this.observer = new IntersectionObserver(
                this.handleIntersection.bind(this),
                {
                    rootMargin: this.options.rootMargin,
                    threshold: this.options.threshold
                }
            );
        }
        
        this.setupPreloading();
    }

    handleIntersection(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                this.loadElement(entry.target);
                this.observer.unobserve(entry.target);
            }
        });
    }

    observe(element) {
        if (!this.observer) {
            // Fallback for browsers without IntersectionObserver
            this.loadElement(element);
            return;
        }

        element.classList.add(this.options.placeholderClass);
        this.observer.observe(element);
    }

    unobserve(element) {
        if (this.observer) {
            this.observer.unobserve(element);
        }
    }

    async loadElement(element) {
        const src = element.dataset.src || element.dataset.lazySrc;
        const type = element.dataset.lazyType || 'image';
        
        if (!src) return;

        element.classList.add('lazy-loading');

        try {
            let result;
            if (this.cache.has(src)) {
                result = this.cache.get(src);
            } else {
                result = await this.loadResource(src, type);
                this.cache.set(src, result);
            }

            await this.applyResult(element, result, type);
            element.classList.remove('lazy-loading', this.options.placeholderClass);
            element.classList.add(this.options.loadedClass);
            
            // Dispatch loaded event
            element.dispatchEvent(new CustomEvent('lazy:loaded', {
                detail: { src, type, element }
            }));

        } catch (error) {
            this.handleLoadError(element, src, error);
        }
    }

    async loadResource(src, type) {
        switch (type) {
            case 'image':
                return this.loadImage(src);
            case 'icon':
                return this.loadIcon(src);
            case 'favicon':
                return this.loadFavicon(src);
            case 'app-icon':
                return this.loadAppIcon(src);
            default:
                return this.loadImage(src);
        }
    }

    loadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(src);
            img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
            img.src = src;
        });
    }

    async loadIcon(src) {
        // For SVG icons or icon fonts
        if (src.includes('.svg') || src.startsWith('data:image/svg')) {
            return this.loadImage(src);
        }
        
        // For icon fonts (Font Awesome, etc.)
        if (src.startsWith('fa-') || src.startsWith('fas ')) {
            return src; // Icon class, no loading needed
        }
        
        return this.loadImage(src);
    }

    async loadFavicon(url) {
        // Extract domain and try multiple favicon sources
        const domain = new URL(url).hostname;
        const faviconSources = [
            `https://${domain}/favicon.ico`,
            `https://${domain}/favicon.png`,
            `https://${domain}/apple-touch-icon.png`,
            `https://www.google.com/s2/favicons?domain=${domain}&sz=32`,
            `https://icons.duckduckgo.com/ip3/${domain}.ico`
        ];

        for (const src of faviconSources) {
            try {
                await this.loadImage(src);
                return src;
            } catch (error) {
                continue;
            }
        }

        throw new Error(`No favicon found for ${domain}`);
    }

    async loadAppIcon(appPath) {
        if (window.electronAPI && window.electronAPI.extractAppIcon) {
            try {
                const result = await window.electronAPI.extractAppIcon(appPath);
                if (result.success && result.iconUrl) {
                    return result.iconUrl;
                }
            } catch (error) {
                console.warn('Failed to extract app icon:', error);
            }
        }

        // Fallback to default app icon
        return this.getDefaultAppIcon(appPath);
    }

    getDefaultAppIcon(appPath) {
        const ext = appPath.split('.').pop()?.toLowerCase();
        const defaultIcons = {
            'exe': '/assets/icons/executable.svg',
            'app': '/assets/icons/application.svg',
            'msi': '/assets/icons/installer.svg',
            'dmg': '/assets/icons/disk.svg',
            'deb': '/assets/icons/package.svg',
            'rpm': '/assets/icons/package.svg'
        };
        
        return defaultIcons[ext] || '/assets/icons/default-app.svg';
    }

    async applyResult(element, result, type) {
        switch (type) {
            case 'image':
            case 'icon':
            case 'favicon':
            case 'app-icon':
                if (element.tagName === 'IMG') {
                    element.src = result;
                } else {
                    element.style.backgroundImage = `url(${result})`;
                }
                break;
            default:
                if (element.tagName === 'IMG') {
                    element.src = result;
                }
        }
    }

    handleLoadError(element, src, error) {
        const retryCount = this.retryAttempts.get(src) || 0;
        
        if (retryCount < this.maxRetries) {
            this.retryAttempts.set(src, retryCount + 1);
            
            // Retry with exponential backoff
            setTimeout(() => {
                this.loadElement(element);
            }, Math.pow(2, retryCount) * 1000);
            
            return;
        }

        // Max retries reached, show error state
        element.classList.remove('lazy-loading', this.options.placeholderClass);
        element.classList.add(this.options.errorClass);
        
        // Set fallback image/icon
        this.setFallback(element);
        
        // Dispatch error event
        element.dispatchEvent(new CustomEvent('lazy:error', {
            detail: { src, error, element }
        }));
    }

    setFallback(element) {
        const fallbackSrc = element.dataset.fallback || '/assets/icons/broken-image.svg';
        
        if (element.tagName === 'IMG') {
            element.src = fallbackSrc;
        } else {
            element.style.backgroundImage = `url(${fallbackSrc})`;
        }
    }

    // Preloading functionality
    setupPreloading() {
        // Preload critical images
        this.preloadCriticalResources();
        
        // Setup idle time preloading
        this.setupIdlePreloading();
    }

    preloadCriticalResources() {
        const criticalImages = [
            '/assets/icons/bookmark.svg',
            '/assets/icons/folder.svg',
            '/assets/icons/application.svg',
            '/assets/icons/website.svg'
        ];

        criticalImages.forEach(src => {
            if (!this.cache.has(src)) {
                this.loadImage(src).then(result => {
                    this.cache.set(src, result);
                }).catch(error => {
                    console.warn('Failed to preload critical resource:', src, error);
                });
            }
        });
    }

    setupIdlePreloading() {
        if ('requestIdleCallback' in window) {
            const preloadBatch = () => {
                requestIdleCallback((deadline) => {
                    while (deadline.timeRemaining() > 0 && this.loadingQueue.size > 0) {
                        const [element] = this.loadingQueue.entries().next().value;
                        this.loadingQueue.delete(element);
                        this.loadElement(element);
                    }
                    
                    if (this.loadingQueue.size > 0) {
                        preloadBatch();
                    }
                });
            };
            
            preloadBatch();
        }
    }

    // Batch loading
    observeMultiple(elements) {
        elements.forEach(element => this.observe(element));
    }

    preload(src, type = 'image') {
        if (!this.cache.has(src)) {
            this.loadResource(src, type).then(result => {
                this.cache.set(src, result);
            }).catch(error => {
                console.warn('Preload failed:', src, error);
            });
        }
    }

    // Cache management
    clearCache() {
        this.cache.clear();
        this.retryAttempts.clear();
    }

    getCacheSize() {
        return this.cache.size;
    }

    getCacheStats() {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys()),
            retryAttempts: this.retryAttempts.size
        };
    }

    // Progressive loading
    enableProgressiveLoading(element, sources = []) {
        // Load low quality first, then high quality
        if (sources.length === 0) return;

        const loadProgressive = async (index = 0) => {
            if (index >= sources.length) return;

            try {
                const src = sources[index];
                await this.loadResource(src.url, src.type || 'image');
                await this.applyResult(element, src.url, src.type || 'image');
                
                // Load next quality level
                if (index < sources.length - 1) {
                    setTimeout(() => loadProgressive(index + 1), 100);
                }
            } catch (error) {
                // Try next source if current fails
                loadProgressive(index + 1);
            }
        };

        loadProgressive(0);
    }

    destroy() {
        if (this.observer) {
            this.observer.disconnect();
        }
        
        this.clearCache();
        this.loadingQueue.clear();
    }
}

// Singleton instance
let lazyLoadingInstance = null;

// Factory function
function createLazyLoading(options = {}) {
    if (!lazyLoadingInstance) {
        lazyLoadingInstance = new LazyLoading(options);
    }
    return lazyLoadingInstance;
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { LazyLoading, createLazyLoading };
} else {
    window.LazyLoading = LazyLoading;
    window.createLazyLoading = createLazyLoading;
}