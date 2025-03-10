// Define sortBookmarks function at the very top
function sortBookmarks(bookmarks) {
    switch (state.sortBy) {
        case 'newest':
            return bookmarks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        case 'oldest':
            return bookmarks.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        case 'alphabetical':
            return bookmarks.sort((a, b) => a.title.localeCompare(b.title));
        case 'most-visited':
            return bookmarks.sort((a, b) => (b.visits || 0) - (a.visits || 0));
        default:
            return bookmarks;
    }
}

// Define updateGridColumns function
function updateGridColumns() {
    elements.bookmarkGrid.style.gridTemplateColumns = `repeat(${state.gridColumns}, 1fr)`;
    if (elements.gridColumnsValue) {
        elements.gridColumnsValue.textContent = state.gridColumns;
    }
}

// Handle grid size change from the range input
function handleGridSizeChange(e) {
    state.gridColumns = parseInt(e.target.value, 10);
    elements.gridColumnsValue.textContent = state.gridColumns;
    updateGridColumns();
    saveToLocalStorage();
}

// App State
const state = {
    bookmarks: [],
    categories: [],
    gridColumns: 4,
    isDarkMode: false,
    searchTerm: '',
    currentCategory: 'all',
    animationsEnabled: true,
    searchCategory: 'all',
    searchTags: [],
    sortBy: 'newest',
    viewMode: 'grid' // Add new viewMode state property
};

// DOM Elements
const elements = {
    bookmarkGrid: document.getElementById('bookmark-grid'),
    adminPanel: document.getElementById('admin-panel'),
    themeToggle: document.getElementById('theme-toggle'),
    gridSizeToggle: document.getElementById('grid-size-toggle'),
    adminToggle: document.getElementById('admin-toggle'),
    closeAdmin: document.getElementById('close-admin'),
    addBookmarkForm: document.getElementById('add-bookmark-form'),
    bookmarksList: document.getElementById('bookmarks-list'),
    gridColumnsInput: document.getElementById('grid-columns'),
    gridColumnsValue: document.getElementById('grid-columns-value'),
    backupBtn: document.getElementById('backup-btn'),
    restoreBtn: document.getElementById('restore-btn'),
    restoreFile: document.getElementById('restore-file'),
    bookmarkTemplate: document.getElementById('bookmark-template'),
    categoryFilters: document.getElementById('category-filters'),
    searchInput: document.getElementById('search-bookmarks'),
    searchClear: document.getElementById('search-clear'),
    categoryInput: document.getElementById('bookmark-category'),
    categoriesList: document.getElementById('categories-list'),
    addCategoryBtn: document.getElementById('add-category-btn'),
    newCategoryInput: document.getElementById('new-category'),
    categoriesContainer: document.getElementById('categories-container'),
    animationToggle: document.getElementById('animation-toggle')
};

// DOM Elements for authentication
const authElements = {
    loginToggle: document.getElementById('login-toggle'),
    loginModal: document.getElementById('login-modal'),
    loginForm: document.getElementById('login-form'),
    cancelLogin: document.getElementById('cancel-login'),
    profileSection: document.getElementById('profile-section'),
    profileUsername: document.getElementById('profile-username'),
    logoutBtn: document.getElementById('logout-btn')
};

// DOM Elements for import/export
const importExportElements = {
    importBtn: document.getElementById('import-btn'),
    importFile: document.getElementById('import-file'),
    exportBtn: document.getElementById('export-btn')
};

// DOM Elements for theme editor
const themeEditorElements = {
    themeEditorForm: document.getElementById('theme-editor-form'),
    themeBgPrimary: document.getElementById('theme-bg-primary'),
    themeBgSecondary: document.getElementById('theme-bg-secondary'),
    themeTextPrimary: document.getElementById('theme-text-primary'),
    themeTextSecondary: document.getElementById('theme-text-secondary'),
    themeAccentColor: document.getElementById('theme-accent-color')
};

// DOM Elements for advanced search and sorting
const advancedSearchElements = {
    searchCategory: document.getElementById('search-category'),
    searchTags: document.getElementById('search-tags'),
    sortBookmarks: document.getElementById('sort-bookmarks')
};

// DOM Elements for notifications
const notificationElements = {
    notificationsContainer: document.getElementById('notifications-container')
};

// DOM Elements for service integration
const integrationElements = {
    pocketBtn: document.getElementById('pocket-btn'),
    instapaperBtn: document.getElementById('instapaper-btn'),
    evernoteBtn: document.getElementById('evernote-btn')
};

// Initialize the application
function init() {
    loadFromLocalStorage();
    renderBookmarks();
    setupEventListeners();
    updateCategoriesUI();
    toggleAnimations(state.animationsEnabled);
    checkAuthentication();
    applyCustomTheme();
    checkReminders();
}

