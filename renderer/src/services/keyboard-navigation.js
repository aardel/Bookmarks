/**
 * Keyboard Navigation Service
 * Enhanced keyboard shortcuts and navigation
 */
class KeyboardNavigation {
    constructor(options = {}) {
        this.options = {
            enableVimMode: false,
            enableTabNavigation: true,
            enableSearchShortcuts: true,
            enableDebugMode: false,
            ...options
        };
        
        this.shortcuts = new Map();
        this.sequences = new Map();
        this.currentSequence = '';
        this.sequenceTimer = null;
        this.sequenceTimeout = 1000;
        
        this.focusedElement = null;
        this.focusHistory = [];
        this.maxFocusHistory = 10;
        
        this.navigationMode = 'normal'; // normal, insert, visual
        this.isEnabled = true;
        
        this.init();
    }

    init() {
        this.setupDefaultShortcuts();
        this.setupKeyListeners();
        this.setupFocusManagement();
        this.loadSettings();
    }

    setupDefaultShortcuts() {
        // Navigation shortcuts
        this.registerShortcut('/', () => this.focusSearch(), 'Focus search bar');
        this.registerShortcut('Escape', () => this.handleEscape(), 'Cancel/Close');
        this.registerShortcut('?', () => this.showHelpDialog(), 'Show keyboard shortcuts help');
        
        // Application shortcuts
        this.registerShortcut('ctrl+n', () => this.triggerNewBookmark(), 'New bookmark');
        this.registerShortcut('cmd+n', () => this.triggerNewBookmark(), 'New bookmark (Mac)');
        this.registerShortcut('ctrl+/', () => this.toggleAdminPanel(), 'Toggle admin panel');
        this.registerShortcut('cmd+/', () => this.toggleAdminPanel(), 'Toggle admin panel (Mac)');
        this.registerShortcut('ctrl+t', () => this.toggleTheme(), 'Toggle dark mode');
        this.registerShortcut('cmd+t', () => this.toggleTheme(), 'Toggle dark mode (Mac)');
        
        // View shortcuts
        this.registerShortcut('1', () => this.switchToView('bookmarks'), 'Switch to bookmarks view');
        this.registerShortcut('2', () => this.switchToView('launcher'), 'Switch to app launcher');
        this.registerShortcut('g', () => this.cycleGridSize(), 'Cycle grid size');
        this.registerShortcut('v', () => this.toggleViewMode(), 'Toggle grid/list view');
        
        // Navigation shortcuts
        this.registerShortcut('j', () => this.navigateDown(), 'Navigate down');
        this.registerShortcut('k', () => this.navigateUp(), 'Navigate up');
        this.registerShortcut('h', () => this.navigateLeft(), 'Navigate left');
        this.registerShortcut('l', () => this.navigateRight(), 'Navigate right');
        this.registerShortcut('Enter', () => this.activateSelected(), 'Activate selected item');
        this.registerShortcut('Space', () => this.toggleSelected(), 'Toggle selection');
        
        // Quick actions
        this.registerShortcut('a', () => this.toggleAdminPanel(), 'Admin panel');
        this.registerShortcut('s', () => this.focusSearch(), 'Search');
        this.registerShortcut('r', () => this.refreshView(), 'Refresh view');
        this.registerShortcut('b', () => this.goBack(), 'Go back');
        this.registerShortcut('f', () => this.goForward(), 'Go forward');
        
        // Advanced shortcuts
        this.registerShortcut('ctrl+shift+p', () => this.showCommandPalette(), 'Command palette');
        this.registerShortcut('cmd+shift+p', () => this.showCommandPalette(), 'Command palette (Mac)');
        this.registerShortcut('ctrl+k', () => this.showQuickJump(), 'Quick jump');
        this.registerShortcut('cmd+k', () => this.showQuickJump(), 'Quick jump (Mac)');
        
        // Sequences
        this.registerSequence('gg', () => this.goToTop(), 'Go to top');
        this.registerSequence('G', () => this.goToBottom(), 'Go to bottom');
        this.registerSequence('dd', () => this.deleteSelected(), 'Delete selected');
        this.registerSequence('yy', () => this.copySelected(), 'Copy selected');
        this.registerSequence('pp', () => this.pasteAtCursor(), 'Paste');
        
        // Vim-style shortcuts (if enabled)
        if (this.options.enableVimMode) {
            this.setupVimShortcuts();
        }
    }

