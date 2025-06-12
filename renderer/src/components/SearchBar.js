/**
 * SearchBar Component
 * Provides search functionality with advanced filtering
 */
class SearchBar {
    constructor(container, options = {}) {
        this.container = container;
        this.options = {
            placeholder: 'Search bookmarks...',
            showFilters: true,
            debounceMs: 300,
            ...options
        };
        this.element = null;
        this.debounceTimer = null;
        this.callbacks = {
            onSearch: () => {},
            onFilter: () => {},
            onClear: () => {}
        };
    }

    render() {
        this.element = document.createElement('div');
        this.element.className = 'search-bar-component';
        this.element.innerHTML = this.getTemplate();
        
        this.bindEvents();
        
        if (this.container) {
            this.container.appendChild(this.element);
        }
        
        return this.element;
    }

    getTemplate() {
        return `
            <div class="search-input-container">
                <div class="search-input-wrapper">
                    <i class="fas fa-search search-icon"></i>
                    <input 
                        type="text" 
                        class="search-input" 
                        placeholder="${this.options.placeholder}"
                        aria-label="Search"
                    >
                    <button class="search-clear-btn hidden" aria-label="Clear search">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                ${this.options.showFilters ? this.getFiltersTemplate() : ''}
            </div>
            <div class="search-suggestions hidden">
                <div class="suggestions-list"></div>
            </div>
        `;
    }