// Event Listeners
function setupEventListeners() {
    // Theme Toggle
    elements.themeToggle.addEventListener('click', toggleTheme);

    // Grid Size Toggle Quick Adjustment
    elements.gridSizeToggle.addEventListener('click', cycleGridSize);

    // Admin Panel Toggle
    elements.adminToggle.addEventListener('click', toggleAdminPanel);
    elements.closeAdmin.addEventListener('click', toggleAdminPanel);

    // Add Bookmark Form
    elements.addBookmarkForm.addEventListener('submit', handleAddBookmark);

    // Grid Columns Input
    elements.gridColumnsInput.addEventListener('input', handleGridSizeChange);

    // Backup and Restore
    elements.backupBtn.addEventListener('click', backupBookmarks);
    elements.restoreBtn.addEventListener('click', () => elements.restoreFile.click());
    elements.restoreFile.addEventListener('change', restoreBookmarks);

    // Bookmark Clicks (Event Delegation)
    elements.bookmarkGrid.addEventListener('click', handleBookmarkClick);
    
    // Search functionality
    elements.searchInput.addEventListener('input', handleSearch);
    elements.searchClear.addEventListener('click', clearSearch);
    
    // Category filter clicks (Event Delegation)
    elements.categoryFilters.addEventListener('click', handleCategoryFilter);
    
    // Add new category
    elements.addCategoryBtn.addEventListener('click', handleAddCategory);
    elements.newCategoryInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddCategory();
        }
    });
    
    // Categories container (Event Delegation for delete)
    elements.categoriesContainer.addEventListener('click', handleCategoryDelete);
    
    // Animation toggle
    elements.animationToggle.addEventListener('change', function() {
        toggleAnimations(this.checked);
    });

    // Authentication event listeners
    authElements.loginToggle.addEventListener('click', toggleLoginModal);
    authElements.cancelLogin.addEventListener('click', toggleLoginModal);
    authElements.loginForm.addEventListener('submit', handleLogin);
    authElements.logoutBtn.addEventListener('click', handleLogout);

    // Import/Export event listeners
    importExportElements.importBtn.addEventListener('click', () => importExportElements.importFile.click());
    importExportElements.importFile.addEventListener('change', handleImportBookmarks);
    importExportElements.exportBtn.addEventListener('click', handleExportBookmarks);

    // Theme editor event listener
    themeEditorElements.themeEditorForm.addEventListener('submit', handleSaveTheme);

    // Advanced search and sorting event listeners
    advancedSearchElements.searchCategory.addEventListener('change', handleAdvancedSearch);
    advancedSearchElements.searchTags.addEventListener('input', handleAdvancedSearch);
    advancedSearchElements.sortBookmarks.addEventListener('change', handleSortBookmarks);

    // Service integration event listeners
    integrationElements.pocketBtn.addEventListener('click', importFromPocket);
    integrationElements.instapaperBtn.addEventListener('click', importFromInstapaper);
    integrationElements.evernoteBtn.addEventListener('click', importFromEvernote);

    // Add view toggle event listener
    document.getElementById('view-toggle').addEventListener('click', toggleViewMode);
}

// Handle Search
function handleSearch(e) {
    state.searchTerm = e.target.value.toLowerCase().trim();
    
    // Show/hide clear button
    if (state.searchTerm) {
        elements.searchClear.classList.remove('hidden');
    } else {
        elements.searchClear.classList.add('hidden');
    }
    
    renderBookmarks();
}

// Clear search
function clearSearch() {
    state.searchTerm = '';
    elements.searchInput.value = '';
    elements.searchClear.classList.add('hidden');
    renderBookmarks();
}

// Handle category filter click
function handleCategoryFilter(e) {
    const categoryBtn = e.target.closest('.category-filter');
    if (!categoryBtn) return;
    
    // Remove active class from all category filters
    document.querySelectorAll('.category-filter').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Add active class to clicked category
    categoryBtn.classList.add('active');
    
    // Update state
    state.currentCategory = categoryBtn.dataset.category;
    
    // Re-render bookmarks
    renderBookmarks();
}

// Add a new category
function handleAddCategory() {
    const categoryName = elements.newCategoryInput.value.trim();
    if (!categoryName) return;
    
    // Check if category already exists
    if (state.categories.includes(categoryName)) {
        alert(`Category "${categoryName}" already exists!`);
        return;
    }
    
    state.categories.push(categoryName);
    elements.newCategoryInput.value = '';
    
    updateCategoriesUI();
    saveToLocalStorage();
}

// Delete a category
function handleCategoryDelete(e) {
    const deleteBtn = e.target.closest('.delete-category');
    if (!deleteBtn) return;
    
    const categoryName = deleteBtn.dataset.category;
    if (confirm(`Are you sure you want to delete the category "${categoryName}"?`)) {
        // Remove category from state
        state.categories = state.categories.filter(cat => cat !== categoryName);
        
        // Update bookmarks that had this category
        state.bookmarks.forEach(bookmark => {
            if (bookmark.category === categoryName) {
                bookmark.category = '';
            }
        });
        
        updateCategoriesUI();
        renderBookmarks();
        renderBookmarksList();
        saveToLocalStorage();
    }
}

// Toggle animations
function toggleAnimations(enabled) {
    state.animationsEnabled = enabled;
    
    if (enabled) {
        document.body.classList.add('animations-enabled');
    } else {
        document.body.classList.remove('animations-enabled');
    }
    
    saveToLocalStorage();
}

// Update all UI elements related to categories
function updateCategoriesUI() {
    // Update category filters
    elements.categoryFilters.innerHTML = '<button class="category-filter active" data-category="all">All</button>';
    
    state.categories.forEach(category => {
        const categoryBtn = document.createElement('button');
        categoryBtn.className = 'category-filter';
        categoryBtn.dataset.category = category;
        categoryBtn.textContent = category;
        elements.categoryFilters.appendChild(categoryBtn);
    });
    
    // Update datalist for category input
    elements.categoriesList.innerHTML = '';
    state.categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        elements.categoriesList.appendChild(option);
    });
    
    // Update categories in admin panel
    elements.categoriesContainer.innerHTML = '';
    state.categories.forEach(category => {
        const categoryItem = document.createElement('div');
        categoryItem.className = 'category-item';
        categoryItem.innerHTML = `
            <span>${category}</span>
            <button class="delete-category" data-category="${category}">
                <i class="fas fa-times"></i>
            </button>
        `;
        elements.categoriesContainer.appendChild(categoryItem);
    });
    
    // If no active category is found, reset to "all"
    const activeCategory = document.querySelector(`.category-filter[data-category="${state.currentCategory}"]`);
    if (!activeCategory && state.currentCategory !== 'all') {
        state.currentCategory = 'all';
        document.querySelector('.category-filter[data-category="all"]').classList.add('active');
    }
}

// Handle Bookmark Grid Click Events (Event Delegation)
function handleBookmarkClick(e) {
    const bookmarkItem = e.target.closest('.bookmark-item');
    if (!bookmarkItem) return;

    // Handle edit button click
    if (e.target.closest('.edit-bookmark')) {
        const bookmarkId = bookmarkItem.dataset.id;
        editBookmark(bookmarkId);
        return;
    }

    // Handle delete button click
    if (e.target.closest('.delete-bookmark')) {
        const bookmarkId = bookmarkItem.dataset.id;
        if (confirm('Are you sure you want to delete this bookmark?')) {
            deleteBookmark(bookmarkId);
        }
        return;
    }

    // Handle share button click
    if (e.target.closest('.share-bookmark')) {
        const bookmarkId = bookmarkItem.dataset.id;
        shareBookmark(bookmarkId);
        return;
    }

    // If not clicking on an action button, navigate to the bookmark URL
    if (!e.target.closest('.bookmark-actions')) {
        const bookmarkId = bookmarkItem.dataset.id;
        const bookmark = state.bookmarks.find(b => b.id === bookmarkId);
        if (bookmark) {
            window.open(bookmark.url, '_blank');
            trackBookmarkVisit(bookmarkId);
        }
    }
}

