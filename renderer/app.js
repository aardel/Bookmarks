/**
 * Modular Bookmark Manager - Electron Compatible Version
 * This version provides modular architecture without ES6 modules for immediate compatibility
 */

// State Manager Implementation
class StateManager {
    constructor() {
        this.state = {
            bookmarks: [],
            categories: [],
            applications: [],
            gridColumns: 4,
            isDarkMode: false,
            searchTerm: '',
            currentCategory: 'all',
            animationsEnabled: true,
            searchCategory: 'all',
            searchTags: [],
            sortBy: 'newest',
            sortOrder: 'desc',
            viewMode: 'grid',
            customSortConfig: null,
            launcherSettings: {
                favorites: [],
                recentApps: [],
                appCategories: {},
                lastScanTime: null
            }
        };
        
        this.subscribers = new Map();
        this.eventHandlers = new Map();
    }

    getState() {
        return { ...this.state };
    }

    setState(updates) {
        const prevState = { ...this.state };
        this.state = { ...this.state, ...updates };
        this.notifySubscribers(prevState, this.state);
    }

    subscribe(key, callback) {
        if (!this.subscribers.has(key)) {
            this.subscribers.set(key, new Set());
        }
        this.subscribers.get(key).add(callback);
        
        return () => {
            this.subscribers.get(key).delete(callback);
        };
    }

    notifySubscribers(prevState, newState) {
        this.subscribers.forEach((callbacks, key) => {
            if (prevState[key] !== newState[key]) {
                callbacks.forEach(callback => {
                    try {
                        callback(newState[key], prevState[key]);
                    } catch (error) {
                        console.error(`Error in state subscriber for ${key}:`, error);
                    }
                });
            }
        });
    }

    dispatch(event, data) {
        if (this.eventHandlers.has(event)) {
            this.eventHandlers.get(event).forEach(handler => {
                try {
                    handler(data);
                } catch (error) {
                    console.error(`Error in event handler for ${event}:`, error);
                }
            });
        }
    }

    on(event, handler) {
        if (!this.eventHandlers.has(event)) {
            this.eventHandlers.set(event, new Set());
        }
        this.eventHandlers.get(event).add(handler);

        return () => {
            this.eventHandlers.get(event).delete(handler);
        };
    }

    async loadFromStorage() {
        try {
            const savedState = localStorage.getItem('bookmarkManagerState');
            if (savedState) {
                const parsed = JSON.parse(savedState);
                this.setState(parsed);
            }
        } catch (error) {
            console.error('Error loading state from storage:', error);
        }
    }

    async saveToStorage() {
        try {
            const stateToSave = {
                bookmarks: this.state.bookmarks,
                categories: this.state.categories,
                gridColumns: this.state.gridColumns,
                isDarkMode: this.state.isDarkMode,
                animationsEnabled: this.state.animationsEnabled,
                sortBy: this.state.sortBy,
                sortOrder: this.state.sortOrder,
                viewMode: this.state.viewMode,
                customSortConfig: this.state.customSortConfig,
                launcherSettings: this.state.launcherSettings
            };
            localStorage.setItem('bookmarkManagerState', JSON.stringify(stateToSave));
        } catch (error) {
            console.error('Error saving state to storage:', error);
            throw error;
        }
    }
}

// Notification Service Implementation
class NotificationService {
    constructor() {
        this.container = null;
        this.notifications = new Map();
        this.init();
    }

