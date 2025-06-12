const { app, BrowserWindow, Menu, ipcMain, shell, dialog } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const { exec } = require('child_process');
const fs = require('fs');

// Keep a global reference of the window object
let mainWindow;

function createWindow() {
    // Create the browser window
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 800,
        minHeight: 600,
        icon: path.join(__dirname, 'assets/icon.png'),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            enableRemoteModule: false,
            preload: path.join(__dirname, 'preload.js')
        },
        titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
        show: false
    });

    // Load the app
    mainWindow.loadFile('renderer/index.html');

    // Show window when ready to prevent visual flash
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });

    // Open DevTools in development
    if (process.argv.includes('--dev')) {
        mainWindow.webContents.openDevTools();
    }

    // Emitted when the window is closed
    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    // Handle external links
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        shell.openExternal(url);
        return { action: 'deny' };
    });
}

// This method will be called when Electron has finished initialization
app.whenReady().then(() => {
    createWindow();
    createMenu();
    setupAutoUpdater();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

// Quit when all windows are closed
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// Setup Auto Updater (commented out for demo)
function setupAutoUpdater() {
    // Configure auto updater for GitHub releases
    autoUpdater.setFeedURL({
        provider: 'github',
        owner: 'aardel',
        repo: 'Bookmarks',
        private: false
    });

    // Configure auto updater settings
    autoUpdater.autoDownload = false; // Don't auto-download, ask user first
    autoUpdater.autoInstallOnAppQuit = false; // Don't auto-install on quit

    // Set update feed URL for development
    if (!app.isPackaged) {
        autoUpdater.updateConfigPath = path.join(__dirname, 'dev-app-update.yml');
    }

    // Auto updater event handlers
    autoUpdater.on('checking-for-update', () => {
        console.log('Checking for update...');
        if (mainWindow) {
            mainWindow.webContents.send('updater-message', {
                type: 'checking',
                message: 'Checking for updates...'
            });
        }
    });

    autoUpdater.on('update-available', (info) => {
        console.log('Update available:', info);
        if (mainWindow) {
            mainWindow.webContents.send('updater-message', {
                type: 'available',
                message: `Update available: v${info.version}`,
                version: info.version,
                releaseNotes: info.releaseNotes,
                releaseDate: info.releaseDate
            });
        }

        // Show dialog to user asking if they want to download
        const response = dialog.showMessageBoxSync(mainWindow, {
            type: 'info',
            buttons: ['Download Now', 'Later', 'View Release Notes'],
            defaultId: 0,
            title: 'Update Available',
            message: `A new version (v${info.version}) is available!`,
            detail: 'Would you like to download it now?'
        });

        if (response === 0) {
            // User chose to download
            autoUpdater.downloadUpdate();
        } else if (response === 2) {
            // User wants to view release notes
            if (info.releaseNotes) {
                shell.openExternal(`https://github.com/aardel/Bookmarks/releases/tag/v${info.version}`);
            }
        }
    });

    autoUpdater.on('update-not-available', (info) => {
        console.log('Update not available. Current version:', app.getVersion());
        if (mainWindow) {
            mainWindow.webContents.send('updater-message', {
                type: 'not-available',
                message: `You are running the latest version (v${app.getVersion()}).`,
                version: app.getVersion()
            });
        }
    });

    autoUpdater.on('error', (err) => {
        console.error('Update error:', err);
        if (mainWindow) {
            mainWindow.webContents.send('updater-message', {
                type: 'error',
                message: 'Update check failed: ' + err.message
            });
        }
    });

    autoUpdater.on('download-progress', (progressObj) => {
        let logMessage = `Download speed: ${(progressObj.bytesPerSecond / 1024 / 1024).toFixed(2)} MB/s`;
        logMessage += ` - Downloaded ${Math.round(progressObj.percent)}%`;
        logMessage += ` (${(progressObj.transferred / 1024 / 1024).toFixed(2)}/${(progressObj.total / 1024 / 1024).toFixed(2)} MB)`;
        console.log(logMessage);
        
        if (mainWindow) {
            mainWindow.webContents.send('updater-message', {
                type: 'download-progress',
                message: `Downloading update... ${Math.round(progressObj.percent)}%`,
                progress: {
                    percent: Math.round(progressObj.percent),
                    transferred: (progressObj.transferred / 1024 / 1024).toFixed(2),
                    total: (progressObj.total / 1024 / 1024).toFixed(2),
                    speed: (progressObj.bytesPerSecond / 1024 / 1024).toFixed(2)
                }
            });
        }
    });

    autoUpdater.on('update-downloaded', (info) => {
        console.log('Update downloaded:', info);
        if (mainWindow) {
            mainWindow.webContents.send('updater-message', {
                type: 'downloaded',
                message: `Update v${info.version} downloaded. Ready to install.`,
                version: info.version
            });
        }
        
        // Show notification to user
        const response = dialog.showMessageBoxSync(mainWindow, {
            type: 'info',
            buttons: ['Restart Now', 'Later'],
            defaultId: 0,
            title: 'Update Downloaded',
            message: `Update v${info.version} has been downloaded successfully!`,
            detail: 'Restart the application now to apply the update, or you can restart later.'
        });

        if (response === 0) {
            autoUpdater.quitAndInstall();
        }
    });

    // Check for updates on startup (after a delay)
    setTimeout(() => {
        console.log('Performing initial update check...');
        autoUpdater.checkForUpdatesAndNotify();
    }, 10000); // Wait 10 seconds after startup

    // Check for updates periodically (every 6 hours)
    setInterval(() => {
        console.log('Performing periodic update check...');
        autoUpdater.checkForUpdatesAndNotify();
    }, 6 * 60 * 60 * 1000); // Every 6 hours
}

// IPC handlers for updater
ipcMain.handle('check-for-updates', async () => {
    try {
        const result = await autoUpdater.checkForUpdatesAndNotify();
        return result;
    } catch (error) {
        console.error('Manual update check failed:', error);
        return { error: error.message };
    }
});

ipcMain.handle('download-update', () => {
    try {
        autoUpdater.downloadUpdate();
        return { success: true };
    } catch (error) {
        console.error('Download update failed:', error);
        return { error: error.message };
    }
});

ipcMain.handle('quit-and-install', () => {
    try {
        autoUpdater.quitAndInstall();
        return { success: true };
    } catch (error) {
        console.error('Quit and install failed:', error);
        return { error: error.message };
    }
});

ipcMain.handle('get-app-version', () => {
    return app.getVersion();
});

// Create application menu
function createMenu() {
    const template = [
        {
            label: 'File',
            submenu: [
                {
                    label: 'New Bookmark',
                    accelerator: 'CmdOrCtrl+N',
                    click: () => {
                        mainWindow.webContents.send('menu-new-bookmark');
                    }
                },
                {
                    label: 'Import Bookmarks',
                    accelerator: 'CmdOrCtrl+I',
                    click: () => {
                        importBookmarks();
                    }
                },
                {
                    label: 'Export Bookmarks',
                    accelerator: 'CmdOrCtrl+E',
                    click: () => {
                        exportBookmarks();
                    }
                },
                { type: 'separator' },
                {
                    label: 'Quit',
                    accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
                    click: () => {
                        app.quit();
                    }
                }
            ]
        },
        {
            label: 'Edit',
            submenu: [
                { role: 'undo' },
                { role: 'redo' },
                { type: 'separator' },
                { role: 'cut' },
                { role: 'copy' },
                { role: 'paste' },
                { role: 'selectall' }
            ]
        },
        {
            label: 'View',
            submenu: [
                {
                    label: 'Toggle Admin Panel',
                    accelerator: 'CmdOrCtrl+/',
                    click: () => {
                        mainWindow.webContents.send('menu-toggle-admin');
                    }
                },
                {
                    label: 'Toggle Theme',
                    accelerator: 'CmdOrCtrl+T',
                    click: () => {
                        mainWindow.webContents.send('menu-toggle-theme');
                    }
                },
                { type: 'separator' },
                { role: 'reload' },
                { role: 'forceReload' },
                { role: 'toggleDevTools' },
                { type: 'separator' },
                { role: 'resetZoom' },
                { role: 'zoomIn' },
                { role: 'zoomOut' },
                { type: 'separator' },
                { role: 'togglefullscreen' }
            ]
        },
        {
            label: 'Window',
            submenu: [
                { role: 'minimize' },
                { role: 'close' }
            ]
        }
    ];

    // macOS specific menu adjustments
    if (process.platform === 'darwin') {
        template.unshift({
            label: app.getName(),
            submenu: [
                { role: 'about' },
                { type: 'separator' },
                { role: 'services', submenu: [] },
                { type: 'separator' },
                { role: 'hide' },
                { role: 'hideothers' },
                { role: 'unhide' },
                { type: 'separator' },
                { role: 'quit' }
            ]
        });

        // Window menu
        template[4].submenu = [
            { role: 'close' },
            { role: 'minimize' },
            { role: 'zoom' },
            { type: 'separator' },
            { role: 'front' }
        ];
    }

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}

// IPC Handlers for native functionality
ipcMain.handle('launch-app', async (event, appPath) => {
    try {
        console.log('Launching app:', appPath);
        
        if (process.platform === 'darwin') {
            // macOS: Use 'open' command for .app bundles or direct shell.openPath
            if (appPath.endsWith('.app')) {
                return await shell.openPath(appPath);
            } else {
                // For command line tools, use exec
                exec(`open "${appPath}"`, (error) => {
                    if (error) console.error('Launch error:', error);
                });
                return '';
            }
        } else if (process.platform === 'win32') {
            // Windows: Direct execution
            return await shell.openPath(appPath);
        } else {
            // Linux: Use shell.openPath
            return await shell.openPath(appPath);
        }
    } catch (error) {
        console.error('Error launching app:', error);
        throw error;
    }
});

ipcMain.handle('open-folder', async (event, folderPath) => {
    try {
        return await shell.openPath(folderPath);
    } catch (error) {
        console.error('Error opening folder:', error);
        throw error;
    }
});

ipcMain.handle('show-item-in-folder', async (event, itemPath) => {
    shell.showItemInFolder(itemPath);
});

ipcMain.handle('browse-for-app', async (event) => {
    const result = await dialog.showOpenDialog(mainWindow, {
        title: 'Select Application',
        properties: ['openFile'],
        filters: process.platform === 'darwin' ? [
            { name: 'Applications', extensions: ['app'] },
            { name: 'All Files', extensions: ['*'] }
        ] : process.platform === 'win32' ? [
            { name: 'Applications', extensions: ['exe'] },
            { name: 'All Files', extensions: ['*'] }
        ] : [
            { name: 'All Files', extensions: ['*'] }
        ]
    });

    if (!result.canceled && result.filePaths.length > 0) {
        return result.filePaths[0];
    }
    return null;
});

ipcMain.handle('browse-for-folder', async (event) => {
    const result = await dialog.showOpenDialog(mainWindow, {
        title: 'Select Folder',
        properties: ['openDirectory']
    });

    if (!result.canceled && result.filePaths.length > 0) {
        return result.filePaths[0];
    }
    return null;
});

ipcMain.handle('scan-applications', async (event) => {
    try {
        const apps = [];
        
        if (process.platform === 'darwin') {
            // Scan /Applications and ~/Applications
            const appDirs = ['/Applications', path.join(require('os').homedir(), 'Applications')];
            
            for (const appDir of appDirs) {
                if (fs.existsSync(appDir)) {
                    const items = fs.readdirSync(appDir);
                    for (const item of items) {
                        if (item.endsWith('.app')) {
                            const fullPath = path.join(appDir, item);
                            const stats = fs.statSync(fullPath);
                            if (stats.isDirectory()) {
                                apps.push({
                                    name: item.replace('.app', ''),
                                    path: fullPath
                                });
                            }
                        }
                    }
                }
            }
        } else if (process.platform === 'win32') {
            // Windows: Scan common program directories
            const programDirs = [
                'C:\\Program Files',
                'C:\\Program Files (x86)',
                path.join(require('os').homedir(), 'AppData\\Local\\Programs')
            ];
            
            // This would need more sophisticated scanning for Windows
            // For now, return empty array
        }
        
        return apps;
    } catch (error) {
        console.error('Error scanning applications:', error);
        return [];
    }
});

// Fetch app icon from various online sources
ipcMain.handle('fetch-app-icon', async (event, appName) => {
    try {
        const https = require('https');
        const http = require('http');
        
        // Clean app name for search
        const cleanAppName = appName.replace(/[^a-zA-Z0-9\s]/g, '').trim();
        
        // Try multiple icon sources
        const iconSources = [
            // MacOS App Store
            `https://is1-ssl.mzstatic.com/image/thumb/Purple116/v4/00/00/00/00000000-0000-0000-0000-000000000000/source/512x512bb.jpg`,
            // Alternative App Store search
            `https://itunes.apple.com/search?term=${encodeURIComponent(cleanAppName)}&entity=macSoftware&limit=1`,
            // Generic favicon service
            `https://www.google.com/s2/favicons?domain=${encodeURIComponent(cleanAppName)}.com&sz=128`,
            // Alternative icon service
            `https://icon-library.com/images/${encodeURIComponent(cleanAppName.toLowerCase())}-icon.png`
        ];
        
        // Try App Store API first
        const searchUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(cleanAppName)}&entity=macSoftware&limit=1`;
        
        return new Promise((resolve) => {
            https.get(searchUrl, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        const results = JSON.parse(data);
                        if (results.results && results.results.length > 0) {
                            const app = results.results[0];
                            resolve({
                                iconUrl: app.artworkUrl512 || app.artworkUrl100 || app.artworkUrl60,
                                category: app.primaryGenreName || 'Utilities',
                                description: app.description || '',
                                appStoreUrl: app.trackViewUrl || ''
                            });
                        } else {
                            // Fallback to favicon
                            resolve({
                                iconUrl: `https://www.google.com/s2/favicons?domain=${encodeURIComponent(cleanAppName)}.com&sz=128`,
                                category: 'Utilities',
                                description: '',
                                appStoreUrl: ''
                            });
                        }
                    } catch (parseError) {
                        console.error('Error parsing App Store response:', parseError);
                        resolve({
                            iconUrl: `https://www.google.com/s2/favicons?domain=${encodeURIComponent(cleanAppName)}.com&sz=128`,
                            category: 'Utilities',
                            description: '',
                            appStoreUrl: ''
                        });
                    }
                });
            }).on('error', (error) => {
                console.error('Error fetching from App Store:', error);
                resolve({
                    iconUrl: `https://www.google.com/s2/favicons?domain=${encodeURIComponent(cleanAppName)}.com&sz=128`,
                    category: 'Utilities',
                    description: '',
                    appStoreUrl: ''
                });
            });
        });
        
    } catch (error) {
        console.error('Error fetching app icon:', error);
        return {
            iconUrl: null,
            category: 'Utilities',
            description: '',
            appStoreUrl: ''
        };
    }
});