// Share a bookmark
function shareBookmark(bookmarkId) {
    const bookmark = state.bookmarks.find(b => b.id === bookmarkId);
    if (!bookmark) return;

    const shareUrl = `${window.location.origin}${window.location.pathname}?bookmark=${encodeURIComponent(bookmarkId)}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
        alert('Bookmark link copied to clipboard!');
    }).catch(err => {
        console.error('Failed to copy bookmark link: ', err);
    });
}

// Toggle Dark/Light Theme
function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    state.isDarkMode = document.body.classList.contains('dark-mode');
    
    // Update icon
    const themeIcon = elements.themeToggle.querySelector('i');
    if (state.isDarkMode) {
        themeIcon.className = 'fas fa-sun';
    } else {
        themeIcon.className = 'fas fa-moon';
    }
    
    saveToLocalStorage();
    applyCustomTheme(); // Reapply custom theme to ensure changes are reflected in both modes
}

// Cycle through grid sizes quickly (3, 4, 5, 6 columns)
function cycleGridSize() {
    const gridSizes = [3, 4, 5, 6];
    let currentIndex = gridSizes.indexOf(state.gridColumns);
    currentIndex = (currentIndex + 1) % gridSizes.length;
    state.gridColumns = gridSizes[currentIndex];
    
    updateGridColumns();
    elements.gridColumnsInput.value = state.gridColumns;
    elements.gridColumnsValue.textContent = state.gridColumns;
    
    saveToLocalStorage();
}

// Toggle Admin Panel
function toggleAdminPanel() {
    elements.adminPanel.classList.toggle('hidden');
    if (!elements.adminPanel.classList.contains('hidden')) {
        // Refresh the bookmarks list in admin panel when opened
        renderBookmarksList();
        populateThemeEditorForm();
    }
}

// Populate theme editor form with current theme values
function populateThemeEditorForm() {
    const customTheme = JSON.parse(localStorage.getItem('customTheme'));
    if (customTheme) {
        themeEditorElements.themeBgPrimary.value = customTheme['--bg-primary'] || '#f8f9fa';
        themeEditorElements.themeBgSecondary.value = customTheme['--bg-secondary'] || '#ffffff';
        themeEditorElements.themeTextPrimary.value = customTheme['--text-primary'] || '#333333';
        themeEditorElements.themeTextSecondary.value = customTheme['--text-secondary'] || '#666666';
        themeEditorElements.themeAccentColor.value = customTheme['--accent-color'] || '#4a6da7';
    } else {
        // Set default values if no custom theme is found
        themeEditorElements.themeBgPrimary.value = '#f8f9fa';
        themeEditorElements.themeBgSecondary.value = '#ffffff';
        themeEditorElements.themeTextPrimary.value = '#333333';
        themeEditorElements.themeTextSecondary.value = '#666666';
        themeEditorElements.themeAccentColor.value = '#4a6da7';
    }
}

// Handle adding a new bookmark
function handleAddBookmark(e) {
    e.preventDefault();
    
    const title = document.getElementById('bookmark-title').value.trim();
    const url = document.getElementById('bookmark-url').value.trim();
    const icon = document.getElementById('bookmark-icon').value.trim() || getFaviconUrl(url);
    const color = document.getElementById('bookmark-color').value;
    const category = document.getElementById('bookmark-category').value.trim();
    const tags = document.getElementById('bookmark-tags').value.split(',').map(tag => tag.trim()).filter(tag => tag);
    const reminderDays = parseInt(document.getElementById('bookmark-reminder').value, 10);

    // Add category to categories list if it doesn't exist
    if (category && !state.categories.includes(category)) {
        state.categories.push(category);
        updateCategoriesUI();
    }
    
    addBookmark({
        title,
        url,
        icon,
        color,
        category,
        tags,
        reminderDays
    });
    
    // Reset form
    e.target.reset();
    document.getElementById('bookmark-color').value = '#ffffff';
}

// Add a new bookmark with enhanced favicon handling
function addBookmark(bookmarkData) {
    const faviconData = bookmarkData.icon || getFaviconUrl(bookmarkData.url);
    
    const newBookmark = {
        id: generateId(),
        title: bookmarkData.title,
        url: bookmarkData.url,
        // If icon is a string, use it directly, otherwise use primary from getFaviconUrl
        icon: typeof bookmarkData.icon === 'string' ? bookmarkData.icon : faviconData.primary,
        iconFallbacks: typeof bookmarkData.icon === 'object' ? faviconData.fallbacks : [],
        color: bookmarkData.color,
        category: bookmarkData.category || '',
        tags: bookmarkData.tags || [],
        reminderDays: bookmarkData.reminderDays || null,
        createdAt: new Date().toISOString(),
        lastVisited: null
    };
    
    state.bookmarks.push(newBookmark);
    saveToLocalStorage();
    renderBookmarks();
    renderBookmarksList();
}

// Edit a bookmark
function editBookmark(bookmarkId) {
    const bookmarkIndex = state.bookmarks.findIndex(b => b.id === bookmarkId);
    if (bookmarkIndex === -1) return;
    
    const bookmark = state.bookmarks[bookmarkIndex];
    
    // Create a simple modal for editing
    const modal = document.createElement('div');
    modal.className = 'edit-modal';
    modal.innerHTML = `
        <div class="edit-modal-content">
            <h3>Edit Bookmark</h3>
            <form id="edit-bookmark-form">
                <div class="form-group">
                    <label for="edit-title">Title:</label>
                    <input type="text" id="edit-title" value="${bookmark.title}" required>
                </div>
                <div class="form-group">
                    <label for="edit-url">URL:</label>
                    <input type="url" id="edit-url" value="${bookmark.url}" required>
                </div>
                <div class="form-group">
                    <label for="edit-icon">Icon URL:</label>
                    <input type="url" id="edit-icon" value="${bookmark.icon}">
                </div>
                <div class="form-group">
                    <label for="edit-category">Category:</label>
                    <input type="text" id="edit-category" list="edit-categories-list" value="${bookmark.category || ''}">
                    <datalist id="edit-categories-list">
                        ${state.categories.map(cat => `<option value="${cat}">`).join('')}
                    </datalist>
                </div>
                <div class="form-group">
                    <label for="edit-color">Background Color:</label>
                    <input type="color" id="edit-color" value="${bookmark.color}">
                </div>
                <div class="form-group">
                    <label for="edit-tags">Tags:</label>
                    <input type="text" id="edit-tags" value="${bookmark.tags.join(', ')}" placeholder="Enter tags separated by commas">
                </div>
                <div class="form-group">
                    <label for="edit-reminder">Reminder (in days):</label>
                    <input type="number" id="edit-reminder" value="${bookmark.reminderDays || ''}" min="1" placeholder="Enter number of days">
                </div>
                <div class="edit-actions">
                    <button type="button" id="cancel-edit" class="btn">Cancel</button>
                    <button type="submit" class="btn btn-primary">Save</button>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add event listeners
    document.getElementById('cancel-edit').addEventListener('click', () => {
        modal.remove();
    });
    
    document.getElementById('edit-bookmark-form').addEventListener('submit', (e) => {
        e.preventDefault();
        
        const category = document.getElementById('edit-category').value.trim();
        const tags = document.getElementById('edit-tags').value.split(',').map(tag => tag.trim()).filter(tag => tag);
        const reminderDays = parseInt(document.getElementById('edit-reminder').value, 10);
        
        // Add category if it doesn't exist
        if (category && !state.categories.includes(category)) {
            state.categories.push(category);
            updateCategoriesUI();
        }
        
        state.bookmarks[bookmarkIndex] = {
            ...bookmark,
            title: document.getElementById('edit-title').value.trim(),
            url: document.getElementById('edit-url').value.trim(),
            icon: document.getElementById('edit-icon').value.trim() || getFaviconUrl(document.getElementById('edit-url').value.trim()),
            color: document.getElementById('edit-color').value,
            category: category,
            tags: tags,
            reminderDays: reminderDays || null
        };
        
        saveToLocalStorage();
        renderBookmarks();
        renderBookmarksList();
        modal.remove();
    });
    
    // Add modal styles if not already present
    if (!document.getElementById('modal-styles')) {
        const modalStyles = document.createElement('style');
        modalStyles.id = 'modal-styles';
        modalStyles.textContent = `
            .edit-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 2000;
            }
            .edit-modal-content {
                background-color: var(--bg-secondary);
                padding: 20px;
                border-radius: 8px;
                width: 90%;
                max-width: 500px;
            }
            .edit-actions {
                display: flex;
                justify-content: space-between;
                margin-top: 20px;
            }
        `;
        document.head.appendChild(modalStyles);
    }
    
    // Toggle admin panel for better UX when editing
    if (!elements.adminPanel.classList.contains('hidden')) {
        toggleAdminPanel();
    }
}

