# Code Architecture Analyzer - Project Structure

## Directory Structure

```
src/
├── extension.ts              # Main extension entry point
├── extension/
│   ├── ContextMenuHandler.ts # Handles context menu commands
│   └── SidebarPanelManager.ts # Manages the sidebar webview panel
├── services/
│   ├── types.ts              # Service interface definitions
│   ├── StorageManager.ts     # Handles diagram and API key persistence
│   └── GeminiAPIClient.ts    # Communicates with Gemini API
├── models/
│   └── index.ts              # Core data models and interfaces
└── test/
    └── ...                   # Test files
```

## Core Interfaces

### Data Models (`src/models/index.ts`)

- **DiagramNode**: Represents a node in the architecture diagram
- **DiagramEdge**: Represents a dependency/edge in the diagram
- **DiagramData**: Complete diagram with nodes, edges, and metadata
- **Dependency**: Represents a dependency between files/modules
- **Warning**: Represents code quality, security, or best practice warnings
- **AnalysisResult**: Complete analysis result from Gemini API

### Service Interfaces (`src/services/types.ts`)

- **IStorageManager**: Handles diagram persistence and API key storage
- **IGeminiAPIClient**: Communicates with Gemini API for code analysis
- **ISidebarPanelManager**: Manages the sidebar webview panel
- **IContextMenuHandler**: Handles context menu commands

## Services

### StorageManager (`src/services/StorageManager.ts`)

Handles:
- Saving/loading diagram data to/from local storage
- Secure storage of API keys using VS Code's secret storage
- Clearing stored data

### GeminiAPIClient (`src/services/GeminiAPIClient.ts`)

Handles:
- Sending code to Gemini API for analysis
- Parsing API responses into AnalysisResult objects
- Error handling for API failures

### ContextMenuHandler (`src/extension/ContextMenuHandler.ts`)

Handles:
- Registering the "Analyze Architecture" context menu option
- Processing file analysis requests

### SidebarPanelManager (`src/extension/SidebarPanelManager.ts`)

Handles:
- Creating and managing the sidebar webview panel
- Tab switching between Diagram and Settings tabs
- Sending messages to the webview
- Receiving messages from the webview

## Dependencies

### Production Dependencies
- **axios**: HTTP client for API calls

### Development Dependencies
- **vscode**: VS Code Extension API
- **typescript**: TypeScript compiler
- **fast-check**: Property-based testing framework
- **eslint**: Code linting
- **esbuild**: Build tool

## Build and Development

### Scripts

- `npm run compile`: Compile TypeScript and lint
- `npm run watch`: Watch for changes and recompile
- `npm run package`: Build for production
- `npm run test`: Run tests
- `npm run lint`: Run ESLint

### Configuration Files

- **tsconfig.json**: TypeScript configuration
- **esbuild.js**: Build configuration
- **eslint.config.mjs**: ESLint configuration
- **package.json**: Project metadata and dependencies

## Extension Activation

The extension activates on:
1. `onCommand:code-architect-hakalab.openSidebar` - When sidebar is opened
2. `onCommand:code-architect-hakalab.analyzeArchitecture` - When context menu is used

## Webview

The sidebar panel includes:
- **Diagram Tab**: Displays the architecture diagram
- **Settings Tab**: Allows configuration of Gemini API Key

The webview communicates with the extension host via message passing.