// Get app info from bundle (macOS specific)
ipcMain.handle('get-app-info', async (event, appPath) => {
    try {
        if (process.platform === 'darwin' && appPath.endsWith('.app')) {
            const plistPath = path.join(appPath, 'Contents', 'Info.plist');
            
            if (fs.existsSync(plistPath)) {
                return new Promise((resolve) => {
                    exec(`plutil -convert json -o - "${plistPath}"`, (error, stdout) => {
                        if (error) {
                            resolve({ category: 'Utilities', description: '' });
                            return;
                        }
                        
                        try {
                            const plist = JSON.parse(stdout);
                            const category = plist.LSApplicationCategoryType || 'Utilities';
                            const description = plist.CFBundleGetInfoString || plist.NSHumanReadableCopyright || '';
                            
                            // Map macOS categories to our categories
                            const categoryMap = {
                                'public.app-category.developer-tools': 'development',
                                'public.app-category.productivity': 'productivity',
                                'public.app-category.entertainment': 'entertainment',
                                'public.app-category.utilities': 'utilities',
                                'public.app-category.graphics-design': 'productivity',
                                'public.app-category.music': 'entertainment',
                                'public.app-category.video': 'entertainment',
                                'public.app-category.games': 'entertainment',
                                'public.app-category.business': 'productivity',
                                'public.app-category.education': 'productivity'
                            };
                            
                            resolve({
                                category: categoryMap[category] || 'utilities',
                                description: description,
                                version: plist.CFBundleShortVersionString || plist.CFBundleVersion || '',
                                identifier: plist.CFBundleIdentifier || ''
                            });
                        } catch (parseError) {
                            resolve({ category: 'utilities', description: '' });
                        }
                    });
                });
            }
        }
        
        return { category: 'utilities', description: '' };
    } catch (error) {
        console.error('Error getting app info:', error);
        return { category: 'utilities', description: '' };
    }
});

