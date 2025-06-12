/**
 * Bookmark Manager Module
 * Handles all bookmark-related operations
 */

import stateManager from './state-manager.js';
import notificationService from '../services/notification-service.js';
import { 
    generateId, 
    validateUrl, 
    validateTitle, 
    validateCategory, 
    validateTags,
    sanitizeString,
    getFaviconUrl,
    formatDate,
    formatRelativeTime,
    copyToClipboard
} from '../utils/helpers.js';

class BookmarkManager {
    constructor() {
        this.initialized = false;
    }

    /**
     * Initialize the bookmark manager
     */
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

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Listen for state changes
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

    /**
     * Add a new bookmark
     */
    async addBookmark(bookmarkData) {
        try {
            // Validate input data
            const validatedData = this.validateBookmarkData(bookmarkData);
            if (!validatedData.isValid) {
                notificationService.warning(validatedData.message);
                return false;
            }

            // Create bookmark object
            const bookmark = {
                id: generateId(),
                title: sanitizeString(bookmarkData.title),
                url: bookmarkData.url,
                category: sanitizeString(bookmarkData.category) || 'General',
                tags: validateTags(bookmarkData.tags),
                color: bookmarkData.color || '#ffffff',
                icon: bookmarkData.icon || getFaviconUrl(bookmarkData.url),
                reminderDays: bookmarkData.reminderDays || null,
                type: bookmarkData.type || 'website',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                visits: 0,
                lastVisited: null
            };

            // Add to state
            const currentBookmarks = stateManager.getState().bookmarks;
            const updatedBookmarks = [...currentBookmarks, bookmark];
            stateManager.setState({ bookmarks: updatedBookmarks });

            // Update categories
            this.updateCategories();

            // Save to storage
            await stateManager.saveToStorage();

            notificationService.success(`Bookmark "${bookmark.title}" added successfully`);
            return bookmark;

        } catch (error) {
            console.error('Error adding bookmark:', error);
            notificationService.error('Failed to add bookmark');
            return false;
        }
    }

    /**
     * Update an existing bookmark
     */
    async updateBookmark(bookmarkId, updateData) {
        try {
            const currentBookmarks = stateManager.getState().bookmarks;
            const bookmarkIndex = currentBookmarks.findIndex(b => b.id === bookmarkId);
            
            if (bookmarkIndex === -1) {
                notificationService.warning('Bookmark not found');
                return false;
            }

            // Validate update data
            const validatedData = this.validateBookmarkData(updateData, false);
            if (!validatedData.isValid) {
                notificationService.warning(validatedData.message);
                return false;
            }

            // Update bookmark
            const updatedBookmarks = [...currentBookmarks];
            const existingBookmark = updatedBookmarks[bookmarkIndex];
            
            updatedBookmarks[bookmarkIndex] = {
                ...existingBookmark,
                title: sanitizeString(updateData.title) || existingBookmark.title,
                url: updateData.url || existingBookmark.url,
                category: sanitizeString(updateData.category) || existingBookmark.category,
                tags: updateData.tags !== undefined ? validateTags(updateData.tags) : existingBookmark.tags,
                color: updateData.color || existingBookmark.color,
                icon: updateData.icon || existingBookmark.icon,
                reminderDays: updateData.reminderDays !== undefined ? updateData.reminderDays : existingBookmark.reminderDays,
                type: updateData.type || existingBookmark.type,
                updatedAt: new Date().toISOString()
            };

            stateManager.setState({ bookmarks: updatedBookmarks });
            this.updateCategories();
            await stateManager.saveToStorage();

            notificationService.success('Bookmark updated successfully');
            return updatedBookmarks[bookmarkIndex];

        } catch (error) {
            console.error('Error updating bookmark:', error);
            notificationService.error('Failed to update bookmark');
            return false;
        }
    }

    /**
     * Delete a bookmark
     */
    async deleteBookmark(bookmarkId) {
        try {
            const currentBookmarks = stateManager.getState().bookmarks;
            const bookmark = currentBookmarks.find(b => b.id === bookmarkId);
            
            if (!bookmark) {
                notificationService.warning('Bookmark not found');
                return false;
            }

            const updatedBookmarks = currentBookmarks.filter(b => b.id !== bookmarkId);
            stateManager.setState({ bookmarks: updatedBookmarks });
            
            this.updateCategories();
            await stateManager.saveToStorage();

            notificationService.success(`Bookmark "${bookmark.title}" deleted`);
            return true;

        } catch (error) {
            console.error('Error deleting bookmark:', error);
            notificationService.error('Failed to delete bookmark');
            return false;
        }
    }

