const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
    // App launching
    launchApp: (appPath) => ipcRenderer.invoke('launch-app', appPath),
    openFolder: (folderPath) => ipcRenderer.invoke('open-folder', folderPath),
    showItemInFolder: (itemPath) => ipcRenderer.invoke('show-item-in-folder', itemPath),
    
    // File browsing
    browseForApp: () => ipcRenderer.invoke('browse-for-app'),
    browseForFolder: () => ipcRenderer.invoke('browse-for-folder'),
    scanApplications: () => ipcRenderer.invoke('scan-applications'),
    
    // App information and icons
    fetchAppIcon: (appName) => ipcRenderer.invoke('fetch-app-icon', appName),
    getAppInfo: (appPath) => ipcRenderer.invoke('get-app-info', appPath),
    extractAppIcon: (appPath) => ipcRenderer.invoke('extract-app-icon', appPath),
    
    // Menu events
    onMenuNewBookmark: (callback) => ipcRenderer.on('menu-new-bookmark', callback),
    onMenuToggleAdmin: (callback) => ipcRenderer.on('menu-toggle-admin', callback),
    onMenuToggleTheme: (callback) => ipcRenderer.on('menu-toggle-theme', callback),
    onImportBookmarks: (callback) => ipcRenderer.on('import-bookmarks', callback),
    onExportBookmarks: (callback) => ipcRenderer.on('export-bookmarks', callback),
    
    // Auto updater
    checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
    downloadUpdate: () => ipcRenderer.invoke('download-update'),
    quitAndInstall: () => ipcRenderer.invoke('quit-and-install'),
    getAppVersion: () => ipcRenderer.invoke('get-app-version'),
    onUpdaterMessage: (callback) => ipcRenderer.on('updater-message', callback),
    
    // Platform info
    platform: process.platform,
    
    // Notifications
    showNotification: (title, body, options = {}) => {
        new Notification(title, { body, ...options });
    }
});

// Add some useful globals
contextBridge.exposeInMainWorld('appInfo', {
    platform: process.platform,
    isElectron: true,
    version: require('./package.json').version
});