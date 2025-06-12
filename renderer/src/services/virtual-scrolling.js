/**
 * Virtual Scrolling Service
 * Efficiently renders large lists by only displaying visible items
 */
class VirtualScrolling {
    constructor(container, options = {}) {
        this.container = container;
        this.options = {
            itemHeight: 100,
            buffer: 5, // Number of items to render outside viewport
            debounceMs: 16, // ~60fps
            ...options
        };
        
        this.items = [];
        this.renderedItems = new Map();
        this.viewport = null;
        this.scrollContainer = null;
        this.spacer = null;
        
        this.scrollPosition = 0;
        this.viewportHeight = 0;
        this.totalHeight = 0;
        
        this.renderCallback = null;
        this.scrollTimer = null;
        
        this.init();
    }

    init() {
        this.createViewport();
        this.bindEvents();
    }

    createViewport() {
        // Create scroll container
        this.scrollContainer = document.createElement('div');
        this.scrollContainer.className = 'virtual-scroll-container';
        this.scrollContainer.style.cssText = `
            height: 100%;
            overflow-y: auto;
            overflow-x: hidden;
        `;

        // Create viewport for visible items
        this.viewport = document.createElement('div');
        this.viewport.className = 'virtual-scroll-viewport';
        this.viewport.style.cssText = `
            position: relative;
            width: 100%;
        `;

        // Create spacer to maintain scroll height
        this.spacer = document.createElement('div');
        this.spacer.className = 'virtual-scroll-spacer';
        this.spacer.style.cssText = `
            width: 100%;
            pointer-events: none;
        `;

        this.viewport.appendChild(this.spacer);
        this.scrollContainer.appendChild(this.viewport);
        this.container.appendChild(this.scrollContainer);

        this.updateViewportHeight();
    }

    bindEvents() {
        this.scrollContainer.addEventListener('scroll', () => {
            this.handleScroll();
        });

        window.addEventListener('resize', () => {
            this.updateViewportHeight();
            this.render();
        });
    }

    handleScroll() {
        clearTimeout(this.scrollTimer);
        this.scrollTimer = setTimeout(() => {
            this.scrollPosition = this.scrollContainer.scrollTop;
            this.render();
        }, this.options.debounceMs);
    }

    updateViewportHeight() {
        this.viewportHeight = this.scrollContainer.clientHeight;
    }

    setItems(items) {
        this.items = items;
        this.totalHeight = items.length * this.options.itemHeight;
        this.spacer.style.height = `${this.totalHeight}px`;
        this.render();
    }

    addItems(items) {
        this.items.push(...items);
        this.totalHeight = this.items.length * this.options.itemHeight;
        this.spacer.style.height = `${this.totalHeight}px`;
        this.render();
    }

    updateItem(index, item) {
        if (index >= 0 && index < this.items.length) {
            this.items[index] = item;
            
            // Re-render if item is currently visible
            const itemElement = this.renderedItems.get(index);
            if (itemElement && this.renderCallback) {
                const newElement = this.renderCallback(item, index);
                if (newElement && itemElement.parentNode) {
                    itemElement.parentNode.replaceChild(newElement, itemElement);
                    this.renderedItems.set(index, newElement);
                }
            }
        }
    }

    removeItem(index) {
        if (index >= 0 && index < this.items.length) {
            this.items.splice(index, 1);
            
            // Remove from rendered items if present
            const itemElement = this.renderedItems.get(index);
            if (itemElement && itemElement.parentNode) {
                itemElement.parentNode.removeChild(itemElement);
            }
            this.renderedItems.delete(index);
            
            // Update indices for items after the removed one
            const updatedMap = new Map();
            for (const [idx, element] of this.renderedItems) {
                if (idx > index) {
                    updatedMap.set(idx - 1, element);
                } else {
                    updatedMap.set(idx, element);
                }
            }
            this.renderedItems = updatedMap;
            
            this.totalHeight = this.items.length * this.options.itemHeight;
            this.spacer.style.height = `${this.totalHeight}px`;
            this.render();
        }
    }

    render() {
        if (!this.renderCallback || this.items.length === 0) return;

        const startIndex = Math.max(0, 
            Math.floor(this.scrollPosition / this.options.itemHeight) - this.options.buffer
        );
        
        const endIndex = Math.min(this.items.length - 1,
            Math.ceil((this.scrollPosition + this.viewportHeight) / this.options.itemHeight) + this.options.buffer
        );

        // Remove items that are no longer visible
        for (const [index, element] of this.renderedItems) {
            if (index < startIndex || index > endIndex) {
                if (element.parentNode) {
                    element.parentNode.removeChild(element);
                }
                this.renderedItems.delete(index);
            }
        }

        // Add new visible items
        for (let i = startIndex; i <= endIndex; i++) {
            if (!this.renderedItems.has(i) && this.items[i]) {
                const element = this.renderCallback(this.items[i], i);
                if (element) {
                    element.style.cssText = `
                        position: absolute;
                        top: ${i * this.options.itemHeight}px;
                        width: 100%;
                        height: ${this.options.itemHeight}px;
                    `;
                    
                    this.viewport.appendChild(element);
                    this.renderedItems.set(i, element);
                }
            }
        }
    }

    setRenderCallback(callback) {
        this.renderCallback = callback;
        this.render();
    }

    scrollToItem(index) {
        if (index >= 0 && index < this.items.length) {
            const targetPosition = index * this.options.itemHeight;
            this.scrollContainer.scrollTop = targetPosition;
        }
    }

    scrollToTop() {
        this.scrollContainer.scrollTop = 0;
    }

    scrollToBottom() {
        this.scrollContainer.scrollTop = this.totalHeight;
    }

    getVisibleRange() {
        const startIndex = Math.floor(this.scrollPosition / this.options.itemHeight);
        const endIndex = Math.min(this.items.length - 1,
            Math.ceil((this.scrollPosition + this.viewportHeight) / this.options.itemHeight)
        );
        
        return { startIndex, endIndex };
    }

    getItemAtPosition(y) {
        const index = Math.floor((this.scrollPosition + y) / this.options.itemHeight);
        return index >= 0 && index < this.items.length ? this.items[index] : null;
    }

    destroy() {
        if (this.scrollTimer) {
            clearTimeout(this.scrollTimer);
        }
        
        this.renderedItems.clear();
        
        if (this.container && this.scrollContainer) {
            this.container.removeChild(this.scrollContainer);
        }
    }

    // Dynamic item height support
    setDynamicHeights(heights) {
        this.itemHeights = heights;
        this.totalHeight = heights.reduce((sum, height) => sum + height, 0);
        this.spacer.style.height = `${this.totalHeight}px`;
        this.render();
    }

    getDynamicItemPosition(index) {
        if (!this.itemHeights) return index * this.options.itemHeight;
        
        let position = 0;
        for (let i = 0; i < index && i < this.itemHeights.length; i++) {
            position += this.itemHeights[i];
        }
        return position;
    }

    // Performance monitoring
    getPerformanceStats() {
        return {
            totalItems: this.items.length,
            renderedItems: this.renderedItems.size,
            viewportHeight: this.viewportHeight,
            scrollPosition: this.scrollPosition,
            memoryUsage: this.renderedItems.size / this.items.length
        };
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = VirtualScrolling;
}