/**
 * Modal Component
 * Reusable modal dialog with accessibility features
 */
class Modal {
    constructor(options = {}) {
        this.options = {
            title: 'Modal',
            content: '',
            size: 'medium', // small, medium, large, fullscreen
            closable: true,
            backdrop: true,
            keyboard: true,
            focus: true,
            className: '',
            ...options
        };
        
        this.element = null;
        this.isOpen = false;
        this.focusedElementBeforeOpen = null;
        this.callbacks = {
            onOpen: () => {},
            onClose: () => {},
            onConfirm: () => {},
            onCancel: () => {}
        };
    }

    render() {
        this.element = document.createElement('div');
        this.element.className = `modal ${this.options.className}`;
        this.element.setAttribute('role', 'dialog');
        this.element.setAttribute('aria-modal', 'true');
        this.element.setAttribute('aria-labelledby', 'modal-title');
        this.element.style.display = 'none';
        
        this.element.innerHTML = this.getTemplate();
        this.bindEvents();
        
        document.body.appendChild(this.element);
        return this.element;
    }

    getTemplate() {
        return `
            <div class="modal-backdrop" ${this.options.backdrop ? '' : 'style="display: none;"'}></div>
            <div class="modal-dialog modal-${this.options.size}">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3 id="modal-title" class="modal-title">${this.escapeHtml(this.options.title)}</h3>
                        ${this.options.closable ? `
                            <button class="modal-close" aria-label="Close modal">
                                <i class="fas fa-times"></i>
                            </button>
                        ` : ''}
                    </div>
                    <div class="modal-body">
                        ${this.options.content}
                    </div>
                    <div class="modal-footer hidden">
                        <!-- Footer content will be added dynamically -->
                    </div>
                </div>
            </div>
        `;
    }

