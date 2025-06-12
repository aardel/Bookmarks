/**
 * Welcome Screen Service
 * Shows initial welcome screen for new users
 */
class WelcomeScreen {
    constructor(options = {}) {
        this.options = {
            showOnFirstRun: true,
            autoHide: false,
            samples: true,
            ...options
        };
        
        this.isVisible = false;
        this.element = null;
        this.hasBeenShown = false;
        
        this.init();
    }

    init() {
        this.loadState();
        
        if (this.shouldShow()) {
            setTimeout(() => {
                this.show();
            }, 500);
        }
    }

    loadState() {
        try {
            const shown = localStorage.getItem('welcome-screen-shown');
            this.hasBeenShown = shown === 'true';
        } catch (error) {
            console.warn('Failed to load welcome screen state:', error);
        }
    }

    saveState() {
        try {
            localStorage.setItem('welcome-screen-shown', 'true');
            this.hasBeenShown = true;
        } catch (error) {
            console.warn('Failed to save welcome screen state:', error);
        }
    }

    shouldShow() {
        if (!this.options.showOnFirstRun) return false;
        if (this.hasBeenShown) return false;
        
        // Check if user has any existing data
        const hasBookmarks = this.hasExistingBookmarks();
        const hasApps = this.hasExistingApps();
        
        return !hasBookmarks && !hasApps;
    }

    hasExistingBookmarks() {
        try {
            const bookmarks = JSON.parse(localStorage.getItem('bookmarks') || '[]');
            return bookmarks.length > 0;
        } catch (error) {
            return false;
        }
    }

    hasExistingApps() {
        try {
            const apps = JSON.parse(localStorage.getItem('applications') || '[]');
            return apps.length > 0;
        } catch (error) {
            return false;
        }
    }

    show() {
        if (this.isVisible) return;
        
        this.isVisible = true;
        this.createElement();
        this.bindEvents();
        
        document.body.appendChild(this.element);
        
        // Animate in
        setTimeout(() => {
            this.element.classList.add('visible');
        }, 100);
        
        // Dispatch event
        document.dispatchEvent(new CustomEvent('welcome-screen:shown'));
    }

    createElement() {
        this.element = document.createElement('div');
        this.element.className = 'welcome-screen';
        this.element.innerHTML = this.getTemplate();
        
        // Add styles
        const style = document.createElement('style');
        style.textContent = this.getStyles();
        document.head.appendChild(style);
    }

    getTemplate() {
        return `
            <div class="welcome-backdrop"></div>
            <div class="welcome-content">
                <div class="welcome-header">
                    <div class="welcome-logo">
                        <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                            <rect width="64" height="64" rx="16" fill="#4a6da7"/>
                            <path d="M16 24L32 16L48 24V48L32 56L16 48V24Z" fill="white"/>
                            <circle cx="32" cy="32" r="6" fill="#4a6da7"/>
                        </svg>
                    </div>
                    <h1>Welcome to Bookmark Manager</h1>
                    <p class="welcome-subtitle">
                        Your all-in-one solution for organizing bookmarks and launching applications
                    </p>
                </div>

                <div class="welcome-features">
                    <div class="feature-grid">
                        <div class="feature-item">
                            <div class="feature-icon">🔖</div>
                            <h3>Smart Bookmarks</h3>
                            <p>Organize your favorite websites with categories, tags, and powerful search</p>
                        </div>
                        <div class="feature-item">
                            <div class="feature-icon">🚀</div>
                            <h3>App Launcher</h3>
                            <p>Launch native applications directly from your bookmark manager</p>
                        </div>
                        <div class="feature-item">
                            <div class="feature-icon">🌙</div>
                            <h3>Dark Mode</h3>
                            <p>Choose between light and dark themes to match your preference</p>
                        </div>
                        <div class="feature-item">
                            <div class="feature-icon">☁️</div>
                            <h3>Backup & Sync</h3>
                            <p>Automatic backups keep your data safe and synchronized</p>
                        </div>
                        <div class="feature-item">
                            <div class="feature-icon">🔍</div>
                            <h3>Advanced Search</h3>
                            <p>Find anything instantly with intelligent search and filtering</p>
                        </div>
                        <div class="feature-item">
                            <div class="feature-icon">⚡</div>
                            <h3>Lightning Fast</h3>
                            <p>Native desktop performance with modern web technologies</p>
                        </div>
                    </div>
                </div>

                <div class="welcome-actions">
                    <div class="action-buttons">
                        <button class="btn btn-primary btn-large" id="get-started-btn">
                            <span>Get Started</span>
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                <path d="M6 12L10 8L6 4" stroke="currentColor" stroke-width="2" fill="none"/>
                            </svg>
                        </button>
                        <button class="btn btn-secondary btn-large" id="import-data-btn">
                            <span>Import Existing Data</span>
                        </button>
                    </div>
                    
                    <div class="quick-options">
                        <label class="checkbox-option">
                            <input type="checkbox" id="create-samples" checked>
                            <span class="checkmark"></span>
                            <span>Create sample bookmarks to get started</span>
                        </label>
                        <label class="checkbox-option">
                            <input type="checkbox" id="enable-tour" checked>
                            <span class="checkmark"></span>
                            <span>Show guided tour</span>
                        </label>
                    </div>
                </div>

                <div class="welcome-footer">
                    <button class="link-button" id="skip-welcome">
                        Skip and start with empty workspace
                    </button>
                </div>
            </div>
        `;
    }

