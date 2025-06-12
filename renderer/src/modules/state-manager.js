/**
 * State Manager Module
 * Centralizes application state management
 */

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

    /**
     * Get current state
     */
    getState() {
        return { ...this.state };
    }

    /**
     * Update state and notify subscribers
     */
    setState(updates) {
        const prevState = { ...this.state };
        this.state = { ...this.state, ...updates };
        this.notifySubscribers(prevState, this.state);
    }

    /**
     * Subscribe to state changes
     */
    subscribe(key, callback) {
        if (!this.subscribers.has(key)) {
            this.subscribers.set(key, new Set());
        }
        this.subscribers.get(key).add(callback);
        
        // Return unsubscribe function
        return () => {
            this.subscribers.get(key).delete(callback);
        };
    }

    /**
     * Notify all subscribers of state changes
     */
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

    /**
     * Dispatch events
     */
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

    /**
     * Register event handler
     */
    on(event, handler) {
        if (!this.eventHandlers.has(event)) {
            this.eventHandlers.set(event, new Set());
        }
        this.eventHandlers.get(event).add(handler);

        // Return unregister function
        return () => {
            this.eventHandlers.get(event).delete(handler);
        };
    }

    /**
     * Load state from localStorage
     */
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

    /**
     * Save state to localStorage
     */
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

// Create singleton instance
const stateManager = new StateManager();

export default stateManager;
export { StateManager }; 