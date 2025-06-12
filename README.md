# Bookmark Manager - Electron App

A powerful, modern bookmark manager and application launcher built with Electron.

## Features

### 📚 Bookmark Management
- Add, edit, and organize bookmarks with categories and tags
- Support for websites, applications, and custom protocols
- Import/export bookmarks from browsers (HTML format)
- Advanced search and filtering capabilities
- Quick-add bookmarklet for browsers

### 🚀 Application Launcher
- Automatically scan and detect installed applications
- **Manual app addition** - Add custom applications that aren't auto-detected
- Launch applications directly from the interface
- Application categorization and organization
- Icon extraction and custom icon support
- Usage tracking and statistics

### 🎨 Modern UI/UX
- Clean, responsive interface with light/dark mode
- 4-column grid layout for better organization
- Smooth animations and transitions
- Mobile-friendly responsive design
- Keyboard shortcuts and navigation
- Customizable themes and layouts

### ⚡ Advanced Features
- **🔄 Automatic Updates** - Auto-update from GitHub releases with user control
- Real-time search across bookmarks and applications
- Category-based filtering and organization
- Export data in multiple formats (JSON, CSV)
- Backup and restore functionality
- Performance monitoring and optimization
- Cross-platform support (macOS, Windows, Linux)

## Screenshots

### Main Interface
![Bookmark Manager Interface](assets/screenshot-main.png)

### Application Launcher
![Application Launcher](assets/screenshot-launcher.png)

### Admin Panel
![Admin Panel](assets/screenshot-admin.png)

## Installation

### Download
- Download the latest release from the [Releases](https://github.com/yourusername/bookmark-manager/releases) page
- Available for macOS, Windows, and Linux

### Build from Source

1. Clone the repository:
```bash
git clone https://github.com/yourusername/bookmark-manager.git
cd bookmark-manager
```

2. Install dependencies:
```bash
npm install
```

3. Run the application:
```bash
npm start
```

4. Build for distribution:
```bash
npm run build
```

## Usage

### Adding Bookmarks
1. Click the gear icon to open the admin panel
2. Use the "Add New Bookmark" form
3. Fill in the URL, title, category, and tags
4. Click "Add Bookmark"

### Adding Applications Manually
1. Open the admin panel (gear icon)
2. Go to "Quick Actions" tab
3. Find the "Add New Application" section
4. Enter application details or use the "Browse" button
5. Optionally extract the application's icon
6. Click "Add Application"

### Organizing Content
- Use categories to group related items
- Add tags for flexible organization
- Use the search function to quickly find items
- Sort by various criteria (date, name, usage, etc.)

### Auto-Updates
The app automatically checks for updates and can download/install them with your permission:

1. **Automatic Updates** (Default: Enabled)
   - Checks for updates on startup and every 6 hours
   - Shows notification when updates are available
   - Downloads with user consent only

2. **Manual Updates**
   - Go to Settings → Application Settings
   - Click "Check for Updates" 
   - View current version and update status

3. **Update Process**
   - Update notification appears in top-right corner
   - Choose to download now or later
   - Progress bar shows download status
   - Restart prompt when ready to install

### Keyboard Shortcuts
- `/` or `Ctrl+F` - Search bookmarks
- `Esc` - Close panels
- `?` - Show keyboard shortcuts help
- `A` - Open admin panel
- `T` - Toggle dark/light mode
- `G` - Cycle grid size

## Technical Details

### Built With
- **Electron** - Cross-platform desktop app framework
- **Vanilla JavaScript** - No heavy frameworks, pure performance
- **CSS3** - Modern styling with CSS Grid and Flexbox
- **Font Awesome** - Beautiful icons
- **LocalStorage** - Data persistence

### Architecture
- Modular design with separated concerns
- State management system
- Event-driven architecture
- Component-based UI structure
- Service layer for data operations

### Performance Features
- Virtual scrolling for large datasets
- Lazy loading of images and icons
- Efficient search algorithms
- Memory usage optimization
- Background processing for heavy operations

## Development

### Project Structure
```
bookmark-manager/
├── main.js              # Electron main process
├── preload.js           # Electron preload script
├── package.json         # Dependencies and scripts
├── assets/              # Icons and images
└── renderer/            # Frontend application
    ├── index.html       # Main HTML file
    ├── app.js          # Main application logic
    ├── styles.css      # Application styling
    └── src/            # Source components
        ├── components/ # UI components
        ├── modules/    # Core modules
        ├── services/   # Business logic
        └── utils/      # Utility functions
```

### Development Commands
```bash
# Run in development mode
npm start

# Run with DevTools open
npm run dev

# Run tests
npm test

# Build for all platforms
npm run build

# Build for specific platform
npm run build-mac
npm run build-win
npm run build-linux

# Release with auto-update (requires GitHub token)
npm run release
npm run release-mac
npm run release-win
npm run release-linux
```

### Publishing Updates

To publish a new version with auto-update support:

1. **Update Version Number**:
   ```bash
   npm version patch  # 1.0.1 -> 1.0.2
   npm version minor  # 1.0.1 -> 1.1.0
   npm version major  # 1.0.1 -> 2.0.0
   ```

2. **Update CHANGELOG.md** with new features and fixes

3. **Set GitHub Token** (for automated releases):
   ```bash
   export GH_TOKEN="your_github_personal_access_token"
   ```

4. **Build and Publish**:
   ```bash
   npm run release  # Builds for all platforms and creates GitHub release
   ```

5. **Manual Release** (alternative):
   - Build: `npm run build`
   - Create GitHub release manually
   - Upload build artifacts (.dmg, .exe, .AppImage)
   - Users will be notified of the update automatically

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- Create an [Issue](https://github.com/yourusername/bookmark-manager/issues) for bug reports
- Start a [Discussion](https://github.com/yourusername/bookmark-manager/discussions) for feature requests
- Check the [Wiki](https://github.com/yourusername/bookmark-manager/wiki) for detailed documentation

## Changelog

### Latest Features
- ✅ Manual application addition functionality
- ✅ Improved 4-column grid layout
- ✅ Fixed dropdown menu text display issues
- ✅ Enhanced "Show in Finder" functionality
- ✅ Better icon extraction and handling
- ✅ Responsive UI improvements

See [CHANGELOG.md](CHANGELOG.md) for full version history.

---

**Built with ❤️ using Electron and modern web technologies**