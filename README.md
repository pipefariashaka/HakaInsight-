# Code Architecture Analyzer

A Visual Studio Code extension that uses Google's Gemini 3 API to analyze source code and generate interactive architecture diagrams.

## Features

- 📊 **Visual Architecture Diagrams** - Interactive diagrams with zoom and pan
- 🔍 **Code Analysis** - Powered by Gemini 3 AI
- ⚠️ **Smart Warnings** - Security, logic, and best practice warnings
- 💾 **Analysis Cache** - Analyses are cached to save API tokens
- 🔐 **Secure Configuration** - API Key stored securely in VS Code
- 🎨 **Modern UI** - Dark theme with polished tab styling
- 🚀 **Fast Performance** - Cached analyses load instantly without API calls
- 🌐 **Bilingual** - Full support for English and Spanish

## Installation

1. Install the extension from the VS Code Marketplace
2. Or clone this repository and run `npm install && npm run package`

## Quick Start

### 1. Configure API Key

1. Open the extension panel (click the icon in the sidebar)
2. Go to the "Settings" tab
3. Enter your Gemini 3 API Key
4. Click "Save"

### 2. Analyze Code

1. Open a code file
2. Right-click on the file in the explorer
3. Select "Analyze Architecture"
4. View the diagram and analysis in the panel

### 3. Explore Diagram

- **Zoom**: Use mouse wheel to zoom in/out
- **Pan**: Click and drag to move around
- **Navigate**: Click on dependencies to open related files

## Commands

- `Open Code Architecture Analyzer` - Open the analysis panel
- `Analyze Architecture` - Analyze the current file (right-click menu)
- `Clear Architecture Diagram` - Clear all stored diagrams and cache
- `Clear Cache` - Clear cached analyses to free up storage

## Requirements

- VS Code 1.80 or higher
- Google Gemini 3 API Key (get one at [Google AI Studio](https://makersuite.google.com/app/apikey))

## Configuration

### API Key

The extension stores your API Key securely using VS Code's secret storage. It is never exposed in plain text.

### Analysis Cache

Analyses are automatically cached to save API tokens and improve performance:

- **Automatic Caching**: Every analysis is saved to cache
- **Instant Loading**: Cached analyses load without API calls
- **Token Savings**: Reusing cached data saves Gemini API tokens
- **Cache Indicators**: Cached data shows a "FROM CACHE" badge with timestamp
- **Update Option**: Click "Update Analysis" to refresh cached data
- **Cache Management**: Use "Clear Cache" command to free up storage

### Diagram Storage

Diagrams are stored in your workspace's global storage directory. They persist across VS Code sessions.

## How It Works

1. **Code Analysis**: When you analyze a file, the extension sends the code to Gemini 3
2. **Response Parsing**: The API returns a structured analysis with:
   - Architecture diagram (nodes and edges)
   - Dependencies
   - Security warnings
   - Logic warnings
   - Best practice recommendations
   - Code explanation
3. **Diagram Merging**: New analyses are merged with existing diagrams incrementally
4. **Cache Storage**: The analysis is saved to cache with timestamp
5. **Instant Retrieval**: Clicking analyzed nodes shows cached data without API calls
6. **Persistence**: Both diagrams and analyses persist across VS Code sessions

### Cache Benefits

- **Save API Tokens**: Reuse analyses instead of making new API calls
- **Faster Performance**: Cached data loads instantly
- **Offline Access**: View previous analyses without internet connection
- **Cost Effective**: Reduce API usage and costs

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    VS Code Extension                         │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         Extension Host (TypeScript)                  │   │
│  │  - Extension Activation                             │   │
│  │  - Sidebar Panel Manager                            │   │
│  │  - Context Menu Handler                             │   │
│  │  - Gemini API Client                                │   │
│  │  - Storage Manager                                  │   │
│  └──────────────────────────────────────────────────────┘   │
│                           ↕                                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         Webview (HTML/CSS/JavaScript)               │   │
│  │  - Diagram Tab                                      │   │
│  │  - Settings Tab                                     │   │
│  │  - Diagram Renderer                                 │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                           ↕
        ┌──────────────────────────────────────┐
        │      Google Gemini API               │
        │  - Code Analysis                     │
        │  - Diagram Generation                │
        │  - Warning Detection                 │
        └──────────────────────────────────────┘
```

## Development

### Setup

```bash
npm install
```

### Build

```bash
npm run compile
```

### Watch Mode

```bash
npm run watch
```

### Test

```bash
npm run test
```

### Lint

```bash
npm run lint
```

## Testing

The extension includes comprehensive tests:

- **Unit Tests**: 22 tests covering individual components
- **Property-Based Tests**: 10 tests using fast-check for robustness
- **Total Coverage**: ~90%

Run tests with:

```bash
npm run test
```

## Troubleshooting

### Extension doesn't appear

- Reload VS Code (Ctrl+Shift+P > Reload Window)
- Check that the extension is enabled

### Analysis fails

- Verify your API Key is valid
- Check your internet connection
- See the VS Code output panel for error details

### Diagram doesn't render

- Try zooming (mouse wheel)
- Check the browser console (F12 in the panel)
- Verify the analysis returned valid data

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

MIT

## Support

For issues, questions, or suggestions, please open an issue on GitHub.

## Changelog

### Version 0.0.2 (Latest)

**UI Polish & Analysis Persistence**
- ✨ New polished tab styling with dark blue active tabs
- 💾 Analysis cache system to save API tokens
- 🏷️ Cache indicators showing "FROM CACHE" badge and timestamp
- 🔄 "Update Analysis" button to refresh cached data
- 🎯 Reorganized button layout in bottom-right corner
- 🧹 "Clear Cache" command for cache management
- 🔒 Security findings persistence across sessions
- 🌐 Enhanced translations for Spanish language
- ⚡ Improved performance with instant cached data loading

### Version 0.0.1

- Initial release
- Code analysis with Gemini 3
- Interactive architecture diagrams
- Security, logic, and best practice warnings
- Persistent diagram storage
- Secure API Key configuration

---

**Note**: This extension requires a valid Google Gemini 3 API Key. Get one for free at [Google AI Studio](https://makersuite.google.com/app/apikey).