    setupVimShortcuts() {
        // Vim navigation
        this.registerShortcut('w', () => this.jumpToNextWord(), 'Next word');
        this.registerShortcut('b', () => this.jumpToPrevWord(), 'Previous word');
        this.registerShortcut('e', () => this.jumpToEndOfWord(), 'End of word');
        this.registerShortcut('0', () => this.jumpToBeginning(), 'Beginning');
        this.registerShortcut('$', () => this.jumpToEnd(), 'End');
        
        // Vim editing
        this.registerShortcut('i', () => this.enterInsertMode(), 'Insert mode');
        this.registerShortcut('I', () => this.insertAtBeginning(), 'Insert at beginning');
        this.registerShortcut('a', () => this.appendAfterCursor(), 'Append after cursor');
        this.registerShortcut('A', () => this.appendAtEnd(), 'Append at end');
        this.registerShortcut('o', () => this.openLineBelow(), 'Open line below');
        this.registerShortcut('O', () => this.openLineAbove(), 'Open line above');
        
        // Vim visual mode
        this.registerShortcut('v', () => this.enterVisualMode(), 'Visual mode');
        this.registerShortcut('V', () => this.enterVisualLineMode(), 'Visual line mode');
        
        // Mode switching
        this.registerShortcut('Escape', () => this.enterNormalMode(), 'Normal mode');
    }

    setupKeyListeners() {
        document.addEventListener('keydown', this.handleKeydown.bind(this), true);
        document.addEventListener('keyup', this.handleKeyup.bind(this), true);
    }

    setupFocusManagement() {
        document.addEventListener('focusin', this.handleFocusIn.bind(this));
        document.addEventListener('focusout', this.handleFocusOut.bind(this));
    }

    handleKeydown(event) {
        if (!this.isEnabled) return;
        
        // Skip if user is typing in an input field (unless in normal mode)
        if (this.isTypingInInput(event.target) && this.navigationMode !== 'normal') {
            return;
        }
        
        const key = this.getKeyString(event);
        
        // Handle sequences first
        if (this.handleSequence(key, event)) {
            return;
        }
        
        // Handle single shortcuts
        if (this.handleShortcut(key, event)) {
            return;
        }
        
        // Handle navigation in normal mode
        if (this.navigationMode === 'normal' && this.handleNavigation(key, event)) {
            return;
        }
    }

    handleKeyup(event) {
        // Handle key release events if needed
    }

    handleFocusIn(event) {
        this.focusedElement = event.target;
        this.addToFocusHistory(event.target);
    }

    handleFocusOut(event) {
        // Track focus changes
    }

    getKeyString(event) {
        const parts = [];
        
        if (event.ctrlKey) parts.push('ctrl');
        if (event.metaKey) parts.push('cmd');
        if (event.altKey) parts.push('alt');
        if (event.shiftKey) parts.push('shift');
        
        let key = event.key.toLowerCase();
        
        // Special key mappings
        const keyMap = {
            ' ': 'space',
            'arrowup': 'up',
            'arrowdown': 'down',
            'arrowleft': 'left',
            'arrowright': 'right'
        };
        
        key = keyMap[key] || key;
        parts.push(key);
        
        return parts.join('+');
    }

    isTypingInInput(element) {
        const inputTypes = ['input', 'textarea', 'select'];
        const contentEditable = element.contentEditable === 'true';
        const isInput = inputTypes.includes(element.tagName.toLowerCase());
        
        return isInput || contentEditable;
    }

    handleSequence(key, event) {
        // Add to current sequence
        this.currentSequence += key;
        
        // Clear sequence timer
        if (this.sequenceTimer) {
            clearTimeout(this.sequenceTimer);
        }
        
        // Check for sequence matches
        for (const [sequence, action] of this.sequences) {
            if (sequence === this.currentSequence) {
                event.preventDefault();
                event.stopPropagation();
                this.currentSequence = '';
                action();
                return true;
            }
            
            // Check if current sequence is a prefix of any registered sequence
            if (sequence.startsWith(this.currentSequence)) {
                // Start timer to reset sequence
                this.sequenceTimer = setTimeout(() => {
                    this.currentSequence = '';
                }, this.sequenceTimeout);
                
                event.preventDefault();
                return true;
            }
        }
        
        // No match found, reset sequence
        this.currentSequence = '';
        return false;
    }

