/**
 * Onboarding Tour Component
 * Provides guided tour for first-time users
 */
class OnboardingTour {
    constructor(options = {}) {
        this.options = {
            autoStart: true,
            skipable: true,
            persistent: true,
            ...options
        };
        
        this.currentStep = 0;
        this.isActive = false;
        this.overlay = null;
        this.tooltip = null;
        this.isCompleted = false;
        
        this.steps = [
            {
                target: 'h1',
                title: 'Welcome to Bookmark Manager!',
                content: 'This is your personal bookmark manager with native app launching capabilities. Let me show you around!',
                position: 'bottom',
                showSkip: true
            },
            {
                target: '#search-bookmarks',
                title: 'Search Your Bookmarks',
                content: 'Use this search bar to quickly find any bookmark. You can search by title, URL, category, or tags.',
                position: 'bottom'
            },
            {
                target: '.view-mode-toggle',
                title: 'Switch Between Views',
                content: 'Toggle between your bookmarks and the app launcher. The app launcher lets you organize and launch applications directly.',
                position: 'bottom'
            },
            {
                target: '#theme-toggle',
                title: 'Dark Mode Toggle',
                content: 'Switch between light and dark themes to match your preference.',
                position: 'bottom'
            },
            {
                target: '#admin-toggle',
                title: 'Admin Panel',
                content: 'Click here to access advanced features like adding bookmarks, importing/exporting data, and managing settings.',
                position: 'left',
                action: () => {
                    // Don't actually open admin panel during tour
                    return false;
                }
            },
            {
                target: '#bookmark-grid',
                title: 'Your Bookmarks',
                content: 'Your bookmarks will appear here. Click any bookmark to open it, or right-click for more options.',
                position: 'top'
            },
            {
                target: '.global-categories',
                title: 'Categories',
                content: 'Organize your bookmarks using categories. Click on a category to filter your bookmarks.',
                position: 'bottom'
            },
            {
                target: '.global-controls',
                title: 'Advanced Controls',
                content: 'Use these controls to filter, sort, and search your bookmarks. You can sort by date, name, or most visited.',
                position: 'top'
            }
        ];
        
        this.init();
    }

    init() {
        this.loadProgress();
        
        if (!this.isCompleted && this.options.autoStart) {
            // Start tour after a short delay to let the app load
            setTimeout(() => {
                this.start();
            }, 1500);
        }
    }

    loadProgress() {
        try {
            const progress = localStorage.getItem('onboarding-completed');
            this.isCompleted = progress === 'true';
        } catch (error) {
            console.warn('Failed to load onboarding progress:', error);
        }
    }

    saveProgress() {
        try {
            localStorage.setItem('onboarding-completed', 'true');
            this.isCompleted = true;
        } catch (error) {
            console.warn('Failed to save onboarding progress:', error);
        }
    }

    start() {
        if (this.isActive || this.isCompleted) return;
        
        this.isActive = true;
        this.currentStep = 0;
        this.createOverlay();
        this.showStep(0);
        
        // Dispatch tour started event
        document.dispatchEvent(new CustomEvent('onboarding:started'));
    }

    createOverlay() {
        this.overlay = document.createElement('div');
        this.overlay.className = 'onboarding-overlay';
        this.overlay.innerHTML = `
            <div class="onboarding-backdrop"></div>
            <div class="onboarding-highlight"></div>
        `;
        
        // Add styles
        this.overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 10000;
            pointer-events: none;
        `;
        
        const backdrop = this.overlay.querySelector('.onboarding-backdrop');
        backdrop.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            backdrop-filter: blur(2px);
        `;
        
        const highlight = this.overlay.querySelector('.onboarding-highlight');
        highlight.style.cssText = `
            position: absolute;
            border-radius: 8px;
            box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.5);
            background: transparent;
            transition: all 0.3s ease;
        `;
        
        document.body.appendChild(this.overlay);
    }

    showStep(stepIndex) {
        if (stepIndex >= this.steps.length) {
            this.complete();
            return;
        }
        
        const step = this.steps[stepIndex];
        const target = document.querySelector(step.target);
        
        if (!target) {
            console.warn(`Onboarding target not found: ${step.target}`);
            this.next();
            return;
        }
        
        this.currentStep = stepIndex;
        this.highlightElement(target);
        this.showTooltip(step, target);
    }

    highlightElement(element) {
        const rect = element.getBoundingClientRect();
        const highlight = this.overlay.querySelector('.onboarding-highlight');
        
        highlight.style.cssText += `
            top: ${rect.top - 8}px;
            left: ${rect.left - 8}px;
            width: ${rect.width + 16}px;
            height: ${rect.height + 16}px;
        `;
    }