// Windows icon extraction helper function
async function extractWindowsIcon(appPath) {
    const path = require('path');
    const fs = require('fs');
    const { exec } = require('child_process');
    
    try {
        if (!fs.existsSync(appPath)) {
            return { success: false, error: 'Application not found' };
        }

        // Create temp directory for icon extraction
        const tempDir = path.join(require('os').tmpdir(), 'bookmark-icons');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        const iconFileName = `icon_${Date.now()}.ico`;
        const tempIconPath = path.join(tempDir, iconFileName);
        const tempPngPath = path.join(tempDir, `icon_${Date.now()}.png`);

        return new Promise((resolve) => {
            // Method 1: Try using PowerShell to extract icon
            const powershellScript = `
                Add-Type -AssemblyName System.Drawing
                $icon = [System.Drawing.Icon]::ExtractAssociatedIcon("${appPath.replace(/\\/g, '\\\\')}")
                if ($icon) {
                    $bitmap = $icon.ToBitmap()
                    $bitmap.Save("${tempPngPath.replace(/\\/g, '\\\\')}", [System.Drawing.Imaging.ImageFormat]::Png)
                    $bitmap.Dispose()
                    $icon.Dispose()
                    Write-Output "success"
                } else {
                    Write-Output "failed"
                }
            `;

            exec(`powershell -Command "${powershellScript}"`, (error, stdout, stderr) => {
                if (error || stderr || stdout.trim() !== 'success') {
                    // Method 2: Try using ResourceHacker (if available)
                    tryResourceHacker();
                } else {
                    // PowerShell method succeeded
                    if (fs.existsSync(tempPngPath)) {
                        fs.readFile(tempPngPath, (readError, data) => {
                            // Clean up temp file
                            fs.unlink(tempPngPath, () => {});
                            
                            if (readError) {
                                resolve({ success: false, error: 'Failed to read extracted icon' });
                                return;
                            }

                            const base64Icon = data.toString('base64');
                            const dataUrl = `data:image/png;base64,${base64Icon}`;
                            
                            resolve({
                                success: true,
                                iconUrl: dataUrl,
                                iconPath: appPath,
                                iconType: 'png',
                                method: 'powershell'
                            });
                        });
                    } else {
                        tryResourceHacker();
                    }
                }
            });

            function tryResourceHacker() {
                // Method 3: Try direct icon extraction using built-in Windows API via Node.js addon
                // For now, use a simpler approach with IconExtract
                const iconExtractScript = `
                    $shell = New-Object -ComObject Shell.Application
                    $folder = $shell.Namespace((Split-Path "${appPath.replace(/\\/g, '\\\\')}" -Parent))
                    $file = $folder.ParseName((Split-Path "${appPath.replace(/\\/g, '\\\\')}" -Leaf))
                    if ($file) {
                        $icon = $file.ExtendedProperty("System.ThumbnailStream")
                        if ($icon) {
                            Write-Output "icon-found"
                        } else {
                            Write-Output "no-icon"
                        }
                    } else {
                        Write-Output "file-not-found"
                    }
                `;

                exec(`powershell -Command "${iconExtractScript}"`, (error2, stdout2, stderr2) => {
                    if (!error2 && stdout2.trim() === 'icon-found') {
                        // Try to extract using alternative method
                        extractUsingAssociatedIcon();
                    } else {
                        // Fallback: Use default Windows executable icon
                        resolve({
                            success: true,
                            iconUrl: getDefaultWindowsIcon(appPath),
                            iconPath: appPath,
                            iconType: 'svg',
                            method: 'fallback'
                        });
                    }
                });
            }

            function extractUsingAssociatedIcon() {
                // Alternative extraction using System.Drawing.Icon.ExtractAssociatedIcon
                const extractScript = `
                    try {
                        Add-Type -AssemblyName System.Drawing
                        Add-Type -AssemblyName System.Windows.Forms
                        
                        $icon = [System.Drawing.Icon]::ExtractAssociatedIcon("${appPath.replace(/\\/g, '\\\\')}")
                        
                        if ($icon -ne $null) {
                            # Convert to bitmap and save as PNG
                            $bitmap = $icon.ToBitmap()
                            $ms = New-Object System.IO.MemoryStream
                            $bitmap.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
                            $bytes = $ms.ToArray()
                            $base64 = [System.Convert]::ToBase64String($bytes)
                            
                            $ms.Dispose()
                            $bitmap.Dispose() 
                            $icon.Dispose()
                            
                            Write-Output $base64
                        } else {
                            Write-Output "ERROR: No icon found"
                        }
                    } catch {
                        Write-Output "ERROR: $($_.Exception.Message)"
                    }
                `;

                exec(`powershell -Command "${extractScript}"`, { maxBuffer: 1024 * 1024 }, (error3, stdout3, stderr3) => {
                    if (!error3 && stdout3.trim() && !stdout3.startsWith('ERROR:')) {
                        const base64Icon = stdout3.trim();
                        const dataUrl = `data:image/png;base64,${base64Icon}`;
                        
                        resolve({
                            success: true,
                            iconUrl: dataUrl,
                            iconPath: appPath,
                            iconType: 'png',
                            method: 'associated-icon'
                        });
                    } else {
                        // Final fallback
                        resolve({
                            success: true,
                            iconUrl: getDefaultWindowsIcon(appPath),
                            iconPath: appPath,
                            iconType: 'svg',
                            method: 'fallback'
                        });
                    }
                });
            }
        });

    } catch (error) {
        console.error('Error in Windows icon extraction:', error);
        return { 
            success: true, // Still return success with fallback
            iconUrl: getDefaultWindowsIcon(appPath),
            iconPath: appPath,
            iconType: 'svg',
            method: 'fallback',
            error: error.message 
        };
    }
}