    init() {
        this.createContainer();
        this.setupKeyboardShortcuts();
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.notifications.size > 0) {
                console.log('Escape key pressed, dismissing all notifications');
                this.dismissAll();
            }
        });
    }

    createContainer() {
        this.container = document.createElement('div');
        this.container.id = 'notifications-container';
        this.container.className = 'notifications-container';
        this.container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            pointer-events: none;
        `;
        document.body.appendChild(this.container);
    }

    show(message, type = 'info', options = {}) {
        const id = Date.now().toString();
        const notification = this.createNotification(id, message, type, options);
        
        this.container.appendChild(notification);
        this.notifications.set(id, notification);

        requestAnimationFrame(() => {
            notification.classList.add('show');
        });

        const duration = options.duration !== undefined ? options.duration : this.getDefaultDuration(type);
        if (duration > 0) {
            const timeoutId = setTimeout(() => {
                console.log('Auto-dismissing notification after timeout:', id);
                this.dismiss(id);
            }, duration);
            
            // Store timeout ID so we can cancel it if manually dismissed
            notification.timeoutId = timeoutId;
        }

        return id;
    }

    createNotification(id, message, type, options) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.dataset.id = id;
        notification.style.cssText = `
            background: var(--bg-secondary);
            border: 1px solid var(--border-color);
            border-radius: 8px;
            padding: 12px 16px;
            margin-bottom: 10px;
            box-shadow: 0 4px 12px var(--shadow);
            color: var(--text-primary);
            font-size: 14px;
            line-height: 1.4;
            max-width: 350px;
            pointer-events: auto;
            transform: translateX(100%);
            transition: transform 0.3s ease, opacity 0.3s ease;
            opacity: 0;
            position: relative;
            overflow: hidden;
        `;

        const typeStyles = this.getTypeStyles(type);
        Object.assign(notification.style, typeStyles);

        const content = document.createElement('div');
        content.className = 'notification-content';
        content.style.cssText = `
            display: flex;
            align-items: center;
            gap: 8px;
        `;

        const icon = document.createElement('i');
        icon.className = this.getTypeIcon(type);
        icon.style.fontSize = '16px';
        content.appendChild(icon);

        const messageEl = document.createElement('span');
        messageEl.textContent = message;
        messageEl.style.flex = '1';
        content.appendChild(messageEl);

        if (options.closable !== false) {
            const closeBtn = document.createElement('button');
            closeBtn.innerHTML = '<i class="fas fa-times"></i>';
            closeBtn.className = 'notification-close-btn';
            closeBtn.setAttribute('aria-label', 'Close notification');
            closeBtn.style.cssText = `
                background: none;
                border: none;
                color: inherit;
                cursor: pointer;
                padding: 6px;
                border-radius: 4px;
                opacity: 0.7;
                transition: opacity 0.2s, background-color 0.2s;
                display: flex;
                align-items: center;
                justify-content: center;
                min-width: 24px;
                min-height: 24px;
                margin-left: 8px;
                flex-shrink: 0;
            `;
            
            // Enhanced event handling
            closeBtn.addEventListener('mouseover', () => {
                closeBtn.style.opacity = '1';
                closeBtn.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
            });
            
            closeBtn.addEventListener('mouseout', () => {
                closeBtn.style.opacity = '0.7';
                closeBtn.style.backgroundColor = 'transparent';
            });
            
            closeBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Close button clicked for notification:', id);
                this.dismiss(id);
            });
            
            // Also allow dismissing by clicking the notification itself
            notification.addEventListener('click', (e) => {
                if (e.target === notification || e.target === content || e.target === messageEl) {
                    console.log('Notification clicked for dismissal:', id);
                    this.dismiss(id);
                }
            });
            
            content.appendChild(closeBtn);
        }

        notification.appendChild(content);
        return notification;
    }

    getTypeStyles(type) {
        const styles = {
            info: { borderLeftColor: '#3498db', borderLeftWidth: '4px' },
            success: { borderLeftColor: '#27ae60', borderLeftWidth: '4px' },
            warning: { borderLeftColor: '#f39c12', borderLeftWidth: '4px' },
            error: { borderLeftColor: '#e74c3c', borderLeftWidth: '4px' }
        };
        return styles[type] || styles.info;
    }

    getTypeIcon(type) {
        const icons = {
            info: 'fas fa-info-circle',
            success: 'fas fa-check-circle',
            warning: 'fas fa-exclamation-triangle',
            error: 'fas fa-times-circle'
        };
        return icons[type] || icons.info;
    }

    getDefaultDuration(type) {
        const durations = { info: 4000, success: 3000, warning: 5000, error: 6000 };
        return durations[type] || 4000;
    }

    dismiss(id) {
        console.log('Attempting to dismiss notification:', id);
        const notification = this.notifications.get(id);
        if (!notification) {
            console.log('Notification not found:', id);
            return;
        }

        console.log('Dismissing notification:', id);
        
        // Add dismissing class to prevent multiple dismissals
        if (notification.classList.contains('dismissing')) {
            console.log('Already dismissing:', id);
            return;
        }
        
        notification.classList.add('dismissing');
        notification.style.transform = 'translateX(100%)';
        notification.style.opacity = '0';
        notification.style.pointerEvents = 'none';

        // Clear auto-dismiss timeout if it exists
        if (notification.timeoutId) {
            clearTimeout(notification.timeoutId);
            console.log('Cleared auto-dismiss timeout for:', id);
        }

        setTimeout(() => {
            try {
                if (notification && notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                    console.log('Notification removed from DOM:', id);
                }
                this.notifications.delete(id);
                console.log('Notification deleted from map:', id);
            } catch (error) {
                console.error('Error removing notification:', error);
            }
        }, 350);
    }

    dismissAll() {
        console.log('Dismissing all notifications');
        this.notifications.forEach((notification, id) => {
            this.dismiss(id);
        });
    }

    info(message, options = {}) { return this.show(message, 'info', options); }
    success(message, options = {}) { return this.show(message, 'success', options); }
    warning(message, options = {}) { return this.show(message, 'warning', options); }
    error(message, options = {}) { return this.show(message, 'error', options); }
}

// Utility Functions
const Utils = {
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    validateUrl(url) {
        if (!url || typeof url !== 'string') return false;
        
        // Remove whitespace
        url = url.trim();
        
        // Check if it's already a valid URL
        try {
            new URL(url);
            return true;
        } catch (error) {
            // Try adding http:// prefix
            try {
                new URL('http://' + url);
                return true;
            } catch (e) {
                // Check if it's an IP address (IPv4)
                const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}(:\d+)?$/;
                if (ipv4Regex.test(url)) {
                    return true;
                }
                
                // Check if it's a local address
                const localRegex = /^(localhost|127\.0\.0\.1|0\.0\.0\.0|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2[0-9]|3[0-1])\.\d+\.\d+)(:\d+)?$/i;
                if (localRegex.test(url)) {
                    return true;
                }
                
                // Check if it looks like a domain
                const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}$/;
                if (domainRegex.test(url)) {
                    return true;
                }
                
                return false;
            }
        }
    },

    normalizeUrl(url) {
        if (!url || typeof url !== 'string') return url;
        
        url = url.trim();
        
        // If it already has a protocol, return as is
        if (/^https?:\/\//i.test(url)) {
            return url;
        }
        
        // If it's an IP address or localhost, add http://
        const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}(:\d+)?$/;
        const localRegex = /^(localhost|127\.0\.0\.1|0\.0\.0\.0|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2[0-9]|3[0-1])\.\d+\.\d+)(:\d+)?$/i;
        
        if (ipv4Regex.test(url) || localRegex.test(url)) {
            return 'http://' + url;
        }
        
        // For domains, add https:// by default
        return 'https://' + url;
    },

    validateTitle(title) {
        return title && typeof title === 'string' && title.trim().length > 0;
    },

    sanitizeString(str) {
        if (typeof str !== 'string') return '';
        return str
            .replace(/[<>]/g, '')
            .replace(/javascript:/gi, '')
            .replace(/data:/gi, '')
            .trim();
    },

    validateCategory(category) {
        return category && typeof category === 'string' && category.trim().length > 0;
    },

    validateTags(tags) {
        if (!tags) return [];
        if (Array.isArray(tags)) {
            return tags.filter(tag => typeof tag === 'string' && tag.trim().length > 0);
        }
        if (typeof tags === 'string') {
            return tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
        }
        return [];
    },

    getFaviconUrl(url) {
        try {
            const urlObj = new URL(url);
            return `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=32`;
        } catch (error) {
            return 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="%23666" d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z"/></svg>';
        }
    },

    debounce(func, wait, immediate = false) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                timeout = null;
                if (!immediate) func(...args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func(...args);
        };
    },

    formatRelativeTime(date) {
        if (!date) return '';
        const dateObj = new Date(date);
        if (isNaN(dateObj.getTime())) return '';
        
        const now = new Date();
        const diffMs = now - dateObj;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);
        
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
        if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
        
        return dateObj.toLocaleDateString();
    },

    async copyToClipboard(text) {
        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(text);
            } else {
                const textArea = document.createElement('textarea');
                textArea.value = text;
                textArea.style.position = 'fixed';
                textArea.style.left = '-999999px';
                textArea.style.top = '-999999px';
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                document.execCommand('copy');
                textArea.remove();
            }
            return true;
        } catch (error) {
            console.error('Failed to copy to clipboard:', error);
            return false;
        }
    },

    isElectron() {
        return !!(window && window.electronAPI);
    },

    isValidImageUrl(url) {
        if (!url || typeof url !== 'string') return false;
        try {
            new URL(url);
            return url.match(/\.(jpg|jpeg|png|gif|svg|ico|icns)$/i) || 
                   url.startsWith('data:image/') ||
                   url.includes('icons') ||
                   url.includes('favicon');
        } catch {
            return false;
        }
    }
};

// Create global instances
const stateManager = new StateManager();
const notificationService = new NotificationService();

// Bookmark Manager Implementation
class BookmarkManager {
    constructor() {
        this.initialized = false;
    }

    async init() {
        if (this.initialized) return;
        
        try {
            await stateManager.loadFromStorage();
            this.setupEventListeners();
            this.initialized = true;
        } catch (error) {
            console.error('Error initializing bookmark manager:', error);
            notificationService.error('Failed to initialize bookmark manager');
        }
    }

    setupEventListeners() {
        stateManager.subscribe('bookmarks', () => {
            this.renderBookmarks();
            this.updateCategoriesUI();
        });

        stateManager.subscribe('currentCategory', () => {
            this.renderBookmarks();
        });

        stateManager.subscribe('searchTerm', () => {
            this.renderBookmarks();
        });

        stateManager.subscribe('sortBy', () => {
            this.renderBookmarks();
        });

        stateManager.subscribe('sortOrder', () => {
            this.renderBookmarks();
        });
    }

    async addBookmark(bookmarkData) {
        try {
            const validatedData = this.validateBookmarkData(bookmarkData);
            if (!validatedData.isValid) {
                notificationService.warning(validatedData.message);
                return false;
            }

            // Normalize the URL
            const normalizedUrl = Utils.normalizeUrl(bookmarkData.url);
            
            const bookmark = {
                id: Utils.generateId(),
                title: Utils.sanitizeString(bookmarkData.title),
                url: normalizedUrl,
                category: Utils.sanitizeString(bookmarkData.category) || 'General',
                tags: Utils.validateTags(bookmarkData.tags),
                color: bookmarkData.color || '#ffffff',
                icon: bookmarkData.icon || Utils.getFaviconUrl(normalizedUrl),
                reminderDays: bookmarkData.reminderDays || null,
                type: bookmarkData.type || 'website',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                visits: 0,
                lastVisited: null
            };

            const currentBookmarks = stateManager.getState().bookmarks;
            const updatedBookmarks = [...currentBookmarks, bookmark];
            stateManager.setState({ bookmarks: updatedBookmarks });

            this.updateCategories();
            await stateManager.saveToStorage();

            notificationService.success(`Bookmark "${bookmark.title}" added successfully`);
            return bookmark;

        } catch (error) {
            console.error('Error adding bookmark:', error);
            notificationService.error('Failed to add bookmark');
            return false;
        }
    }

    validateBookmarkData(data, requireAll = true) {
        const errors = [];

        if (requireAll || data.title !== undefined) {
            if (!Utils.validateTitle(data.title)) {
                errors.push('Title is required and must be valid');
            }
        }

        if (requireAll || data.url !== undefined) {
            if (!Utils.validateUrl(data.url)) {
                errors.push('URL is required and must be valid');
            }
        }

        return {
            isValid: errors.length === 0,
            message: errors.join(', ')
        };
    }

    updateCategories() {
        const bookmarks = stateManager.getState().bookmarks;
        const categories = [...new Set(bookmarks.map(b => b.category))].sort();
        stateManager.setState({ categories });
    }

    renderBookmarks() {
        const bookmarkGrid = document.getElementById('bookmark-grid');
        if (!bookmarkGrid) return;

        const bookmarks = this.getFilteredBookmarks();
        const { viewMode } = stateManager.getState();

        bookmarkGrid.innerHTML = '';
        bookmarkGrid.className = `bookmark-container ${viewMode === 'list' ? 'list-view' : ''}`;

        if (bookmarks.length === 0) {
            this.renderEmptyState(bookmarkGrid);
            return;
        }

        bookmarks.forEach(bookmark => {
            const bookmarkElement = this.createBookmarkElement(bookmark);
            bookmarkGrid.appendChild(bookmarkElement);
        });
    }

    getFilteredBookmarks() {
        const state = stateManager.getState();
        let bookmarks = [...state.bookmarks];

        if (state.currentCategory && state.currentCategory !== 'all') {
            bookmarks = bookmarks.filter(b => 
                b.category.toLowerCase() === state.currentCategory.toLowerCase()
            );
        }

        if (state.searchTerm) {
            const searchTerm = state.searchTerm.toLowerCase();
            bookmarks = bookmarks.filter(b =>
                b.title.toLowerCase().includes(searchTerm) ||
                b.url.toLowerCase().includes(searchTerm) ||
                b.category.toLowerCase().includes(searchTerm) ||
                b.tags.some(tag => tag.toLowerCase().includes(searchTerm))
            );
        }

        return this.sortBookmarks(bookmarks);
    }

    sortBookmarks(bookmarks) {
        const { sortBy, sortOrder } = stateManager.getState();
        
        const sorted = [...bookmarks].sort((a, b) => {
            let comparison = 0;

            switch (sortBy) {
                case 'newest':
                    comparison = new Date(b.createdAt) - new Date(a.createdAt);
                    break;
                case 'oldest':
                    comparison = new Date(a.createdAt) - new Date(b.createdAt);
                    break;
                case 'alphabetical':
                    comparison = a.title.localeCompare(b.title);
                    break;
                case 'most-visited':
                    comparison = (b.visits || 0) - (a.visits || 0);
                    break;
                case 'category':
                    comparison = a.category.localeCompare(b.category);
                    break;
                default:
                    comparison = 0;
            }

            return sortOrder === 'desc' ? -comparison : comparison;
        });

        return sorted;
    }

    renderEmptyState(container) {
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-state';
        emptyState.innerHTML = `
            <div class="empty-state-content">
                <i class="fas fa-bookmark empty-state-icon"></i>
                <h3>No bookmarks found</h3>
                <p>Add your first bookmark to get started</p>
                <button class="btn btn-primary" onclick="document.getElementById('admin-toggle').click()">
                    <i class="fas fa-plus"></i> Add Bookmark
                </button>
            </div>
        `;
        container.appendChild(emptyState);
    }

    createBookmarkElement(bookmark) {
        const { viewMode } = stateManager.getState();
        const element = document.createElement('div');
        element.className = `bookmark-item ${bookmark.type}-bookmark`;
        element.dataset.id = bookmark.id;
        element.dataset.category = bookmark.category;

        element.innerHTML = `
            <div class="bookmark-icon">
                <img src="${bookmark.icon}" alt="${bookmark.title}" 
                     onerror="this.src='${Utils.getFaviconUrl(bookmark.url)}'">
            </div>
            <div class="bookmark-info">
                <div class="bookmark-title" title="${bookmark.title}">${bookmark.title}</div>
                <div class="bookmark-category">${bookmark.category}</div>
                ${bookmark.visits ? `<div class="bookmark-visits">${bookmark.visits} visits</div>` : ''}
            </div>
            <div class="bookmark-actions">
                <button class="bookmark-menu-btn" title="Actions">
                    <i class="fas fa-ellipsis-v"></i>
                </button>
                <div class="bookmark-actions-menu">
                    <button class="edit-bookmark">
                        <i class="fas fa-edit"></i>
                        <span>Edit</span>
                    </button>
                    <button class="copy-bookmark">
                        <i class="fas fa-copy"></i>
                        <span>Copy Link</span>
                    </button>
                    <button class="share-bookmark">
                        <i class="fas fa-share-alt"></i>
                        <span>Share</span>
                    </button>
                    <button class="delete-bookmark">
                        <i class="fas fa-trash"></i>
                        <span>Delete</span>
                    </button>
                </div>
            </div>
        `;

        this.attachBookmarkEvents(element, bookmark);
        return element;
    }

    attachBookmarkEvents(element, bookmark) {
        element.addEventListener('click', (e) => {
            if (e.target.closest('.bookmark-actions')) return;
            this.launchBookmark(bookmark.id);
        });

        const copyBtn = element.querySelector('.copy-bookmark');
        if (copyBtn) {
            copyBtn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const success = await Utils.copyToClipboard(bookmark.url);
                if (success) {
                    notificationService.success('Link copied to clipboard');
                } else {
                    notificationService.error('Failed to copy link');
                }
            });
        }
    }

    async launchBookmark(bookmarkId) {
        try {
            const bookmark = this.getBookmark(bookmarkId);
            if (!bookmark) {
                notificationService.warning('Bookmark not found');
                return;
            }

            await this.trackVisit(bookmarkId);

            if (bookmark.type === 'program' && window.electronAPI) {
                try {
                    await window.electronAPI.launchApp(bookmark.url);
                    notificationService.success(`Launched ${bookmark.title}`);
                } catch (error) {
                    console.error('Error launching application:', error);
                    notificationService.error(`Failed to launch ${bookmark.title}`);
                }
            } else {
                window.open(bookmark.url, '_blank');
            }

        } catch (error) {
            console.error('Error launching bookmark:', error);
            notificationService.error('Failed to launch bookmark');
        }
    }

    getBookmark(bookmarkId) {
        const bookmarks = stateManager.getState().bookmarks;
        return bookmarks.find(b => b.id === bookmarkId);
    }

    async trackVisit(bookmarkId) {
        try {
            const currentBookmarks = stateManager.getState().bookmarks;
            const bookmarkIndex = currentBookmarks.findIndex(b => b.id === bookmarkId);
            
            if (bookmarkIndex === -1) return;

            const updatedBookmarks = [...currentBookmarks];
            updatedBookmarks[bookmarkIndex] = {
                ...updatedBookmarks[bookmarkIndex],
                visits: (updatedBookmarks[bookmarkIndex].visits || 0) + 1,
                lastVisited: new Date().toISOString()
            };

            stateManager.setState({ bookmarks: updatedBookmarks });
            await stateManager.saveToStorage();

        } catch (error) {
            console.error('Error tracking visit:', error);
        }
    }

    updateCategoriesUI() {
        const categoryFilters = document.getElementById('category-filters');
        const mobileFilters = document.getElementById('mobile-category-filters');
        
        if (!categoryFilters) return;

        const { categories, currentCategory } = stateManager.getState();

        [categoryFilters, mobileFilters].forEach(container => {
            if (!container) return;
            
            container.innerHTML = `
                <button class="category-filter ${currentCategory === 'all' ? 'active' : ''}" 
                        data-category="all">All</button>
            `;

            categories.forEach(category => {
                const button = document.createElement('button');
                button.className = `category-filter ${currentCategory === category ? 'active' : ''}`;
                button.dataset.category = category;
                button.textContent = category;
                container.appendChild(button);
            });
        });
    }
}

// Create bookmark manager instance
const bookmarkManager = new BookmarkManager();

// Update Manager
class UpdateManager {
    constructor() {
        this.currentVersion = '1.0.1';
        this.updateInfo = null;
        this.isChecking = false;
        this.autoUpdateEnabled = true;
        this.checkInterval = null;
        
        this.elements = {
            notification: document.getElementById('update-notification'),
            title: document.getElementById('update-title'),
            message: document.getElementById('update-message'),
            progress: document.getElementById('update-progress'),
            progressFill: document.getElementById('progress-fill'),
            progressText: document.getElementById('progress-text'),
            downloadBtn: document.getElementById('update-download'),
            installBtn: document.getElementById('update-install'),
            laterBtn: document.getElementById('update-later'),
            closeBtn: document.getElementById('update-close'),
            currentVersion: document.getElementById('current-version'),
            versionStatus: document.getElementById('version-status'),
            checkBtn: document.getElementById('check-updates-btn'),
            viewReleasesBtn: document.getElementById('view-releases-btn'),
            autoUpdateToggle: document.getElementById('auto-update-toggle')
        };
        
        this.init();
    }
    
    init() {
        this.loadCurrentVersion();
        this.setupEventListeners();
        this.setupUpdateListener();
        this.loadAutoUpdatePreference();
    }
    
    async loadCurrentVersion() {
        try {
            if (Utils.isElectron() && window.electronAPI?.getAppVersion) {
                this.currentVersion = await window.electronAPI.getAppVersion();
            }
            
            if (this.elements.currentVersion) {
                this.elements.currentVersion.textContent = `v${this.currentVersion}`;
            }
        } catch (error) {
            console.error('Failed to load app version:', error);
        }
    }
    
    setupEventListeners() {
        // Update notification buttons
        if (this.elements.downloadBtn) {
            this.elements.downloadBtn.addEventListener('click', () => this.downloadUpdate());
        }
        
        if (this.elements.installBtn) {
            this.elements.installBtn.addEventListener('click', () => this.installUpdate());
        }
        
        if (this.elements.laterBtn) {
            this.elements.laterBtn.addEventListener('click', () => this.hideNotification());
        }
        
        if (this.elements.closeBtn) {
            this.elements.closeBtn.addEventListener('click', () => this.hideNotification());
        }
        
        // Settings panel buttons
        if (this.elements.checkBtn) {
            this.elements.checkBtn.addEventListener('click', () => this.checkForUpdates(true));
        }
        
        if (this.elements.viewReleasesBtn) {
            this.elements.viewReleasesBtn.addEventListener('click', () => this.viewReleases());
        }
        
        if (this.elements.autoUpdateToggle) {
            this.elements.autoUpdateToggle.addEventListener('change', (e) => {
                this.setAutoUpdateEnabled(e.target.checked);
            });
        }
    }
    
    setupUpdateListener() {
        if (Utils.isElectron() && window.electronAPI?.onUpdaterMessage) {
            window.electronAPI.onUpdaterMessage((event, data) => {
                this.handleUpdateMessage(data);
            });
        }
    }
    
    loadAutoUpdatePreference() {
        const saved = localStorage.getItem('autoUpdateEnabled');
        if (saved !== null) {
            this.autoUpdateEnabled = JSON.parse(saved);
            if (this.elements.autoUpdateToggle) {
                this.elements.autoUpdateToggle.checked = this.autoUpdateEnabled;
            }
        }
    }
    
    setAutoUpdateEnabled(enabled) {
        this.autoUpdateEnabled = enabled;
        localStorage.setItem('autoUpdateEnabled', JSON.stringify(enabled));
        
        if (enabled) {
            notificationService.success('Automatic updates enabled');
        } else {
            notificationService.info('Automatic updates disabled');
        }
    }
    
    async checkForUpdates(manual = false) {
        if (this.isChecking) {
            if (manual) {
                notificationService.info('Already checking for updates...');
            }
            return;
        }
        
        this.isChecking = true;
        this.updateStatus('checking', 'Checking for updates...');
        
        if (this.elements.checkBtn) {
            this.elements.checkBtn.disabled = true;
            this.elements.checkBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Checking...';
        }
        
        try {
            if (Utils.isElectron() && window.electronAPI?.checkForUpdates) {
                const result = await window.electronAPI.checkForUpdates();
                
                if (result?.error) {
                    throw new Error(result.error);
                }
                
                if (manual) {
                    // If manual check and no updates, show notification
                    setTimeout(() => {
                        if (!this.updateInfo) {
                            notificationService.success('You are running the latest version!');
                        }
                    }, 2000);
                }
            } else {
                throw new Error('Update checking not available');
            }
        } catch (error) {
            console.error('Update check failed:', error);
            this.updateStatus('error', `Update check failed: ${error.message}`);
            
            if (manual) {
                notificationService.error('Failed to check for updates');
            }
        } finally {
            this.isChecking = false;
            if (this.elements.checkBtn) {
                this.elements.checkBtn.disabled = false;
                this.elements.checkBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Check for Updates';
            }
        }
    }
    
    handleUpdateMessage(data) {
        console.log('Update message received:', data);
        
        switch (data.type) {
            case 'checking':
                this.updateStatus('checking', 'Checking for updates...');
                break;
                
            case 'available':
                this.updateInfo = data;
                this.updateStatus('update-available', `Update available: v${data.version}`);
                this.showUpdateNotification(data);
                break;
                
            case 'not-available':
                this.updateStatus('up-to-date', 'You are running the latest version');
                break;
                
            case 'download-progress':
                this.showDownloadProgress(data.progress);
                break;
                
            case 'downloaded':
                this.updateInfo = data;
                this.showUpdateReady(data);
                break;
                
            case 'error':
                this.updateStatus('error', data.message);
                break;
        }
    }
    
    updateStatus(type, message) {
        if (this.elements.versionStatus) {
            this.elements.versionStatus.textContent = message;
            this.elements.versionStatus.className = `version-status ${type}`;
        }
    }
    
    showUpdateNotification(data) {
        if (!this.elements.notification) return;
        
        this.elements.title.textContent = 'Update Available';
        this.elements.message.textContent = `Version ${data.version} is now available. Would you like to download it?`;
        
        // Show download button, hide others
        this.elements.downloadBtn.classList.remove('hidden');
        this.elements.installBtn.classList.add('hidden');
        this.elements.progress.classList.add('hidden');
        
        this.showNotification();
    }
    
    showDownloadProgress(progress) {
        if (!this.elements.notification) return;
        
        this.elements.title.textContent = 'Downloading Update';
        this.elements.message.textContent = `Downloading v${this.updateInfo?.version || 'latest'}...`;
        
        // Show progress, hide buttons
        this.elements.progress.classList.remove('hidden');
        this.elements.downloadBtn.classList.add('hidden');
        this.elements.installBtn.classList.add('hidden');
        
        // Update progress bar
        if (this.elements.progressFill) {
            this.elements.progressFill.style.width = `${progress.percent}%`;
        }
        
        if (this.elements.progressText) {
            this.elements.progressText.textContent = 
                `${progress.percent}% - ${progress.transferred}MB / ${progress.total}MB (${progress.speed} MB/s)`;
        }
        
        this.showNotification();
    }
    
    showUpdateReady(data) {
        if (!this.elements.notification) return;
        
        this.elements.title.textContent = 'Update Ready';
        this.elements.message.textContent = `Version ${data.version} has been downloaded and is ready to install.`;
        
        // Show install button, hide others
        this.elements.installBtn.classList.remove('hidden');
        this.elements.downloadBtn.classList.add('hidden');
        this.elements.progress.classList.add('hidden');
        
        this.showNotification();
    }
    
    showNotification() {
        if (this.elements.notification) {
            this.elements.notification.classList.remove('hidden');
        }
    }
    
    hideNotification() {
        if (this.elements.notification) {
            this.elements.notification.classList.add('hidden');
        }
    }
    
    async downloadUpdate() {
        try {
            if (Utils.isElectron() && window.electronAPI?.downloadUpdate) {
                const result = await window.electronAPI.downloadUpdate();
                if (result?.error) {
                    throw new Error(result.error);
                }
                
                // Update UI to show downloading state
                this.elements.title.textContent = 'Downloading Update';
                this.elements.message.textContent = 'Download started...';
                this.elements.downloadBtn.classList.add('hidden');
                
            } else {
                throw new Error('Download functionality not available');
            }
        } catch (error) {
            console.error('Download failed:', error);
            notificationService.error(`Download failed: ${error.message}`);
        }
    }
    
    async installUpdate() {
        try {
            if (Utils.isElectron() && window.electronAPI?.quitAndInstall) {
                await window.electronAPI.quitAndInstall();
            } else {
                throw new Error('Install functionality not available');
            }
        } catch (error) {
            console.error('Install failed:', error);
            notificationService.error(`Install failed: ${error.message}`);
        }
    }
    
    viewReleases() {
        const url = 'https://github.com/aardel/Bookmarks/releases';
        if (Utils.isElectron() && window.electronAPI?.platform) {
            // Open in external browser
            window.open(url, '_blank');
        } else {
            window.open(url, '_blank');
        }
    }
}

// Create update manager instance
const updateManager = new UpdateManager();

// Application Core
class AppCore {
    constructor() {
        this.initialized = false;
        this.elements = {};
    }

    async init() {
        if (this.initialized) return;

        try {
            console.log('Initializing Bookmark Manager...');
            
            this.showLoadingState();
            this.cacheElements();
            this.setupEventListeners();
            this.initializeTheme();
            
            if (Utils.isElectron()) {
                this.setupElectronIntegration();
            }
            
            await bookmarkManager.init();
            this.loadDemoDataIfEmpty();
            this.setupGlobalEventListeners();
            
            // Initial render of content
            bookmarkManager.renderBookmarks();
            bookmarkManager.updateCategoriesUI();
            this.loadBookmarkSuggestions();
            
            this.hideLoadingState();
            
            this.initialized = true;
            console.log('Bookmark Manager initialized successfully');
            
            notificationService.success('Application ready!');

        } catch (error) {
            console.error('Error initializing application:', error);
            notificationService.error('Failed to initialize application');
            this.hideLoadingState();
        }
    }

    cacheElements() {
        this.elements = {
            bookmarkGrid: document.getElementById('bookmark-grid'),
            adminPanel: document.getElementById('admin-panel'),
            searchInput: document.getElementById('search-bookmarks'),
            searchClear: document.getElementById('search-clear'),
            themeToggle: document.getElementById('theme-toggle'),
            adminToggle: document.getElementById('admin-toggle'),
            addBookmarkForm: document.getElementById('add-bookmark-form'),
            addAppForm: document.getElementById('add-app-form'),
            browseAppBtn: document.getElementById('browse-app-btn'),
            categoryFilters: document.getElementById('category-filters'),
            mobileCategoryFilters: document.getElementById('mobile-category-filters'),
            mobileNavToggle: document.getElementById('mobile-nav-toggle'),
            mobileNav: document.getElementById('mobile-nav'),
            closeAdmin: document.getElementById('close-admin'),
            gridColumnsInput: document.getElementById('grid-columns'),
            gridColumnsValue: document.getElementById('grid-columns-value')
        };
    }

    setupEventListeners() {
        this.setupSearchListeners();
        this.setupNavigationListeners();
        this.setupAdminPanelListeners();
        this.setupFormListeners();
        this.setupViewModeToggle();
        this.setupLauncherFunctionality();
    }

    setupSearchListeners() {
        if (this.elements.searchInput) {
            const debouncedSearch = Utils.debounce((value) => {
                stateManager.setState({ searchTerm: value });
                this.updateSearchClearVisibility();
            }, 300);

            this.elements.searchInput.addEventListener('input', (e) => {
                debouncedSearch(e.target.value);
            });
        }

        if (this.elements.searchClear) {
            this.elements.searchClear.addEventListener('click', () => {
                this.clearSearch();
            });
        }
    }

    setupNavigationListeners() {
        if (this.elements.mobileNavToggle && this.elements.mobileNav) {
            this.elements.mobileNavToggle.addEventListener('click', () => {
                this.elements.mobileNav.classList.toggle('hidden');
            });
        }

        [this.elements.categoryFilters, this.elements.mobileCategoryFilters].forEach(container => {
            if (container) {
                container.addEventListener('click', (e) => {
                    if (e.target.classList.contains('category-filter')) {
                        const category = e.target.dataset.category;
                        stateManager.setState({ currentCategory: category });
                        this.updateCategoryFilters();
                    }
                });
            }
        });

        if (this.elements.themeToggle) {
            this.elements.themeToggle.addEventListener('click', () => {
                this.toggleTheme();
            });
        }

        if (this.elements.adminToggle) {
            this.elements.adminToggle.addEventListener('click', () => {
                this.toggleAdminPanel();
            });
        }
    }

    setupAdminPanelListeners() {
        if (this.elements.closeAdmin) {
            this.elements.closeAdmin.addEventListener('click', () => {
                this.toggleAdminPanel();
            });
        }

        if (this.elements.gridColumnsInput) {
            this.elements.gridColumnsInput.addEventListener('input', (e) => {
                const value = parseInt(e.target.value);
                stateManager.setState({ gridColumns: value });
                this.updateGridColumns();
            });
        }

        // Setup admin tab functionality
        this.setupAdminTabs();
        this.setupAdminButtons();
        this.setupVersionDisplay();
    }

    setupFormListeners() {
        if (this.elements.addBookmarkForm) {
            this.elements.addBookmarkForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleAddBookmark(e);
            });
        }

        if (this.elements.addAppForm) {
            this.elements.addAppForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleAddApplication(e);
            });
        }

        if (this.elements.browseAppBtn) {
            this.elements.browseAppBtn.addEventListener('click', async () => {
                await this.handleBrowseForApp();
            });
        }

        // Enhance Add Bookmark form: handle type toggling and app scanning
        const bookmarkTypeSelect = document.getElementById('bookmark-type');
        const scanAppsBtn = document.getElementById('scan-apps-btn');
        const urlLabel = document.getElementById('url-label');
        const urlInput = document.getElementById('bookmark-url');
        const urlHint = document.getElementById('url-hint');
        const detectedProgramsList = document.getElementById('detected-programs');

        const updateBookmarkTypeUI = () => {
            const type = bookmarkTypeSelect?.value || 'website';
            if (!urlLabel || !urlHint || !urlInput) return;

            if (type === 'program') {
                urlLabel.textContent = 'Application Path *';
                urlInput.placeholder = '/Applications/Example.app';
                urlHint.textContent = 'Path to the application executable';
                if (scanAppsBtn) scanAppsBtn.classList.remove('hidden');
            } else if (type === 'protocol') {
                urlLabel.textContent = 'Custom Protocol URL *';
                urlInput.placeholder = 'app://example';
                urlHint.textContent = 'Enter a custom protocol like app://something';
                if (scanAppsBtn) scanAppsBtn.classList.add('hidden');
            } else {
                urlLabel.textContent = 'URL *';
                urlInput.placeholder = 'https://example.com';
                urlHint.textContent = 'Enter the website URL';
                if (scanAppsBtn) scanAppsBtn.classList.add('hidden');
            }
        };

        if (bookmarkTypeSelect) {
            bookmarkTypeSelect.addEventListener('change', updateBookmarkTypeUI);
            updateBookmarkTypeUI();
        }

        if (scanAppsBtn) {
            scanAppsBtn.addEventListener('click', async () => {
                try {
                    if (!Utils.isElectron() || !window.electronAPI?.scanApplications) {
                        notificationService.warning('Application scanning requires Electron environment');
                        return;
                    }
                    scanAppsBtn.disabled = true;
                    scanAppsBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Scanning';
                    const found = await window.electronAPI.scanApplications();
                    if (detectedProgramsList) {
                        detectedProgramsList.innerHTML = '';
                        (found || []).forEach(app => {
                            const option = document.createElement('option');
                            option.value = app.path;
                            option.label = app.name;
                            detectedProgramsList.appendChild(option);
                        });
                    }
                    notificationService.success(`Detected ${found?.length || 0} applications`);
                } catch (err) {
                    console.error('Scan apps failed:', err);
                    notificationService.error('Failed to scan applications');
                } finally {
                    scanAppsBtn.disabled = false;
                    scanAppsBtn.innerHTML = '<i class="fas fa-search"></i> Scan Apps';
                }
            });
        }
    }

    setupAdminTabs() {
        // Setup admin tab navigation
        const adminTabs = document.querySelectorAll('.admin-tab');
        const adminTabContents = document.querySelectorAll('.admin-tab-content');

        adminTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // Remove active from all tabs and contents
                adminTabs.forEach(t => {
                    t.classList.remove('active');
                    t.setAttribute('aria-selected', 'false');
                });
                adminTabContents.forEach(content => {
                    content.classList.remove('active');
                });

                // Add active to clicked tab and corresponding content
                tab.classList.add('active');
                tab.setAttribute('aria-selected', 'true');
                
                const tabId = tab.dataset.tab;
                const content = document.getElementById(tabId);
                if (content) {
                    content.classList.add('active');
                }

                // Load tab-specific content
                this.loadTabContent(tabId);
            });
        });
    }

    setupAdminButtons() {
        // Import/Export buttons
        const importHtmlBtn = document.getElementById('import-html-btn');
        const importJsonBtn = document.getElementById('import-json-btn');
        const backupBtn = document.getElementById('backup-btn');
        const exportCsvBtn = document.getElementById('export-csv-btn');
        const exportJsonBtn = document.getElementById('export-json-btn');

        // Data tools buttons
        const findDuplicatesBtn = document.getElementById('find-duplicates-btn');
        const checkLinksBtn = document.getElementById('check-links-btn');
        const updateFaviconsBtn = document.getElementById('update-favicons-btn');
        const cleanupDataBtn = document.getElementById('cleanup-data-btn');

        // Settings buttons
        const animationToggle = document.getElementById('animation-toggle');
        const autoUpdateToggle = document.getElementById('auto-update-toggle');
        const checkUpdatesBtn = document.getElementById('check-updates-btn');
        const viewReleasesBtn = document.getElementById('view-releases-btn');

        // Theme buttons
        const themeEditorForm = document.getElementById('theme-editor-form');
        const resetThemeBtn = document.getElementById('reset-theme');
        const presetButtons = document.querySelectorAll('.preset-btn');

        // Suggestions button
        const refreshSuggestionsBtn = document.getElementById('refresh-suggestions');

        // Setup event listeners
        if (importHtmlBtn) {
            importHtmlBtn.addEventListener('click', () => this.handleImportHtml());
        }
        if (importJsonBtn) {
            importJsonBtn.addEventListener('click', () => this.handleImportJson());
        }
        if (backupBtn) {
            backupBtn.addEventListener('click', () => this.handleBackup());
        }
        if (exportCsvBtn) {
            exportCsvBtn.addEventListener('click', () => this.handleExportCsv());
        }
        if (exportJsonBtn) {
            exportJsonBtn.addEventListener('click', () => this.handleExportJson());
        }
        
        if (findDuplicatesBtn) {
            findDuplicatesBtn.addEventListener('click', () => this.handleFindDuplicates());
        }
        if (checkLinksBtn) {
            checkLinksBtn.addEventListener('click', () => this.handleCheckLinks());
        }
        if (updateFaviconsBtn) {
            updateFaviconsBtn.addEventListener('click', () => this.handleUpdateFavicons());
        }
        if (cleanupDataBtn) {
            cleanupDataBtn.addEventListener('click', () => this.handleCleanupData());
        }
        
        if (animationToggle) {
            animationToggle.addEventListener('change', (e) => {
                stateManager.setState({ animationsEnabled: e.target.checked });
                stateManager.saveToStorage();
            });
        }
        if (autoUpdateToggle) {
            autoUpdateToggle.addEventListener('change', (e) => {
                // Handle auto-update toggle
                console.log('Auto-update toggled:', e.target.checked);
            });
        }
        if (checkUpdatesBtn) {
            checkUpdatesBtn.addEventListener('click', () => this.handleCheckUpdates());
        }
        if (viewReleasesBtn) {
            viewReleasesBtn.addEventListener('click', () => this.handleViewReleases());
        }
        
        if (themeEditorForm) {
            themeEditorForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleSaveTheme();
            });
        }
        if (resetThemeBtn) {
            resetThemeBtn.addEventListener('click', () => this.handleResetTheme());
        }

        // Setup theme preset buttons
        presetButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const theme = e.target.dataset.theme;
                this.handleThemePreset(theme);
            });
        });

        if (refreshSuggestionsBtn) {
            refreshSuggestionsBtn.addEventListener('click', () => this.handleRefreshSuggestions());
        }
    }

    setupVersionDisplay() {
        // Display current version
        const currentVersionEl = document.getElementById('current-version');
        if (currentVersionEl) {
            // Get version from package.json or electron
            if (window.electronAPI && window.electronAPI.getAppVersion) {
                window.electronAPI.getAppVersion().then(version => {
                    currentVersionEl.textContent = `v${version}`;
                }).catch(() => {
                    currentVersionEl.textContent = 'v1.0.1';
                });
            } else {
                currentVersionEl.textContent = 'v1.0.1';
            }
        }

        // Add version to main window header
        this.addVersionToHeader();
    }

    addVersionToHeader() {
        const headerLeft = document.querySelector('.header-left h1');
        if (headerLeft && !headerLeft.querySelector('.version-badge')) {
            const versionBadge = document.createElement('span');
            versionBadge.className = 'version-badge';
            versionBadge.textContent = 'v1.0.1';
            headerLeft.appendChild(versionBadge);
        }
    }

    setupViewModeToggle() {
        const bookmarksViewBtn = document.getElementById('bookmarks-view-btn');
        const launcherViewBtn = document.getElementById('launcher-view-btn');
        
        if (bookmarksViewBtn && launcherViewBtn) {
            bookmarksViewBtn.addEventListener('click', () => {
                this.switchToView('bookmarks');
            });
            
            launcherViewBtn.addEventListener('click', () => {
                this.switchToView('launcher');
            });
        }
        
        // Setup unified global controls
        this.setupGlobalControls();
    }

    setupGlobalControls() {
        // Update the global search to work for both views
        const globalSearch = document.getElementById('search-bookmarks');
        if (globalSearch) {
            // Update placeholder based on current view
            this.updateGlobalSearchPlaceholder();
            
            globalSearch.addEventListener('input', (e) => {
                const currentView = stateManager.getState().currentView || 'bookmarks';
                if (currentView === 'bookmarks') {
                    stateManager.setState({ searchTerm: e.target.value });
                } else {
                    const launcherSettings = stateManager.getState().launcherSettings;
                    stateManager.setState({
                        launcherSettings: {
                            ...launcherSettings,
                            searchTerm: e.target.value
                        }
                    });
                    this.renderApplications();
                }
            });
        }

        // Setup global categories
        this.setupGlobalCategories();
        
        // Setup view-specific actions
        this.updateViewActions();
        
        // Setup global sort options
        this.updateGlobalSortOptions();
    }

    updateGlobalSearchPlaceholder() {
        const globalSearch = document.getElementById('search-bookmarks');
        const currentView = stateManager.getState().currentView || 'bookmarks';
        
        if (globalSearch) {
            if (currentView === 'bookmarks') {
                globalSearch.placeholder = 'Search bookmarks...';
            } else {
                globalSearch.placeholder = 'Search applications...';
            }
        }
    }

    setupGlobalCategories() {
        const categoriesContainer = document.getElementById('global-categories');
        if (!categoriesContainer) return;

        // Handle category tab clicks
        categoriesContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('category-tab')) {
                const category = e.target.dataset.category;
                const currentView = stateManager.getState().currentView || 'bookmarks';
                
                // Update active state
                categoriesContainer.querySelectorAll('.category-tab').forEach(tab => {
                    tab.classList.remove('active');
                });
                e.target.classList.add('active');
                
                // Update state based on current view
                if (currentView === 'bookmarks') {
                    stateManager.setState({ currentCategory: category === 'all' ? 'all' : category });
                } else {
                    const launcherSettings = stateManager.getState().launcherSettings;
                    stateManager.setState({
                        launcherSettings: {
                            ...launcherSettings,
                            currentView: category
                        }
                    });
                    this.renderApplications();
                }
            }
        });
        
        // Initialize categories for current view
        this.updateGlobalCategories();
    }

    updateGlobalCategories() {
        const categoriesContainer = document.getElementById('global-categories');
        const currentView = stateManager.getState().currentView || 'bookmarks';
        
        if (!categoriesContainer) return;
        
        let categories = [];
        
        if (currentView === 'bookmarks') {
            // Get bookmark categories
            const bookmarks = stateManager.getState().bookmarks || [];
            const bookmarkCategories = [...new Set(bookmarks.map(b => b.category))].sort();
            categories = ['all', ...bookmarkCategories];
        } else {
            // Get app categories
            categories = ['all', 'recent', 'favorites', 'productivity', 'development', 'entertainment', 'utilities'];
        }
        
        // Update category tabs
        categoriesContainer.innerHTML = categories.map(category => {
            const isActive = currentView === 'bookmarks' 
                ? (stateManager.getState().currentCategory || 'all') === category
                : (stateManager.getState().launcherSettings?.currentView || 'all') === category;
                
            const displayName = category === 'all' 
                ? (currentView === 'bookmarks' ? 'All Bookmarks' : 'All Apps')
                : category.charAt(0).toUpperCase() + category.slice(1);
                
            return `<button class="category-tab ${isActive ? 'active' : ''}" data-category="${category}">${displayName}</button>`;
        }).join('');
    }

    updateViewActions() {
        const viewActions = document.getElementById('global-view-actions');
        const currentView = stateManager.getState().currentView || 'bookmarks';
        
        if (!viewActions) return;
        
        if (currentView === 'bookmarks') {
            // Bookmark-specific actions
            viewActions.innerHTML = `
                <button id="refresh-suggestions" title="Refresh suggestions">
                    <i class="fas fa-lightbulb"></i> Suggestions
                </button>
            `;
        } else {
            // App launcher-specific actions
            viewActions.innerHTML = `
                <button id="scan-all-apps" title="Scan for applications">
                    <i class="fas fa-sync"></i> Scan Apps
                </button>
                <button id="refresh-icons" class="secondary" title="Refresh icons from internet">
                    <i class="fas fa-cloud-download-alt"></i> Online Icons
                </button>
            `;
            
            // Re-setup button event listeners
            const scanButton = document.getElementById('scan-all-apps');
            if (scanButton) {
                scanButton.addEventListener('click', () => this.scanForApplications());
            }
            
            const refreshIconsButton = document.getElementById('refresh-icons');
            if (refreshIconsButton) {
                refreshIconsButton.addEventListener('click', () => this.refreshAllIcons());
            }
        }
    }

    updateGlobalSortOptions() {
        const globalSort = document.getElementById('global-sort');
        const currentView = stateManager.getState().currentView || 'bookmarks';
        
        if (!globalSort) return;
        
        if (currentView === 'bookmarks') {
            // Bookmark sort options
            globalSort.innerHTML = `
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="alphabetical">Alphabetical</option>
                <option value="most-visited">Most Visited</option>
                <option value="category">Category</option>
                <option value="tags">Tags</option>
            `;
            globalSort.value = stateManager.getState().sortBy || 'newest';
        } else {
            // App launcher sort options
            globalSort.innerHTML = `
                <option value="name">Name</option>
                <option value="category">Category</option>
                <option value="usage">Most Used</option>
                <option value="lastUsed">Recently Used</option>
            `;
            const launcherSettings = stateManager.getState().launcherSettings;
            globalSort.value = launcherSettings?.sortBy || 'name';
        }
        
        // Remove existing event listeners to avoid duplicates
        const newSort = globalSort.cloneNode(true);
        globalSort.parentNode.replaceChild(newSort, globalSort);
        
        // Setup global sort event listener
        newSort.addEventListener('change', (e) => {
            if (currentView === 'bookmarks') {
                stateManager.setState({ sortBy: e.target.value });
            } else {
                const launcherSettings = stateManager.getState().launcherSettings;
                stateManager.setState({
                    launcherSettings: {
                        ...launcherSettings,
                        sortBy: e.target.value
                    }
                });
                this.renderApplications();
            }
        });
    }

    switchToView(viewType) {
        const bookmarksViewBtn = document.getElementById('bookmarks-view-btn');
        const launcherViewBtn = document.getElementById('launcher-view-btn');
        const bookmarksView = document.getElementById('bookmarks-view');
        const launcherView = document.getElementById('launcher-view');
        
        if (!bookmarksViewBtn || !launcherViewBtn || !bookmarksView || !launcherView) {
            console.warn('View switching elements not found');
            return;
        }
        
        if (viewType === 'bookmarks') {
            // Switch to bookmarks view
            bookmarksViewBtn.classList.add('active');
            launcherViewBtn.classList.remove('active');
            bookmarksView.classList.add('active');
            bookmarksView.classList.remove('hidden');
            launcherView.classList.remove('active');
            launcherView.classList.add('hidden');
            
            // Update state and render bookmarks
            stateManager.setState({ currentView: 'bookmarks' });
            bookmarkManager.renderBookmarks();
            
            // Update global interface
            this.updateGlobalSearchPlaceholder();
            this.updateGlobalCategories();
            this.updateViewActions();
            this.updateGlobalSortOptions();
            
            // Load bookmark suggestions
            this.loadBookmarkSuggestions();
            
            notificationService.info('Switched to Bookmark Manager');
            
        } else if (viewType === 'launcher') {
            // Switch to launcher view
            launcherViewBtn.classList.add('active');
            bookmarksViewBtn.classList.remove('active');
            launcherView.classList.add('active');
            launcherView.classList.remove('hidden');
            bookmarksView.classList.remove('active');
            bookmarksView.classList.add('hidden');
            
            // Update state and render applications
            stateManager.setState({ currentView: 'launcher' });
            this.renderApplications();
            
            // Update global interface
            this.updateGlobalSearchPlaceholder();
            this.updateGlobalCategories();
            this.updateViewActions();
            this.updateGlobalSortOptions();
            
            // Load app suggestions
            this.loadAppSuggestions();
            
            notificationService.info('Switched to Application Launcher');
        }
    }

    setupLauncherFunctionality() {
        this.setupLauncherSearch();
        this.setupLauncherTabs();
        this.setupScanButton();
        this.setupAdvancedFiltering();
    }

    setupLauncherSearch() {
        const searchInput = document.getElementById('launch-search');
        const suggestionsContainer = document.getElementById('search-suggestions');
        
        if (searchInput && suggestionsContainer) {
            const debouncedSearch = Utils.debounce((searchTerm) => {
                const launcherSettings = stateManager.getState().launcherSettings;
                stateManager.setState({
                    launcherSettings: {
                        ...launcherSettings,
                        searchTerm: searchTerm
                    }
                });
                
                if (searchTerm.length >= 2) {
                    this.showSearchSuggestions(searchTerm);
                } else {
                    this.hideSuggestions();
                }
                
                this.renderApplications();
            }, 300);

            searchInput.addEventListener('input', (e) => {
                debouncedSearch(e.target.value.trim());
            });
            
            searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    const apps = this.getFilteredApplications();
                    if (apps.length > 0) {
                        this.launchApplication(apps[0]);
                    }
                } else if (e.key === 'Escape') {
                    searchInput.value = '';
                    debouncedSearch('');
                }
            });
        }
    }

    setupLauncherTabs() {
        const categoryTabs = document.querySelectorAll('.app-category-tab');
        
        categoryTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const category = tab.dataset.category;
                
                // Update active tab
                categoryTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                // Update launcher settings
                const launcherSettings = stateManager.getState().launcherSettings;
                stateManager.setState({
                    launcherSettings: {
                        ...launcherSettings,
                        currentView: category
                    }
                });
                
                // Re-render applications
                this.renderApplications();
            });
        });
    }

    setupScanButton() {
        const scanButton = document.getElementById('scan-all-apps');
        
        if (scanButton) {
            scanButton.addEventListener('click', () => {
                this.scanForApplications();
            });
        }

        // Setup refresh icons button
        const refreshIconsButton = document.getElementById('refresh-icons');
        if (refreshIconsButton) {
            refreshIconsButton.addEventListener('click', () => {
                this.refreshAllIcons();
            });
        }
    }

    setupAdvancedFiltering() {
        // Sort dropdown
        const sortSelect = document.getElementById('app-sort');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                const launcherSettings = stateManager.getState().launcherSettings;
                stateManager.setState({
                    launcherSettings: {
                        ...launcherSettings,
                        sortBy: e.target.value
                    }
                });
                this.renderApplications();
                stateManager.saveToStorage();
            });
        }
        
        // Clear filters button
        const clearFiltersBtn = document.getElementById('clear-filters');
        if (clearFiltersBtn) {
            clearFiltersBtn.addEventListener('click', () => {
                this.clearAllFilters();
            });
        }
    }

    async handleAddBookmark(e) {
        const formData = new FormData(e.target);
        const bookmarkData = {
            title: formData.get('bookmark-title'),
            url: formData.get('bookmark-url'),
            category: formData.get('bookmark-category'),
            tags: formData.get('bookmark-tags'),
            color: formData.get('bookmark-color'),
            icon: formData.get('bookmark-icon'),
            reminderDays: formData.get('bookmark-reminder'),
            type: formData.get('bookmark-type')
        };

        const result = await bookmarkManager.addBookmark(bookmarkData);
        if (result) {
            e.target.reset();
        }
    }

    async handleAddApplication(e) {
        try {
            const formData = new FormData(e.target);
            const appName = formData.get('app-name');
            const appPath = formData.get('app-path');
            const appCategory = formData.get('app-category-select');
            const appVersion = formData.get('app-version');
            const appDescription = formData.get('app-description');
            const appIconUrl = formData.get('app-icon-url');
            const appCustomIcon = formData.get('app-custom-icon');
            const extractIcon = formData.get('app-extract-icon') === 'on';

            if (!appName || !appPath) {
                notificationService.warning('Application name and path are required');
                return;
            }

            // Create new application object
            const newApp = {
                id: `manual-app-${Date.now()}`,
                name: appName,
                path: appPath,
                category: appCategory || 'Other',
                version: appVersion || '',
                description: appDescription || '',
                iconUrl: appIconUrl || '',
                icon: appCustomIcon || 'fas fa-desktop',
                lastUsed: null,
                useCount: 0,
                usageCount: 0,
                createdAt: new Date().toISOString(),
                isManual: true
            };

            // Try to extract icon if requested and in Electron environment
            if (extractIcon && Utils.isElectron() && window.electronAPI?.extractAppIcon) {
                try {
                    const iconResult = await window.electronAPI.extractAppIcon(appPath);
                    if (iconResult.success && iconResult.iconUrl) {
                        newApp.iconUrl = iconResult.iconUrl;
                        newApp.localIconPath = iconResult.iconPath;
                    }
                } catch (iconError) {
                    console.warn('Failed to extract icon:', iconError);
                }
            }

            // Add to applications list
            const currentApps = JSON.parse(localStorage.getItem('applications') || '[]');
            currentApps.push(newApp);
            localStorage.setItem('applications', JSON.stringify(currentApps));

            // Update state
            stateManager.setState({ applications: currentApps });

            // Show success notification
            notificationService.success(`Added ${appName} to application launcher`);

            // Reset form
            e.target.reset();

            // Refresh applications view if currently visible
            if (stateManager.getState().currentView === 'launcher') {
                this.renderApplications();
            }

        } catch (error) {
            console.error('Error adding application:', error);
            notificationService.error('Failed to add application');
        }
    }

    async handleBrowseForApp() {
        try {
            if (!Utils.isElectron() || !window.electronAPI?.browseForApp) {
                notificationService.warning('File browsing requires Electron environment');
                return;
            }

            const selectedPath = await window.electronAPI.browseForApp();
            if (selectedPath) {
                // Set the path in the form
                const appPathInput = document.getElementById('app-path');
                if (appPathInput) {
                    appPathInput.value = selectedPath;
                }

                // Try to extract app name from path
                const appNameInput = document.getElementById('app-name');
                if (appNameInput && !appNameInput.value) {
                    const pathParts = selectedPath.split('/');
                    const fileName = pathParts[pathParts.length - 1];
                    const appName = fileName.replace(/\.app$/, '').replace(/\.exe$/, '');
                    appNameInput.value = appName;
                }

                // Try to get app info if available
                if (window.electronAPI?.getAppInfo) {
                    try {
                        const appInfo = await window.electronAPI.getAppInfo(selectedPath);
                        if (appInfo.category) {
                            const categorySelect = document.getElementById('app-category-select');
                            if (categorySelect) {
                                // Map category to our options
                                const categoryMap = {
                                    'development': 'Development',
                                    'productivity': 'Productivity',
                                    'entertainment': 'Entertainment',
                                    'utilities': 'Utilities'
                                };
                                const mappedCategory = categoryMap[appInfo.category] || 'Other';
                                categorySelect.value = mappedCategory;
                            }
                        }
                        if (appInfo.version) {
                            const versionInput = document.getElementById('app-version');
                            if (versionInput) {
                                versionInput.value = appInfo.version;
                            }
                        }
                        if (appInfo.description) {
                            const descriptionInput = document.getElementById('app-description');
                            if (descriptionInput) {
                                descriptionInput.value = appInfo.description;
                            }
                        }
                    } catch (infoError) {
                        console.warn('Failed to get app info:', infoError);
                    }
                }
            }
        } catch (error) {
            console.error('Error browsing for app:', error);
            notificationService.error('Failed to browse for application');
        }
    }

    clearSearch() {
        if (this.elements.searchInput) {
            this.elements.searchInput.value = '';
            stateManager.setState({ searchTerm: '' });
            this.updateSearchClearVisibility();
        }
    }

    toggleTheme() {
        const currentTheme = stateManager.getState().isDarkMode;
        const newTheme = !currentTheme;
        stateManager.setState({ isDarkMode: newTheme });
        this.applyTheme(newTheme);
        stateManager.saveToStorage();
    }

    toggleAdminPanel() {
        if (this.elements.adminPanel) {
            const wasHidden = this.elements.adminPanel.classList.contains('hidden');
            this.elements.adminPanel.classList.toggle('hidden');
            
            // If we're opening the panel (was hidden), update the color inputs
            if (wasHidden) {
                // Small delay to ensure the panel is visible before updating colors
                setTimeout(() => {
                    this.updateThemeColorInputs();
                }, 100);
            }
        }
    }

    updateSearchClearVisibility() {
        if (this.elements.searchClear) {
            const hasValue = this.elements.searchInput?.value.length > 0;
            this.elements.searchClear.classList.toggle('hidden', !hasValue);
        }
    }

    updateCategoryFilters() {
        const currentCategory = stateManager.getState().currentCategory;
        
        [this.elements.categoryFilters, this.elements.mobileCategoryFilters].forEach(container => {
            if (!container) return;
            
            container.querySelectorAll('.category-filter').forEach(filter => {
                filter.classList.toggle('active', filter.dataset.category === currentCategory);
            });
        });
    }

    updateGridColumns() {
        if (this.elements.bookmarkGrid) {
            const columns = stateManager.getState().gridColumns;
            this.elements.bookmarkGrid.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;
        }

        if (this.elements.gridColumnsValue) {
            this.elements.gridColumnsValue.textContent = stateManager.getState().gridColumns;
        }
    }

    initializeTheme() {
        const savedTheme = localStorage.getItem('isDarkMode');
        const isDark = savedTheme ? JSON.parse(savedTheme) : false;
        stateManager.setState({ isDarkMode: isDark });
        this.applyTheme(isDark);
    }

    applyTheme(isDark) {
        document.body.classList.toggle('dark-mode', isDark);
        document.body.classList.toggle('light-mode', !isDark);
    }

    setupElectronIntegration() {
        if (!window.electronAPI) return;

        window.electronAPI.onMenuNewBookmark(() => {
            this.toggleAdminPanel();
        });

        window.electronAPI.onMenuToggleAdmin(() => {
            this.toggleAdminPanel();
        });

        window.electronAPI.onMenuToggleTheme(() => {
            this.toggleTheme();
        });
    }

    showLoadingState() {
        const loader = document.getElementById('loading-spinner');
        if (loader) {
            loader.classList.remove('hidden');
        }
    }

    hideLoadingState() {
        const loader = document.getElementById('loading-spinner');
        if (loader) {
            loader.classList.add('hidden');
        }
    }

    setupGlobalEventListeners() {
        // Close dropdown menus when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.bookmark-actions')) {
                document.querySelectorAll('.bookmark-actions-menu.show').forEach(menu => {
                    menu.classList.remove('show');
                });
            }
        });
    }

    loadDemoDataIfEmpty() {
        const bookmarks = stateManager.getState().bookmarks;
        if (bookmarks.length === 0) {
            const demoBookmarks = [
                {
                    id: 'demo-1',
                    title: 'Google',
                    url: 'https://google.com',
                    category: 'Search',
                    tags: ['search', 'web'],
                    type: 'website',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    visits: 0,
                    color: '#ffffff',
                    icon: 'https://www.google.com/s2/favicons?domain=google.com&sz=32'
                },
                {
                    id: 'demo-2',
                    title: 'GitHub',
                    url: 'https://github.com',
                    category: 'Development',
                    tags: ['code', 'git'],
                    type: 'website',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    visits: 0,
                    color: '#ffffff',
                    icon: 'https://www.google.com/s2/favicons?domain=github.com&sz=32'
                }
            ];

            stateManager.setState({ bookmarks: demoBookmarks });
            bookmarkManager.updateCategories();
            stateManager.saveToStorage();
        }
        
        // Auto-scan applications if none exist
        this.autoScanApplicationsIfEmpty();
    }

    async autoScanApplicationsIfEmpty() {
        const launcherSettings = stateManager.getState().launcherSettings;
        const hasApplications = launcherSettings.applications && launcherSettings.applications.length > 0;
        
        if (!hasApplications) {
            console.log('No applications found in storage. Auto-scanning on first run...');
            notificationService.info('Scanning for applications on first run...');
            
            // Automatically scan for applications
            try {
                await this.scanForApplications();
                notificationService.success('Application scan completed!');
            } catch (error) {
                console.error('Auto-scan failed:', error);
                notificationService.warning('Auto-scan failed. Click "Scan Apps" to try again.');
            }
        } else {
            // Check if we need to refresh icons for existing apps
            this.checkAndRefreshIcons();
        }
    }

    checkAndRefreshIcons() {
        const launcherSettings = stateManager.getState().launcherSettings;
        const appsWithoutIcons = launcherSettings.applications.filter(app => 
            !app.iconUrl || app.iconUrl.trim() === ''
        );
        
        if (appsWithoutIcons.length > 0) {
            console.log(`Found ${appsWithoutIcons.length} apps without icons:`, 
                appsWithoutIcons.map(app => app.name));
            
            // Automatically refresh icons for these apps
            setTimeout(() => {
                this.refreshIconsForApps(appsWithoutIcons);
            }, 1000);
        }
    }

    async refreshIconsForApps(apps) {
        console.log('Refreshing icons for apps:', apps.map(app => app.name));
        
        for (const app of apps) {
            try {
                // Try to extract icon from local app bundle
                if (window.electronAPI && window.electronAPI.extractAppIcon) {
                    const localIconResult = await window.electronAPI.extractAppIcon(app.path);
                    if (localIconResult && localIconResult.success && localIconResult.iconUrl) {
                        app.iconUrl = localIconResult.iconUrl;
                        app.localIconPath = localIconResult.iconPath;
                        app.iconType = localIconResult.iconType;
                        console.log(`✅ Refreshed local icon for ${app.name}`);
                        continue;
                    }
                }
                
                // Fallback to internet icon
                if (window.electronAPI && window.electronAPI.fetchAppIcon) {
                    const iconData = await window.electronAPI.fetchAppIcon(app.name);
                    if (iconData && iconData.iconUrl) {
                        app.iconUrl = iconData.iconUrl;
                        app.internetIcon = true;
                        console.log(`🌐 Refreshed internet icon for ${app.name}`);
                    }
                }
            } catch (error) {
                console.error(`Failed to refresh icon for ${app.name}:`, error);
            }
        }
        
        // Update state and re-render
        const launcherSettings = stateManager.getState().launcherSettings;
        stateManager.setState({
            launcherSettings: {
                ...launcherSettings,
                applications: [...launcherSettings.applications]
            }
        });
        
        await stateManager.saveToStorage();
        this.renderApplications();
        
        notificationService.success(`Refreshed icons for ${apps.length} applications`);
    }

    async refreshAllIcons() {
        const launcherSettings = stateManager.getState().launcherSettings;
        const allApps = launcherSettings.applications || [];
        
        if (allApps.length === 0) {
            notificationService.warning('No applications to refresh icons for');
            return;
        }
        
        notificationService.info('Refreshing all application icons...');
        
        // Reset all icon URLs to force refresh
        allApps.forEach(app => {
            app.iconUrl = null;
            app.localIconPath = null;
            app.internetIcon = false;
        });
        
        // Refresh icons for all apps
        await this.refreshIconsForApps(allApps);
    }



    renderApplications() {
        const applicationsGrid = document.getElementById('applications-grid');
        if (!applicationsGrid) return;

        const applications = this.getFilteredApplications();
        applicationsGrid.innerHTML = '';

        if (applications.length === 0) {
            this.renderEmptyLauncherState(applicationsGrid);
            return;
        }

        applications.forEach(app => {
            const appElement = this.createApplicationElement(app);
            applicationsGrid.appendChild(appElement);
        });
    }

    getFilteredApplications() {
        const launcherSettings = stateManager.getState().launcherSettings;
        let applications = [...(launcherSettings.applications || [])];

        // Filter by search term
        if (launcherSettings.searchTerm) {
            const searchTerm = launcherSettings.searchTerm.toLowerCase();
            applications = applications.filter(app =>
                app.name.toLowerCase().includes(searchTerm) ||
                app.category.toLowerCase().includes(searchTerm)
            );
        }

        // Filter by category
        if (launcherSettings.currentView && launcherSettings.currentView !== 'all') {
            if (launcherSettings.currentView === 'recent') {
                applications = applications
                    .filter(app => app.lastUsed)
                    .sort((a, b) => new Date(b.lastUsed) - new Date(a.lastUsed))
                    .slice(0, 20);
            } else if (launcherSettings.currentView === 'favorites') {
                applications = applications.filter(app => app.favorite);
            } else {
                applications = applications.filter(app => 
                    app.category.toLowerCase() === launcherSettings.currentView.toLowerCase()
                );
            }
        }

        return applications;
    }

    createApplicationElement(app) {
        const element = document.createElement('div');
        element.className = 'application-item bookmark-item';
        element.dataset.id = app.id;
        element.dataset.path = app.path;

        const lastUsedText = app.lastUsed ? `Last used: ${this.formatLastUsed(app.lastUsed)}` : 'Never used';
        const usageCount = app.usageCount || 0;
        const description = app.description ? `title="${app.description}"` : '';
        
        // Add icon source indicator
        const iconSource = app.localIconPath ? 'Local Icon' : (app.internetIcon ? 'Internet Icon' : 'Default Icon');
        const iconSourceClass = app.localIconPath ? 'local-icon' : (app.internetIcon ? 'internet-icon' : 'default-icon');
        
        // Always try to use iconUrl if available, with better fallback handling
        const hasIconUrl = app.iconUrl && app.iconUrl.trim() !== '';
        const iconContent = hasIconUrl ? 
            `<div class="app-icon-container">
                <img src="${app.iconUrl}" alt="${app.name}" 
                      onerror="console.log('Icon failed to load for ${app.name}:', this.src); this.style.display='none'; this.nextElementSibling.style.display='block';"
                      onload="console.log('Icon loaded successfully for ${app.name}:', this.src);"
                      style="width: 48px; height: 48px; object-fit: contain;">
                 <i class="${app.icon || 'fas fa-desktop'}" style="display: none; font-size: 32px; color: white;"></i>
                 <div class="icon-source-badge ${iconSourceClass}" title="${iconSource}">
                    ${app.localIconPath ? '<i class="fas fa-hdd"></i>' : (app.internetIcon ? '<i class="fas fa-cloud"></i>' : '<i class="fas fa-font"></i>')}
                 </div>
             </div>` :
            `<div class="app-icon-container">
                <i class="${app.icon || 'fas fa-desktop'}" style="font-size: 32px; color: white;"></i>
                 <div class="icon-source-badge default-icon" title="Default Icon">
                    <i class="fas fa-font"></i>
                 </div>
             </div>`;

        element.innerHTML = `
            <div class="bookmark-info">
                <div class="app-header">
                    <div class="bookmark-title app-name" title="${app.name}">${app.name}</div>
                </div>
                <div class="bookmark-category app-category">${app.category}</div>
            </div>
            <div class="bookmark-icon app-icon ${iconSourceClass}">
                ${iconContent}
            </div>
            ${app.version ? `<div class="app-version-under-icon">v${app.version}</div>` : ''}
            <div class="bookmark-actions app-actions">
                <button class="bookmark-menu-btn" title="Actions">
                    <i class="fas fa-ellipsis-v"></i>
                </button>
                <div class="bookmark-actions-menu">
                    <button class="favorite-app ${app.favorite ? 'active' : ''}" data-app-path="${app.path}">
                        <i class="fas fa-heart"></i>
                        <span>${app.favorite ? 'Remove Favorite' : 'Add Favorite'}</span>
                    </button>
                    <button class="launch-app" data-app-path="${app.path}">
                        <i class="fas fa-play"></i>
                        <span>Launch App</span>
                    </button>
                    ${Utils.isElectron() ? `
                    <button class="show-in-finder" data-app-path="${app.path}">
                        <i class="fas fa-folder"></i>
                        <span>Show in Finder</span>
                    </button>` : ''}
                    ${app.appStoreUrl ? `
                    <button class="view-app-store" data-url="${app.appStoreUrl}">
                        <i class="fas fa-external-link-alt"></i>
                        <span>View in App Store</span>
                    </button>` : ''}
                </div>
            </div>
        `;

        this.attachApplicationEvents(element, app);
        return element;
    }

    formatLastUsed(dateString) {
        if (!dateString) return '';
        
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '';
        
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);
        
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        
        return date.toLocaleDateString();
    }

    attachApplicationEvents(element, app) {
        element.addEventListener('click', (e) => {
            if (e.target.closest('.bookmark-actions')) return;
            this.launchApplication(app);
        });

        // Menu toggle functionality
        const menuBtn = element.querySelector('.bookmark-menu-btn');
        const menu = element.querySelector('.bookmark-actions-menu');
        
        if (menuBtn && menu) {
            menuBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                
                // Close other open menus
                document.querySelectorAll('.bookmark-actions-menu.show').forEach(m => {
                    if (m !== menu) m.classList.remove('show');
                });
                
                // Toggle this menu
                menu.classList.toggle('show');
            });
        }

        const favoriteBtn = element.querySelector('.favorite-app');
        if (favoriteBtn) {
            favoriteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleFavoriteApplication(app.id);
                // Close menu after action
                if (menu) menu.classList.remove('show');
            });
        }

        const launchBtn = element.querySelector('.launch-app');
        if (launchBtn) {
            launchBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.launchApplication(app);
                // Close menu after action
                if (menu) menu.classList.remove('show');
            });
        }

        const showInFinderBtn = element.querySelector('.show-in-finder');
        if (showInFinderBtn) {
            showInFinderBtn.addEventListener('click', async (e) => {
                e.stopPropagation();
                try {
                    if (window.electronAPI && window.electronAPI.showItemInFolder) {
                        await window.electronAPI.showItemInFolder(app.path);
                        notificationService.success(`Revealed ${app.name} in Finder`);
                    } else {
                        notificationService.warning('Show in Finder requires Electron environment');
                    }
                } catch (error) {
                    console.error('Error showing in finder:', error);
                    notificationService.error('Failed to show in Finder');
                }
                // Close menu after action
                if (menu) menu.classList.remove('show');
            });
        }

        const viewAppStoreBtn = element.querySelector('.view-app-store');
        if (viewAppStoreBtn) {
            viewAppStoreBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const url = e.target.closest('.view-app-store').dataset.url;
                if (url) {
                    window.open(url, '_blank');
                }
                // Close menu after action
                if (menu) menu.classList.remove('show');
            });
        }
    }

    async launchApplication(app) {
        try {
            if (Utils.isElectron() && window.electronAPI) {
                await window.electronAPI.launchApp(app.path);
                notificationService.success(`Launched ${app.name}`);
                this.updateUsageStats(app);
            } else {
                notificationService.warning('Application launching requires Electron environment');
            }
        } catch (error) {
            console.error('Error launching application:', error);
            notificationService.error(`Failed to launch ${app.name}`);
        }
    }

    updateUsageStats(app) {
        const launcherSettings = stateManager.getState().launcherSettings;
        const applications = [...launcherSettings.applications];
        const appIndex = applications.findIndex(a => a.id === app.id);
        
        if (appIndex !== -1) {
            applications[appIndex] = {
                ...applications[appIndex],
                usageCount: (applications[appIndex].usageCount || 0) + 1,
                lastUsed: new Date().toISOString()
            };

            stateManager.setState({
                launcherSettings: {
                    ...launcherSettings,
                    applications
                }
            });
            stateManager.saveToStorage();
        }
    }

    toggleFavoriteApplication(appId) {
        const launcherSettings = stateManager.getState().launcherSettings;
        const applications = [...launcherSettings.applications];
        const appIndex = applications.findIndex(a => a.id === appId);
        
        if (appIndex !== -1) {
            applications[appIndex] = {
                ...applications[appIndex],
                favorite: !applications[appIndex].favorite
            };

            stateManager.setState({
                launcherSettings: {
                    ...launcherSettings,
                    applications
                }
            });
            stateManager.saveToStorage();

            const action = applications[appIndex].favorite ? 'Added to' : 'Removed from';
            notificationService.success(`${action} favorites: ${applications[appIndex].name}`);
            
            this.renderApplications();
        }
    }

    async scanForApplications() {
        const launcherSettings = stateManager.getState().launcherSettings;
        if (launcherSettings.isScanning) return;
        
        // Update state to indicate scanning
        stateManager.setState({
            launcherSettings: {
                ...launcherSettings,
                isScanning: true
            }
        });
        this.updateScanButtonState(true);
        
        try {
            console.log('Scanning for applications...');
            
            // Check if we're in Electron environment
            if (window.electronAPI && window.electronAPI.scanApplications) {
                console.log('Calling electronAPI.scanApplications...');
                const foundApps = await window.electronAPI.scanApplications();
                console.log('Found apps from Electron API:', foundApps.length, foundApps);
                
                // Enhanced app processing with icon fetching and better categorization
                const scannedApplications = await Promise.all(foundApps.map(async (app) => {
                    const baseApp = {
                        id: Utils.generateId(),
                        name: app.name,
                        path: app.path,
                        lastUsed: null,
                        usageCount: 0,
                        favorite: launcherSettings.favorites ? launcherSettings.favorites.includes(app.path) : false,
                        iconUrl: null,
                        description: '',
                        appStoreUrl: '',
                        version: ''
                    };
                    
                    try {
                        // Get app info from bundle first (more accurate)
                        if (window.electronAPI.getAppInfo) {
                            const appInfo = await window.electronAPI.getAppInfo(app.path);
                            baseApp.category = appInfo.category || this.categorizeApplication(app.name).category;
                            baseApp.description = appInfo.description || '';
                            baseApp.version = appInfo.version || '';
                            baseApp.identifier = appInfo.identifier || '';
                        } else {
                            baseApp.category = this.categorizeApplication(app.name).category;
                        }
                        
                        // Try to extract icon from local app bundle first (most accurate)
                        let localIconExtracted = false;
                        if (window.electronAPI.extractAppIcon) {
                            try {
                                const localIconResult = await window.electronAPI.extractAppIcon(app.path);
                                if (localIconResult && localIconResult.success && localIconResult.iconUrl) {
                                    baseApp.iconUrl = localIconResult.iconUrl;
                                    baseApp.localIconPath = localIconResult.iconPath;
                                    baseApp.iconType = localIconResult.iconType;
                                    localIconExtracted = true;
                                    console.log(`✅ Extracted local icon for ${app.name}:`, localIconResult.iconType, localIconResult.iconUrl);
                                } else {
                                    console.log(`❌ Local icon extraction returned no result for ${app.name}:`, localIconResult);
                                }
                            } catch (localIconError) {
                                console.log(`❌ Local icon extraction failed for ${app.name}:`, localIconError);
                            }
                        }
                        
                        // Fetch icon and additional info from internet (fallback or supplement)
                        if (window.electronAPI.fetchAppIcon) {
                            try {
                                const iconData = await window.electronAPI.fetchAppIcon(app.name);
                                
                                // Only use internet icon if local extraction failed
                                if (!localIconExtracted && iconData && iconData.iconUrl) {
                                    baseApp.iconUrl = iconData.iconUrl;
                                    baseApp.internetIcon = true;
                                    console.log(`🌐 Fetched internet icon for ${app.name}:`, iconData.iconUrl);
                                }
                                
                                // Always use internet data for App Store info and categories
                                if (iconData) {
                                    baseApp.appStoreUrl = iconData.appStoreUrl;
                                    
                                    // Use online category if it's more specific
                                    if (iconData.category && iconData.category !== 'Utilities') {
                                        const mappedCategory = this.mapAppStoreCategory(iconData.category);
                                        if (mappedCategory !== 'utilities') {
                                            baseApp.category = mappedCategory;
                                        }
                                    }
                                    
                                    if (iconData.description && !baseApp.description) {
                                        baseApp.description = iconData.description;
                                    }
                                }
                            } catch (internetIconError) {
                                console.log(`❌ Internet icon fetch failed for ${app.name}:`, internetIconError);
                            }
                        }
                        
                        // Set fallback icon for cases where no iconUrl is available
                        baseApp.icon = this.categorizeApplication(app.name).icon;
                        
                    } catch (error) {
                        console.error(`Error enhancing app ${app.name}:`, error);
                        // Fallback to basic categorization
                        const basicCategory = this.categorizeApplication(app.name);
                        baseApp.category = basicCategory.category;
                        baseApp.icon = basicCategory.icon;
                    }
                    
                    return baseApp;
                }));
                
                console.log('Enhanced applications with icons and categories:', scannedApplications.length);
                
                // Debug icon loading summary
                const iconStats = {
                    total: scannedApplications.length,
                    localIcons: scannedApplications.filter(app => app.localIconPath).length,
                    internetIcons: scannedApplications.filter(app => app.internetIcon).length,
                    noIcons: scannedApplications.filter(app => !app.iconUrl).length
                };
                console.log('📊 Icon loading stats:', iconStats);
                
                // List apps without icons for debugging
                const appsWithoutIcons = scannedApplications.filter(app => !app.iconUrl);
                if (appsWithoutIcons.length > 0) {
                    console.log('⚠️ Apps without icons:', appsWithoutIcons.map(app => app.name));
                }
                
                // Merge with existing applications
                this.mergeApplications(scannedApplications);
                
                // Save to storage
                await stateManager.saveToStorage();
                
                // Render updated list
                this.renderApplications();
                
                notificationService.success(`Found ${scannedApplications.length} applications`);
                
            } else {
                // Fallback for non-Electron environment
                console.log('Application scanning requires Electron environment');
                notificationService.warning('Application scanning requires Electron environment');
                this.renderApplications(); // Show empty state
            }
            
        } catch (error) {
            console.error('Error scanning applications:', error);
            notificationService.error('Failed to scan applications');
        } finally {
            const launcherSettings = stateManager.getState().launcherSettings;
            stateManager.setState({
                launcherSettings: {
                    ...launcherSettings,
                    isScanning: false
                }
            });
            this.updateScanButtonState(false);
        }
    }

    updateScanButtonState(isScanning) {
        const scanButton = document.getElementById('scan-all-apps');
        if (!scanButton) return;
        
        const icon = scanButton.querySelector('i');
        const text = scanButton.childNodes[1];
        
        if (isScanning) {
            icon.className = 'fas fa-spinner fa-spin';
            if (text) text.textContent = ' Scanning...';
            scanButton.disabled = true;
        } else {
            icon.className = 'fas fa-sync';
            if (text) text.textContent = ' Scan Apps';
            scanButton.disabled = false;
        }
    }

    mapAppStoreCategory(appStoreCategory) {
        const categoryMap = {
            'Developer Tools': 'development',
            'Productivity': 'productivity',
            'Entertainment': 'entertainment',
            'Utilities': 'utilities',
            'Graphics & Design': 'productivity',
            'Music': 'entertainment',
            'Video': 'entertainment',
            'Games': 'entertainment',
            'Business': 'productivity',
            'Education': 'productivity',
            'Photo & Video': 'productivity',
            'Social Networking': 'productivity',
            'News': 'productivity',
            'Reference': 'productivity',
            'Finance': 'productivity',
            'Health & Fitness': 'productivity'
        };
        
        return categoryMap[appStoreCategory] || 'utilities';
    }

    categorizeApplication(appName) {
        const name = appName.toLowerCase();
        
        // Development tools
        if (name.includes('code') || name.includes('studio') || name.includes('xcode') || 
            name.includes('terminal') || name.includes('git') || name.includes('docker') ||
            name.includes('postman') || name.includes('intellij') || name.includes('eclipse')) {
            return { category: 'development', icon: 'fas fa-code' };
        }
        
        // Productivity apps
        if (name.includes('office') || name.includes('word') || name.includes('excel') || 
            name.includes('powerpoint') || name.includes('outlook') || name.includes('notes') ||
            name.includes('calendar') || name.includes('slack') || name.includes('zoom') ||
            name.includes('teams') || name.includes('notion') || name.includes('todoist')) {
            return { category: 'productivity', icon: 'fas fa-briefcase' };
        }
        
        // Entertainment apps
        if (name.includes('spotify') || name.includes('music') || name.includes('video') || 
            name.includes('vlc') || name.includes('netflix') || name.includes('youtube') ||
            name.includes('steam') || name.includes('game') || name.includes('player')) {
            return { category: 'entertainment', icon: 'fas fa-play' };
        }
        
        // Utilities
        if (name.includes('finder') || name.includes('calculator') || name.includes('archive') || 
            name.includes('cleaner') || name.includes('backup') || name.includes('disk') ||
            name.includes('activity') || name.includes('monitor') || name.includes('utility')) {
            return { category: 'utilities', icon: 'fas fa-wrench' };
        }
        
        // Web browsers
        if (name.includes('safari') || name.includes('chrome') || name.includes('firefox') || 
            name.includes('browser') || name.includes('edge')) {
            return { category: 'productivity', icon: 'fas fa-globe' };
        }
        
        // Default category
        return { category: 'utilities', icon: 'fas fa-desktop' };
    }

    mergeApplications(scannedApplications) {
        const launcherSettings = stateManager.getState().launcherSettings;
        const existingApps = launcherSettings.applications || [];
        const beforeCount = existingApps.length;
        
        console.log('Merging applications. Existing count:', existingApps.length);
        console.log('Scanned count:', scannedApplications.length);
        
        const newApplications = [];
        const scannedPaths = scannedApplications.map(app => app.path);
        
        // First, update existing apps with scanned data if they match by name or path
        existingApps.forEach(existingApp => {
            const scannedMatch = scannedApplications.find(scannedApp => 
                scannedApp.path === existingApp.path || 
                scannedApp.name.toLowerCase() === existingApp.name.toLowerCase() ||
                // Handle common name variations
                this.areAppNamesEquivalent(scannedApp.name, existingApp.name)
            );
            
            if (scannedMatch) {
                // Update existing app with scanned data, preserving user data like favorites/usage
                const updatedApp = {
                    ...scannedMatch,
                    id: existingApp.id, // Keep original ID
                    favorite: existingApp.favorite, // Preserve favorite status
                    usageCount: existingApp.usageCount || scannedMatch.usageCount || 0, // Keep higher usage count
                    lastUsed: existingApp.lastUsed || scannedMatch.lastUsed // Keep most recent usage
                };
                newApplications.push(updatedApp);
                console.log(`🔄 Updated existing app: ${existingApp.name} with scanned data`);
            } else {
                // Keep existing app as-is if no scanned match
                newApplications.push(existingApp);
            }
        });
        
        // Then, add new scanned apps that don't exist in existing apps
        scannedApplications.forEach(scannedApp => {
            const existsInNew = newApplications.find(app => 
                app.path === scannedApp.path || 
                app.name.toLowerCase() === scannedApp.name.toLowerCase() ||
                this.areAppNamesEquivalent(scannedApp.name, app.name)
            );
            
            if (!existsInNew) {
                newApplications.push(scannedApp);
                console.log(`➕ Added new app: ${scannedApp.name}`);
            }
        });
        
        stateManager.setState({
            launcherSettings: {
                ...launcherSettings,
                applications: newApplications,
                lastScanTime: new Date().toISOString()
            }
        });
        
        const addedCount = newApplications.length - beforeCount;
        const updatedCount = existingApps.filter(existing => 
            scannedApplications.some(scanned => 
                scanned.path === existing.path || 
                scanned.name.toLowerCase() === existing.name.toLowerCase()
            )
        ).length;
        
        console.log('After merge - total applications:', newApplications.length);
        console.log('Added:', addedCount, 'new applications');
        console.log('Updated:', updatedCount, 'existing applications');
    }

    areAppNamesEquivalent(name1, name2) {
        const normalize = (name) => name.toLowerCase()
            .replace(/\s+/g, '')
            .replace(/[^a-z0-9]/g, '');
        
        const n1 = normalize(name1);
        const n2 = normalize(name2);
        
        // Direct match
        if (n1 === n2) return true;
        
        // Common variations
        const variations = {
            'visualstudiocode': ['vscode'],
            'googlechrome': ['chrome'],
            'microsoftword': ['word'],
            'microsoftexcel': ['excel'],
            'microsoftpowerpoint': ['powerpoint'],
            'adobephotoshop': ['photoshop'],
            'adobeillustrator': ['illustrator'],
            'sublimetext': ['sublime'],
            'jetbrainsintellijidea': ['intellij', 'idea'],
            'jetbrainswebstorm': ['webstorm'],
            'jetbrainspycharm': ['pycharm']
        };
        
        // Check if either name is a variation of the other
        for (const [full, shorts] of Object.entries(variations)) {
            if ((n1 === full && shorts.includes(n2)) || 
                (n2 === full && shorts.includes(n1)) ||
                (shorts.includes(n1) && shorts.includes(n2))) {
                return true;
            }
        }
        
        return false;
    }

    clearAllFilters() {
        const launcherSettings = stateManager.getState().launcherSettings;
        stateManager.setState({
            launcherSettings: {
                ...launcherSettings,
                searchTerm: '',
                currentView: 'all',
                sortBy: 'name'
            }
        });

        // Clear UI elements
        const searchInput = document.getElementById('launch-search');
        if (searchInput) searchInput.value = '';

        const categoryTabs = document.querySelectorAll('.app-category-tab');
        categoryTabs.forEach(tab => {
            tab.classList.toggle('active', tab.dataset.category === 'all');
        });

        const sortSelect = document.getElementById('app-sort');
        if (sortSelect) sortSelect.value = 'name';

        this.renderApplications();
        notificationService.success('All launcher filters cleared');
    }

    renderEmptyLauncherState(container) {
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-state';
        emptyState.innerHTML = `
            <div class="empty-state-content">
                <i class="fas fa-rocket empty-state-icon"></i>
                <h3>No applications found</h3>
                <p>Scan for applications or add them manually</p>
                <button class="btn btn-primary" onclick="document.getElementById('scan-all-apps').click()">
                    <i class="fas fa-search"></i> Scan Applications
                </button>
            </div>
        `;
        container.appendChild(emptyState);
    }

    showSearchSuggestions(searchTerm) {
        // Implementation for search suggestions
        console.log('Showing search suggestions for:', searchTerm);
    }

    hideSuggestions() {
        const suggestionsContainer = document.getElementById('search-suggestions');
        if (suggestionsContainer) {
            suggestionsContainer.classList.add('hidden');
            suggestionsContainer.innerHTML = '';
        }
    }

    // Admin panel handler functions
    loadTabContent(tabId) {
        switch (tabId) {
            case 'manage':
                this.loadManageContent();
                break;
            case 'analytics':
                this.loadAnalyticsContent();
                break;
            case 'settings':
                this.loadSettingsContent();
                break;
            default:
                break;
        }
    }

    loadManageContent() {
        // Load bookmarks into management view with filters/sorting and bulk actions
        const managementList = document.getElementById('bookmarks-management-list');
        const searchInput = document.getElementById('admin-search');
        const clearBtn = document.getElementById('admin-search-clear');
        const categorySelect = document.getElementById('admin-filter-category');
        const dateSelect = document.getElementById('admin-filter-date');
        const sortSelect = document.getElementById('manage-sort');
        const selectAll = document.getElementById('select-all-bookmarks');
        const bulkBar = document.getElementById('bulk-actions');
        const selectedCountEl = document.getElementById('selected-count');
        const bulkDeleteBtn = document.getElementById('bulk-delete');
        const bulkExportBtn = document.getElementById('bulk-export');
        const bulkCategorizeBtn = document.getElementById('bulk-categorize');

        if (!managementList) return;

        // Build category filter options
        if (categorySelect && !categorySelect.dataset.populated) {
            const categories = stateManager.getState().categories || [];
            const current = categorySelect.value;
            categorySelect.innerHTML = '<option value="">All Categories</option>' +
                categories.map(c => `<option value="${c}">${c}</option>`).join('');
            if (current) categorySelect.value = current;
            categorySelect.dataset.populated = 'true';
        }

        // Collect filters
        const searchTerm = (searchInput?.value || '').toLowerCase().trim();
        const categoryFilter = categorySelect?.value || '';
        const dateFilter = dateSelect?.value || '';

        // Prepare dataset
        let items = [...(stateManager.getState().bookmarks || [])];

        // Apply filters
        if (searchTerm) {
            items = items.filter(b => (
                b.title?.toLowerCase().includes(searchTerm) ||
                b.url?.toLowerCase().includes(searchTerm) ||
                b.category?.toLowerCase().includes(searchTerm) ||
                (b.tags || []).some(t => t.toLowerCase().includes(searchTerm))
            ));
        }
        if (categoryFilter) {
            items = items.filter(b => (b.category || '').toLowerCase() === categoryFilter.toLowerCase());
        }
        if (dateFilter) {
            const now = new Date();
            items = items.filter(b => {
                const created = new Date(b.createdAt);
                if (isNaN(created.getTime())) return true;
                switch (dateFilter) {
                    case 'today': return created.toDateString() === now.toDateString();
                    case 'week': {
                        const diffDays = Math.floor((now - created) / 86400000);
                        return diffDays <= 7;
                    }
                    case 'month': return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
                    case 'year': return created.getFullYear() === now.getFullYear();
                    default: return true;
                }
            });
        }

        // Sorting
        const sortBy = sortSelect?.value || 'newest';
        const sorted = [...items].sort((a, b) => {
            switch (sortBy) {
                case 'oldest': return new Date(a.createdAt) - new Date(b.createdAt);
                case 'alphabetical': return (a.title || '').localeCompare(b.title || '');
                case 'most-visited': return (b.visits || 0) - (a.visits || 0);
                case 'category': return (a.category || '').localeCompare(b.category || '');
                case 'newest':
                default: return new Date(b.createdAt) - new Date(a.createdAt);
            }
        });

        // Render list
        managementList.innerHTML = '';
        sorted.forEach(bookmark => {
            const item = document.createElement('div');
            item.className = 'management-item';
            item.innerHTML = `
                <label class="checkbox-container">
                    <input type="checkbox" class="bookmark-select" data-id="${bookmark.id}">
                    <span class="checkmark"></span>
                </label>
                <img src="${bookmark.icon}" alt="${bookmark.title}" class="management-icon">
                <div class="management-info">
                    <div class="management-title">${bookmark.title}</div>
                    <div class="management-url">${bookmark.url}</div>
                    <div class="management-category">${bookmark.category}</div>
                </div>
                <div class="management-actions">
                    <button class="btn-edit" data-id="${bookmark.id}" title="Edit"><i class="fas fa-edit"></i></button>
                    <button class="btn-delete" data-id="${bookmark.id}" title="Delete"><i class="fas fa-trash"></i></button>
                </div>
            `;
            managementList.appendChild(item);
        });

        // Helpers for selection
        const updateBulkBar = () => {
            const selected = managementList.querySelectorAll('.bookmark-select:checked');
            const count = selected.length;
            if (bulkBar) bulkBar.style.display = count > 0 ? 'flex' : 'none';
            if (selectedCountEl) selectedCountEl.textContent = String(count);
        };

        // Wire selection listeners
        managementList.querySelectorAll('.bookmark-select').forEach(cb => {
            cb.addEventListener('change', updateBulkBar);
        });
        updateBulkBar();

        if (selectAll && !selectAll.dataset.listenerAttached) {
            selectAll.addEventListener('change', (e) => {
                const checked = e.target.checked;
                managementList.querySelectorAll('.bookmark-select').forEach(cb => {
                    cb.checked = checked;
                });
                updateBulkBar();
            });
            selectAll.dataset.listenerAttached = 'true';
        }

        // Single delete
        managementList.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const id = btn.getAttribute('data-id');
                const current = stateManager.getState().bookmarks;
                const updated = current.filter(b => b.id !== id);
                stateManager.setState({ bookmarks: updated });
                stateManager.saveToStorage();
                this.loadManageContent();
                notificationService.success('Bookmark deleted');
            });
        });

        // Bulk actions
        if (bulkDeleteBtn && !bulkDeleteBtn.dataset.listenerAttached) {
            bulkDeleteBtn.addEventListener('click', () => {
                const selectedIds = Array.from(managementList.querySelectorAll('.bookmark-select:checked')).map(cb => cb.getAttribute('data-id'));
                if (selectedIds.length === 0) return;
                const current = stateManager.getState().bookmarks;
                const updated = current.filter(b => !selectedIds.includes(b.id));
                stateManager.setState({ bookmarks: updated });
                stateManager.saveToStorage();
                this.loadManageContent();
                notificationService.success(`Deleted ${selectedIds.length} bookmarks`);
            });
            bulkDeleteBtn.dataset.listenerAttached = 'true';
        }

        if (bulkExportBtn && !bulkExportBtn.dataset.listenerAttached) {
            bulkExportBtn.addEventListener('click', () => {
                const selected = Array.from(managementList.querySelectorAll('.bookmark-select:checked')).map(cb => cb.getAttribute('data-id'));
                const current = stateManager.getState().bookmarks;
                const data = current.filter(b => selected.includes(b.id));
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `bookmarks-selected-${new Date().toISOString().split('T')[0]}.json`;
                a.click();
                URL.revokeObjectURL(url);
                notificationService.success(`Exported ${data.length} bookmarks`);
            });
            bulkExportBtn.dataset.listenerAttached = 'true';
        }

        if (bulkCategorizeBtn && !bulkCategorizeBtn.dataset.listenerAttached) {
            bulkCategorizeBtn.addEventListener('click', async () => {
                const selectedIds = Array.from(managementList.querySelectorAll('.bookmark-select:checked')).map(cb => cb.getAttribute('data-id'));
                if (selectedIds.length === 0) return;
                const newCategory = prompt('Enter category for selected bookmarks:');
                if (!newCategory) return;
                const current = stateManager.getState().bookmarks;
                const updated = current.map(b => selectedIds.includes(b.id) ? { ...b, category: newCategory } : b);
                stateManager.setState({ bookmarks: updated });
                // Update categories list in state
                bookmarkManager.updateCategories();
                stateManager.saveToStorage();
                this.loadManageContent();
                notificationService.success(`Updated category for ${selectedIds.length} bookmarks`);
            });
            bulkCategorizeBtn.dataset.listenerAttached = 'true';
        }

        // Filters/search wiring (debounced)
        const refreshManage = Utils.debounce(() => this.loadManageContent(), 200);
        if (searchInput && !searchInput.dataset.listenerAttached) {
            searchInput.addEventListener('input', refreshManage);
            searchInput.dataset.listenerAttached = 'true';
        }
        if (clearBtn && !clearBtn.dataset.listenerAttached) {
            clearBtn.addEventListener('click', () => { if (searchInput) { searchInput.value = ''; refreshManage(); } });
            clearBtn.dataset.listenerAttached = 'true';
        }
        if (categorySelect && !categorySelect.dataset.filterListener) {
            categorySelect.addEventListener('change', refreshManage);
            categorySelect.dataset.filterListener = 'true';
        }
        if (dateSelect && !dateSelect.dataset.filterListener) {
            dateSelect.addEventListener('change', refreshManage);
            dateSelect.dataset.filterListener = 'true';
        }
        if (sortSelect && !sortSelect.dataset.filterListener) {
            sortSelect.addEventListener('change', refreshManage);
            sortSelect.dataset.filterListener = 'true';
        }
    }

    loadAnalyticsContent() {
        const bookmarks = stateManager.getState().bookmarks;
        
        // Update stats
        document.getElementById('total-bookmarks').textContent = bookmarks.length;
        document.getElementById('total-categories').textContent = new Set(bookmarks.map(b => b.category)).size;
        document.getElementById('total-clicks').textContent = bookmarks.reduce((sum, b) => sum + (b.visits || 0), 0);
        
        const thisMonth = bookmarks.filter(b => {
            const created = new Date(b.createdAt);
            const now = new Date();
            return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
        }).length;
        document.getElementById('bookmarks-this-month').textContent = thisMonth;

        // Load most visited
        const mostVisited = bookmarks
            .filter(b => b.visits > 0)
            .sort((a, b) => (b.visits || 0) - (a.visits || 0))
            .slice(0, 5);
            
        const mostVisitedList = document.getElementById('most-visited-list');
        if (mostVisitedList) {
            mostVisitedList.innerHTML = mostVisited.map(b => 
                `<div class="analytics-item">${b.title} (${b.visits} visits)</div>`
            ).join('');
        }
    }

    loadSettingsContent() {
        // Load current settings
        const state = stateManager.getState();
        
        const gridColumns = document.getElementById('grid-columns');
        const gridColumnsValue = document.getElementById('grid-columns-value');
        const animationToggle = document.getElementById('animation-toggle');
        
        if (gridColumns && gridColumnsValue) {
            gridColumns.value = state.gridColumns;
            gridColumnsValue.textContent = state.gridColumns;
            
            gridColumns.addEventListener('input', (e) => {
                const value = parseInt(e.target.value);
                gridColumnsValue.textContent = value;
                stateManager.setState({ gridColumns: value });
                this.updateGridColumns();
                stateManager.saveToStorage();
            });
        }
        
        if (animationToggle) {
            animationToggle.checked = state.animationsEnabled;
        }
    }

    // Handler functions for admin buttons
    handleImportHtml() {
        const fileInput = document.getElementById('import-html-file');
        if (fileInput) {
            fileInput.click();
            fileInput.onchange = (e) => {
                const file = e.target.files[0];
                if (file) {
                    // Handle HTML import
                    notificationService.info('HTML import functionality coming soon!');
                }
            };
        }
    }

    handleImportJson() {
        const fileInput = document.getElementById('import-json-file');
        if (fileInput) {
            fileInput.click();
            fileInput.onchange = (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        try {
                            const data = JSON.parse(event.target.result);
                            if (data.bookmarks && Array.isArray(data.bookmarks)) {
                                stateManager.setState({ bookmarks: data.bookmarks });
                                stateManager.saveToStorage();
                                notificationService.success(`Imported ${data.bookmarks.length} bookmarks!`);
                            }
                        } catch (error) {
                            notificationService.error('Invalid JSON file');
                        }
                    };
                    reader.readAsText(file);
                }
            };
        }
    }

    handleBackup() {
        const state = stateManager.getState();
        const backup = {
            version: '1.0.1',
            timestamp: new Date().toISOString(),
            bookmarks: state.bookmarks,
            categories: state.categories,
            settings: {
                gridColumns: state.gridColumns,
                isDarkMode: state.isDarkMode,
                animationsEnabled: state.animationsEnabled,
                sortBy: state.sortBy,
                sortOrder: state.sortOrder
            }
        };
        
        const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bookmark-manager-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        notificationService.success('Backup created successfully!');
    }

    handleExportCsv() {
        const bookmarks = stateManager.getState().bookmarks;
        const csvHeader = 'Title,URL,Category,Tags,Created,Visits\n';
        const csvData = bookmarks.map(b => 
            `"${b.title}","${b.url}","${b.category}","${(b.tags || []).join(';')}","${b.createdAt}","${b.visits || 0}"`
        ).join('\n');
        
        const blob = new Blob([csvHeader + csvData], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bookmarks-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        
        notificationService.success('CSV export completed!');
    }

    handleExportJson() {
        const bookmarks = stateManager.getState().bookmarks;
        const blob = new Blob([JSON.stringify(bookmarks, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bookmarks-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        notificationService.success('JSON export completed!');
    }

    handleFindDuplicates() {
        const bookmarks = stateManager.getState().bookmarks;
        const duplicates = [];
        const seen = new Set();
        
        bookmarks.forEach(bookmark => {
            if (seen.has(bookmark.url)) {
                duplicates.push(bookmark);
            } else {
                seen.add(bookmark.url);
            }
        });
        
        if (duplicates.length > 0) {
            notificationService.warning(`Found ${duplicates.length} duplicate bookmarks`);
        } else {
            notificationService.success('No duplicates found!');
        }
    }

    handleCheckLinks() {
        notificationService.info('Checking links... This may take a moment');
        const bookmarks = stateManager.getState().bookmarks;
        let checkedCount = 0;
        let brokenCount = 0;
        
        // Simple implementation - check a few links
        bookmarks.slice(0, 5).forEach(bookmark => {
            fetch(bookmark.url, { method: 'HEAD', mode: 'no-cors' })
                .then(() => {
                    checkedCount++;
                    if (checkedCount === Math.min(5, bookmarks.length)) {
                        notificationService.success(`Checked ${checkedCount} links, ${brokenCount} broken`);
                    }
                })
                .catch(() => {
                    brokenCount++;
                    checkedCount++;
                    if (checkedCount === Math.min(5, bookmarks.length)) {
                        notificationService.warning(`Checked ${checkedCount} links, ${brokenCount} broken`);
                    }
                });
        });
    }

    handleUpdateFavicons() {
        notificationService.info('Updating favicons...');
        const bookmarks = stateManager.getState().bookmarks;
        
        bookmarks.forEach(bookmark => {
            try {
                const url = new URL(bookmark.url);
                bookmark.icon = `https://www.google.com/s2/favicons?domain=${url.hostname}&sz=32`;
            } catch (error) {
                // Keep existing icon if URL is invalid
            }
        });
        
        stateManager.setState({ bookmarks });
        stateManager.saveToStorage();
        notificationService.success('Favicons updated!');
    }

    handleCleanupData() {
        notificationService.info('Cleaning up data...');
        const bookmarks = stateManager.getState().bookmarks;
        
        // Remove bookmarks with invalid URLs
        const cleanedBookmarks = bookmarks.filter(bookmark => {
            try {
                new URL(bookmark.url);
                return true;
            } catch {
                return false;
            }
        });
        
        const removedCount = bookmarks.length - cleanedBookmarks.length;
        if (removedCount > 0) {
            stateManager.setState({ bookmarks: cleanedBookmarks });
            stateManager.saveToStorage();
            notificationService.success(`Cleaned up ${removedCount} invalid bookmarks`);
        } else {
            notificationService.success('No cleanup needed!');
        }
    }

    async handleCheckUpdates() {
        if (Utils.isElectron() && window.electronAPI) {
            try {
                notificationService.info('Checking for updates...');

                // Prefer the UpdateManager if available
                if (typeof updateManager?.checkForUpdates === 'function') {
                    await updateManager.checkForUpdates(true);
                } else if (this.checkForUpdates) {
                    await this.checkForUpdates(true);
                } else {
                    // Fallback to direct API call
                    const result = await window.electronAPI.checkForUpdates();
                    if (result?.error) {
                        throw new Error(result.error);
                    }
                    setTimeout(() => {
                        const versionStatus = document.getElementById('version-status');
                        if (versionStatus && versionStatus.textContent.includes('latest version')) {
                            notificationService.success('You are running the latest version!');
                        }
                    }, 1500);
                }
            } catch (error) {
                console.error('Update check failed:', error);
                notificationService.error(`Update check failed: ${error.message}`);
            }
        } else {
            notificationService.info('Update checking is not available in web version. Download the latest version from GitHub.');
        }
    }

    handleViewReleases() {
        if (window.electronAPI) {
            // Open GitHub releases page
            window.open('https://github.com/aardel/Bookmarks/releases', '_blank');
        } else {
            notificationService.info('Release notes available on GitHub');
        }
    }

    handleSaveTheme() {
        // Get values from color inputs
        const bgPrimary = document.getElementById('theme-bg-primary')?.value;
        const bgSecondary = document.getElementById('theme-bg-secondary')?.value;
        const textPrimary = document.getElementById('theme-text-primary')?.value;
        const textSecondary = document.getElementById('theme-text-secondary')?.value;
        const accentColor = document.getElementById('theme-accent-color')?.value;

        if (!bgPrimary || !bgSecondary || !textPrimary || !textSecondary || !accentColor) {
            notificationService.error('Please set all color values');
            return;
        }

        // Apply custom colors to CSS variables
        const root = document.documentElement;
        root.style.setProperty('--bg-primary', bgPrimary);
        root.style.setProperty('--bg-secondary', bgSecondary);
        root.style.setProperty('--text-primary', textPrimary);
        root.style.setProperty('--text-secondary', textSecondary);
        root.style.setProperty('--accent-color', accentColor);

        // Update preset button active state
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector('[data-theme="custom"]')?.classList.add('active');

        // Save custom theme to state
        const customTheme = {
            isDarkMode: false, // Custom theme is considered light mode
            customColors: {
                '--bg-primary': bgPrimary,
                '--bg-secondary': bgSecondary,
                '--text-primary': textPrimary,
                '--text-secondary': textSecondary,
                '--accent-color': accentColor
            }
        };

        stateManager.setState({ 
            isDarkMode: customTheme.isDarkMode,
            customTheme: customTheme
        });
        stateManager.saveToStorage();

        notificationService.success('Custom theme saved and applied!');
    }

    handleResetTheme() {
        // Reset to default theme
        this.applyTheme(false);
        stateManager.setState({ isDarkMode: false });
        stateManager.saveToStorage();
        notificationService.success('Theme reset to default!');
    }

    handleThemePreset(theme) {
        // Apply predefined theme presets
        const themes = {
            light: {
                isDarkMode: false,
                name: 'Light Theme'
            },
            dark: {
                isDarkMode: true,
                name: 'Dark Theme'
            },
            blue: {
                isDarkMode: false,
                name: 'Blue Theme',
                customColors: {
                    '--accent-color': '#1976d2',
                    '--bg-primary': '#e3f2fd',
                    '--bg-secondary': '#bbdefb'
                }
            },
            custom: {
                isDarkMode: false,
                name: 'Custom Theme'
            }
        };

        const selectedTheme = themes[theme];
        if (!selectedTheme) {
            notificationService.error('Invalid theme selected');
            return;
        }

        // Apply the theme
        this.applyTheme(selectedTheme.isDarkMode);
        stateManager.setState({ isDarkMode: selectedTheme.isDarkMode });
        
        // Apply custom colors if they exist
        if (selectedTheme.customColors) {
            const root = document.documentElement;
            Object.entries(selectedTheme.customColors).forEach(([property, value]) => {
                root.style.setProperty(property, value);
            });
        } else if (theme === 'light' || theme === 'dark') {
            // Reset custom colors for light/dark themes
            const root = document.documentElement;
            root.style.removeProperty('--accent-color');
            root.style.removeProperty('--bg-primary');
            root.style.removeProperty('--bg-secondary');
        }

        // Update preset button active state
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-theme="${theme}"]`)?.classList.add('active');

        // Update color inputs to reflect current theme
        this.updateThemeColorInputs(theme, selectedTheme);

        stateManager.saveToStorage();
        notificationService.success(`${selectedTheme.name} applied!`);
    }

    updateThemeColorInputs(themeName = null, themeData = null) {
        console.log('Updating theme color inputs for theme:', themeName);
        
        // Define default theme colors
        const themeColors = {
            light: {
                'theme-bg-primary': '#f8f9fa',
                'theme-bg-secondary': '#ffffff',
                'theme-text-primary': '#333333',
                'theme-text-secondary': '#666666',
                'theme-accent-color': '#4a6da7'
            },
            dark: {
                'theme-bg-primary': '#1a1a1a',
                'theme-bg-secondary': '#2d2d2d',
                'theme-text-primary': '#ffffff',
                'theme-text-secondary': '#cccccc',
                'theme-accent-color': '#8e24aa'
            },
            blue: {
                'theme-bg-primary': '#e3f2fd',
                'theme-bg-secondary': '#bbdefb',
                'theme-text-primary': '#333333',
                'theme-text-secondary': '#666666',
                'theme-accent-color': '#1976d2'
            },
            custom: {
                'theme-bg-primary': '#f8f9fa',
                'theme-bg-secondary': '#ffffff',
                'theme-text-primary': '#333333',
                'theme-text-secondary': '#666666',
                'theme-accent-color': '#4a6da7'
            }
        };

        // Use predefined colors if theme is specified
        let colorsToUse = {};
        if (themeName && themeColors[themeName]) {
            colorsToUse = themeColors[themeName];
            console.log('Using predefined colors for', themeName, colorsToUse);
        } else {
            // Fallback to computed styles
            const computedStyle = getComputedStyle(document.documentElement);
            
            const colorInputs = {
                'theme-bg-primary': '--bg-primary',
                'theme-bg-secondary': '--bg-secondary', 
                'theme-text-primary': '--text-primary',
                'theme-text-secondary': '--text-secondary',
                'theme-accent-color': '--accent-color'
            };

            Object.entries(colorInputs).forEach(([inputId, cssVariable]) => {
                let currentValue = computedStyle.getPropertyValue(cssVariable).trim();
                
                if (!currentValue || currentValue === '') {
                    // Fallback: get actual computed color from a test element
                    const testElement = document.createElement('div');
                    testElement.style.color = `var(${cssVariable})`;
                    testElement.style.position = 'absolute';
                    testElement.style.visibility = 'hidden';
                    document.body.appendChild(testElement);
                    
                    const testComputedStyle = getComputedStyle(testElement);
                    currentValue = testComputedStyle.color;
                    document.body.removeChild(testElement);
                }
                
                if (currentValue && currentValue !== '' && currentValue !== 'rgba(0, 0, 0, 0)') {
                    const hexColor = this.convertColorToHex(currentValue);
                    if (hexColor) {
                        colorsToUse[inputId] = hexColor;
                    }
                }
            });
        }

        // Apply the colors to the inputs
        Object.entries(colorsToUse).forEach(([inputId, color]) => {
            const input = document.getElementById(inputId);
            if (input) {
                input.value = color;
                console.log(`Set ${inputId} to ${color}`);
            } else {
                console.log(`Input ${inputId} not found`);
            }
        });
    }

    convertColorToHex(color) {
        console.log('Converting color:', color);
        
        // If already hex, return as-is
        if (color.startsWith('#')) {
            return color;
        }
        
        // Handle RGB/RGBA format
        const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/);
        if (rgbMatch) {
            const r = parseInt(rgbMatch[1]);
            const g = parseInt(rgbMatch[2]);
            const b = parseInt(rgbMatch[3]);
            const hex = '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
            console.log(`RGB(${r}, ${g}, ${b}) converted to ${hex}`);
            return hex;
        }
        
        // Fallback: create a temporary element to convert color to RGB
        const tempElement = document.createElement('div');
        tempElement.style.color = color;
        tempElement.style.position = 'absolute';
        tempElement.style.visibility = 'hidden';
        document.body.appendChild(tempElement);
        
        const rgb = getComputedStyle(tempElement).color;
        document.body.removeChild(tempElement);
        
        console.log(`Fallback conversion of "${color}" resulted in "${rgb}"`);
        
        // Try to convert the RGB result
        const fallbackRgbMatch = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/);
        if (fallbackRgbMatch) {
            const r = parseInt(fallbackRgbMatch[1]);
            const g = parseInt(fallbackRgbMatch[2]);
            const b = parseInt(fallbackRgbMatch[3]);
            const hex = '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
            console.log(`Fallback RGB(${r}, ${g}, ${b}) converted to ${hex}`);
            return hex;
        }
        
        return color;
    }

    handleRefreshSuggestions() {
        // Get current view
        const currentView = stateManager.getState().currentView || 'bookmarks';
        
        if (currentView === 'bookmarks') {
            this.loadBookmarkSuggestions();
        } else {
            this.loadAppSuggestions();
        }
    }

    loadBookmarkSuggestions() {
        const suggestionsGrid = document.getElementById('suggestions-grid');
        const suggestionsSection = document.getElementById('suggestions-section');
        
        if (!suggestionsGrid || !suggestionsSection) return;
        
        // Show section and update content for bookmarks
        suggestionsSection.style.display = 'block';
        
        const suggestions = [
            { title: 'GitHub', url: 'https://github.com', category: 'Development' },
            { title: 'Stack Overflow', url: 'https://stackoverflow.com', category: 'Development' },
            { title: 'MDN Web Docs', url: 'https://developer.mozilla.org', category: 'Development' },
            { title: 'Google Drive', url: 'https://drive.google.com', category: 'Productivity' },
            { title: 'YouTube', url: 'https://youtube.com', category: 'Entertainment' }
        ];
        
        suggestionsGrid.innerHTML = suggestions.map(suggestion => `
            <div class="suggestion-item" data-url="${suggestion.url}">
                <img src="https://www.google.com/s2/favicons?domain=${new URL(suggestion.url).hostname}&sz=32" alt="${suggestion.title}">
                <div class="suggestion-info">
                    <div class="suggestion-title">${suggestion.title}</div>
                    <div class="suggestion-category">${suggestion.category}</div>
                </div>
                <button class="add-suggestion-btn" data-title="${suggestion.title}" data-url="${suggestion.url}" data-category="${suggestion.category}">
                    <i class="fas fa-plus"></i>
                </button>
            </div>
        `).join('');
        
        // Add click handlers for suggestions
        suggestionsGrid.querySelectorAll('.add-suggestion-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const title = btn.dataset.title;
                const url = btn.dataset.url;
                const category = btn.dataset.category;
                
                const result = await bookmarkManager.addBookmark({ title, url, category });
                if (result) {
                    btn.innerHTML = '<i class="fas fa-check"></i>';
                    btn.disabled = true;
                }
            });
        });
        
        notificationService.success('Bookmark suggestions refreshed!');
    }

    loadAppSuggestions() {
        const suggestionsGrid = document.getElementById('suggestions-grid');
        const suggestionsSection = document.getElementById('suggestions-section');
        
        if (!suggestionsGrid || !suggestionsSection) return;
        
        // Show section and update content for apps
        suggestionsSection.style.display = 'block';
        
        // Update header for app suggestions
        const header = suggestionsSection.querySelector('h3');
        if (header) {
            header.innerHTML = '<i class="fas fa-rocket"></i> Suggested Applications';
        }
        const description = suggestionsSection.querySelector('p');
        if (description) {
            description.textContent = 'Popular applications you might want to add';
        }
        
        const appSuggestions = [
            { name: 'Visual Studio Code', path: '/Applications/Visual Studio Code.app', category: 'Development' },
            { name: 'Google Chrome', path: '/Applications/Google Chrome.app', category: 'Productivity' },
            { name: 'Slack', path: '/Applications/Slack.app', category: 'Productivity' },
            { name: 'Adobe Photoshop', path: '/Applications/Adobe Photoshop.app', category: 'Graphics' },
            { name: 'Spotify', path: '/Applications/Spotify.app', category: 'Entertainment' }
        ];
        
        suggestionsGrid.innerHTML = appSuggestions.map(app => `
            <div class="suggestion-item" data-path="${app.path}">
                <i class="fas fa-desktop suggestion-app-icon"></i>
                <div class="suggestion-info">
                    <div class="suggestion-title">${app.name}</div>
                    <div class="suggestion-category">${app.category}</div>
                </div>
                <button class="add-suggestion-btn" data-name="${app.name}" data-path="${app.path}" data-category="${app.category}">
                    <i class="fas fa-plus"></i>
                </button>
            </div>
        `).join('');
        
        // Add click handlers for app suggestions
        suggestionsGrid.querySelectorAll('.add-suggestion-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const name = btn.dataset.name;
                const path = btn.dataset.path;
                const category = btn.dataset.category;
                
                // Add to launcher settings
                const launcherSettings = stateManager.getState().launcherSettings;
                const newApp = {
                    id: Utils.generateId(),
                    name,
                    path,
                    category: category.toLowerCase(),
                    usageCount: 0,
                    favorite: false,
                    iconUrl: null,
                    description: ''
                };
                
                const applications = [...(launcherSettings.applications || []), newApp];
                stateManager.setState({
                    launcherSettings: {
                        ...launcherSettings,
                        applications
                    }
                });
                stateManager.saveToStorage();
                
                btn.innerHTML = '<i class="fas fa-check"></i>';
                btn.disabled = true;
                notificationService.success(`Added ${name} to launcher!`);
            });
        });
        
        notificationService.success('App suggestions refreshed!');
    }
}

// Add CSS for notifications
const style = document.createElement('style');
style.textContent = `
    .notification.show {
        transform: translateX(0) !important;
        opacity: 1 !important;
    }

    .empty-state {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 300px;
        text-align: center;
        color: var(--text-secondary);
        grid-column: 1 / -1;
    }

    .empty-state-content {
        max-width: 400px;
    }

    .empty-state-icon {
        font-size: 4rem;
        margin-bottom: 1rem;
        opacity: 0.5;
    }

    .empty-state h3 {
        margin-bottom: 0.5rem;
        color: var(--text-primary);
    }

    .empty-state p {
        margin-bottom: 1.5rem;
    }

    .btn {
        background: var(--accent-color);
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
        transition: all 0.2s;
    }

    .btn:hover {
        opacity: 0.9;
        transform: translateY(-1px);
    }

    .btn i {
        margin-right: 8px;
    }

    .applications-container {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 16px;
        padding: 20px;
    }

    .application-item {
        background: var(--bg-secondary);
        border: 1px solid var(--border-color);
        border-radius: 8px;
        padding: 16px;
        cursor: pointer;
        transition: all 0.2s;
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        position: relative;
    }

    .application-item:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px var(--shadow);
        border-color: var(--accent-color);
    }

    .app-icon {
        font-size: 2rem;
        margin-bottom: 12px;
        color: var(--accent-color);
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 40px;
    }

    .app-icon i {
        font-size: 32px;
        color: var(--accent-color);
    }

    .app-info {
        flex-grow: 1;
        width: 100%;
    }

    .app-name {
        font-weight: 600;
        color: var(--text-primary);
        margin-bottom: 4px;
        font-size: 14px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .app-category {
        color: var(--text-secondary);
        font-size: 12px;
        margin-bottom: 4px;
    }

    .app-usage {
        color: var(--text-secondary);
        font-size: 11px;
    }

    .app-actions {
        display: flex;
        gap: 8px;
        margin-top: 12px;
        opacity: 0;
        transition: opacity 0.2s;
    }

    .application-item:hover .app-actions {
        opacity: 1;
    }

    .app-favorite-btn,
    .app-launch-btn {
        background: var(--bg-primary);
        border: 1px solid var(--border-color);
        color: var(--text-secondary);
        padding: 6px 8px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
        transition: all 0.2s;
    }

    .app-favorite-btn:hover,
    .app-launch-btn:hover {
        background: var(--accent-color);
        color: white;
    }

    .app-favorite-btn.active {
        background: #f39c12;
        color: white;
        border-color: #f39c12;
    }

    .main-view {
        display: none;
    }

    .main-view.active {
        display: block;
    }

    .view-mode-btn {
        background: var(--bg-secondary);
        border: 1px solid var(--border-color);
        color: var(--text-secondary);
        padding: 12px 24px;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s;
        margin-right: 8px;
    }

    .view-mode-btn:hover {
        background: var(--bg-primary);
        border-color: var(--accent-color);
    }

    .view-mode-btn.active {
        background: var(--accent-color);
        color: white;
        border-color: var(--accent-color);
    }

    .view-mode-toggle {
        text-align: center;
        padding: 20px;
        background: var(--bg-primary);
        border-bottom: 1px solid var(--border-color);
    }

    .app-stats {
        margin-top: 4px;
        font-size: 11px;
        color: var(--text-secondary);
    }

    .usage-count,
    .last-used {
        display: block;
        margin-bottom: 2px;
    }

    .app-version {
        font-size: 10px;
        color: var(--text-secondary);
        margin-top: 4px;
        opacity: 0.7;
    }

    .local-icon img {
        border: 2px solid #27ae60;
        border-radius: 4px;
    }

    .internet-icon img {
        border: 2px solid #3498db;
        border-radius: 4px;
    }

    .bookmark-icon img {
        width: 32px;
        height: 32px;
        object-fit: contain;
    }

    .favorite-app.active {
        background: #e74c3c !important;
        color: white !important;
        border-color: #e74c3c !important;
    }

    .applications-container .bookmark-item {
        min-height: 120px;
    }

    .no-applications {
        grid-column: 1 / -1;
        text-align: center;
        padding: 40px;
        color: var(--text-secondary);
    }

    .no-applications i {
        font-size: 3rem;
        margin-bottom: 16px;
        opacity: 0.5;
    }

    .no-applications h3 {
        margin-bottom: 8px;
        color: var(--text-primary);
    }

    .no-applications p {
        margin-bottom: 16px;
    }

    .icon-source-badge {
        position: absolute;
        bottom: -2px;
        right: -2px;
        background: var(--bg-secondary);
        border: 1px solid var(--border-color);
        border-radius: 50%;
        width: 16px;
        height: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 8px;
        z-index: 2;
    }

    .bookmark-icon {
        position: relative;
    }

    .icon-source-badge.local-icon {
        color: #27ae60;
        border-color: #27ae60;
    }

    .icon-source-badge.internet-icon {
        color: #3498db;
        border-color: #3498db;
    }

    .icon-source-badge.default-icon {
        color: var(--text-secondary);
        opacity: 0.7;
    }

    .bookmark-actions-menu {
        position: absolute;
        top: 100%;
        right: 0;
        background: var(--bg-secondary);
        border: 1px solid var(--border-color);
        border-radius: 6px;
        box-shadow: 0 4px 12px var(--shadow);
        z-index: 1000;
        min-width: 150px;
        opacity: 0;
        visibility: hidden;
        transform: translateY(-10px);
        transition: all 0.2s ease;
        overflow: hidden;
    }

    .bookmark-actions-menu.show {
        opacity: 1;
        visibility: visible;
        transform: translateY(0);
    }

    .bookmark-actions-menu button {
        display: flex;
        align-items: center;
        width: 100%;
        padding: 8px 12px;
        border: none;
        background: transparent;
        color: var(--text-primary);
        font-size: 13px;
        cursor: pointer;
        transition: background-color 0.2s;
        text-align: left;
    }

    .bookmark-actions-menu button:hover {
        background: var(--bg-primary);
    }

    .bookmark-actions-menu button i {
        margin-right: 8px;
        width: 14px;
        text-align: center;
    }

    .bookmark-actions {
        position: relative;
    }

    .bookmark-menu-btn {
        background: transparent;
        border: none;
        color: var(--text-secondary);
        padding: 4px 8px;
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.2s;
        opacity: 0;
    }

    .application-item:hover .bookmark-menu-btn {
        opacity: 1;
    }

    .bookmark-menu-btn:hover {
        background: var(--bg-primary);
        color: var(--text-primary);
    }

    /* Version badge in header */
    .version-badge {
        display: inline-block;
        background: var(--accent-color);
        color: white;
        font-size: 10px;
        padding: 2px 6px;
        border-radius: 10px;
        margin-left: 8px;
        font-weight: 500;
        vertical-align: middle;
    }

    /* View mode toggle border centering fix */
    .view-mode-toggle {
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 16px 20px;
        background: var(--bg-primary);
        border-bottom: 1px solid var(--border-color);
    }

    .view-mode-btn {
        background: var(--bg-secondary);
        border: 1px solid var(--border-color);
        color: var(--text-secondary);
        padding: 10px 20px;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s;
        margin: 0 4px;
        font-size: 14px;
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .view-mode-btn:hover {
        background: var(--bg-primary);
        border-color: var(--accent-color);
        color: var(--text-primary);
    }

    .view-mode-btn.active {
        background: var(--accent-color);
        color: white;
        border-color: var(--accent-color);
    }

    /* Suggestions styling */
    .suggestions-section {
        padding: 20px;
        background: var(--bg-primary);
        border-bottom: 1px solid var(--border-color);
    }

    .suggestions-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 16px;
    }

    .suggestions-header h3 {
        margin: 0;
        color: var(--text-primary);
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .suggestions-header p {
        margin: 4px 0 0 0;
        color: var(--text-secondary);
        font-size: 14px;
    }

    .refresh-btn {
        background: transparent;
        border: 1px solid var(--border-color);
        color: var(--text-secondary);
        padding: 8px 12px;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s;
    }

    .refresh-btn:hover {
        background: var(--accent-color);
        color: white;
        border-color: var(--accent-color);
    }

    .suggestions-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
        gap: 12px;
    }

    .suggestion-item {
        display: flex;
        align-items: center;
        background: var(--bg-secondary);
        border: 1px solid var(--border-color);
        border-radius: 8px;
        padding: 12px;
        transition: all 0.2s;
        cursor: pointer;
    }

    .suggestion-item:hover {
        transform: translateY(-1px);
        box-shadow: 0 2px 8px var(--shadow);
        border-color: var(--accent-color);
    }

    .suggestion-item img {
        width: 24px;
        height: 24px;
        margin-right: 12px;
        border-radius: 4px;
    }

    .suggestion-app-icon {
        font-size: 24px;
        color: var(--accent-color);
        margin-right: 12px;
        width: 24px;
        text-align: center;
    }

    .suggestion-info {
        flex: 1;
    }

    .suggestion-title {
        font-weight: 600;
        color: var(--text-primary);
        margin-bottom: 2px;
    }

    .suggestion-category {
        font-size: 12px;
        color: var(--text-secondary);
    }

    .add-suggestion-btn {
        background: var(--accent-color);
        border: none;
        color: white;
        padding: 6px 8px;
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.2s;
        margin-left: 8px;
    }

    .add-suggestion-btn:hover {
        background: var(--accent-color);
        opacity: 0.8;
    }

    .add-suggestion-btn:disabled {
        background: #27ae60;
        cursor: not-allowed;
    }

    /* Management item styling */
    .management-item {
        display: flex;
        align-items: center;
        padding: 12px;
        border-bottom: 1px solid var(--border-color);
        transition: background-color 0.2s;
    }

    .management-item:hover {
        background: var(--bg-primary);
    }

    .management-icon {
        width: 24px;
        height: 24px;
        margin: 0 12px;
        border-radius: 4px;
    }

    .management-info {
        flex: 1;
    }

    .management-title {
        font-weight: 600;
        color: var(--text-primary);
        margin-bottom: 2px;
    }

    .management-url {
        font-size: 12px;
        color: var(--text-secondary);
        margin-bottom: 2px;
    }

    .management-category {
        font-size: 11px;
        color: var(--accent-color);
    }

    .management-actions {
        display: flex;
        gap: 8px;
    }

    .btn-edit, .btn-delete {
        background: transparent;
        border: 1px solid var(--border-color);
        color: var(--text-secondary);
        padding: 6px 8px;
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.2s;
    }

    .btn-edit:hover {
        background: var(--accent-color);
        color: white;
        border-color: var(--accent-color);
    }

    .btn-delete:hover {
        background: #e74c3c;
        color: white;
        border-color: #e74c3c;
    }

    .analytics-item {
        padding: 8px 12px;
        border-bottom: 1px solid var(--border-color);
        color: var(--text-primary);
    }
`;
document.head.appendChild(style);

// Create and initialize the app
const appCore = new AppCore();

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}

async function initializeApp() {
    try {
        console.log('Starting modular bookmark manager...');
        await appCore.init();
        console.log('Modular bookmark manager started successfully!');
    } catch (error) {
        console.error('Failed to initialize modular bookmark manager:', error);
        
        document.body.innerHTML = `
            <div style="
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 100vh;
                font-family: Arial, sans-serif;
                color: #333;
                background: #f5f5f5;
            ">
                <h1 style="color: #e74c3c; margin-bottom: 20px;">
                    <i class="fas fa-exclamation-triangle"></i>
                    Initialization Failed
                </h1>
                <p style="margin-bottom: 20px; text-align: center;">
                    The bookmark manager failed to start. Please try refreshing the page.
                </p>
                <button onclick="location.reload()" style="
                    background: #3498db;
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 16px;
                ">
                    <i class="fas fa-refresh"></i> Reload Application
                </button>
            </div>
        `;
    }
}

// Export for potential external access
window.BookmarkManager = {
    appCore,
    stateManager,
    bookmarkManager,
    notificationService,
    version: '2.0.0-compatible'
}; 