    showTooltip(step, target) {
        if (this.tooltip) {
            this.tooltip.remove();
        }
        
        this.tooltip = document.createElement('div');
        this.tooltip.className = 'onboarding-tooltip';
        this.tooltip.style.cssText = `
            position: fixed;
            max-width: 300px;
            background: white;
            border-radius: 8px;
            padding: 20px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
            z-index: 10001;
            pointer-events: auto;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        `;
        
        this.tooltip.innerHTML = `
            <div class="tooltip-header">
                <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: #333;">
                    ${step.title}
                </h3>
                ${step.showSkip ? `
                    <button class="skip-tour-btn" style="
                        position: absolute;
                        top: 16px;
                        right: 16px;
                        background: none;
                        border: none;
                        font-size: 14px;
                        color: #666;
                        cursor: pointer;
                        text-decoration: underline;
                    ">Skip Tour</button>
                ` : ''}
            </div>
            <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.5; color: #666;">
                ${step.content}
            </p>
            <div class="tooltip-footer" style="display: flex; justify-content: space-between; align-items: center;">
                <div class="step-indicator" style="font-size: 12px; color: #999;">
                    ${this.currentStep + 1} of ${this.steps.length}
                </div>
                <div class="tooltip-buttons">
                    ${this.currentStep > 0 ? `
                        <button class="prev-btn" style="
                            background: none;
                            border: 1px solid #ddd;
                            border-radius: 4px;
                            padding: 8px 16px;
                            margin-right: 8px;
                            cursor: pointer;
                            font-size: 14px;
                        ">Previous</button>
                    ` : ''}
                    <button class="next-btn" style="
                        background: #4a6da7;
                        color: white;
                        border: none;
                        border-radius: 4px;
                        padding: 8px 16px;
                        cursor: pointer;
                        font-size: 14px;
                    ">
                        ${this.currentStep === this.steps.length - 1 ? 'Finish' : 'Next'}
                    </button>
                </div>
            </div>
        `;
        
        this.positionTooltip(step, target);
        this.bindTooltipEvents();
        
        document.body.appendChild(this.tooltip);
        
        // Animate in
        setTimeout(() => {
            this.tooltip.style.opacity = '1';
            this.tooltip.style.transform = 'scale(1)';
        }, 10);
    }

    positionTooltip(step, target) {
        const rect = target.getBoundingClientRect();
        const tooltipWidth = 300;
        const tooltipHeight = 150; // Approximate
        const margin = 16;
        
        let top, left;
        
        switch (step.position) {
            case 'top':
                top = rect.top - tooltipHeight - margin;
                left = rect.left + (rect.width / 2) - (tooltipWidth / 2);
                break;
            case 'bottom':
                top = rect.bottom + margin;
                left = rect.left + (rect.width / 2) - (tooltipWidth / 2);
                break;
            case 'left':
                top = rect.top + (rect.height / 2) - (tooltipHeight / 2);
                left = rect.left - tooltipWidth - margin;
                break;
            case 'right':
                top = rect.top + (rect.height / 2) - (tooltipHeight / 2);
                left = rect.right + margin;
                break;
            default:
                top = rect.bottom + margin;
                left = rect.left;
        }
        
        // Keep tooltip within viewport
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        if (left < margin) left = margin;
        if (left + tooltipWidth > viewportWidth - margin) {
            left = viewportWidth - tooltipWidth - margin;
        }
        if (top < margin) top = margin;
        if (top + tooltipHeight > viewportHeight - margin) {
            top = viewportHeight - tooltipHeight - margin;
        }
        
        this.tooltip.style.cssText += `
            top: ${top}px;
            left: ${left}px;
            opacity: 0;
            transform: scale(0.9);
            transition: all 0.2s ease;
        `;
    }

    bindTooltipEvents() {
        const nextBtn = this.tooltip.querySelector('.next-btn');
        const prevBtn = this.tooltip.querySelector('.prev-btn');
        const skipBtn = this.tooltip.querySelector('.skip-tour-btn');
        
        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.next());
        }
        
        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.previous());
        }
        
        if (skipBtn) {
            skipBtn.addEventListener('click', () => this.skip());
        }
        
        // Close on escape key
        document.addEventListener('keydown', this.handleKeydown.bind(this));
    }

    handleKeydown(event) {
        if (!this.isActive) return;
        
        switch (event.key) {
            case 'Escape':
                this.skip();
                break;
            case 'ArrowRight':
            case 'Enter':
                this.next();
                break;
            case 'ArrowLeft':
                this.previous();
                break;
        }
    }

    next() {
        const step = this.steps[this.currentStep];
        
        // Execute step action if defined
        if (step.action && step.action() === false) {
            return; // Action prevented navigation
        }
        
        this.showStep(this.currentStep + 1);
    }

    previous() {
        if (this.currentStep > 0) {
            this.showStep(this.currentStep - 1);
        }
    }

    skip() {
        this.complete(false);
    }

    complete(markCompleted = true) {
        this.isActive = false;
        
        if (markCompleted) {
            this.saveProgress();
        }
        
        // Remove overlay and tooltip
        if (this.overlay) {
            this.overlay.remove();
            this.overlay = null;
        }
        
        if (this.tooltip) {
            this.tooltip.remove();
            this.tooltip = null;
        }
        
        // Remove event listeners
        document.removeEventListener('keydown', this.handleKeydown);
        
        // Show completion message if tour was completed
        if (markCompleted) {
            this.showCompletionMessage();
        }
        
        // Dispatch tour completed event
        document.dispatchEvent(new CustomEvent('onboarding:completed', {
            detail: { completed: markCompleted }
        }));
    }

    showCompletionMessage() {
        const notification = document.createElement('div');
        notification.className = 'onboarding-completion';
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #4a6da7;
            color: white;
            padding: 16px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
            z-index: 10000;
            max-width: 300px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        `;
        
        notification.innerHTML = `
            <div style="display: flex; align-items: center; margin-bottom: 8px;">
                <span style="font-size: 18px; margin-right: 8px;">🎉</span>
                <strong>Welcome aboard!</strong>
            </div>
            <p style="margin: 0; font-size: 14px; opacity: 0.9;">
                You're all set! Start adding bookmarks and organizing your apps.
            </p>
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            notification.style.transition = 'all 0.3s ease';
            
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 5000);
    }

    // Public API
    restart() {
        this.isCompleted = false;
        localStorage.removeItem('onboarding-completed');
        this.start();
    }

    isRunning() {
        return this.isActive;
    }

    getCurrentStep() {
        return this.currentStep;
    }

    addStep(step) {
        this.steps.push(step);
    }

    removeStep(index) {
        if (index >= 0 && index < this.steps.length) {
            this.steps.splice(index, 1);
        }
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = OnboardingTour;
}