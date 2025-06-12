/**
 * Backup Service
 * Handles automatic backups and cloud synchronization
 */
class BackupService {
    constructor(options = {}) {
        this.options = {
            autoBackupInterval: 24 * 60 * 60 * 1000, // 24 hours
            maxLocalBackups: 10,
            maxCloudBackups: 50,
            backupFormat: 'json',
            compression: true,
            encryption: false,
            cloudProviders: ['local', 'googledrive', 'dropbox', 'onedrive'],
            ...options
        };
        
        this.isEnabled = false;
        this.lastBackupTime = null;
        this.backupTimer = null;
        this.syncQueue = [];
        this.isOnline = navigator.onLine;
        
        this.storage = {
            local: new LocalBackupProvider(),
            googledrive: null,
            dropbox: null,
            onedrive: null
        };
        
        this.init();
    }

    init() {
        this.loadSettings();
        this.setupOnlineStatusMonitoring();
        this.setupAutoBackup();
        this.cleanupOldBackups();
    }

    loadSettings() {
        try {
            const settings = localStorage.getItem('backup-settings');
            if (settings) {
                const parsed = JSON.parse(settings);
                this.options = { ...this.options, ...parsed };
                this.isEnabled = parsed.enabled || false;
                this.lastBackupTime = parsed.lastBackupTime ? new Date(parsed.lastBackupTime) : null;
            }
        } catch (error) {
            console.error('Failed to load backup settings:', error);
        }
    }

    saveSettings() {
        try {
            const settings = {
                ...this.options,
                enabled: this.isEnabled,
                lastBackupTime: this.lastBackupTime?.toISOString()
            };
            localStorage.setItem('backup-settings', JSON.stringify(settings));
        } catch (error) {
            console.error('Failed to save backup settings:', error);
        }
    }