    handleShortcut(key, event) {
        const action = this.shortcuts.get(key);
        
        if (action) {
            event.preventDefault();
            event.stopPropagation();
            action();
            return true;
        }
        
        return false;
    }

    handleNavigation(key, event) {
        const navigationKeys = ['j', 'k', 'h', 'l', 'up', 'down', 'left', 'right'];
        
        if (navigationKeys.includes(key)) {
            event.preventDefault();
            return true;
        }
        
        return false;
    }

    // Shortcut registration
    registerShortcut(keys, action, description = '') {
        this.shortcuts.set(keys, action);
        
        if (description) {
            action.description = description;
        }
    }

    registerSequence(sequence, action, description = '') {
        this.sequences.set(sequence, action);
        
        if (description) {
            action.description = description;
        }
    }

    unregisterShortcut(keys) {
        this.shortcuts.delete(keys);
    }

    unregisterSequence(sequence) {
        this.sequences.delete(sequence);
    }

    // Focus management
    addToFocusHistory(element) {
        // Remove if already in history
        const index = this.focusHistory.indexOf(element);
        if (index > -1) {
            this.focusHistory.splice(index, 1);
        }
        
        // Add to beginning
        this.focusHistory.unshift(element);
        
        // Trim to max size
        if (this.focusHistory.length > this.maxFocusHistory) {
            this.focusHistory = this.focusHistory.slice(0, this.maxFocusHistory);
        }
    }

    focusPrevious() {
        if (this.focusHistory.length > 1) {
            const previous = this.focusHistory[1];
            if (previous && document.contains(previous)) {
                previous.focus();
            }
        }
    }

    // Action implementations
    focusSearch() {
        const searchInput = document.querySelector('#search-bookmarks, #global-search');
        if (searchInput) {
            searchInput.focus();
            searchInput.select();
        }
    }

    handleEscape() {
        // Close any open modals or panels
        const activeModal = document.querySelector('.modal.show, .admin-panel:not(.hidden)');
        if (activeModal) {
            const closeBtn = activeModal.querySelector('.modal-close, #close-admin');
            if (closeBtn) {
                closeBtn.click();
            }
            return;
        }
        
        // Clear search if focused
        const searchInput = document.querySelector('#search-bookmarks:focus, #global-search:focus');
        if (searchInput) {
            searchInput.value = '';
            searchInput.blur();
            return;
        }
        
        // Exit vim modes
        if (this.navigationMode !== 'normal') {
            this.enterNormalMode();
        }
    }

    showHelpDialog() {
        const helpDialog = this.createHelpDialog();
        document.body.appendChild(helpDialog);
    }

