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

        const duration = options.duration || this.getDefaultDuration(type);
        if (duration > 0) {
            setTimeout(() => {
                this.dismiss(id);
            }, duration);
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
            closeBtn.style.cssText = `
                background: none;
                border: none;
                color: inherit;
                cursor: pointer;
                padding: 4px;
                border-radius: 4px;
                opacity: 0.6;
                transition: opacity 0.2s;
            `;
            closeBtn.onmouseover = () => closeBtn.style.opacity = '1';
            closeBtn.onmouseout = () => closeBtn.style.opacity = '0.6';
            closeBtn.onclick = () => this.dismiss(id);
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
        const notification = this.notifications.get(id);
        if (!notification) return;

        notification.style.transform = 'translateX(100%)';
        notification.style.opacity = '0';

        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
            this.notifications.delete(id);
        }, 300);
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
        try {
            new URL(url);
            return true;
        } catch (error) {
            try {
                new URL('http://' + url);
                return true;
            } catch (e) {
                return false;
            }
        }
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

            const bookmark = {
                id: Utils.generateId(),
                title: Utils.sanitizeString(bookmarkData.title),
                url: bookmarkData.url,
                category: Utils.sanitizeString(bookmarkData.category) || 'General',
                tags: Utils.validateTags(bookmarkData.tags),
                color: bookmarkData.color || '#ffffff',
                icon: bookmarkData.icon || Utils.getFaviconUrl(bookmarkData.url),
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
        const url = 'https://github.com/aarondelia/bookmark-manager/releases';
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
            this.elements.adminPanel.classList.toggle('hidden');
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