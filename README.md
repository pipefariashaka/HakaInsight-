# Haka Insight

A Visual Studio Code extension that uses Google's Gemini 3 API to analyze source code and generate interactive architecture diagrams with deep insights and quality metrics.

## Features

- 📊 **Visual Architecture Diagrams** - Interactive diagrams with zoom, pan, and persistent node positions
- 🔍 **Code Analysis** - Powered by Gemini 3 AI with dual model support (Flash & Pro)
- 🔐 **Security Analysis** - Dedicated security tab with risk level calculation and AI executive summaries
- 📈 **Quality Analysis** - Separate quality tab with code quality scoring and categorized issues
- 💾 **Analysis Cache** - Analyses are cached to save API tokens
- 🧭 **Code Navigation** - Click to jump directly to code locations from findings
- 📄 **Report Generation** - Generate professional HTML reports for security and quality
- 🎨 **Modern UI** - Dark theme with polished tab styling and consistent button design
- 🚀 **Fast Performance** - Cached analyses load instantly without API calls
- 🌐 **Bilingual** - Full support for English and Spanish with instant language switching
- 🔄 **Auto-Loading** - Diagrams load automatically when opening the sidebar
- ⚡ **Smart Loading States** - Visual feedback during analysis operations

## Installation

1. Install the extension from the VS Code Marketplace
2. Or clone this repository and run `npm install && npm run package`

## Quick Start

### 1. Configure API Key

1. Open the extension panel (click the Haka Insight icon in the sidebar)
2. Go to the "Settings" tab
3. Enter your Gemini 3 API Key
4. Select your preferred model (Flash for speed, Pro for detail)
5. Click "Save"
6. Optionally click "Test Connection" to verify

### 2. Analyze Code

1. Open a code file
2. Right-click on the file in the explorer
3. Select "Analyze Architecture"
4. View the diagram and analysis in the panel

### 3. Explore Features

**Diagram Tab:**
- **Zoom**: Use mouse wheel to zoom in/out
- **Pan**: Click and drag to move around
- **Navigate**: Click on dependencies to open related files
- **Persist**: Node positions are automatically saved

**Security Tab:**
- View security findings categorized by severity
- Check overall risk level calculation
- Read AI-generated executive summary
- Generate professional security reports
- Navigate directly to code locations

**Quality Tab:**
- Analyze code quality with scoring
- Review bugs, improvements, performance issues, and best practices
- Generate detailed quality reports
- Jump to specific code issues

**Settings Tab:**
- Configure API key and model
- Change interface language (English/Spanish)
- Test API connection

## Commands

- `Open Haka Insight` - Open the analysis panel
- `Analyze with Haka Insight` - Analyze the current file (right-click menu)
- `Clear Haka Insight Diagram` - Clear all stored diagrams and cache
- `Clear Cache` - Clear cached analyses to free up storage
- `Load Test Data` - Load sample data for testing (development only)

## Requirements

- VS Code 1.80 or higher
- Google Gemini 3 API Key (get one at [Google AI Studio](https://makersuite.google.com/app/apikey))

## Configuration

### API Key

The extension stores your API Key securely using VS Code's secret storage. It is never exposed in plain text.

### Model Selection

Choose between two Gemini models:
- **Gemini 3 Flash (Lite)**: Faster responses, lower cost, good for quick analyses
- **Gemini 3 Pro**: More detailed analysis, better for complex code

### Language Support

Switch between English and Spanish in the Settings tab. The interface updates immediately. Note that existing analyses remain in their original language - re-analyze files to see them in the new language.

### Diagram Persistence

Node positions are automatically saved as you arrange them. Your custom layouts persist across VS Code sessions.

### Analysis Cache

Analyses are automatically cached to save API tokens and improve performance:

- **Automatic Caching**: Every analysis is saved to cache
- **Instant Loading**: Cached analyses load without API calls
- **Token Savings**: Reusing cached data saves Gemini API tokens
- **Cache Indicators**: Cached data shows a "FROM CACHE" badge with timestamp
- **Update Option**: Click "Update Analysis" to refresh cached data
- **Cache Management**: Use "Clear Cache" command to free up storage

### Report Generation

Generate professional HTML reports:
- **Security Reports**: Comprehensive security analysis with risk assessment
- **Quality Reports**: Detailed code quality metrics with scoring
- Reports include charts, statistics, and actionable recommendations
- Open directly in your browser for easy sharing

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

### Version 0.0.3 (Latest)

**Major UI Improvements & New Features**
- ✨ **Separated Security & Quality Tabs**: Dedicated tabs for security and quality analysis
- 🔐 **Enhanced Security Analysis**: Risk level calculation, severity categorization, AI executive summaries
- 📈 **Quality Scoring System**: Comprehensive code quality metrics with 0-100 scoring
- 🧭 **Code Navigation**: Click "Go to code" buttons to jump directly to issues in your files
- 📄 **Report Generation**: Generate professional HTML reports for security and quality
- 💾 **Diagram Persistence**: Node positions automatically save and restore
- 🎨 **Redesigned Settings UI**: Cleaner, more compact layout with better organization
- 🔘 **Consistent Button Styling**: Unified color scheme matching tab design
- ⚡ **Smart Loading States**: Visual feedback during analysis operations
- 🔄 **Auto-Loading Diagrams**: Diagrams load automatically when opening sidebar
- 🌐 **Improved i18n**: Complete English and Spanish translations for all new features
- 🎯 **Dual Model Support**: Choose between Gemini Flash (fast) and Pro (detailed)

### Version 0.0.2

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