    bindEvents() {
        if (!this.element) return;

        // Close button
        if (this.options.closable) {
            const closeBtn = this.element.querySelector('.modal-close');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => this.close());
            }
        }

        // Backdrop click
        if (this.options.backdrop) {
            const backdrop = this.element.querySelector('.modal-backdrop');
            if (backdrop) {
                backdrop.addEventListener('click', () => this.close());
            }
        }

        // Keyboard events
        if (this.options.keyboard) {
            this.element.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.options.closable) {
                    this.close();
                } else if (e.key === 'Tab') {
                    this.handleTabKey(e);
                }
            });
        }
    }

    handleTabKey(e) {
        const focusableElements = this.element.querySelectorAll(
            'a[href], button:not([disabled]), textarea:not([disabled]), input[type="text"]:not([disabled]), input[type="radio"]:not([disabled]), input[type="checkbox"]:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
            if (document.activeElement === firstElement) {
                e.preventDefault();
                lastElement.focus();
            }
        } else {
            if (document.activeElement === lastElement) {
                e.preventDefault();
                firstElement.focus();
            }
        }
    }

    open() {
        if (this.isOpen) return;

        if (!this.element) {
            this.render();
        }

        this.focusedElementBeforeOpen = document.activeElement;
        this.isOpen = true;
        
        this.element.style.display = 'flex';
        document.body.classList.add('modal-open');
        
        // Fade in animation
        setTimeout(() => {
            this.element.classList.add('show');
        }, 10);

        // Focus management
        if (this.options.focus) {
            const firstFocusable = this.element.querySelector(
                'input, button, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            if (firstFocusable) {
                firstFocusable.focus();
            }
        }

        this.callbacks.onOpen();
        
        // Dispatch custom event
        this.element.dispatchEvent(new CustomEvent('modal:open', {
            detail: { modal: this }
        }));
    }

    close() {
        if (!this.isOpen) return;

        this.isOpen = false;
        this.element.classList.remove('show');
        
        setTimeout(() => {
            this.element.style.display = 'none';
            document.body.classList.remove('modal-open');
            
            // Restore focus
            if (this.focusedElementBeforeOpen) {
                this.focusedElementBeforeOpen.focus();
            }
        }, 300); // Match CSS transition duration

        this.callbacks.onClose();
        
        // Dispatch custom event
        this.element.dispatchEvent(new CustomEvent('modal:close', {
            detail: { modal: this }
        }));
    }

    setTitle(title) {
        if (!this.element) return;
        const titleElement = this.element.querySelector('#modal-title');
        if (titleElement) {
            titleElement.textContent = title;
        }
    }

    setContent(content) {
        if (!this.element) return;
        const bodyElement = this.element.querySelector('.modal-body');
        if (bodyElement) {
            if (typeof content === 'string') {
                bodyElement.innerHTML = content;
            } else {
                bodyElement.innerHTML = '';
                bodyElement.appendChild(content);
            }
        }
    }

    setFooter(content) {
        if (!this.element) return;
        const footerElement = this.element.querySelector('.modal-footer');
        if (footerElement) {
            footerElement.classList.remove('hidden');
            if (typeof content === 'string') {
                footerElement.innerHTML = content;
            } else {
                footerElement.innerHTML = '';
                footerElement.appendChild(content);
            }
        }
    }

    addButton(text, className = 'btn-secondary', callback = null) {
        const button = document.createElement('button');
        button.className = `btn ${className}`;
        button.textContent = text;
        
        if (callback) {
            button.addEventListener('click', callback);
        }

        let footerElement = this.element.querySelector('.modal-footer');
        if (!footerElement) {
            footerElement = document.createElement('div');
            footerElement.className = 'modal-footer';
            this.element.querySelector('.modal-content').appendChild(footerElement);
        }
        
        footerElement.classList.remove('hidden');
        footerElement.appendChild(button);
        
        return button;
    }

    showLoading(message = 'Loading...') {
        this.setContent(`
            <div class="modal-loading">
                <div class="loading-spinner"></div>
                <p>${this.escapeHtml(message)}</p>
            </div>
        `);
    }

    showError(message = 'An error occurred') {
        this.setContent(`
            <div class="modal-error">
                <i class="fas fa-exclamation-triangle"></i>
                <p>${this.escapeHtml(message)}</p>
            </div>
        `);
    }

    showSuccess(message = 'Success!') {
        this.setContent(`
            <div class="modal-success">
                <i class="fas fa-check-circle"></i>
                <p>${this.escapeHtml(message)}</p>
            </div>
        `);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Event listeners
    onOpen(callback) {
        this.callbacks.onOpen = callback;
        return this;
    }

    onClose(callback) {
        this.callbacks.onClose = callback;
        return this;
    }

    onConfirm(callback) {
        this.callbacks.onConfirm = callback;
        return this;
    }

    onCancel(callback) {
        this.callbacks.onCancel = callback;
        return this;
    }

    destroy() {
        if (this.element) {
            this.close();
            setTimeout(() => {
                if (this.element.parentNode) {
                    this.element.parentNode.removeChild(this.element);
                }
                this.element = null;
            }, 300);
        }
    }

    // Static factory methods
    static confirm(options = {}) {
        const modal = new Modal({
            title: 'Confirm',
            size: 'small',
            ...options
        });

        modal.render();
        
        modal.addButton('Cancel', 'btn-secondary', () => {
            modal.callbacks.onCancel();
            modal.close();
        });
        
        modal.addButton('Confirm', 'btn-primary', () => {
            modal.callbacks.onConfirm();
            modal.close();
        });

        return modal;
    }

    static alert(options = {}) {
        const modal = new Modal({
            title: 'Alert',
            size: 'small',
            ...options
        });

        modal.render();
        
        modal.addButton('OK', 'btn-primary', () => {
            modal.callbacks.onConfirm();
            modal.close();
        });

        return modal;
    }

    static prompt(options = {}) {
        const modal = new Modal({
            title: 'Input Required',
            size: 'small',
            ...options
        });

        const inputId = 'modal-prompt-input';
        modal.setContent(`
            <div class="form-group">
                <label for="${inputId}">${options.message || 'Please enter a value:'}</label>
                <input type="text" id="${inputId}" class="form-control" value="${options.defaultValue || ''}" placeholder="${options.placeholder || ''}">
            </div>
        `);

        modal.render();
        
        modal.addButton('Cancel', 'btn-secondary', () => {
            modal.callbacks.onCancel(null);
            modal.close();
        });
        
        modal.addButton('OK', 'btn-primary', () => {
            const input = modal.element.querySelector(`#${inputId}`);
            const value = input ? input.value : '';
            modal.callbacks.onConfirm(value);
            modal.close();
        });

        return modal;
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Modal;
}