function getDefaultWindowsIcon(appPath) {
    const path = require('path');
    const ext = path.extname(appPath).toLowerCase();
    
    // Return appropriate default icon based on file extension
    const icons = {
        '.exe': 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDZINDBWNDBIMTJWNloiIGZpbGw9IiMxOTc2RDIiLz4KPHBhdGggZD0iTTggNkgzNlY0MEg4VjZaIiBmaWxsPSIjMjE5NkYzIi8+CjxwYXRoIGQ9Ik0xNiAxNEgzMlYzNEgxNlYxNFoiIGZpbGw9IiNGRkZGRkYiLz4KPHBhdGggZD0iTTIwIDE4SDI4VjIySDE5VjE4WiIgZmlsbD0iIzE5NzZEMiIvPgo8cGF0aCBkPSJNMjAgMjZIMjhWMzBIMjBWMjZaIiBmaWxsPSIjMTk3NkQyIi8+Cjwvc3ZnPgo=',
        '.msi': 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTggNkg0MFY0Mkg4VjZaIiBmaWxsPSIjRkY5ODAwIi8+CjxwYXRoIGQ9Ik0xNiAxNEgzMlYzNEgxNlYxNFoiIGZpbGw9IiNGRkZGRkYiLz4KPHBhdGggZD0iTTIwIDE4SDI4VjIySDE5VjE4WiIgZmlsbD0iI0ZGOTgwMCIvPgo8cGF0aCBkPSJNMjAgMjZIMjhWMzBIMjBWMjZaIiBmaWxsPSIjRkY5ODAwIi8+Cjwvc3ZnPgo=',
        default: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTggNkg0MFY0Mkg4VjZaIiBmaWxsPSIjNjA3RDhCIi8+CjxwYXRoIGQ9Ik0xNiAxNEgzMlYzNEgxNlYxNFoiIGZpbGw9IiNGRkZGRkYiLz4KPHBhdGggZD0iTTIwIDE4SDI4VjIySDE5VjE4WiIgZmlsbD0iIzYwN0Q4QiIvPgo8cGF0aCBkPSJNMjAgMjZIMjhWMzBIMjBWMjZaIiBmaWxsPSIjNjA3RDhCIi8+Cjwvc3ZnPgo='
    };
    
    return icons[ext] || icons.default;
}