// Check reminders and notify user
function checkReminders() {
    const now = new Date();
    const notifications = [];

    state.bookmarks.forEach(bookmark => {
        if (bookmark.reminderDays && bookmark.lastVisited) {
            const lastVisitedDate = new Date(bookmark.lastVisited);
            const reminderDate = new Date(lastVisitedDate);
            reminderDate.setDate(reminderDate.getDate() + bookmark.reminderDays);

            if (now >= reminderDate) {
                notifications.push(`Reminder: Visit "${bookmark.title}"`);
            }
        }
    });

    if (notifications.length > 0) {
        notificationElements.notificationsContainer.innerHTML = '<ul>' + notifications.map(notification => `<li>${notification}</li>`).join('') + '</ul>';
    } else {
        notificationElements.notificationsContainer.innerHTML = '<p>No notifications</p>';
    }
}

// Track bookmark visit
function trackBookmarkVisit(bookmarkId) {
    const bookmark = state.bookmarks.find(b => b.id === bookmarkId);
    if (!bookmark) return;

    if (!bookmark.visits) {
        bookmark.visits = 0;
    }
    bookmark.visits += 1;
    bookmark.lastVisited = new Date().toISOString();

    saveToLocalStorage();
    updateAnalytics();
}

// Update analytics display in the admin panel
function updateAnalytics() {
    const mostVisitedEl = document.getElementById('most-visited-list');
    const trendsEl = document.getElementById('bookmark-trends-list');
    
    if (!mostVisitedEl || !trendsEl) return;
    
    // Sort bookmarks by visits
    const sortedByVisits = [...state.bookmarks]
        .filter(b => b.visits && b.visits > 0)
        .sort((a, b) => (b.visits || 0) - (a.visits || 0))
        .slice(0, 5); // Top 5
    
    // Display most visited bookmarks
    mostVisitedEl.innerHTML = '';
    if (sortedByVisits.length === 0) {
        mostVisitedEl.innerHTML = '<li>No visit data available yet</li>';
    } else {
        sortedByVisits.forEach(bookmark => {
            const li = document.createElement('li');
            li.innerHTML = `${bookmark.title} - ${bookmark.visits} visits`;
            mostVisitedEl.appendChild(li);
        });
    }
    
    // Calculate category distribution
    const categoryStats = {};
    state.bookmarks.forEach(bookmark => {
        const category = bookmark.category || 'Uncategorized';
        if (!categoryStats[category]) {
            categoryStats[category] = 0;
        }
        categoryStats[category]++;
    });
    
    // Display category trends
    trendsEl.innerHTML = '';
    Object.entries(categoryStats)
        .sort((a, b) => b[1] - a[1])
        .forEach(([category, count]) => {
            const li = document.createElement('li');
            li.innerHTML = `${category}: ${count} bookmarks`;
            trendsEl.appendChild(li);
        });
}

// Backup bookmarks to JSON file
function backupBookmarks() {
    const data = JSON.stringify({
        bookmarks: state.bookmarks,
        categories: state.categories,
        gridColumns: state.gridColumns,
        isDarkMode: state.isDarkMode,
        animationsEnabled: state.animationsEnabled
    }, null, 2);
    
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bookmarks_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    
    // Clean up
    setTimeout(() => {
        URL.revokeObjectURL(url);
    }, 100);
}