    getStyles() {
        return `
            .welcome-screen {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 20000;
                opacity: 0;
                transition: opacity 0.3s ease;
            }

            .welcome-screen.visible {
                opacity: 1;
            }

            .welcome-backdrop {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            }

            .welcome-content {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 90%;
                max-width: 800px;
                max-height: 90vh;
                background: white;
                border-radius: 16px;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
                overflow-y: auto;
                padding: 40px;
                text-align: center;
            }

            .welcome-header {
                margin-bottom: 40px;
            }

            .welcome-logo {
                margin-bottom: 24px;
            }

            .welcome-header h1 {
                font-size: 32px;
                font-weight: 600;
                margin: 0 0 12px 0;
                color: #2d3748;
            }

            .welcome-subtitle {
                font-size: 18px;
                color: #718096;
                margin: 0;
                line-height: 1.5;
            }

            .feature-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
                gap: 24px;
                margin-bottom: 40px;
            }

            .feature-item {
                text-align: center;
                padding: 20px;
            }

            .feature-icon {
                font-size: 32px;
                margin-bottom: 12px;
            }

            .feature-item h3 {
                font-size: 16px;
                font-weight: 600;
                margin: 0 0 8px 0;
                color: #2d3748;
            }

            .feature-item p {
                font-size: 14px;
                color: #718096;
                margin: 0;
                line-height: 1.4;
            }

            .welcome-actions {
                margin-bottom: 32px;
            }

            .action-buttons {
                display: flex;
                gap: 16px;
                justify-content: center;
                margin-bottom: 24px;
                flex-wrap: wrap;
            }

            .btn {
                display: inline-flex;
                align-items: center;
                gap: 8px;
                padding: 12px 24px;
                border-radius: 8px;
                font-size: 16px;
                font-weight: 500;
                text-decoration: none;
                cursor: pointer;
                transition: all 0.2s ease;
                border: none;
            }

            .btn-large {
                padding: 16px 32px;
                font-size: 18px;
            }

            .btn-primary {
                background: #4a6da7;
                color: white;
            }

            .btn-primary:hover {
                background: #3a5a97;
                transform: translateY(-1px);
            }

            .btn-secondary {
                background: transparent;
                color: #4a6da7;
                border: 2px solid #4a6da7;
            }

            .btn-secondary:hover {
                background: #4a6da7;
                color: white;
            }

            .quick-options {
                display: flex;
                flex-direction: column;
                gap: 12px;
                align-items: center;
            }

            .checkbox-option {
                display: flex;
                align-items: center;
                gap: 8px;
                cursor: pointer;
                font-size: 14px;
                color: #4a5568;
            }

            .checkbox-option input[type="checkbox"] {
                display: none;
            }

            .checkmark {
                width: 16px;
                height: 16px;
                border: 2px solid #cbd5e0;
                border-radius: 4px;
                background: white;
                position: relative;
                transition: all 0.2s ease;
            }

            .checkbox-option input[type="checkbox"]:checked + .checkmark {
                background: #4a6da7;
                border-color: #4a6da7;
            }

            .checkbox-option input[type="checkbox"]:checked + .checkmark::after {
                content: '✓';
                color: white;
                font-size: 12px;
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
            }

            .welcome-footer {
                border-top: 1px solid #e2e8f0;
                padding-top: 24px;
            }

            .link-button {
                background: none;
                border: none;
                color: #718096;
                font-size: 14px;
                cursor: pointer;
                text-decoration: underline;
            }

            .link-button:hover {
                color: #4a5568;
            }

            @media (max-width: 640px) {
                .welcome-content {
                    width: 95%;
                    padding: 24px;
                }

                .welcome-header h1 {
                    font-size: 24px;
                }

                .welcome-subtitle {
                    font-size: 16px;
                }

                .action-buttons {
                    flex-direction: column;
                    align-items: center;
                }

                .feature-grid {
                    grid-template-columns: 1fr;
                    gap: 16px;
                }
            }
        `;
    }

