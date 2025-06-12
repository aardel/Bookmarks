/**
 * Application Core Module
 * Main orchestrator for the bookmark manager application
 */

import stateManager from './state-manager.js';
import bookmarkManager from './bookmark-manager.js';
import notificationService from '../services/notification-service.js';
import { debounce, isElectron } from '../utils/helpers.js';

class AppCore {
    constructor() {
        this.initialized = false;
        this.elements = {};
        this.eventHandlers = new Map();
    }

    /**
     * Initialize the application
     */
    async init() {
        if (this.initialized) return;

        try {
            console.log('Initializing Bookmark Manager...');
            
            // Show loading state
            this.showLoadingState();

            // Initialize core components
            await this.initializeComponents();
            
            // Cache DOM elements
            this.cacheElements();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Load and setup theme
            this.initializeTheme();
            
            // Setup Electron integration
            if (isElectron()) {
                this.setupElectronIntegration();
            }
            
            // Initialize bookmark manager
            await bookmarkManager.init();
            
            // Load demo data if empty
            this.loadDemoDataIfEmpty();
            
            // Hide loading state
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

    /**
     * Initialize core components
     */
    async initializeComponents() {
        // State manager is already initialized as singleton
        // Notification service is already initialized as singleton
        // Bookmark manager will be initialized separately
    }

    /**
     * Cache DOM elements
     */
    cacheElements() {
        this.elements = {
            // Main containers
            bookmarkGrid: document.getElementById('bookmark-grid'),
            adminPanel: document.getElementById('admin-panel'),
            
            // Header elements
            searchInput: document.getElementById('search-bookmarks'),
            searchClear: document.getElementById('search-clear'),
            themeToggle: document.getElementById('theme-toggle'),
            adminToggle: document.getElementById('admin-toggle'),
            viewToggle: document.getElementById('view-toggle'),
            gridSizeToggle: document.getElementById('grid-size-toggle'),
            
            // Forms
            addBookmarkForm: document.getElementById('add-bookmark-form'),
            
            // Category filters
            categoryFilters: document.getElementById('category-filters'),
            mobileCategoryFilters: document.getElementById('mobile-category-filters'),
            
            // Advanced search
            searchCategory: document.getElementById('search-category'),
            searchTags: document.getElementById('search-tags'),
            sortBookmarks: document.getElementById('sort-bookmarks'),
            sortOrderToggle: document.getElementById('sort-order-toggle'),
            
            // Mobile navigation
            mobileNavToggle: document.getElementById('mobile-nav-toggle'),
            mobileNav: document.getElementById('mobile-nav'),
            
            // View mode toggle
            bookmarksViewBtn: document.getElementById('bookmarks-view-btn'),
            launcherViewBtn: document.getElementById('launcher-view-btn'),
            bookmarksView: document.getElementById('bookmarks-view'),
            launcherView: document.getElementById('launcher-view'),
            
            // Admin panel elements
            closeAdmin: document.getElementById('close-admin'),
            adminTabs: document.querySelectorAll('.admin-tab'),
            adminTabContents: document.querySelectorAll('.admin-tab-content'),
            
            // Settings
            gridColumnsInput: document.getElementById('grid-columns'),
            gridColumnsValue: document.getElementById('grid-columns-value'),
            animationToggle: document.getElementById('animation-toggle'),
            
            // Theme editor
            themeEditorForm: document.getElementById('theme-editor-form'),
            
            // Import/Export
            importJsonBtn: document.getElementById('import-json-btn'),
            importJsonFile: document.getElementById('import-json-file'),
            importHtmlBtn: document.getElementById('import-html-btn'),
            importHtmlFile: document.getElementById('import-html-file'),
            exportJsonBtn: document.getElementById('export-json-btn'),
            exportCsvBtn: document.getElementById('export-csv-btn'),
            backupBtn: document.getElementById('backup-btn')
        };
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        this.setupSearchListeners();
        this.setupNavigationListeners();
        this.setupAdminPanelListeners();
        this.setupFormListeners();
        this.setupThemeListeners();
        this.setupImportExportListeners();
        this.setupKeyboardShortcuts();
        this.setupStateSubscriptions();
    }

    /**
     * Setup search functionality
     */
    setupSearchListeners() {
        if (this.elements.searchInput) {
            const debouncedSearch = debounce((value) => {
                stateManager.setState({ searchTerm: value });
                this.updateSearchClearVisibility();
            }, 300);

            this.elements.searchInput.addEventListener('input', (e) => {
                debouncedSearch(e.target.value);
            });

            this.elements.searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    this.clearSearch();
                }
            });
        }