    /**
     * Track bookmark visit
     */
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

    /**
     * Launch a bookmark
     */
    async launchBookmark(bookmarkId) {
        try {
            const bookmark = this.getBookmark(bookmarkId);
            if (!bookmark) {
                notificationService.warning('Bookmark not found');
                return;
            }

            // Track the visit
            await this.trackVisit(bookmarkId);

            // Launch based on type
            if (bookmark.type === 'program' && window.electronAPI) {
                try {
                    await window.electronAPI.launchApp(bookmark.url);
                    notificationService.success(`Launched ${bookmark.title}`);
                } catch (error) {
                    console.error('Error launching application:', error);
                    notificationService.error(`Failed to launch ${bookmark.title}`);
                }
            } else {
                // Open website
                window.open(bookmark.url, '_blank');
            }

        } catch (error) {
            console.error('Error launching bookmark:', error);
            notificationService.error('Failed to launch bookmark');
        }
    }

    /**
     * Get a single bookmark by ID
     */
    getBookmark(bookmarkId) {
        const bookmarks = stateManager.getState().bookmarks;
        return bookmarks.find(b => b.id === bookmarkId);
    }

    /**
     * Get filtered and sorted bookmarks
     */
    getFilteredBookmarks() {
        const state = stateManager.getState();
        let bookmarks = [...state.bookmarks];

        // Apply category filter
        if (state.currentCategory && state.currentCategory !== 'all') {
            bookmarks = bookmarks.filter(b => 
                b.category.toLowerCase() === state.currentCategory.toLowerCase()
            );
        }

        // Apply search filter
        if (state.searchTerm) {
            const searchTerm = state.searchTerm.toLowerCase();
            bookmarks = bookmarks.filter(b =>
                b.title.toLowerCase().includes(searchTerm) ||
                b.url.toLowerCase().includes(searchTerm) ||
                b.category.toLowerCase().includes(searchTerm) ||
                b.tags.some(tag => tag.toLowerCase().includes(searchTerm))
            );
        }

        // Apply advanced filters
        if (state.searchCategory && state.searchCategory !== 'all') {
            bookmarks = bookmarks.filter(b =>
                b.category.toLowerCase() === state.searchCategory.toLowerCase()
            );
        }

        if (state.searchTags && state.searchTags.length > 0) {
            bookmarks = bookmarks.filter(b =>
                state.searchTags.some(tag =>
                    b.tags.some(bookmarkTag =>
                        bookmarkTag.toLowerCase().includes(tag.toLowerCase())
                    )
                )
            );
        }

        // Sort bookmarks
        return this.sortBookmarks(bookmarks);
    }

