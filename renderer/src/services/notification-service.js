/**
 * Notification Service Module
 * Handles all user notifications and feedback
 */

class NotificationService {
    constructor() {
        this.container = null;
        this.notifications = new Map();
        this.init();
    }

    /**
     * Initialize the notification system
     */
    init() {
        this.createContainer();
    }

    /**
     * Create the notification container
     */
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

    /**
     * Show a notification
     */
    show(message, type = 'info', options = {}) {
        const id = Date.now().toString();
        const notification = this.createNotification(id, message, type, options);
        
        this.container.appendChild(notification);
        this.notifications.set(id, notification);

        // Trigger entrance animation
        requestAnimationFrame(() => {
            notification.classList.add('show');
        });

        // Auto-dismiss
        const duration = options.duration || this.getDefaultDuration(type);
        if (duration > 0) {
            setTimeout(() => {
                this.dismiss(id);
            }, duration);
        }

        return id;
    }

    /**
     * Create a notification element
     */
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

        // Add type-specific styling
        const typeStyles = this.getTypeStyles(type);
        Object.assign(notification.style, typeStyles);

        // Create content
        const content = document.createElement('div');
        content.className = 'notification-content';
        content.style.cssText = `
            display: flex;
            align-items: center;
            gap: 8px;
        `;

        // Add icon
        const icon = document.createElement('i');
        icon.className = this.getTypeIcon(type);
        icon.style.fontSize = '16px';
        content.appendChild(icon);

        // Add message
        const messageEl = document.createElement('span');
        messageEl.textContent = message;
        messageEl.style.flex = '1';
        content.appendChild(messageEl);

        // Add close button if specified
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

        // Add progress bar for timed notifications
        if (options.showProgress !== false && (options.duration || this.getDefaultDuration(type)) > 0) {
            const progressBar = document.createElement('div');
            progressBar.style.cssText = `
                position: absolute;
                bottom: 0;
                left: 0;
                height: 3px;
                background: currentColor;
                opacity: 0.3;
                animation: notification-progress ${options.duration || this.getDefaultDuration(type)}ms linear;
            `;
            notification.appendChild(progressBar);
        }

        return notification;
    }

    /**
     * Get type-specific styles
     */
    getTypeStyles(type) {
        const styles = {
            info: {
                borderLeftColor: '#3498db',
                borderLeftWidth: '4px'
            },
            success: {
                borderLeftColor: '#27ae60',
                borderLeftWidth: '4px'
            },
            warning: {
                borderLeftColor: '#f39c12',
                borderLeftWidth: '4px'
            },
            error: {
                borderLeftColor: '#e74c3c',
                borderLeftWidth: '4px'
            }
        };
        return styles[type] || styles.info;
    }

    /**
     * Get type-specific icon
     */
    getTypeIcon(type) {
        const icons = {
            info: 'fas fa-info-circle',
            success: 'fas fa-check-circle',
            warning: 'fas fa-exclamation-triangle',
            error: 'fas fa-times-circle'
        };
        return icons[type] || icons.info;
    }

    /**
     * Get default duration for notification type
     */
    getDefaultDuration(type) {
        const durations = {
            info: 4000,
            success: 3000,
            warning: 5000,
            error: 6000
        };
        return durations[type] || 4000;
    }

    /**
     * Dismiss a notification
     */
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

    /**
     * Dismiss all notifications
     */
    dismissAll() {
        this.notifications.forEach((_, id) => {
            this.dismiss(id);
        });
    }

    /**
     * Convenience methods
     */
    info(message, options = {}) {
        return this.show(message, 'info', options);
    }

    success(message, options = {}) {
        return this.show(message, 'success', options);
    }

    warning(message, options = {}) {
        return this.show(message, 'warning', options);
    }

    error(message, options = {}) {
        return this.show(message, 'error', options);
    }

    /**
     * Show loading notification
     */
    loading(message, options = {}) {
        const loadingOptions = {
            ...options,
            duration: 0, // Don't auto-dismiss
            closable: false,
            showProgress: false
        };
        
        const id = this.show(message, 'info', loadingOptions);
        
        // Add loading spinner
        const notification = this.notifications.get(id);
        if (notification) {
            const icon = notification.querySelector('i');
            icon.className = 'fas fa-spinner fa-spin';
        }
        
        return id;
    }

    /**
     * Update an existing notification
     */
    update(id, message, type) {
        const notification = this.notifications.get(id);
        if (!notification) return;

        const messageEl = notification.querySelector('.notification-content span');
        const icon = notification.querySelector('i');
        
        if (messageEl) messageEl.textContent = message;
        if (icon && type) {
            icon.className = this.getTypeIcon(type);
            notification.className = `notification notification-${type}`;
            Object.assign(notification.style, this.getTypeStyles(type));
        }
    }
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    .notification.show {
        transform: translateX(0) !important;
        opacity: 1 !important;
    }

    @keyframes notification-progress {
        from { width: 100%; }
        to { width: 0%; }
    }

    .notifications-container {
        pointer-events: none;
    }

    .notification {
        pointer-events: auto;
    }
`;
document.head.appendChild(style);

// Create singleton instance
const notificationService = new NotificationService();

export default notificationService;
export { NotificationService }; 