    bindEvents() {
        const getStartedBtn = this.element.querySelector('#get-started-btn');
        const importDataBtn = this.element.querySelector('#import-data-btn');
        const skipBtn = this.element.querySelector('#skip-welcome');

        if (getStartedBtn) {
            getStartedBtn.addEventListener('click', () => this.handleGetStarted());
        }

        if (importDataBtn) {
            importDataBtn.addEventListener('click', () => this.handleImportData());
        }

        if (skipBtn) {
            skipBtn.addEventListener('click', () => this.handleSkip());
        }

        // Close on escape key
        document.addEventListener('keydown', this.handleKeydown.bind(this));
    }

    handleKeydown(event) {
        if (event.key === 'Escape' && this.isVisible) {
            this.handleSkip();
        }
    }

    async handleGetStarted() {
        const createSamples = this.element.querySelector('#create-samples').checked;
        const enableTour = this.element.querySelector('#enable-tour').checked;

        if (createSamples) {
            await this.createSampleData();
        }

        this.hide();

        if (enableTour) {
            // Start onboarding tour
            document.dispatchEvent(new CustomEvent('welcome-screen:start-tour'));
        }

        document.dispatchEvent(new CustomEvent('welcome-screen:get-started', {
            detail: { createSamples, enableTour }
        }));
    }

    handleImportData() {
        this.hide();
        
        // Trigger import dialog
        document.dispatchEvent(new CustomEvent('welcome-screen:import-data'));
    }

    handleSkip() {
        this.hide();
        
        document.dispatchEvent(new CustomEvent('welcome-screen:skipped'));
    }

    async createSampleData() {
        const sampleBookmarks = [
            {
                id: 'sample-1',
                title: 'GitHub',
                url: 'https://github.com',
                category: 'Development',
                type: 'website',
                tags: ['code', 'git', 'development'],
                iconUrl: 'https://github.com/favicon.ico',
                createdAt: new Date().toISOString(),
                visits: 0
            },
            {
                id: 'sample-2',
                title: 'Stack Overflow',
                url: 'https://stackoverflow.com',
                category: 'Development',
                type: 'website',
                tags: ['help', 'programming', 'qa'],
                iconUrl: 'https://stackoverflow.com/favicon.ico',
                createdAt: new Date().toISOString(),
                visits: 0
            },
            {
                id: 'sample-3',
                title: 'YouTube',
                url: 'https://youtube.com',
                category: 'Entertainment',
                type: 'website',
                tags: ['video', 'entertainment'],
                iconUrl: 'https://youtube.com/favicon.ico',
                createdAt: new Date().toISOString(),
                visits: 0
            },
            {
                id: 'sample-4',
                title: 'Google Drive',
                url: 'https://drive.google.com',
                category: 'Productivity',
                type: 'website',
                tags: ['cloud', 'storage', 'documents'],
                iconUrl: 'https://drive.google.com/favicon.ico',
                createdAt: new Date().toISOString(),
                visits: 0
            }
        ];

        const sampleCategories = ['Development', 'Entertainment', 'Productivity', 'News', 'Social'];

        try {
            localStorage.setItem('bookmarks', JSON.stringify(sampleBookmarks));
            localStorage.setItem('categories', JSON.stringify(sampleCategories));
            
            // Dispatch event to refresh the UI
            document.dispatchEvent(new CustomEvent('bookmarks:updated'));
        } catch (error) {
            console.error('Failed to create sample data:', error);
        }
    }

    hide() {
        if (!this.isVisible) return;
        
        this.isVisible = false;
        this.saveState();
        
        this.element.classList.remove('visible');
        
        setTimeout(() => {
            if (this.element && this.element.parentNode) {
                this.element.parentNode.removeChild(this.element);
            }
            this.element = null;
        }, 300);
        
        // Remove event listener
        document.removeEventListener('keydown', this.handleKeydown);
        
        document.dispatchEvent(new CustomEvent('welcome-screen:hidden'));
    }

    // Public API
    isShowing() {
        return this.isVisible;
    }

    forceShow() {
        this.hasBeenShown = false;
        localStorage.removeItem('welcome-screen-shown');
        this.show();
    }

    reset() {
        this.hasBeenShown = false;
        localStorage.removeItem('welcome-screen-shown');
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WelcomeScreen;
}