    getFiltersTemplate() {
        return `
            <div class="search-filters">
                <div class="filter-group">
                    <label for="search-category-filter">Category:</label>
                    <select id="search-category-filter" class="filter-select">
                        <option value="">All Categories</option>
                    </select>
                </div>
                <div class="filter-group">
                    <label for="search-type-filter">Type:</label>
                    <select id="search-type-filter" class="filter-select">
                        <option value="">All Types</option>
                        <option value="website">Websites</option>
                        <option value="program">Programs</option>
                        <option value="protocol">Protocols</option>
                    </select>
                </div>
                <div class="filter-group">
                    <label for="search-tags-input">Tags:</label>
                    <input 
                        type="text" 
                        id="search-tags-input" 
                        class="filter-input"
                        placeholder="Enter tags..."
                        aria-label="Filter by tags"
                    >
                </div>
                <button class="advanced-search-toggle" data-expanded="false">
                    <i class="fas fa-sliders-h"></i>
                    Advanced
                </button>
            </div>
            <div class="advanced-search-panel hidden">
                <div class="advanced-filters">
                    <div class="filter-row">
                        <div class="filter-group">
                            <label for="date-from">Created After:</label>
                            <input type="date" id="date-from" class="filter-input">
                        </div>
                        <div class="filter-group">
                            <label for="date-to">Created Before:</label>
                            <input type="date" id="date-to" class="filter-input">
                        </div>
                    </div>
                    <div class="filter-row">
                        <div class="filter-group">
                            <label for="visit-count-min">Min Visits:</label>
                            <input type="number" id="visit-count-min" class="filter-input" min="0">
                        </div>
                        <div class="filter-group">
                            <label for="visit-count-max">Max Visits:</label>
                            <input type="number" id="visit-count-max" class="filter-input" min="0">
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    bindEvents() {
        if (!this.element) return;

        const searchInput = this.element.querySelector('.search-input');
        const clearBtn = this.element.querySelector('.search-clear-btn');
        const advancedToggle = this.element.querySelector('.advanced-search-toggle');
        const advancedPanel = this.element.querySelector('.advanced-search-panel');

        // Search input events
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.handleSearchInput(e.target.value);
                this.toggleClearButton(e.target.value);
            });

            searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    this.clearSearch();
                } else if (e.key === 'Enter') {
                    this.handleSearch(e.target.value);
                }
            });

            searchInput.addEventListener('focus', () => {
                this.showSuggestions();
            });
        }

        // Clear button
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                this.clearSearch();
            });
        }

        // Advanced search toggle
        if (advancedToggle && advancedPanel) {
            advancedToggle.addEventListener('click', () => {
                this.toggleAdvancedSearch();
            });
        }

        // Filter events
        this.bindFilterEvents();

        // Click outside to hide suggestions
        document.addEventListener('click', (e) => {
            if (!this.element.contains(e.target)) {
                this.hideSuggestions();
            }
        });
    }

    bindFilterEvents() {
        const filters = this.element.querySelectorAll('.filter-select, .filter-input');
        filters.forEach(filter => {
            filter.addEventListener('change', () => {
                this.handleFilterChange();
            });
        });
    }

    handleSearchInput(value) {
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => {
            this.handleSearch(value);
        }, this.options.debounceMs);

        // Show suggestions for partial input
        if (value.length > 1) {
            this.updateSuggestions(value);
        } else {
            this.hideSuggestions();
        }
    }

    handleSearch(value) {
        const filters = this.getFilterValues();
        this.callbacks.onSearch(value, filters);
    }

    handleFilterChange() {
        const searchValue = this.getSearchValue();
        const filters = this.getFilterValues();
        this.callbacks.onFilter(searchValue, filters);
    }

    getSearchValue() {
        const input = this.element.querySelector('.search-input');
        return input ? input.value : '';
    }

    getFilterValues() {
        const filters = {};
        
        const categoryFilter = this.element.querySelector('#search-category-filter');
        if (categoryFilter) filters.category = categoryFilter.value;
        
        const typeFilter = this.element.querySelector('#search-type-filter');
        if (typeFilter) filters.type = typeFilter.value;
        
        const tagsInput = this.element.querySelector('#search-tags-input');
        if (tagsInput && tagsInput.value) {
            filters.tags = tagsInput.value.split(',').map(tag => tag.trim()).filter(Boolean);
        }

        const dateFrom = this.element.querySelector('#date-from');
        if (dateFrom && dateFrom.value) filters.dateFrom = dateFrom.value;
        
        const dateTo = this.element.querySelector('#date-to');
        if (dateTo && dateTo.value) filters.dateTo = dateTo.value;
        
        const visitMin = this.element.querySelector('#visit-count-min');
        if (visitMin && visitMin.value) filters.visitCountMin = parseInt(visitMin.value);
        
        const visitMax = this.element.querySelector('#visit-count-max');
        if (visitMax && visitMax.value) filters.visitCountMax = parseInt(visitMax.value);

        return filters;
    }

    toggleClearButton(value) {
        const clearBtn = this.element.querySelector('.search-clear-btn');
        if (clearBtn) {
            clearBtn.classList.toggle('hidden', !value);
        }
    }

    toggleAdvancedSearch() {
        const toggle = this.element.querySelector('.advanced-search-toggle');
        const panel = this.element.querySelector('.advanced-search-panel');
        
        if (toggle && panel) {
            const isExpanded = toggle.dataset.expanded === 'true';
            toggle.dataset.expanded = !isExpanded;
            panel.classList.toggle('hidden', isExpanded);
            
            const icon = toggle.querySelector('i');
            if (icon) {
                icon.className = isExpanded ? 'fas fa-sliders-h' : 'fas fa-chevron-up';
            }
        }
    }

    clearSearch() {
        const searchInput = this.element.querySelector('.search-input');
        if (searchInput) {
            searchInput.value = '';
            searchInput.focus();
        }
        
        this.toggleClearButton('');
        this.hideSuggestions();
        this.callbacks.onClear();
    }

    updateCategories(categories) {
        const categoryFilter = this.element.querySelector('#search-category-filter');
        if (categoryFilter) {
            // Clear existing options except "All Categories"
            const allOption = categoryFilter.querySelector('option[value=""]');
            categoryFilter.innerHTML = '';
            categoryFilter.appendChild(allOption);
            
            // Add category options
            categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category;
                option.textContent = category;
                categoryFilter.appendChild(option);
            });
        }
    }

    updateSuggestions(searchTerm) {
        // This would typically fetch suggestions from a service
        const suggestions = this.generateSuggestions(searchTerm);
        const suggestionsList = this.element.querySelector('.suggestions-list');
        
        if (suggestionsList && suggestions.length > 0) {
            suggestionsList.innerHTML = suggestions.map(suggestion => 
                `<div class="suggestion-item" data-suggestion="${this.escapeHtml(suggestion)}">
                    <i class="fas fa-search"></i>
                    <span>${this.highlightMatch(suggestion, searchTerm)}</span>
                </div>`
            ).join('');
            
            this.showSuggestions();
            this.bindSuggestionEvents();
        } else {
            this.hideSuggestions();
        }
    }

    generateSuggestions(searchTerm) {
        // Simple suggestion generation - in a real app this would come from a service
        const commonSuggestions = [
            'Google', 'GitHub', 'Stack Overflow', 'YouTube', 'Twitter',
            'Facebook', 'LinkedIn', 'Amazon', 'Netflix', 'Spotify'
        ];
        
        return commonSuggestions
            .filter(suggestion => suggestion.toLowerCase().includes(searchTerm.toLowerCase()))
            .slice(0, 5);
    }

    bindSuggestionEvents() {
        const suggestions = this.element.querySelectorAll('.suggestion-item');
        suggestions.forEach(suggestion => {
            suggestion.addEventListener('click', () => {
                const searchInput = this.element.querySelector('.search-input');
                if (searchInput) {
                    searchInput.value = suggestion.dataset.suggestion;
                    this.handleSearch(suggestion.dataset.suggestion);
                    this.hideSuggestions();
                }
            });
        });
    }

    showSuggestions() {
        const suggestions = this.element.querySelector('.search-suggestions');
        if (suggestions) {
            suggestions.classList.remove('hidden');
        }
    }

    hideSuggestions() {
        const suggestions = this.element.querySelector('.search-suggestions');
        if (suggestions) {
            suggestions.classList.add('hidden');
        }
    }

    highlightMatch(text, searchTerm) {
        const regex = new RegExp(`(${this.escapeRegex(searchTerm)})`, 'gi');
        return text.replace(regex, '<mark>$1</mark>');
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    // Public API methods
    setSearchValue(value) {
        const searchInput = this.element.querySelector('.search-input');
        if (searchInput) {
            searchInput.value = value;
            this.toggleClearButton(value);
        }
    }

    focus() {
        const searchInput = this.element.querySelector('.search-input');
        if (searchInput) {
            searchInput.focus();
        }
    }

    onSearch(callback) {
        this.callbacks.onSearch = callback;
    }

    onFilter(callback) {
        this.callbacks.onFilter = callback;
    }

    onClear(callback) {
        this.callbacks.onClear = callback;
    }

    destroy() {
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }
        if (this.element) {
            this.element.remove();
            this.element = null;
        }
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SearchBar;
}