    /**
     * Sort bookmarks based on current sort settings
     */
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
                case 'reminder-date':
                    const aReminder = this.calculateReminderDate(a);
                    const bReminder = this.calculateReminderDate(b);
                    comparison = aReminder - bReminder;
                    break;
                default:
                    comparison = 0;
            }

            return sortOrder === 'desc' ? -comparison : comparison;
        });

        return sorted;
    }

    /**
     * Calculate reminder date for a bookmark
     */
    calculateReminderDate(bookmark) {
        if (!bookmark.reminderDays) return Infinity;
        
        const createdDate = new Date(bookmark.createdAt);
        const reminderDate = new Date(createdDate.getTime() + (bookmark.reminderDays * 24 * 60 * 60 * 1000));
        return reminderDate.getTime();
    }

    /**
     * Validate bookmark data
     */
    validateBookmarkData(data, requireAll = true) {
        const errors = [];

        if (requireAll || data.title !== undefined) {
            if (!validateTitle(data.title)) {
                errors.push('Title is required and must be valid');
            }
        }

        if (requireAll || data.url !== undefined) {
            if (!validateUrl(data.url)) {
                errors.push('URL is required and must be valid');
            }
        }

        if (data.category !== undefined && data.category && !validateCategory(data.category)) {
            errors.push('Category must be valid if provided');
        }

        if (data.reminderDays !== undefined && data.reminderDays !== null) {
            const days = parseInt(data.reminderDays);
            if (isNaN(days) || days < 1 || days > 365) {
                errors.push('Reminder days must be between 1 and 365');
            }
        }

        return {
            isValid: errors.length === 0,
            message: errors.join(', ')
        };
    }

    /**
     * Update categories list
     */
    updateCategories() {
        const bookmarks = stateManager.getState().bookmarks;
        const categories = [...new Set(bookmarks.map(b => b.category))].sort();
        stateManager.setState({ categories });
    }

    /**
     * Render bookmarks to the UI
     */
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

    /**
     * Render empty state
     */
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

    /**
     * Create a bookmark element
     */
    createBookmarkElement(bookmark) {
        const { viewMode } = stateManager.getState();
        const element = document.createElement('div');
        element.className = `bookmark-item ${bookmark.type}-bookmark`;
        element.dataset.id = bookmark.id;
        element.dataset.category = bookmark.category;

        if (viewMode === 'list') {
            element.innerHTML = this.getListViewHTML(bookmark);
        } else {
            element.innerHTML = this.getGridViewHTML(bookmark);
        }

        this.attachBookmarkEvents(element, bookmark);
        return element;
    }

    /**
     * Get grid view HTML for a bookmark
     */
    getGridViewHTML(bookmark) {
        return `
            <div class="bookmark-icon">
                <img src="${bookmark.icon}" alt="${bookmark.title}" 
                     onerror="this.src='${getFaviconUrl(bookmark.url)}'">
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
    }

    /**
     * Get list view HTML for a bookmark
     */
    getListViewHTML(bookmark) {
        return `
            <div class="bookmark-icon">
                <img src="${bookmark.icon}" alt="${bookmark.title}"
                     onerror="this.src='${getFaviconUrl(bookmark.url)}'">
            </div>
            <div class="bookmark-info">
                <div class="bookmark-title">${bookmark.title}</div>
                <div class="bookmark-url">${bookmark.url}</div>
                <div class="bookmark-meta">
                    <span class="bookmark-category">${bookmark.category}</span>
                    ${bookmark.tags.length > 0 ? `<span class="bookmark-tags">${bookmark.tags.join(', ')}</span>` : ''}
                    <span class="bookmark-date">Added ${formatRelativeTime(bookmark.createdAt)}</span>
                    ${bookmark.visits ? `<span class="bookmark-visits">${bookmark.visits} visits</span>` : ''}
                </div>
            </div>
            <div class="bookmark-actions">
                <button class="edit-bookmark" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="copy-bookmark" title="Copy Link">
                    <i class="fas fa-copy"></i>
                </button>
                <button class="share-bookmark" title="Share">
                    <i class="fas fa-share-alt"></i>
                </button>
                <button class="delete-bookmark" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
    }

    /**
     * Attach event listeners to bookmark element
     */
    attachBookmarkEvents(element, bookmark) {
        // Main click to launch
        element.addEventListener('click', (e) => {
            if (e.target.closest('.bookmark-actions')) return;
            this.launchBookmark(bookmark.id);
        });

        // Menu toggle
        const menuBtn = element.querySelector('.bookmark-menu-btn');
        const menu = element.querySelector('.bookmark-actions-menu');
        
        if (menuBtn && menu) {
            menuBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleBookmarkMenu(element);
            });
        }

        // Action buttons
        const editBtn = element.querySelector('.edit-bookmark');
        const copyBtn = element.querySelector('.copy-bookmark');
        const shareBtn = element.querySelector('.share-bookmark');
        const deleteBtn = element.querySelector('.delete-bookmark');

        if (editBtn) {
            editBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.showEditModal(bookmark);
            });
        }

        if (copyBtn) {
            copyBtn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const success = await copyToClipboard(bookmark.url);
                if (success) {
                    notificationService.success('Link copied to clipboard');
                } else {
                    notificationService.error('Failed to copy link');
                }
            });
        }

        if (shareBtn) {
            shareBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.shareBookmark(bookmark);
            });
        }

        if (deleteBtn) {
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.confirmDelete(bookmark);
            });
        }
    }

    /**
     * Toggle bookmark menu
     */
    toggleBookmarkMenu(element) {
        // Close all other menus first
        document.querySelectorAll('.bookmark-actions-menu.show').forEach(menu => {
            if (!element.contains(menu)) {
                menu.classList.remove('show');
            }
        });

        const menu = element.querySelector('.bookmark-actions-menu');
        if (menu) {
            menu.classList.toggle('show');
        }
    }

    /**
     * Show edit modal for bookmark
     */
    showEditModal(bookmark) {
        stateManager.dispatch('show-edit-modal', bookmark);
    }

    /**
     * Share bookmark
     */
    async shareBookmark(bookmark) {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: bookmark.title,
                    url: bookmark.url
                });
            } catch (error) {
                // User cancelled or error occurred
                this.fallbackShare(bookmark);
            }
        } else {
            this.fallbackShare(bookmark);
        }
    }

    /**
     * Fallback share method
     */
    async fallbackShare(bookmark) {
        const shareText = `${bookmark.title} - ${bookmark.url}`;
        const success = await copyToClipboard(shareText);
        
        if (success) {
            notificationService.success('Bookmark link copied to clipboard');
        } else {
            notificationService.error('Failed to share bookmark');
        }
    }

    /**
     * Confirm bookmark deletion
     */
    confirmDelete(bookmark) {
        const confirmed = confirm(`Are you sure you want to delete "${bookmark.title}"?`);
        if (confirmed) {
            this.deleteBookmark(bookmark.id);
        }
    }

    /**
     * Update categories UI
     */
    updateCategoriesUI() {
        const categoryFilters = document.getElementById('category-filters');
        const mobileFilters = document.getElementById('mobile-category-filters');
        const searchCategory = document.getElementById('search-category');
        
        if (!categoryFilters) return;

        const { categories, currentCategory } = stateManager.getState();

        // Update filter buttons
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

        // Update search select
        if (searchCategory) {
            const currentValue = searchCategory.value;
            searchCategory.innerHTML = '<option value="all">All</option>';
            
            categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category;
                option.textContent = category;
                searchCategory.appendChild(option);
            });
            
            searchCategory.value = currentValue;
        }
    }

    /**
     * Export bookmarks
     */
    exportBookmarks(format = 'json') {
        const bookmarks = stateManager.getState().bookmarks;
        
        if (format === 'json') {
            return JSON.stringify(bookmarks, null, 2);
        } else if (format === 'csv') {
            return this.convertToCSV(bookmarks);
        }
        
        return null;
    }

    /**
     * Convert bookmarks to CSV format
     */
    convertToCSV(bookmarks) {
        const headers = ['Title', 'URL', 'Category', 'Tags', 'Type', 'Created', 'Visits'];
        const rows = bookmarks.map(bookmark => [
            bookmark.title,
            bookmark.url,
            bookmark.category,
            bookmark.tags.join('; '),
            bookmark.type,
            formatDate(bookmark.createdAt),
            bookmark.visits || 0
        ]);

        const csvContent = [headers, ...rows]
            .map(row => row.map(field => `"${field}"`).join(','))
            .join('\n');

        return csvContent;
    }

    /**
     * Import bookmarks
     */
    async importBookmarks(data, format = 'json') {
        try {
            let bookmarksToImport = [];

            if (format === 'json') {
                bookmarksToImport = JSON.parse(data);
            } else if (format === 'html') {
                bookmarksToImport = this.parseBookmarksHTML(data);
            }

            if (!Array.isArray(bookmarksToImport)) {
                throw new Error('Invalid import format');
            }

            const currentBookmarks = stateManager.getState().bookmarks;
            const newBookmarks = [];

            for (const bookmarkData of bookmarksToImport) {
                const bookmark = {
                    id: generateId(),
                    title: sanitizeString(bookmarkData.title || bookmarkData.name || 'Imported Bookmark'),
                    url: bookmarkData.url || bookmarkData.href || '',
                    category: sanitizeString(bookmarkData.category || 'Imported'),
                    tags: validateTags(bookmarkData.tags || []),
                    color: bookmarkData.color || '#ffffff',
                    icon: bookmarkData.icon || getFaviconUrl(bookmarkData.url),
                    reminderDays: bookmarkData.reminderDays || null,
                    type: bookmarkData.type || 'website',
                    createdAt: bookmarkData.createdAt || new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    visits: bookmarkData.visits || 0,
                    lastVisited: bookmarkData.lastVisited || null
                };

                if (validateUrl(bookmark.url)) {
                    newBookmarks.push(bookmark);
                }
            }

            const allBookmarks = [...currentBookmarks, ...newBookmarks];
            stateManager.setState({ bookmarks: allBookmarks });
            
            this.updateCategories();
            await stateManager.saveToStorage();

            notificationService.success(`Imported ${newBookmarks.length} bookmarks successfully`);
            return newBookmarks.length;

        } catch (error) {
            console.error('Error importing bookmarks:', error);
            notificationService.error('Failed to import bookmarks');
            return 0;
        }
    }

    /**
     * Parse HTML bookmark file
     */
    parseBookmarksHTML(htmlContent) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlContent, 'text/html');
        const links = doc.querySelectorAll('a[href]');
        
        return Array.from(links).map(link => ({
            title: link.textContent.trim(),
            url: link.href,
            category: 'Imported'
        }));
    }
}

// Create singleton instance
const bookmarkManager = new BookmarkManager();

export default bookmarkManager;
export { BookmarkManager };