// Restore bookmarks from JSON file
function restoreBookmarks(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(event) {
        try {
            const data = JSON.parse(event.target.result);
            
            // Validate data structure
            if (Array.isArray(data.bookmarks)) {
                state.bookmarks = data.bookmarks;
                
                if (Array.isArray(data.categories)) {
                    state.categories = data.categories;
                }
                
                if (typeof data.gridColumns === 'number') {
                    state.gridColumns = data.gridColumns;
                    elements.gridColumnsInput.value = state.gridColumns;
                    elements.gridColumnsValue.textContent = state.gridColumns;
                }
                
                if (typeof data.isDarkMode === 'boolean') {
                    state.isDarkMode = data.isDarkMode;
                    document.body.classList.toggle('dark-mode', state.isDarkMode);
                    
                    const themeIcon = elements.themeToggle.querySelector('i');
                    themeIcon.className = state.isDarkMode ? 'fas fa-sun' : 'fas fa-moon';
                }
                
                if (typeof data.animationsEnabled === 'boolean') {
                    toggleAnimations(data.animationsEnabled);
                    elements.animationToggle.checked = data.animationsEnabled;
                }
                
                updateCategoriesUI();
                saveToLocalStorage();
                renderBookmarks();
                renderBookmarksList();
                alert('Bookmarks restored successfully!');
            } else {
                throw new Error('Invalid backup format');
            }
        } catch (error) {
            alert('Failed to restore bookmarks: ' + error.message);
        }
    };
    reader.readAsText(file);
    
    // Reset file input
    e.target.value = '';
}

// Handle import bookmarks
function handleImportBookmarks(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(event) {
        try {
            const data = JSON.parse(event.target.result);
            if (Array.isArray(data.bookmarks)) {
                state.bookmarks = data.bookmarks;
                saveToLocalStorage();
                renderBookmarks();
                renderBookmarksList();
                alert('Bookmarks imported successfully!');
            } else {
                throw new Error('Invalid import format');
            }
        } catch (error) {
            alert('Failed to import bookmarks: ' + error.message);
        }
    };
    reader.readAsText(file);

    // Reset file input
    e.target.value = '';
}

// Handle export bookmarks
function handleExportBookmarks() {
    const exportFormat = prompt('Export format (json or csv):', 'json');
    
    if (exportFormat.toLowerCase() === 'csv') {
        exportBookmarksToCSV();
    } else {
        exportBookmarksToJSON();
    }
}

// Export bookmarks to JSON
function exportBookmarksToJSON() {
    const data = JSON.stringify({
        bookmarks: state.bookmarks,
        categories: state.categories,
        gridColumns: state.gridColumns,
        isDarkMode: state.isDarkMode,
        animationsEnabled: state.animationsEnabled
    }, null, 2);

    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bookmarks_export_${new Date().toISOString().split('T')[0]}.json`;
    a.click();

    // Clean up
    setTimeout(() => {
        URL.revokeObjectURL(url);
    }, 100);
}

// Export bookmarks to CSV
function exportBookmarksToCSV() {
    // CSV headers
    const csvRows = ['Title,URL,Category,Tags,Created At'];
    
    // Add bookmark data
    state.bookmarks.forEach(bookmark => {
        const tags = bookmark.tags ? bookmark.tags.join(';') : '';
        // Escape commas in fields
        const escapedTitle = bookmark.title ? `"${bookmark.title.replace(/"/g, '""')}"` : '';
        const escapedUrl = bookmark.url ? `"${bookmark.url.replace(/"/g, '""')}"` : '';
        const escapedCategory = bookmark.category ? `"${bookmark.category.replace(/"/g, '""')}"` : '';
        const escapedTags = tags ? `"${tags.replace(/"/g, '""')}"` : '';
        
        csvRows.push(`${escapedTitle},${escapedUrl},${escapedCategory},${escapedTags},${bookmark.createdAt}`);
    });
    
    // Combine rows into CSV content
    const csvContent = csvRows.join('\n');
    
    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bookmarks_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    
    // Clean up
    setTimeout(() => {
        URL.revokeObjectURL(url);
    }, 100);
}

// Render all bookmarks
function renderBookmarks() {
    elements.bookmarkGrid.innerHTML = '';
    
    let filteredBookmarks = filterBookmarks(state.bookmarks);
    filteredBookmarks = sortBookmarks(filteredBookmarks);
    
    if (filteredBookmarks.length === 0) {
        const emptyMessage = document.createElement('div');
        emptyMessage.className = 'empty-message';
        
        if (state.bookmarks.length === 0) {
            emptyMessage.innerHTML = `
                <i class="fas fa-bookmark" style="font-size: 48px; color: var(--accent-color); margin-bottom: 15px;"></i>
                <h3>No bookmarks yet</h3>
                <p>Click the gear icon to add your first bookmark</p>
            `;
        } else {
            emptyMessage.innerHTML = `
                <i class="fas fa-search" style="font-size: 48px; color: var(--accent-color); margin-bottom: 15px;"></i>
                <h3>No matching bookmarks</h3>
                <p>Try changing your search or category filter</p>
            `;
        }
        
        elements.bookmarkGrid.appendChild(emptyMessage);
        
        // Add styles for empty message if not already present
        if (!document.getElementById('empty-message-styles')) {
            const emptyStyles = document.createElement('style');
            emptyStyles.id = 'empty-message-styles';
            emptyStyles.textContent = `
                .empty-message {
                    grid-column: 1 / -1;
                    text-align: center;
                    padding: 50px;
                    color: var(--text-secondary);
                }
            `;
            document.head.appendChild(emptyStyles);
        }
        
        return;
    }
    
    const templateId = state.viewMode === 'list' ? 'bookmark-list-template' : 'bookmark-template';
    const templateElement = document.getElementById(templateId);
    
    filteredBookmarks.forEach(bookmark => {
        const clone = document.importNode(templateElement.content, true);
        const bookmarkItem = clone.querySelector('.bookmark-item');
        
        bookmarkItem.dataset.id = bookmark.id;
        bookmarkItem.style.backgroundColor = bookmark.color;
        
        // Adjust text color based on background color brightness
        const brightness = getBrightness(bookmark.color);
        if (brightness < 128) {
            bookmarkItem.style.color = '#ffffff';
        }
        
        const iconImg = clone.querySelector('.bookmark-icon img');
        iconImg.src = bookmark.icon;
        iconImg.alt = bookmark.title;
        
        clone.querySelector('.bookmark-title').textContent = bookmark.title;
        
        // Add URL display in list view
        if (state.viewMode === 'list' && clone.querySelector('.bookmark-url')) {
            const urlDisplay = clone.querySelector('.bookmark-url');
            urlDisplay.textContent = bookmark.url;
            urlDisplay.style.fontSize = '0.8rem';
            urlDisplay.style.color = 'var(--text-secondary)';
        }
        
        // Add category if present
        const categoryEl = clone.querySelector('.bookmark-category');
        if (bookmark.category) {
            categoryEl.textContent = bookmark.category;
        } else {
            categoryEl.style.display = 'none';
        }
        
        // Add tags if present
        if (bookmark.tags && bookmark.tags.length > 0) {
            const tagsEl = document.createElement('div');
            tagsEl.className = 'bookmark-tags';
            tagsEl.textContent = `Tags: ${bookmark.tags.join(', ')}`;
            bookmarkItem.appendChild(tagsEl);
        }
        
        elements.bookmarkGrid.appendChild(clone);
    });
    
    updateGridColumns();
}

