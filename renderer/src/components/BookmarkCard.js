/**
 * BookmarkCard Component
 * Renders individual bookmark items in both grid and list view
 */
class BookmarkCard {
    constructor(bookmark, options = {}) {
        this.bookmark = bookmark;
        this.options = {
            viewMode: 'grid',
            showActions: true,
            ...options
        };
        this.element = null;
    }

    render() {
        const template = this.options.viewMode === 'list' 
            ? this.getListTemplate() 
            : this.getGridTemplate();
        
        this.element = document.createElement('div');
        this.element.className = `bookmark-item ${this.options.viewMode}-view`;
        this.element.setAttribute('role', 'listitem');
        this.element.setAttribute('data-bookmark-id', this.bookmark.id);
        this.element.innerHTML = template;

        this.bindEvents();
        return this.element;
    }

    getGridTemplate() {
        const { title, url, category, iconUrl, tags = [], color, type, visits = 0 } = this.bookmark;
        const displayIcon = iconUrl || this.getDefaultIcon(type);
        
        return `
            <div class="bookmark-content">
                <div class="bookmark-icon">
                    <img src="${displayIcon}" alt="${title}" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJMMTMuMDkgOC4yNkwyMCA5TDEzLjA5IDE1Ljc0TDEyIDIyTDEwLjkxIDE1Ljc0TDQgOUwxMC45MSA4LjI2TDEyIDJaIiBmaWxsPSIjNjY3Mjg0Ii8+Cjwvc3ZnPgo='">
                </div>
                <div class="bookmark-info">
                    <div class="bookmark-title">${this.escapeHtml(title)}</div>
                    <div class="bookmark-category">${this.escapeHtml(category)}</div>
                    ${tags.length > 0 ? `<div class="bookmark-tags">${tags.map(tag => `<span class="tag">${this.escapeHtml(tag)}</span>`).join('')}</div>` : ''}
                    ${visits > 0 ? `<div class="bookmark-visits">${visits} visits</div>` : ''}
                </div>
                ${this.options.showActions ? this.getActionsTemplate() : ''}
            </div>
            ${color && color !== '#ffffff' ? `<div class="bookmark-color-indicator" style="background-color: ${color}"></div>` : ''}
        `;
    }

    getListTemplate() {
        const { title, url, category, iconUrl, tags = [], type, visits = 0 } = this.bookmark;
        const displayIcon = iconUrl || this.getDefaultIcon(type);
        
        return `
            <div class="bookmark-content">
                <div class="bookmark-icon">
                    <img src="${displayIcon}" alt="${title}" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJMMTMuMDkgOC4yNkwyMCA5TDEzLjA5IDE1Ljc0TDEyIDIyTDEwLjkxIDE1Ljc0TDQgOUwxMC45MSA4LjI2TDEyIDJaIiBmaWxsPSIjNjY3Mjg0Ii8+Cjwvc3ZnPgo='">
                </div>
                <div class="bookmark-details">
                    <div class="bookmark-title">${this.escapeHtml(title)}</div>
                    <div class="bookmark-url">${this.escapeHtml(url)}</div>
                    <div class="bookmark-meta">
                        <span class="bookmark-category">${this.escapeHtml(category)}</span>
                        ${visits > 0 ? `<span class="bookmark-visits">${visits} visits</span>` : ''}
                    </div>
                    ${tags.length > 0 ? `<div class="bookmark-tags">${tags.map(tag => `<span class="tag">${this.escapeHtml(tag)}</span>`).join('')}</div>` : ''}
                </div>
                ${this.options.showActions ? this.getActionsTemplate() : ''}
            </div>
        `;
    }

    getActionsTemplate() {
        return `
            <div class="bookmark-actions">
                <button class="bookmark-menu-btn" title="Actions" aria-label="Bookmark actions">
                    <i class="fas fa-ellipsis-v"></i>
                </button>
                <div class="bookmark-actions-menu">
                    <button class="action-edit" data-action="edit">
                        <i class="fas fa-edit"></i>
                        <span>Edit</span>
                    </button>
                    <button class="action-duplicate" data-action="duplicate">
                        <i class="fas fa-copy"></i>
                        <span>Duplicate</span>
                    </button>
                    <button class="action-share" data-action="share">
                        <i class="fas fa-share-alt"></i>
                        <span>Share</span>
                    </button>
                    <button class="action-delete" data-action="delete">
                        <i class="fas fa-trash"></i>
                        <span>Delete</span>
                    </button>
                </div>
            </div>
        `;
    }