        if (this.elements.searchClear) {
            this.elements.searchClear.addEventListener('click', () => {
                this.clearSearch();
            });
        }

        // Advanced search elements
        if (this.elements.searchCategory) {
            this.elements.searchCategory.addEventListener('change', (e) => {
                stateManager.setState({ searchCategory: e.target.value });
            });
        }

        if (this.elements.searchTags) {
            const debouncedTagsSearch = debounce((value) => {
                const tags = value.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
                stateManager.setState({ searchTags: tags });
            }, 300);

            this.elements.searchTags.addEventListener('input', (e) => {
                debouncedTagsSearch(e.target.value);
            });
        }

        if (this.elements.sortBookmarks) {
            this.elements.sortBookmarks.addEventListener('change', (e) => {
                stateManager.setState({ sortBy: e.target.value });
            });
        }

        if (this.elements.sortOrderToggle) {
            this.elements.sortOrderToggle.addEventListener('click', () => {
                const currentOrder = stateManager.getState().sortOrder;
                const newOrder = currentOrder === 'asc' ? 'desc' : 'asc';
                stateManager.setState({ sortOrder: newOrder });
                this.updateSortOrderIcon();
            });
        }
    }

    /**
     * Setup navigation listeners
     */
    setupNavigationListeners() {
        // Mobile navigation toggle
        if (this.elements.mobileNavToggle && this.elements.mobileNav) {
            this.elements.mobileNavToggle.addEventListener('click', () => {
                this.elements.mobileNav.classList.toggle('hidden');
            });
        }

        // Category filters
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

        // View mode toggle
        if (this.elements.bookmarksViewBtn) {
            this.elements.bookmarksViewBtn.addEventListener('click', () => {
                this.switchToView('bookmarks');
            });
        }

        if (this.elements.launcherViewBtn) {
            this.elements.launcherViewBtn.addEventListener('click', () => {
                this.switchToView('launcher');
            });
        }

        // Header controls
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

        if (this.elements.viewToggle) {
            this.elements.viewToggle.addEventListener('click', () => {
                this.toggleViewMode();
            });
        }

        if (this.elements.gridSizeToggle) {
            this.elements.gridSizeToggle.addEventListener('click', () => {
                this.cycleGridSize();
            });
        }
    }

    /**
     * Setup admin panel listeners
     */
    setupAdminPanelListeners() {
        // Close admin panel
        if (this.elements.closeAdmin) {
            this.elements.closeAdmin.addEventListener('click', () => {
                this.toggleAdminPanel();
            });
        }

        // Admin tabs
        this.elements.adminTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                this.switchAdminTab(tab.dataset.tab);
            });
        });

        // Settings
        if (this.elements.gridColumnsInput) {
            this.elements.gridColumnsInput.addEventListener('input', (e) => {
                const value = parseInt(e.target.value);
                stateManager.setState({ gridColumns: value });
                this.updateGridColumns();
            });
        }

        if (this.elements.animationToggle) {
            this.elements.animationToggle.addEventListener('change', (e) => {
                stateManager.setState({ animationsEnabled: e.target.checked });
                this.updateAnimations();
            });
        }
    }

    /**
     * Setup form listeners
     */
    setupFormListeners() {
        if (this.elements.addBookmarkForm) {
            this.elements.addBookmarkForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleAddBookmark(e);
            });
        }
    }

    /**
     * Setup theme listeners
     */
    setupThemeListeners() {
        if (this.elements.themeEditorForm) {
            this.elements.themeEditorForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleSaveTheme(e);
            });
        }

        // Theme presets
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.applyThemePreset(btn.dataset.theme);
            });
        });
    }

    /**
     * Setup import/export listeners
     */
    setupImportExportListeners() {
        // Import JSON
        if (this.elements.importJsonBtn && this.elements.importJsonFile) {
            this.elements.importJsonBtn.addEventListener('click', () => {
                this.elements.importJsonFile.click();
            });

            this.elements.importJsonFile.addEventListener('change', (e) => {
                this.handleImportFile(e, 'json');
            });
        }

        // Import HTML
        if (this.elements.importHtmlBtn && this.elements.importHtmlFile) {
            this.elements.importHtmlBtn.addEventListener('click', () => {
                this.elements.importHtmlFile.click();
            });

            this.elements.importHtmlFile.addEventListener('change', (e) => {
                this.handleImportFile(e, 'html');
            });
        }

        // Export buttons
        if (this.elements.exportJsonBtn) {
            this.elements.exportJsonBtn.addEventListener('click', () => {
                this.handleExportBookmarks('json');
            });
        }

        if (this.elements.exportCsvBtn) {
            this.elements.exportCsvBtn.addEventListener('click', () => {
                this.handleExportBookmarks('csv');
            });
        }

        if (this.elements.backupBtn) {
            this.elements.backupBtn.addEventListener('click', () => {
                this.handleBackup();
            });
        }
    }

    /**
     * Setup keyboard shortcuts
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Global shortcuts
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 'f':
                    case '/':
                        e.preventDefault();
                        if (this.elements.searchInput) {
                            this.elements.searchInput.focus();
                        }
                        break;
                    case 'n':
                        e.preventDefault();
                        this.toggleAdminPanel();
                        break;
                    case 't':
                        if (e.shiftKey) {
                            e.preventDefault();
                            this.toggleTheme();
                        }
                        break;
                }
            }

            // Escape key
            if (e.key === 'Escape') {
                this.handleEscapeKey();
            }

            // Admin panel shortcuts
            if (e.key === 'a' && !e.ctrlKey && !e.metaKey && !this.isInputFocused()) {
                this.toggleAdminPanel();
            }
        });
    }

    /**
     * Setup state subscriptions
     */
    setupStateSubscriptions() {
        stateManager.subscribe('isDarkMode', (isDark) => {
            this.updateThemeIcon(isDark);
        });

        stateManager.subscribe('viewMode', (mode) => {
            this.updateViewModeIcon(mode);
        });

        stateManager.subscribe('gridColumns', () => {
            this.updateGridColumns();
        });

        stateManager.subscribe('animationsEnabled', (enabled) => {
            this.updateAnimations(enabled);
        });
    }

    /**
     * Setup Electron integration
     */
    setupElectronIntegration() {
        if (!window.electronAPI) return;

        // Menu event handlers
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

    /**
     * Event Handlers
     */
    async handleAddBookmark(e) {
        const formData = new FormData(e.target);
        const bookmarkData = {
            title: formData.get('title'),
            url: formData.get('url'),
            category: formData.get('category'),
            tags: formData.get('tags'),
            color: formData.get('color'),
            icon: formData.get('icon'),
            reminderDays: formData.get('reminderDays'),
            type: formData.get('type')
        };

        const result = await bookmarkManager.addBookmark(bookmarkData);
        if (result) {
            e.target.reset();
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

    toggleViewMode() {
        const currentMode = stateManager.getState().viewMode;
        const newMode = currentMode === 'grid' ? 'list' : 'grid';
        stateManager.setState({ viewMode: newMode });
        bookmarkManager.renderBookmarks();
        stateManager.saveToStorage();
    }

    cycleGridSize() {
        const currentColumns = stateManager.getState().gridColumns;
        const newColumns = currentColumns >= 8 ? 2 : currentColumns + 1;
        stateManager.setState({ gridColumns: newColumns });
        this.updateGridColumns();
        stateManager.saveToStorage();
    }

    switchToView(viewType) {
        // Update view mode buttons
        this.elements.bookmarksViewBtn?.classList.toggle('active', viewType === 'bookmarks');
        this.elements.launcherViewBtn?.classList.toggle('active', viewType === 'launcher');

        // Show/hide views
        this.elements.bookmarksView?.classList.toggle('active', viewType === 'bookmarks');
        this.elements.bookmarksView?.classList.toggle('hidden', viewType !== 'bookmarks');
        this.elements.launcherView?.classList.toggle('active', viewType === 'launcher');
        this.elements.launcherView?.classList.toggle('hidden', viewType === 'launcher');
    }

    switchAdminTab(tabName) {
        // Update tab buttons
        this.elements.adminTabs.forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });

        // Update tab contents
        this.elements.adminTabContents.forEach(content => {
            content.classList.toggle('active', content.id === tabName);
        });
    }

    async handleImportFile(e, format) {
        const file = e.target.files[0];
        if (!file) return;

        try {
            const content = await file.text();
            const count = await bookmarkManager.importBookmarks(content, format);
            
            if (count > 0) {
                notificationService.success(`Successfully imported ${count} bookmarks`);
            }
        } catch (error) {
            console.error('Error importing file:', error);
            notificationService.error('Failed to import bookmarks');
        }

        // Reset file input
        e.target.value = '';
    }

    handleExportBookmarks(format) {
        try {
            const content = bookmarkManager.exportBookmarks(format);
            if (!content) {
                notificationService.warning('No bookmarks to export');
                return;
            }

            const filename = `bookmarks-${new Date().toISOString().split('T')[0]}.${format}`;
            const mimeType = format === 'json' ? 'application/json' : 'text/csv';
            
            this.downloadFile(filename, content, mimeType);
            notificationService.success(`Bookmarks exported as ${format.toUpperCase()}`);
        } catch (error) {
            console.error('Error exporting bookmarks:', error);
            notificationService.error('Failed to export bookmarks');
        }
    }

    handleBackup() {
        try {
            const state = stateManager.getState();
            const backup = {
                version: '1.0.0',
                timestamp: new Date().toISOString(),
                data: {
                    bookmarks: state.bookmarks,
                    categories: state.categories,
                    settings: {
                        gridColumns: state.gridColumns,
                        isDarkMode: state.isDarkMode,
                        animationsEnabled: state.animationsEnabled,
                        viewMode: state.viewMode,
                        sortBy: state.sortBy,
                        sortOrder: state.sortOrder
                    }
                }
            };

            const content = JSON.stringify(backup, null, 2);
            const filename = `bookmark-manager-backup-${new Date().toISOString().split('T')[0]}.json`;
            
            this.downloadFile(filename, content, 'application/json');
            notificationService.success('Backup created successfully');
        } catch (error) {
            console.error('Error creating backup:', error);
            notificationService.error('Failed to create backup');
        }
    }

    /**
     * UI Update Methods
     */
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

    updateSortOrderIcon() {
        if (this.elements.sortOrderToggle) {
            const icon = this.elements.sortOrderToggle.querySelector('i');
            const sortOrder = stateManager.getState().sortOrder;
            
            if (icon) {
                icon.className = sortOrder === 'asc' ? 'fas fa-sort-amount-up' : 'fas fa-sort-amount-down';
            }
        }
    }

    updateThemeIcon(isDark) {
        if (this.elements.themeToggle) {
            const icon = this.elements.themeToggle.querySelector('i');
            if (icon) {
                icon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
            }
        }
    }

    updateViewModeIcon(mode) {
        if (this.elements.viewToggle) {
            const icon = this.elements.viewToggle.querySelector('i');
            if (icon) {
                icon.className = mode === 'grid' ? 'fas fa-list' : 'fas fa-th';
            }
        }
    }

    updateGridColumns() {
        if (this.elements.bookmarkGrid) {
            const columns = stateManager.getState().gridColumns;
            this.elements.bookmarkGrid.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;
        }

        if (this.elements.gridColumnsValue) {
            this.elements.gridColumnsValue.textContent = stateManager.getState().gridColumns;
        }

        if (this.elements.gridColumnsInput) {
            this.elements.gridColumnsInput.value = stateManager.getState().gridColumns;
        }
    }

    updateAnimations(enabled = null) {
        const animationsEnabled = enabled !== null ? enabled : stateManager.getState().animationsEnabled;
        document.body.classList.toggle('animations-enabled', animationsEnabled);
        
        if (this.elements.animationToggle) {
            this.elements.animationToggle.checked = animationsEnabled;
        }
    }

    /**
     * Theme Methods
     */
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

    applyThemePreset(themeName) {
        const presets = {
            light: { isDarkMode: false },
            dark: { isDarkMode: true },
            blue: { isDarkMode: false }, // You can extend this with color customization
            custom: {} // Will be handled by theme editor
        };

        const preset = presets[themeName];
        if (preset) {
            stateManager.setState(preset);
            this.applyTheme(preset.isDarkMode);
            stateManager.saveToStorage();
        }
    }

    handleSaveTheme(e) {
        // This would handle custom theme saving
        // Implementation depends on theme editor requirements
        notificationService.success('Theme saved successfully');
    }

    /**
     * Utility Methods
     */
    showLoadingState() {
        // Show loading spinner or skeleton UI
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

    isInputFocused() {
        const activeElement = document.activeElement;
        return activeElement && (
            activeElement.tagName === 'INPUT' ||
            activeElement.tagName === 'TEXTAREA' ||
            activeElement.contentEditable === 'true'
        );
    }

    handleEscapeKey() {
        // Close admin panel if open
        if (this.elements.adminPanel && !this.elements.adminPanel.classList.contains('hidden')) {
            this.toggleAdminPanel();
            return;
        }

        // Clear search if there's a search term
        if (stateManager.getState().searchTerm) {
            this.clearSearch();
            return;
        }

        // Close any open bookmark menus
        document.querySelectorAll('.bookmark-actions-menu.show').forEach(menu => {
            menu.classList.remove('show');
        });
    }

    downloadFile(filename, content, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    }

    loadDemoDataIfEmpty() {
        const bookmarks = stateManager.getState().bookmarks;
        if (bookmarks.length === 0) {
            // Add some demo bookmarks
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
    }
}

// Create and export singleton instance
const appCore = new AppCore();

export default appCore;
export { AppCore };