// Extract app icon from local bundle
ipcMain.handle('extract-app-icon', async (event, appPath) => {
    try {
        if (process.platform === 'darwin' && appPath.endsWith('.app')) {
            const path = require('path');
            const fs = require('fs');
            
            // Read Info.plist to get icon file name
            const plistPath = path.join(appPath, 'Contents', 'Info.plist');
            
            if (!fs.existsSync(plistPath)) {
                return { success: false, error: 'Info.plist not found' };
            }
            
            return new Promise((resolve) => {
                exec(`plutil -convert json -o - "${plistPath}"`, async (error, stdout) => {
                    if (error) {
                        resolve({ success: false, error: 'Failed to read Info.plist' });
                        return;
                    }
                    
                    try {
                        const plist = JSON.parse(stdout);
                        const iconFileName = plist.CFBundleIconFile || plist.CFBundleIconName;
                        
                        if (!iconFileName) {
                            resolve({ success: false, error: 'No icon specified in bundle' });
                            return;
                        }
                        
                        // Look for icon files in Resources directory
                        const resourcesPath = path.join(appPath, 'Contents', 'Resources');
                        
                        if (!fs.existsSync(resourcesPath)) {
                            resolve({ success: false, error: 'Resources directory not found' });
                            return;
                        }
                        
                        // Try different icon file extensions and sizes
                        const iconExtensions = ['.icns', '.png', '.ico', ''];
                        const iconSizes = ['', '@2x', '_512x512', '_256x256', '_128x128'];
                        
                        let iconPath = null;
                        
                        // First try the exact name from plist
                        for (const ext of iconExtensions) {
                            const testPath = path.join(resourcesPath, iconFileName + ext);
                            if (fs.existsSync(testPath)) {
                                iconPath = testPath;
                                break;
                            }
                        }
                        
                        // If not found, try common icon names
                        if (!iconPath) {
                            const commonNames = ['app', 'icon', 'AppIcon', iconFileName];
                            for (const name of commonNames) {
                                for (const ext of iconExtensions) {
                                    for (const size of iconSizes) {
                                        const testPath = path.join(resourcesPath, name + size + ext);
                                        if (fs.existsSync(testPath)) {
                                            iconPath = testPath;
                                            break;
                                        }
                                    }
                                    if (iconPath) break;
                                }
                                if (iconPath) break;
                            }
                        }
                        
                        if (!iconPath) {
                            resolve({ success: false, error: 'Icon file not found in bundle' });
                            return;
                        }
                        
                        // Convert icns to png if needed and create data URL
                        if (iconPath.endsWith('.icns')) {
                            // Use sips to convert icns to png and get base64
                            const tempPngPath = path.join(require('os').tmpdir(), `icon_${Date.now()}.png`);
                            
                            exec(`sips -s format png "${iconPath}" --out "${tempPngPath}" --resampleHeightWidth 128 128`, (sipError) => {
                                if (sipError) {
                                    resolve({ success: false, error: 'Failed to convert icns to png' });
                                    return;
                                }
                                
                                // Read the converted PNG and create base64 data URL
                                fs.readFile(tempPngPath, (readError, data) => {
                                    // Clean up temp file
                                    fs.unlink(tempPngPath, () => {});
                                    
                                    if (readError) {
                                        resolve({ success: false, error: 'Failed to read converted icon' });
                                        return;
                                    }
                                    
                                    const base64Icon = data.toString('base64');
                                    const dataUrl = `data:image/png;base64,${base64Icon}`;
                                    
                                    resolve({
                                        success: true,
                                        iconUrl: dataUrl,
                                        iconPath: iconPath,
                                        iconType: 'icns'
                                    });
                                });
                            });
                        } else if (iconPath.endsWith('.png') || iconPath.endsWith('.jpg') || iconPath.endsWith('.jpeg')) {
                            // For PNG/JPG, read directly and create data URL
                            fs.readFile(iconPath, (readError, data) => {
                                if (readError) {
                                    resolve({ success: false, error: 'Failed to read icon file' });
                                    return;
                                }
                                
                                const ext = path.extname(iconPath).substring(1);
                                const mimeType = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 'image/png';
                                const base64Icon = data.toString('base64');
                                const dataUrl = `data:${mimeType};base64,${base64Icon}`;
                                
                                resolve({
                                    success: true,
                                    iconUrl: dataUrl,
                                    iconPath: iconPath,
                                    iconType: ext
                                });
                            });
                        } else {
                            resolve({ success: false, error: 'Unsupported icon format' });
                        }
                        
                    } catch (parseError) {
                        resolve({ success: false, error: 'Failed to parse Info.plist' });
                    }
                });
            });
        } else if (process.platform === 'win32') {
            // Windows icon extraction implementation
            return await extractWindowsIcon(appPath);
        } else {
            return { success: false, error: 'Unsupported platform' };
        }
        
    } catch (error) {
        console.error('Error extracting app icon:', error);
        return { success: false, error: error.message };
    }
});

// Import/Export functionality
async function importBookmarks() {
    const result = await dialog.showOpenDialog(mainWindow, {
        title: 'Import Bookmarks',
        filters: [
            { name: 'JSON Files', extensions: ['json'] },
            { name: 'HTML Files', extensions: ['html', 'htm'] },
            { name: 'All Files', extensions: ['*'] }
        ],
        properties: ['openFile']
    });

    if (!result.canceled && result.filePaths.length > 0) {
        mainWindow.webContents.send('import-bookmarks', result.filePaths[0]);
    }
}

async function exportBookmarks() {
    const result = await dialog.showSaveDialog(mainWindow, {
        title: 'Export Bookmarks',
        defaultPath: 'bookmarks-export.json',
        filters: [
            { name: 'JSON Files', extensions: ['json'] },
            { name: 'All Files', extensions: ['*'] }
        ]
    });

    if (!result.canceled) {
        mainWindow.webContents.send('export-bookmarks', result.filePath);
    }
}

// Handle app protocol (for future use)
app.setAsDefaultProtocolClient('bookmark-manager');