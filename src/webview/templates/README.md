# Template Files Structure

This directory contains the split HTML template files for the Haka Insight webview.

## Files Created

### 1. `main.html`
The main template file that uses placeholders to compose the complete HTML document.

**Placeholders:**
- `{{STYLES}}` - CSS styles section
- `{{TABS}}` - Tab navigation buttons
- `{{DIAGRAM_TAB}}` - Diagram tab content
- `{{SETTINGS_TAB}}` - Settings tab content
- `{{SECURITY_TAB}}` - Security analysis tab content
- `{{QUALITY_TAB}}` - Quality analysis tab content
- `{{MODALS}}` - All modal dialogs and overlays
- `{{SCRIPTS}}` - JavaScript code

### 2. `tabs.html`
Contains the tab navigation container with buttons for:
- Diagram
- Security
- Quality
- Settings

### 3. `diagram-tab.html`
The diagram visualization tab including:
- SVG diagram container
- Loading indicator
- Control buttons (menu, export, zoom)
- Export menu
- Explanation container
- Warnings container

### 4. `settings-tab.html`
Settings configuration tab with sections for:
- Language settings
- Diagram layout options
- AI configuration (API key, model selection)

### 5. `security-tab.html`
Security analysis tab featuring:
- Empty state display
- Security summary with statistics
- Risk level indicator
- AI executive summary section
- Findings list

### 6. `quality-tab.html`
Code quality analysis tab with:
- Empty state display
- Quality summary statistics
- Analysis button
- Quality findings organized by category:
  - Possible bugs
  - Improvement opportunities
  - Performance optimizations
  - Best practices

### 7. `modals.html`
All modal dialogs and overlays:
- Left menu (analyzed files list)
- Analysis modal (loading indicator)
- Node popup (diagram node details)
- Context menu
- Details panel (file analysis details)
- Risk info modal (risk calculation explanation)

### 8. `full-extracted.html`
The original complete HTML file (kept for reference).

## Usage

To compose the complete HTML, replace the placeholders in `main.html` with the content from the respective template files:

```javascript
let html = mainTemplate;
html = html.replace('{{STYLES}}', stylesContent);
html = html.replace('{{TABS}}', tabsContent);
html = html.replace('{{DIAGRAM_TAB}}', diagramTabContent);
html = html.replace('{{SETTINGS_TAB}}', settingsTabContent);
html = html.replace('{{SECURITY_TAB}}', securityTabContent);
html = html.replace('{{QUALITY_TAB}}', qualityTabContent);
html = html.replace('{{MODALS}}', modalsContent);
html = html.replace('{{SCRIPTS}}', scriptsContent);
```

## Benefits of This Structure

1. **Modularity**: Each section is in its own file, making it easier to maintain
2. **Reusability**: Individual components can be updated independently
3. **Clarity**: Clear separation of concerns
4. **Flexibility**: Easy to add, remove, or modify sections
5. **Version Control**: Smaller, focused diffs when making changes
