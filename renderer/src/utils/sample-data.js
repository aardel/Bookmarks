/**
 * Sample Data for Demo Purposes
 */

// Sample applications for macOS
const sampleApplications = [
    {
        id: 'app-1',
        name: 'Visual Studio Code',
        path: '/Applications/Visual Studio Code.app',
        category: 'Development',
        iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4IiByeD0iOCIgZmlsbD0iIzAwN0FDQyIvPgo8cGF0aCBkPSJNMTIgMTJIMzZWMzZIMTJWMTJaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4K',
        description: 'Code editor',
        lastUsed: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
        useCount: 15
    },
    {
        id: 'app-2', 
        name: 'Chrome',
        path: '/Applications/Google Chrome.app',
        category: 'Productivity',
        iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjQiIGN5PSIyNCIgcj0iMjAiIGZpbGw9IiNGRkQ5NEMiLz4KPGNpcmNsZSBjeD0iMjQiIGN5PSIyNCIgcj0iMTIiIGZpbGw9IiM0Mjg1RjQiLz4KPGNpcmNsZSBjeD0iMjQiIGN5PSIyNCIgcj0iNiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+',
        description: 'Web browser',
        lastUsed: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
        useCount: 42
    },
    {
        id: 'app-3',
        name: 'Spotify',
        path: '/Applications/Spotify.app',
        category: 'Entertainment',
        iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjQiIGN5PSIyNCIgcj0iMjAiIGZpbGw9IiMxREI5NTQiLz4KPHBhdGggZD0iTTE2IDIwSDMyTTE2IDI0SDMyTTE2IDI4SDMyIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIiLz4KPC9zdmc+',
        description: 'Music streaming',
        lastUsed: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // 1 hour ago
        useCount: 28
    },
    {
        id: 'app-4',
        name: 'Terminal',
        path: '/Applications/Utilities/Terminal.app',
        category: 'Utilities',
        iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4IiByeD0iOCIgZmlsbD0iIzAwMCIvPgo8dGV4dCB4PSI4IiB5PSIyNCIgZmlsbD0iIzAwRkYwMCIgZm9udC1mYW1pbHk9Im1vbm9zcGFjZSIgZm9udC1zaXplPSIxMiI+JCB8PC90ZXh0Pgo8L3N2Zz4K',
        description: 'Terminal emulator',
        lastUsed: new Date(Date.now() - 1000 * 60 * 10).toISOString(), // 10 minutes ago
        useCount: 8
    },
    {
        id: 'app-5',
        name: 'Figma',
        path: '/Applications/Figma.app',
        category: 'Development',
        iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4IiByeD0iOCIgZmlsbD0iI0Y3NkU2QyIvPgo8Y2lyY2xlIGN4PSIzMCIgY3k9IjI0IiByPSI4IiBmaWxsPSIjMUFCQ0ZFIi8+CjxyZWN0IHg9IjEyIiB5PSI4IiB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHJ4PSI4IiBmaWxsPSIjRkY3MjYyIi8+Cjwvc3ZnPg==',
        description: 'Design tool',
        lastUsed: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(), // 4 hours ago
        useCount: 12
    }
];

// Sample bookmarks
const sampleBookmarks = [
    {
        id: 'bookmark-1',
        title: 'GitHub',
        url: 'https://github.com',
        category: 'Development',
        type: 'website',
        tags: ['code', 'git', 'development'],
        iconUrl: 'https://github.com/favicon.ico',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(), // 1 week ago
        visits: 25,
        color: '#24292e'
    },
    {
        id: 'bookmark-2',
        title: 'Stack Overflow',
        url: 'https://stackoverflow.com',
        category: 'Development',
        type: 'website',
        tags: ['help', 'programming', 'qa'],
        iconUrl: 'https://stackoverflow.com/favicon.ico',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(), // 5 days ago
        visits: 18,
        color: '#f48024'
    },
    {
        id: 'bookmark-3',
        title: 'YouTube',
        url: 'https://youtube.com',
        category: 'Entertainment',
        type: 'website',
        tags: ['video', 'entertainment', 'music'],
        iconUrl: 'https://youtube.com/favicon.ico',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(), // 3 days ago
        visits: 42,
        color: '#ff0000'
    },
    {
        id: 'bookmark-4',
        title: 'Google Drive',
        url: 'https://drive.google.com',
        category: 'Productivity',
        type: 'website',
        tags: ['cloud', 'storage', 'documents'],
        iconUrl: 'https://drive.google.com/favicon.ico',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days ago
        visits: 15,
        color: '#34a853'
    },
    {
        id: 'bookmark-5',
        title: 'Figma',
        url: 'https://figma.com',
        category: 'Development',
        type: 'website',
        tags: ['design', 'ui', 'prototyping'],
        iconUrl: 'https://figma.com/favicon.ico',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
        visits: 8,
        color: '#f24e1e'
    }
];

// Function to populate sample data
function populateSampleData() {
    try {
        // Check if data already exists
        const existingBookmarks = JSON.parse(localStorage.getItem('bookmarks') || '[]');
        const existingApps = JSON.parse(localStorage.getItem('applications') || '[]');
        
        // Only add samples if no data exists
        if (existingBookmarks.length === 0) {
            localStorage.setItem('bookmarks', JSON.stringify(sampleBookmarks));
            console.log('Added sample bookmarks');
        }
        
        if (existingApps.length === 0) {
            localStorage.setItem('applications', JSON.stringify(sampleApplications));
            console.log('Added sample applications');
        }
        
        // Always ensure categories exist
        const categories = ['Development', 'Productivity', 'Entertainment', 'Utilities', 'News', 'Social'];
        localStorage.setItem('categories', JSON.stringify(categories));
        
        // Dispatch events to refresh UI
        document.dispatchEvent(new CustomEvent('bookmarks:updated'));
        document.dispatchEvent(new CustomEvent('applications:updated'));
        
        return true;
    } catch (error) {
        console.error('Failed to populate sample data:', error);
        return false;
    }
}

// Auto-populate on load if no data exists
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', populateSampleData);
} else {
    populateSampleData();
}

// Export for manual use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { sampleApplications, sampleBookmarks, populateSampleData };
}