    getDefaultIcon(type) {
        const icons = {
            'website': 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJDNi40OCAyIDIgNi40OCAyIDEyUzYuNDggMjIgMTIgMjJTMjIgMTcuNTIgMjIgMTJTMTcuNTIgMiAxMiAyWk0xMSAyMFY0QzE1LjQxIDQgMTkgNy41OSAxOSAxMkMxOSAxNi40MSAxNS40MSAyMCAxMSAyMFoiIGZpbGw9IiM0YTZkYTciLz4KPC9zdmc+',
            'program': 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTkgMTJMMTEgMTRMMTUgMTBNMjEgMTJDMjEgMTYuOTcgMTYuOTcgMjEgMTIgMjFTMyAxNi45NyAzIDEyUzcuMDMgMyAxMiAzUzIxIDcuMDMgMjEgMTJaIiBzdHJva2U9IiM0YTZkYTciIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+Cjwvc3ZnPg==',
            'protocol': 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEwIDEzQTUgNSAwIDAgMCA3LjU0IDUuNDZMMi43NiA0QTExLjUgMTEuNSAwIDAgMCAyLjc2IDIwTDcuNTQgMTguNTRBNSA1IDAgMCAwIDEwIDEzWiIgZmlsbD0iIzRhNmRhNyIvPgo8L3N2Zz4='
        };
        return icons[type] || icons['website'];
    }

    bindEvents() {
        if (!this.element) return;

        // Main click event to open bookmark
        this.element.addEventListener('click', (e) => {
            // Don't trigger if clicking on actions
            if (e.target.closest('.bookmark-actions')) return;
            this.handleOpen();
        });

        // Actions menu toggle
        const menuBtn = this.element.querySelector('.bookmark-menu-btn');
        const actionsMenu = this.element.querySelector('.bookmark-actions-menu');
        
        if (menuBtn && actionsMenu) {
            menuBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleActionsMenu();
            });

            // Action buttons
            actionsMenu.addEventListener('click', (e) => {
                e.stopPropagation();
                const action = e.target.closest('[data-action]')?.dataset.action;
                if (action) {
                    this.handleAction(action);
                    this.hideActionsMenu();
                }
            });
        }

        // Context menu
        this.element.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.showContextMenu(e.clientX, e.clientY);
        });
    }

    handleOpen() {
        const { type, url } = this.bookmark;
        
        if (type === 'program' && window.electronAPI) {
            window.electronAPI.launchApp(url);
        } else if (type === 'website') {
            window.open(url, '_blank');
        } else if (type === 'protocol') {
            window.location.href = url;
        }

        // Track visit
        this.trackVisit();
    }

    handleAction(action) {
        const event = new CustomEvent('bookmark-action', {
            detail: { action, bookmark: this.bookmark }
        });
        document.dispatchEvent(event);
    }

    toggleActionsMenu() {
        const menu = this.element.querySelector('.bookmark-actions-menu');
        if (menu) {
            menu.classList.toggle('show');
        }
    }

    hideActionsMenu() {
        const menu = this.element.querySelector('.bookmark-actions-menu');
        if (menu) {
            menu.classList.remove('show');
        }
    }

    showContextMenu(x, y) {
        // Implementation for context menu
        console.log('Context menu at', x, y);
    }

    trackVisit() {
        const event = new CustomEvent('bookmark-visited', {
            detail: { bookmarkId: this.bookmark.id }
        });
        document.dispatchEvent(event);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    update(bookmark) {
        this.bookmark = bookmark;
        if (this.element) {
            const newElement = this.render();
            this.element.replaceWith(newElement);
        }
    }

    destroy() {
        if (this.element) {
            this.element.remove();
            this.element = null;
        }
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BookmarkCard;
}