// Render bookmarks list in admin panel
function renderBookmarksList() {
    elements.bookmarksList.innerHTML = '';
    
    if (state.bookmarks.length === 0) {
        elements.bookmarksList.innerHTML = '<p>No bookmarks yet.</p>';
        return;
    }
    
    state.bookmarks.forEach(bookmark => {
        const item = document.createElement('div');
        item.className = 'bookmark-list-item';
        item.innerHTML = `
            <div class="bookmark-list-title">
                <img src="${bookmark.icon}" alt="${bookmark.title}">
                <span>${bookmark.title}</span>
                ${bookmark.category ? `<small class="bookmark-category">${bookmark.category}</small>` : ''}
            </div>
            <div class="bookmark-list-actions">
                <button class="edit-btn" data-id="${bookmark.id}">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="delete-btn" data-id="${bookmark.id}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        elements.bookmarksList.appendChild(item);
        
        // Add event listeners
        item.querySelector('.edit-btn').addEventListener('click', () => {
            editBookmark(bookmark.id);
        });
        
        item.querySelector('.delete-btn').addEventListener('click', () => {
            if (confirm('Are you sure you want to delete this bookmark?')) {
                deleteBookmark(bookmark.id);
            }
        });
    });
}

// Get favicon URL from domain with enhanced fallbacks
function getFaviconUrl(url) {
    try {
        const domain = new URL(url).hostname;
        
        // Try multiple potential favicon sources
        return {
            url: url,
            // Primary: Google's favicon service
            primary: `https://www.google.com/s2/favicons?domain=${domain}&sz=64`,
            // Fallbacks in case the primary source fails
            fallbacks: [
                `https://${domain}/favicon.ico`,
                `https://${domain}/favicon.png`,
                `https://${domain}/apple-touch-icon.png`,
                `https://${domain}/apple-touch-icon-precomposed.png`
            ]
        };
    } catch (e) {
        return {
            url: 'https://example.com',
            primary: 'https://www.google.com/s2/favicons?domain=example.com&sz=64',
            fallbacks: []
        };
    }
}

// Generate a unique ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

// Calculate color brightness (0-255)
function getBrightness(hexColor) {
    // Convert hex to RGB
    const r = parseInt(hexColor.substr(1, 2), 16);
    const g = parseInt(hexColor.substr(3, 2), 16);
    const b = parseInt(hexColor.substr(5, 2), 16);
    
    // Calculate brightness using relative luminance formula
    return (r * 299 + g * 587 + b * 114) / 1000;
}

// Save state to localStorage
function saveToLocalStorage() {
    localStorage.setItem('bookmarkManager', JSON.stringify({
        bookmarks: state.bookmarks,
        categories: state.categories,
        gridColumns: state.gridColumns,
        isDarkMode: state.isDarkMode,
        animationsEnabled: state.animationsEnabled,
        viewMode: state.viewMode
    }));
}

// Load state from localStorage
function loadFromLocalStorage() {
    const savedData = localStorage.getItem('bookmarkManager');
    if (savedData) {
        try {
            const parsedData = JSON.parse(savedData);
            
            if (Array.isArray(parsedData.bookmarks)) {
                state.bookmarks = parsedData.bookmarks;
            }
            
            if (Array.isArray(parsedData.categories)) {
                state.categories = parsedData.categories;
            }
            
            if (typeof parsedData.gridColumns === 'number') {
                state.gridColumns = parsedData.gridColumns;
                elements.gridColumnsInput.value = state.gridColumns;
                elements.gridColumnsValue.textContent = state.gridColumns;
            }
            
            if (typeof parsedData.isDarkMode === 'boolean') {
                state.isDarkMode = parsedData.isDarkMode;
                document.body.classList.toggle('dark-mode', state.isDarkMode);
                
                const themeIcon = elements.themeToggle.querySelector('i');
                themeIcon.className = state.isDarkMode ? 'fas fa-sun' : 'fas fa-moon';
            }
            
            if (typeof parsedData.animationsEnabled === 'boolean') {
                state.animationsEnabled = parsedData.animationsEnabled;
                if (elements.animationToggle) {
                    elements.animationToggle.checked = parsedData.animationsEnabled;
                }
            }

            if (typeof parsedData.viewMode === 'string') {
                state.viewMode = parsedData.viewMode;
                // Apply the saved view mode
                if (state.viewMode === 'list') {
                    document.getElementById('bookmark-grid').classList.add('list-view');
                    const viewToggleIcon = document.getElementById('view-toggle').querySelector('i');
                    viewToggleIcon.className = 'fas fa-list';
                }
            }
        } catch (error) {
            console.error('Error loading saved data:', error);
        }
    }
}