    setupOnlineStatusMonitoring() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.processSyncQueue();
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
        });
    }

    setupAutoBackup() {
        if (this.isEnabled && this.options.autoBackupInterval > 0) {
            this.scheduleNextBackup();
        }
    }

    scheduleNextBackup() {
        if (this.backupTimer) {
            clearTimeout(this.backupTimer);
        }

        const nextBackupTime = this.calculateNextBackupTime();
        const delay = Math.max(0, nextBackupTime - Date.now());

        this.backupTimer = setTimeout(() => {
            this.performAutoBackup();
        }, delay);
    }

    calculateNextBackupTime() {
        if (!this.lastBackupTime) {
            return Date.now() + 60000; // 1 minute for first backup
        }
        return this.lastBackupTime.getTime() + this.options.autoBackupInterval;
    }

    async performAutoBackup() {
        try {
            const data = await this.collectBackupData();
            await this.createBackup(data, 'auto');
            this.scheduleNextBackup();
        } catch (error) {
            console.error('Auto backup failed:', error);
            // Retry in 1 hour
            this.backupTimer = setTimeout(() => {
                this.performAutoBackup();
            }, 60 * 60 * 1000);
        }
    }

    async collectBackupData() {
        // Collect all application data
        const data = {
            version: '1.0.0',
            timestamp: new Date().toISOString(),
            bookmarks: this.getBookmarks(),
            categories: this.getCategories(),
            settings: this.getSettings(),
            analytics: this.getAnalytics(),
            applications: this.getApplications()
        };

        return data;
    }

    getBookmarks() {
        try {
            return JSON.parse(localStorage.getItem('bookmarks') || '[]');
        } catch (error) {
            return [];
        }
    }

    getCategories() {
        try {
            return JSON.parse(localStorage.getItem('categories') || '[]');
        } catch (error) {
            return [];
        }
    }

    getSettings() {
        const settings = {};
        const keys = ['theme', 'grid-columns', 'view-mode', 'sort-order'];
        
        keys.forEach(key => {
            const value = localStorage.getItem(key);
            if (value !== null) {
                settings[key] = value;
            }
        });
        
        return settings;
    }

    getAnalytics() {
        try {
            return JSON.parse(localStorage.getItem('analytics') || '{}');
        } catch (error) {
            return {};
        }
    }

    getApplications() {
        try {
            return JSON.parse(localStorage.getItem('applications') || '[]');
        } catch (error) {
            return [];
        }
    }

    async createBackup(data, type = 'manual') {
        const backup = {
            id: this.generateBackupId(),
            type: type,
            timestamp: new Date().toISOString(),
            size: 0,
            data: data
        };

        if (this.options.compression) {
            backup.data = await this.compressData(data);
            backup.compressed = true;
        }

        if (this.options.encryption) {
            backup.data = await this.encryptData(backup.data);
            backup.encrypted = true;
        }

        backup.size = this.calculateDataSize(backup.data);

        // Save to local storage first
        await this.storage.local.saveBackup(backup);

        // Queue for cloud sync if online
        if (this.isOnline) {
            this.queueCloudSync(backup);
        } else {
            this.syncQueue.push(backup);
        }

        this.lastBackupTime = new Date();
        this.saveSettings();

        // Dispatch backup created event
        document.dispatchEvent(new CustomEvent('backup:created', {
            detail: { backup, type }
        }));

        return backup;
    }

    generateBackupId() {
        return `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    async compressData(data) {
        if ('CompressionStream' in window) {
            const stream = new CompressionStream('gzip');
            const writer = stream.writable.getWriter();
            const reader = stream.readable.getReader();
            
            writer.write(new TextEncoder().encode(JSON.stringify(data)));
            writer.close();
            
            const chunks = [];
            let done = false;
            
            while (!done) {
                const { value, done: readerDone } = await reader.read();
                done = readerDone;
                if (value) chunks.push(value);
            }
            
            return Array.from(new Uint8Array(await new Blob(chunks).arrayBuffer()));
        } else {
            // Fallback: simple JSON compression (removing whitespace)
            return JSON.stringify(data);
        }
    }

    async encryptData(data) {
        // Simple encryption implementation
        // In production, use a proper encryption library
        if (typeof data === 'string') {
            return btoa(data);
        }
        return btoa(JSON.stringify(data));
    }

    calculateDataSize(data) {
        if (typeof data === 'string') {
            return new Blob([data]).size;
        }
        return new Blob([JSON.stringify(data)]).size;
    }

    async queueCloudSync(backup) {
        const enabledProviders = this.options.cloudProviders.filter(p => p !== 'local');
        
        for (const provider of enabledProviders) {
            if (this.storage[provider] && this.storage[provider].isConfigured()) {
                try {
                    await this.storage[provider].saveBackup(backup);
                } catch (error) {
                    console.error(`Failed to sync to ${provider}:`, error);
                    this.syncQueue.push({ backup, provider });
                }
            }
        }
    }

    async processSyncQueue() {
        while (this.syncQueue.length > 0 && this.isOnline) {
            const item = this.syncQueue.shift();
            
            try {
                if (item.provider) {
                    await this.storage[item.provider].saveBackup(item.backup);
                } else {
                    await this.queueCloudSync(item);
                }
            } catch (error) {
                console.error('Failed to process sync queue item:', error);
                // Re-queue if it's a temporary failure
                if (this.isTemporaryError(error)) {
                    this.syncQueue.push(item);
                }
            }
        }
    }

    isTemporaryError(error) {
        const temporaryErrors = [
            'Network error',
            'Rate limit',
            'Service unavailable',
            'Timeout'
        ];
        
        return temporaryErrors.some(temp => 
            error.message.toLowerCase().includes(temp.toLowerCase())
        );
    }

    async restoreBackup(backupId, provider = 'local') {
        try {
            const backup = await this.storage[provider].getBackup(backupId);
            
            if (!backup) {
                throw new Error('Backup not found');
            }

            let data = backup.data;

            // Decrypt if needed
            if (backup.encrypted) {
                data = await this.decryptData(data);
            }

            // Decompress if needed
            if (backup.compressed) {
                data = await this.decompressData(data);
            }

            // Restore data
            await this.restoreData(data);

            // Dispatch restore event
            document.dispatchEvent(new CustomEvent('backup:restored', {
                detail: { backup, provider }
            }));

            return true;
        } catch (error) {
            console.error('Failed to restore backup:', error);
            throw error;
        }
    }

    async decryptData(data) {
        // Simple decryption (reverse of encryption)
        if (typeof data === 'string') {
            return atob(data);
        }
        return JSON.parse(atob(data));
    }

    async decompressData(data) {
        if ('DecompressionStream' in window && Array.isArray(data)) {
            const stream = new DecompressionStream('gzip');
            const writer = stream.writable.getWriter();
            const reader = stream.readable.getReader();
            
            writer.write(new Uint8Array(data));
            writer.close();
            
            const chunks = [];
            let done = false;
            
            while (!done) {
                const { value, done: readerDone } = await reader.read();
                done = readerDone;
                if (value) chunks.push(value);
            }
            
            const decompressed = new TextDecoder().decode(
                new Uint8Array(await new Blob(chunks).arrayBuffer())
            );
            
            return JSON.parse(decompressed);
        } else {
            return typeof data === 'string' ? JSON.parse(data) : data;
        }
    }

    async restoreData(data) {
        // Restore bookmarks
        if (data.bookmarks) {
            localStorage.setItem('bookmarks', JSON.stringify(data.bookmarks));
        }

        // Restore categories
        if (data.categories) {
            localStorage.setItem('categories', JSON.stringify(data.categories));
        }

        // Restore settings
        if (data.settings) {
            Object.entries(data.settings).forEach(([key, value]) => {
                localStorage.setItem(key, value);
            });
        }

        // Restore analytics
        if (data.analytics) {
            localStorage.setItem('analytics', JSON.stringify(data.analytics));
        }

        // Restore applications
        if (data.applications) {
            localStorage.setItem('applications', JSON.stringify(data.applications));
        }

        // Reload application state
        if (window.location) {
            window.location.reload();
        }
    }

    async listBackups(provider = 'local') {
        return await this.storage[provider].listBackups();
    }

    async deleteBackup(backupId, provider = 'local') {
        return await this.storage[provider].deleteBackup(backupId);
    }

    async cleanupOldBackups() {
        try {
            const localBackups = await this.listBackups('local');
            if (localBackups.length > this.options.maxLocalBackups) {
                const toDelete = localBackups
                    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
                    .slice(0, localBackups.length - this.options.maxLocalBackups);
                
                for (const backup of toDelete) {
                    await this.deleteBackup(backup.id, 'local');
                }
            }
        } catch (error) {
            console.error('Failed to cleanup old backups:', error);
        }
    }

    // Public API
    enable() {
        this.isEnabled = true;
        this.saveSettings();
        this.setupAutoBackup();
    }

    disable() {
        this.isEnabled = false;
        if (this.backupTimer) {
            clearTimeout(this.backupTimer);
            this.backupTimer = null;
        }
        this.saveSettings();
    }

    async manualBackup() {
        const data = await this.collectBackupData();
        return await this.createBackup(data, 'manual');
    }

    getStatus() {
        return {
            enabled: this.isEnabled,
            lastBackup: this.lastBackupTime,
            nextBackup: this.backupTimer ? 
                new Date(Date.now() + this.calculateNextBackupTime() - Date.now()) : null,
            syncQueue: this.syncQueue.length,
            isOnline: this.isOnline
        };
    }

    updateSettings(newSettings) {
        this.options = { ...this.options, ...newSettings };
        this.saveSettings();
        
        if (this.isEnabled) {
            this.setupAutoBackup();
        }
    }
}

// Local Backup Provider
class LocalBackupProvider {
    constructor() {
        this.storageKey = 'bookmark-backups';
    }

    async saveBackup(backup) {
        try {
            const existingBackups = await this.listBackups();
            existingBackups.push(backup);
            
            localStorage.setItem(this.storageKey, JSON.stringify(existingBackups));
            return backup.id;
        } catch (error) {
            throw new Error(`Failed to save local backup: ${error.message}`);
        }
    }

    async getBackup(backupId) {
        const backups = await this.listBackups();
        return backups.find(b => b.id === backupId);
    }

    async listBackups() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            return [];
        }
    }

    async deleteBackup(backupId) {
        const backups = await this.listBackups();
        const filtered = backups.filter(b => b.id !== backupId);
        localStorage.setItem(this.storageKey, JSON.stringify(filtered));
        return true;
    }

    isConfigured() {
        return true; // Local storage is always available
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BackupService;
}