    createHelpDialog() {
        const dialog = document.createElement('div');
        dialog.className = 'keyboard-help-dialog';
        dialog.innerHTML = `
            <div class="help-backdrop"></div>
            <div class="help-content">
                <div class="help-header">
                    <h2>Keyboard Shortcuts</h2>
                    <button class="help-close">&times;</button>
                </div>
                <div class="help-body">
                    ${this.generateHelpContent()}
                </div>
            </div>
        `;
        
        // Add styles
        this.addHelpDialogStyles();
        
        // Bind close events
        const closeBtn = dialog.querySelector('.help-close');
        const backdrop = dialog.querySelector('.help-backdrop');
        
        const closeDialog = () => {
            dialog.remove();
        };
        
        closeBtn.addEventListener('click', closeDialog);
        backdrop.addEventListener('click', closeDialog);
        
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                closeDialog();
            }
        }, { once: true });
        
        return dialog;
    }

    generateHelpContent() {
        const sections = [
            {
                title: 'Navigation',
                shortcuts: [
                    ['/', 'Focus search'],
                    ['?', 'Show this help'],
                    ['Escape', 'Cancel/Close'],
                    ['j/↓', 'Navigate down'],
                    ['k/↑', 'Navigate up'],
                    ['h/←', 'Navigate left'],
                    ['l/→', 'Navigate right']
                ]
            },
            {
                title: 'Actions',
                shortcuts: [
                    ['Ctrl+N', 'New bookmark'],
                    ['Ctrl+/', 'Toggle admin panel'],
                    ['Ctrl+T', 'Toggle dark mode'],
                    ['Enter', 'Activate selected'],
                    ['Space', 'Toggle selection']
                ]
            },
            {
                title: 'Views',
                shortcuts: [
                    ['1', 'Bookmarks view'],
                    ['2', 'App launcher view'],
                    ['g', 'Cycle grid size'],
                    ['v', 'Toggle grid/list view'],
                    ['r', 'Refresh view']
                ]
            },
            {
                title: 'Quick Actions',
                shortcuts: [
                    ['a', 'Admin panel'],
                    ['s', 'Search'],
                    ['b', 'Go back'],
                    ['f', 'Go forward']
                ]
            }
        ];
        
        if (this.options.enableVimMode) {
            sections.push({
                title: 'Vim Mode',
                shortcuts: [
                    ['i', 'Insert mode'],
                    ['v', 'Visual mode'],
                    ['w', 'Next word'],
                    ['b', 'Previous word'],
                    ['gg', 'Go to top'],
                    ['G', 'Go to bottom'],
                    ['dd', 'Delete selected'],
                    ['yy', 'Copy selected']
                ]
            });
        }
        
        return sections.map(section => `
            <div class="help-section">
                <h3>${section.title}</h3>
                <div class="shortcuts-list">
                    ${section.shortcuts.map(([key, desc]) => `
                        <div class="shortcut-item">
                            <kbd>${key}</kbd>
                            <span>${desc}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');
    }

    addHelpDialogStyles() {
        if (document.querySelector('#keyboard-help-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'keyboard-help-styles';
        style.textContent = `
            .keyboard-help-dialog {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 20000;
            }
            
            .help-backdrop {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                backdrop-filter: blur(4px);
            }
            
            .help-content {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: var(--bg-secondary);
                border-radius: 12px;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
                max-width: 600px;
                max-height: 80vh;
                overflow-y: auto;
                color: var(--text-primary);
            }
            
            .help-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 20px 24px;
                border-bottom: 1px solid var(--border-color);
            }
            
            .help-header h2 {
                margin: 0;
                font-size: 18px;
                font-weight: 600;
            }
            
            .help-close {
                background: none;
                border: none;
                font-size: 24px;
                cursor: pointer;
                color: var(--text-secondary);
                padding: 0;
                width: 32px;
                height: 32px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 4px;
            }
            
            .help-close:hover {
                background: var(--tile-hover);
            }
            
            .help-body {
                padding: 24px;
            }
            
            .help-section {
                margin-bottom: 24px;
            }
            
            .help-section:last-child {
                margin-bottom: 0;
            }
            
            .help-section h3 {
                margin: 0 0 12px 0;
                font-size: 14px;
                font-weight: 600;
                color: var(--accent-color);
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            
            .shortcuts-list {
                display: grid;
                gap: 8px;
            }
            
            .shortcut-item {
                display: flex;
                align-items: center;
                gap: 12px;
            }
            
            .shortcut-item kbd {
                display: inline-block;
                padding: 4px 8px;
                background: var(--category-bg);
                border-radius: 4px;
                font-size: 12px;
                font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
                min-width: 60px;
                text-align: center;
                border: 1px solid var(--border-color);
            }
            
            .shortcut-item span {
                font-size: 14px;
                color: var(--text-secondary);
            }
        `;
        
        document.head.appendChild(style);
    }

    // Application-specific actions
    triggerNewBookmark() {
        const adminToggle = document.querySelector('#admin-toggle');
        if (adminToggle) {
            adminToggle.click();
            
            // Focus the bookmark title field after admin panel opens
            setTimeout(() => {
                const titleInput = document.querySelector('#bookmark-title');
                if (titleInput) {
                    titleInput.focus();
                }
            }, 100);
        }
    }

    toggleAdminPanel() {
        const adminToggle = document.querySelector('#admin-toggle');
        if (adminToggle) {
            adminToggle.click();
        }
    }

    toggleTheme() {
        const themeToggle = document.querySelector('#theme-toggle');
        if (themeToggle) {
            themeToggle.click();
        }
    }

    switchToView(view) {
        const viewBtn = document.querySelector(`#${view}-view-btn`);
        if (viewBtn && !viewBtn.classList.contains('active')) {
            viewBtn.click();
        }
    }

    cycleGridSize() {
        const gridToggle = document.querySelector('#grid-size-toggle');
        if (gridToggle) {
            gridToggle.click();
        }
    }

    toggleViewMode() {
        const viewToggle = document.querySelector('#view-toggle');
        if (viewToggle) {
            viewToggle.click();
        }
    }

    // Navigation methods
    navigateDown() {
        this.moveSelection('down');
    }

    navigateUp() {
        this.moveSelection('up');
    }

    navigateLeft() {
        this.moveSelection('left');
    }

    navigateRight() {
        this.moveSelection('right');
    }

    moveSelection(direction) {
        const items = document.querySelectorAll('.bookmark-item, .application-item');
        const selected = document.querySelector('.item-selected') || items[0];
        
        if (!selected || items.length === 0) return;
        
        const currentIndex = Array.from(items).indexOf(selected);
        let newIndex;
        
        switch (direction) {
            case 'down':
                newIndex = Math.min(currentIndex + 1, items.length - 1);
                break;
            case 'up':
                newIndex = Math.max(currentIndex - 1, 0);
                break;
            case 'left':
                newIndex = Math.max(currentIndex - 1, 0);
                break;
            case 'right':
                newIndex = Math.min(currentIndex + 1, items.length - 1);
                break;
        }
        
        if (newIndex !== currentIndex) {
            this.selectItem(items[newIndex]);
        }
    }

    selectItem(item) {
        // Remove previous selection
        const prevSelected = document.querySelector('.item-selected');
        if (prevSelected) {
            prevSelected.classList.remove('item-selected');
        }
        
        // Add selection to new item
        item.classList.add('item-selected');
        item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    activateSelected() {
        const selected = document.querySelector('.item-selected');
        if (selected) {
            selected.click();
        }
    }

    toggleSelected() {
        const selected = document.querySelector('.item-selected');
        if (selected) {
            const checkbox = selected.querySelector('input[type="checkbox"]');
            if (checkbox) {
                checkbox.checked = !checkbox.checked;
                checkbox.dispatchEvent(new Event('change'));
            }
        }
    }

    // Vim mode methods
    enterNormalMode() {
        this.navigationMode = 'normal';
        document.body.classList.remove('vim-insert', 'vim-visual');
        document.body.classList.add('vim-normal');
    }

    enterInsertMode() {
        this.navigationMode = 'insert';
        document.body.classList.remove('vim-normal', 'vim-visual');
        document.body.classList.add('vim-insert');
    }

    enterVisualMode() {
        this.navigationMode = 'visual';
        document.body.classList.remove('vim-normal', 'vim-insert');
        document.body.classList.add('vim-visual');
    }

    // Utility methods
    goToTop() {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        const firstItem = document.querySelector('.bookmark-item, .application-item');
        if (firstItem) {
            this.selectItem(firstItem);
        }
    }

    goToBottom() {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        const items = document.querySelectorAll('.bookmark-item, .application-item');
        if (items.length > 0) {
            this.selectItem(items[items.length - 1]);
        }
    }

    refreshView() {
        window.location.reload();
    }

    goBack() {
        if (window.history.length > 1) {
            window.history.back();
        }
    }

    goForward() {
        window.history.forward();
    }

    // Settings
    loadSettings() {
        try {
            const settings = localStorage.getItem('keyboard-navigation-settings');
            if (settings) {
                const parsed = JSON.parse(settings);
                this.options = { ...this.options, ...parsed };
            }
        } catch (error) {
            console.warn('Failed to load keyboard navigation settings:', error);
        }
    }

    saveSettings() {
        try {
            localStorage.setItem('keyboard-navigation-settings', JSON.stringify(this.options));
        } catch (error) {
            console.warn('Failed to save keyboard navigation settings:', error);
        }
    }

    // Public API
    enable() {
        this.isEnabled = true;
    }

    disable() {
        this.isEnabled = false;
    }

    isVimModeEnabled() {
        return this.options.enableVimMode;
    }

    enableVimMode() {
        this.options.enableVimMode = true;
        this.setupVimShortcuts();
        this.saveSettings();
    }

    disableVimMode() {
        this.options.enableVimMode = false;
        this.enterNormalMode();
        document.body.classList.remove('vim-normal', 'vim-insert', 'vim-visual');
        this.saveSettings();
    }

    getShortcuts() {
        return Array.from(this.shortcuts.entries()).map(([key, action]) => ({
            key,
            description: action.description || 'No description'
        }));
    }

    getSequences() {
        return Array.from(this.sequences.entries()).map(([sequence, action]) => ({
            sequence,
            description: action.description || 'No description'
        }));
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = KeyboardNavigation;
}