// Add some demo bookmarks if none exist
function addDemoBookmarksIfEmpty() {
    if (state.bookmarks.length === 0) {
        const demoCategories = ['Work', 'Social', 'Shopping', 'Entertainment'];
        demoCategories.forEach(category => {
            if (!state.categories.includes(category)) {
                state.categories.push(category);
            }
        });
        
        const demoBookmarks = [
            {
                title: "Google",
                url: "https://www.google.com",
                icon: "https://www.google.com/s2/favicons?domain=google.com&sz=64",
                color: "#ffffff",
                category: "Work"
            },
            {
                title: "YouTube",
                url: "https://www.youtube.com",
                icon: "https://www.google.com/s2/favicons?domain=youtube.com&sz=64",
                color: "#ff0000",
                category: "Entertainment"
            },
            {
                title: "GitHub",
                url: "https://github.com",
                icon: "https://www.google.com/s2/favicons?domain=github.com&sz=64",
                color: "#161b22",
                category: "Work"
            },
            {
                title: "Reddit",
                url: "https://www.reddit.com",
                icon: "https://www.google.com/s2/favicons?domain=reddit.com&sz=64",
                color: "#ff4500",
                category: "Social"
            },
            {
                title: "Amazon",
                url: "https://www.amazon.com",
                icon: "https://www.google.com/s2/favicons?domain=amazon.com&sz=64",
                color: "#232f3e",
                category: "Shopping"
            },
            {
                title: "Twitter",
                url: "https://twitter.com",
                icon: "https://www.google.com/s2/favicons?domain=twitter.com&sz=64",
                color: "#1da1f2",
                category: "Social"
            },
            {
                title: "Netflix",
                url: "https://www.netflix.com",
                icon: "https://www.google.com/s2/favicons?domain=netflix.com&sz=64",
                color: "#e50914",
                category: "Entertainment"
            },
            {
                title: "Stack Overflow",
                url: "https://stackoverflow.com",
                icon: "https://www.google.com/s2/favicons?domain=stackoverflow.com&sz=64",
                color: "#f48024",
                category: "Work"
            }
        ];
        
        demoBookmarks.forEach(bookmark => addBookmark(bookmark));
        updateCategoriesUI();
    }
}

// Add a keyboard shortcut for searching
document.addEventListener('keydown', (e) => {
    // Skip shortcuts if we're in an input or textarea
    const isInInput = document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA';
    
    // Ctrl/Cmd + F or just '/' when not in an input field
    if (((e.ctrlKey || e.metaKey) && e.key === 'f') || 
        (e.key === '/' && !isInInput)) {
        e.preventDefault();
        elements.searchInput.focus();
    }
    
    // Esc key to close admin panel and other modals
    if (e.key === 'Escape') {
        if (!elements.adminPanel.classList.contains('hidden')) {
            toggleAdminPanel();
        }
        
        // Close any other modals that might be open
        document.querySelectorAll('.edit-modal, .keyboard-shortcuts, .login-modal, .quick-add-modal').forEach(modal => {
            if (!modal.classList.contains('hidden')) {
                modal.classList.add('hidden');
            }
        });
    }
    
    // ? key to show keyboard shortcuts help
    if (e.key === '?' && !isInInput) {
        const keyboardShortcuts = document.getElementById('keyboard-shortcuts');
        keyboardShortcuts.classList.toggle('hidden');
        
        // Add event listener to close button if not already added
        const closeBtn = document.getElementById('close-shortcuts');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                keyboardShortcuts.classList.add('hidden');
            });
        }
    }
    
    // 'A' key to toggle admin panel
    if (e.key === 'a' && !isInInput) {
        toggleAdminPanel();
    }
    
    // 'T' key to toggle dark/light mode
    if (e.key === 't' && !isInInput) {
        toggleTheme();
    }
    
    // 'G' key to cycle grid size
    if (e.key === 'g' && !isInInput) {
        cycleGridSize();
    }
});

// Toggle login modal
function toggleLoginModal() {
    authElements.loginModal.classList.toggle('hidden');
}

// Handle login
function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();

    // Simple authentication check (in a real app, use a backend service)
    if (username === 'admin' && password === 'password') {
        localStorage.setItem('authenticatedUser', username);
        checkAuthentication();
        toggleLoginModal();
    } else {
        alert('Invalid username or password');
    }
}

// Handle logout
function handleLogout() {
    localStorage.removeItem('authenticatedUser');
    checkAuthentication();
}

// Check authentication status
function checkAuthentication() {
    const authenticatedUser = localStorage.getItem('authenticatedUser');
    if (authenticatedUser) {
        authElements.profileSection.classList.remove('hidden');
        authElements.profileUsername.textContent = authenticatedUser;
        authElements.loginToggle.classList.add('hidden');
    } else {
        authElements.profileSection.classList.add('hidden');
        authElements.loginToggle.classList.remove('hidden');
    }
}

// Load shared bookmark from URL
function loadSharedBookmark() {
    const urlParams = new URLSearchParams(window.location.search);
    
    // Handle shared bookmark
    const bookmarkId = urlParams.get('bookmark');
    if (bookmarkId) {
        const bookmark = state.bookmarks.find(b => b.id === bookmarkId);
        if (bookmark) {
            alert(`Shared Bookmark:\n\nTitle: ${bookmark.title}\nURL: ${bookmark.url}`);
        } else {
            alert('Bookmark not found.');
        }
    }
    
    // Handle bookmarklet add action
    const action = urlParams.get('action');
    if (action === 'add') {
        const url = urlParams.get('url');
        const title = urlParams.get('title');
        
        if (url && title) {
            // Pre-fill the add bookmark form
            document.getElementById('bookmark-title').value = title;
            document.getElementById('bookmark-url').value = url;
            
            // Show admin panel
            if (elements.adminPanel.classList.contains('hidden')) {
                toggleAdminPanel();
            }
        }
    }
}

// Handle save theme
function handleSaveTheme(e) {
    e.preventDefault();

    const customTheme = {
        '--bg-primary': themeEditorElements.themeBgPrimary.value,
        '--bg-secondary': themeEditorElements.themeBgSecondary.value,
        '--text-primary': themeEditorElements.themeTextPrimary.value,
        '--text-secondary': themeEditorElements.themeTextSecondary.value,
        '--accent-color': themeEditorElements.themeAccentColor.value
    };

    localStorage.setItem('customTheme', JSON.stringify(customTheme));
    applyCustomTheme();
}

