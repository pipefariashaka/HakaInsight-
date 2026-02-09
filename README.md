# Haka Insight

**AI-Powered Code Architecture Analysis for Visual Studio Code**

Transform your codebase into interactive visual diagrams with deep security and quality insights powered by Google's Gemini AI.

![Haka Insight Overview](https://raw.githubusercontent.com/pipefariashaka/HakaInsight-/main/media/screenshots/hero-screenshot.png)

## ✨ Key Features

### 📊 Interactive Architecture Diagrams
Generate beautiful, interactive diagrams of your code architecture with automatic dependency detection and relationship mapping.

![Diagram View](https://raw.githubusercontent.com/pipefariashaka/HakaInsight-/main/media/screenshots/diagram-tab.png)

- **Zoom & Pan**: Navigate large codebases with smooth zoom and pan controls
- **Persistent Layouts**: Your custom node arrangements are automatically saved
- **Click to Navigate**: Jump directly to code by clicking on diagram nodes
- **Smart Merging**: Incrementally build comprehensive diagrams across multiple analyses

### 🔐 Security Analysis
Identify security vulnerabilities with AI-powered analysis and risk assessment.

![Security Analysis](https://raw.githubusercontent.com/pipefariashaka/HakaInsight-/main/media/screenshots/security-tab.png)

- **Risk Level Calculation**: Automatic risk scoring (Critical/High/Medium/Low)
- **Severity Categorization**: Findings organized by severity level
- **AI Executive Summaries**: Get high-level security overviews
- **Code Navigation**: Jump directly to vulnerable code locations
- **Professional Reports**: Generate shareable HTML security reports

### 📈 Quality Analysis
Comprehensive code quality metrics with actionable recommendations.

![Quality Analysis](https://raw.githubusercontent.com/pipefariashaka/HakaInsight-/main/media/screenshots/quality-tab.png)

- **Quality Scoring**: 0-100 quality score based on multiple factors
- **Categorized Issues**: Bugs, improvements, performance, and best practices
- **Detailed Recommendations**: AI-generated suggestions for each issue
- **Quality Reports**: Export detailed quality analysis as HTML
- **Direct Navigation**: Click to view issues in your code

### ⚙️ Flexible Configuration
Easy setup with powerful customization options.

![Settings](https://raw.githubusercontent.com/pipefariashaka/HakaInsight-/main/media/screenshots/settings-tab.png)

- **Dual Model Support**: Choose between Gemini Flash (fast) or Pro (detailed)
- **Bilingual Interface**: Full English and Spanish support
- **Secure API Storage**: Your API key is stored securely
- **Connection Testing**: Verify your API configuration instantly

### 💾 Smart Caching
Save API tokens and improve performance with intelligent caching.

- **Automatic Caching**: Every analysis is saved locally
- **Instant Loading**: Cached analyses load without API calls
- **Token Savings**: Reuse previous analyses to reduce costs
- **Cache Indicators**: See when data is from cache with timestamps
- **Easy Updates**: Refresh cached data with one click

## 🚀 Getting Started

### Installation

1. Install from the [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=hakalab.haka-insight)
2. Click the Haka Insight icon in the Activity Bar
3. Configure your Gemini API key in the Settings tab

### Get Your API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Create a new API key
4. Copy and paste it into Haka Insight settings

### Analyze Your Code

![Context Menu](https://raw.githubusercontent.com/pipefariashaka/HakaInsight-/main/media/screenshots/context-menu.png)

**Method 1: Context Menu**
- Right-click any file in the explorer
- Select "Analyze with Haka Insight"

**Method 2: Editor Menu**
- Open a file
- Click the Haka Insight icon in the editor toolbar

**Method 3: Command Palette**
- Press `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (Mac)
- Type "Analyze with Haka Insight"

## 📖 How to Use

### Understanding the Diagram

The diagram shows your code architecture with:
- **Nodes**: Files, classes, functions, and components
- **Edges**: Dependencies and relationships
- **Colors**: Different node types (files, classes, functions)
- **Badges**: File names and metadata

**Interactions:**
- **Mouse Wheel**: Zoom in/out
- **Click & Drag**: Pan around the diagram
- **Click Node**: View details and navigate to code
- **Drag Node**: Rearrange layout (auto-saved)

### Security Tab

View security findings organized by severity:
- **Critical**: Immediate attention required
- **High**: Important security issues
- **Medium**: Moderate security concerns
- **Low**: Minor security suggestions

Each finding includes:
- Description of the vulnerability
- Location in your code
- AI-generated recommendations
- "Go to code" button for quick navigation

**Risk Level**: Overall security assessment based on all findings

### Quality Tab

Code quality analysis with scoring:
- **Quality Score**: 0-100 rating based on multiple factors
- **Bugs**: Potential errors and defects
- **Improvements**: Code optimization opportunities
- **Performance**: Speed and efficiency issues
- **Best Practices**: Coding standards and conventions

### Generate Reports

![Report Example](https://raw.githubusercontent.com/pipefariashaka/HakaInsight-/main/media/screenshots/report-example.png)

Create professional HTML reports:
1. Analyze your code
2. Go to Security or Quality tab
3. Click "Generate Report"
4. Report opens in your browser
5. Share with your team

Reports include:
- Executive summary
- Detailed findings
- Statistics and charts
- Recommendations
- Timestamp and metadata

## 🌐 Language Support

Switch between English and Spanish instantly:
1. Go to Settings tab
2. Select your preferred language
3. Interface updates immediately

**Note**: Existing analyses remain in their original language. Re-analyze files to see them in the new language.

## ⚡ Performance & Caching

### How Caching Works

1. **First Analysis**: Code is sent to Gemini API
2. **Automatic Save**: Results are cached locally
3. **Subsequent Views**: Data loads instantly from cache
4. **Manual Refresh**: Click "Update Analysis" to refresh

### Benefits

- **Faster Loading**: Instant access to previous analyses
- **Cost Savings**: Reduce API usage and costs
- **Offline Access**: View cached data without internet
- **Token Efficiency**: Reuse analyses instead of re-analyzing

### Cache Management

- **View Cache Status**: See "FROM CACHE" badge with timestamp
- **Clear Cache**: Use "Clear Cache" command to free storage
- **Update Analysis**: Refresh specific cached analyses

## 🎯 Model Selection

### Gemini Flash (Lite)
- **Speed**: Fast responses (2-5 seconds)
- **Cost**: Lower API token usage
- **Best For**: Quick analyses, frequent use, large codebases

### Gemini Pro
- **Detail**: More comprehensive analysis
- **Accuracy**: Better detection of complex issues
- **Best For**: Critical code, security audits, detailed reviews

## 📋 Commands

Access via Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`):

- `Open Haka Insight` - Open the analysis panel
- `Analyze with Haka Insight` - Analyze current file
- `Clear Haka Insight Diagram` - Clear all diagrams and cache
- `Clear Cache` - Clear cached analyses only

## 🔧 Requirements

- **VS Code**: Version 1.80 or higher
- **API Key**: Google Gemini API key ([Get one free](https://makersuite.google.com/app/apikey))
- **Internet**: Required for API calls (cached data works offline)

## 🛡️ Privacy & Security

- **API Key Storage**: Stored securely using VS Code's secret storage
- **Local Caching**: Analyses stored locally on your machine
- **No Data Collection**: We don't collect or store your code
- **Direct API Calls**: Your code goes directly to Google's Gemini API

## 🐛 Troubleshooting

### Extension doesn't appear
- Reload VS Code: `Ctrl+Shift+P` → "Reload Window"
- Check extension is enabled in Extensions panel

### Analysis fails
- Verify API key is correct in Settings
- Test connection using "Test Connection" button
- Check internet connection
- View error details in VS Code Output panel

### Diagram doesn't render
- Try zooming with mouse wheel
- Check browser console (F12) for errors
- Verify analysis returned valid data
- Clear cache and re-analyze

### API errors
- **401 Unauthorized**: Invalid API key
- **429 Too Many Requests**: Rate limit exceeded, wait and retry
- **500 Server Error**: Gemini API issue, try again later

## 📊 What Gets Analyzed

Haka Insight analyzes:
- **Architecture**: File structure, dependencies, relationships
- **Security**: Vulnerabilities, injection risks, authentication issues
- **Quality**: Code smells, complexity, maintainability
- **Performance**: Inefficiencies, bottlenecks, optimization opportunities
- **Best Practices**: Coding standards, design patterns, conventions

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## 📄 License

MIT License - see [LICENSE](LICENSE) for details

## 🔗 Links

- [GitHub Repository](https://github.com/pipefariashaka/HakaInsight-)
- [Report Issues](https://github.com/pipefariashaka/HakaInsight-/issues)
- [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=hakalab.haka-insight)
- [Get Gemini API Key](https://makersuite.google.com/app/apikey)
- [Creator's LinkedIn](https://www.linkedin.com/in/felipefariasalfaro/)

## 📝 Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history and updates.

## ⭐ Support

If you find Haka Insight useful, please:
- ⭐ Star the repository
- 📝 Leave a review on the marketplace
- 🐛 Report bugs and suggest features
- 📢 Share with your team

---

**Made with ❤️ by [Felipe Farias](https://www.linkedin.com/in/felipefariasalfaro/) | Haka Lab**

*Transform your code understanding with AI-powered insights*