// Apply custom theme
function applyCustomTheme() {
    const customTheme = JSON.parse(localStorage.getItem('customTheme'));
    if (customTheme) {
        for (const [key, value] of Object.entries(customTheme)) {
            document.documentElement.style.setProperty(key, value);
        }
        // Update theme editor inputs with current values
        themeEditorElements.themeBgPrimary.value = customTheme['--bg-primary'];
        themeEditorElements.themeBgSecondary.value = customTheme['--bg-secondary'];
        themeEditorElements.themeTextPrimary.value = customTheme['--text-primary'];
        themeEditorElements.themeTextSecondary.value = customTheme['--text-secondary'];
        themeEditorElements.themeAccentColor.value = customTheme['--accent-color'];
    }
}

// Register service worker for offline support
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./service-worker.js')
            .then(registration => {
                console.log('ServiceWorker registration successful with scope: ', registration.scope);
            })
            .catch(error => {
                console.log('ServiceWorker registration failed: ', error);
            });
    });
}

// Handle advanced search
function handleAdvancedSearch() {
    state.searchCategory = advancedSearchElements.searchCategory.value;
    state.searchTags = advancedSearchElements.searchTags.value.split(',').map(tag => tag.trim()).filter(tag => tag);
    renderBookmarks();
}

// Handle sort bookmarks
function handleSortBookmarks() {
    state.sortBy = advancedSearchElements.sortBookmarks.value;
    renderBookmarks();
}

// Filter bookmarks based on search, category, and tags
function filterBookmarks(bookmarks) {
    return bookmarks.filter(bookmark => {
        // Search filter
        const matchesSearch = state.searchTerm ? 
            bookmark.title.toLowerCase().includes(state.searchTerm) || 
            bookmark.url.toLowerCase().includes(state.searchTerm) ||
            (bookmark.category && bookmark.category.toLowerCase().includes(state.searchTerm)) ||
            (bookmark.tags && bookmark.tags.some(tag => tag.toLowerCase().includes(state.searchTerm))) :
            true;
        
        // Category filter
        const matchesCategory = state.searchCategory === 'all' ? 
            true : 
            bookmark.category === state.searchCategory;
        
        // Tags filter
        const matchesTags = state.searchTags.length === 0 ? 
            true : 
            state.searchTags.every(tag => bookmark.tags.includes(tag));
        
        return matchesSearch && matchesCategory && matchesTags;
    });
}

// Import bookmarks from Pocket
function importFromPocket() {
    // Example API call to Pocket (replace with actual API call)
    fetch('https://getpocket.com/v3/get', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Accept': 'application/json'
        },
        body: JSON.stringify({
            consumer_key: 'YOUR_POCKET_CONSUMER_KEY',
            access_token: 'YOUR_POCKET_ACCESS_TOKEN'
        })
    })
    .then(response => response.json())
    .then(data => {
        const bookmarks = data.list.map(item => ({
            title: item.resolved_title || item.given_title,
            url: item.resolved_url || item.given_url,
            icon: getFaviconUrl(item.resolved_url || item.given_url),
            color: '#ffffff',
            category: 'Pocket',
            tags: item.tags ? Object.keys(item.tags) : [],
            createdAt: new Date().toISOString()
        }));
        bookmarks.forEach(bookmark => addBookmark(bookmark));
        alert('Bookmarks imported from Pocket successfully!');
    })
    .catch(error => {
        console.error('Error importing from Pocket:', error);
        alert('Failed to import bookmarks from Pocket.');
    });
}

// Import bookmarks from Instapaper
function importFromInstapaper() {
    // Example API call to Instapaper (replace with actual API call)
    fetch('https://www.instapaper.com/api/1/bookmarks/list', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + btoa('YOUR_INSTAPAPER_USERNAME:YOUR_INSTAPAPER_PASSWORD')
        },
        body: 'folder_id=unread'
    })
    .then(response => response.json())
    .then(data => {
        const bookmarks = data.map(item => ({
            title: item.title,
            url: item.url,
            icon: getFaviconUrl(item.url),
            color: '#ffffff',
            category: 'Instapaper',
            tags: item.tags || [],
            createdAt: new Date().toISOString()
        }));
        bookmarks.forEach(bookmark => addBookmark(bookmark));
        alert('Bookmarks imported from Instapaper successfully!');
    })
    .catch(error => {
        console.error('Error importing from Instapaper:', error);
        alert('Failed to import bookmarks from Instapaper.');
    });
}

// Import bookmarks from Evernote
function importFromEvernote() {
    // Example API call to Evernote (replace with actual API call)
    fetch('https://api.evernote.com/v1/notes', {
        method: 'GET',
        headers: {
            'Authorization': 'Bearer YOUR_EVERNOTE_ACCESS_TOKEN'
        }
    })
    .then(response => response.json())
    .then(data => {
        const bookmarks = data.notes.map(note => ({
            title: note.title,
            url: note.attributes.sourceURL,
            icon: getFaviconUrl(note.attributes.sourceURL),
            color: '#ffffff',
            category: 'Evernote',
            tags: note.tagNames || [],
            createdAt: new Date().toISOString()
        }));
        bookmarks.forEach(bookmark => addBookmark(bookmark));
        alert('Bookmarks imported from Evernote successfully!');
    })
    .catch(error => {
        console.error('Error importing from Evernote:', error);
        alert('Failed to import bookmarks from Evernote.');
    });
}

// Handle delete bookmark
function deleteBookmark(bookmarkId) {
    const bookmarkIndex = state.bookmarks.findIndex(b => b.id === bookmarkId);
    if (bookmarkIndex === -1) return;
    
    state.bookmarks.splice(bookmarkIndex, 1);
    saveToLocalStorage();
    renderBookmarks();
    renderBookmarksList();
    updateAnalytics();
}

// Toggle between grid and list view
function toggleViewMode() {
    state.viewMode = state.viewMode === 'grid' ? 'list' : 'grid';
    
    // Update the icon
    const viewToggleIcon = document.getElementById('view-toggle').querySelector('i');
    viewToggleIcon.className = state.viewMode === 'grid' ? 'fas fa-th' : 'fas fa-list';
    
    // Apply the view mode to the container
    const bookmarkGrid = document.getElementById('bookmark-grid');
    if (state.viewMode === 'list') {
        bookmarkGrid.classList.add('list-view');
    } else {
        bookmarkGrid.classList.remove('list-view');
    }
    
    // Save view mode preference in localStorage
    saveToLocalStorage();
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    init();
    addDemoBookmarksIfEmpty();
    loadSharedBookmark();
});