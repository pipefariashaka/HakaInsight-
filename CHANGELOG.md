# Change Log

All notable changes to the "code-architect-hakalab" extension will be documented in this file.

## [0.0.1] - 2026-02-08

### Added
- **Separated Security & Quality Tabs**: Dedicated tabs for security and quality analysis with independent data
- **Enhanced Security Analysis**: 
  - Risk level calculation (Critical/High/Medium/Low)
  - Severity categorization for findings
  - AI-generated executive summaries
  - Risk level information modal with calculation formula
- **Quality Scoring System**: 
  - Comprehensive code quality metrics
  - 0-100 quality score calculation
  - Categorized issues: Bugs, Improvements, Performance, Best Practices
- **Code Navigation**: 
  - "Go to code" buttons on security findings
  - "Go to code" buttons on quality issues
  - Direct navigation to file locations with line highlighting
- **Report Generation**:
  - Professional HTML security reports
  - Detailed HTML quality reports
  - Embedded charts and visualizations
  - Exportable and shareable reports
- **Diagram Persistence**:
  - Automatic saving of node positions
  - Positions restore across VS Code sessions
  - Debounced auto-save (2-second delay)
- **Smart Loading States**:
  - Diagram loading spinner for first analysis
  - Analysis modal for subsequent analyses
  - Loading indicators with i18n support
- **Auto-Loading Diagrams**: Diagrams load automatically when sidebar opens
- **Dual Model Support**: Choose between Gemini Flash (fast) and Pro (detailed)

### Changed
- **Redesigned Settings UI**:
  - Reduced padding and spacing for cleaner look
  - Reorganized AI configuration section
  - API Key field moved to top
  - Model selector after API Key
  - Action buttons grouped together
  - Removed cache statistics section
- **Consistent Button Styling**:
  - Unified color scheme across all buttons
  - Primary buttons: #0099cc
  - Secondary buttons: rgba(10, 14, 39, 0.5)
  - Consistent hover states
  - Buttons match tab active/inactive colors
- **Improved Internationalization**:
  - Complete English translations for all new features
  - Complete Spanish translations for all new features
  - Language switching affects all UI elements
  - User notification about analysis language behavior

### Fixed
- Security and quality data no longer mixed in single tab
- Empty state handling for tabs without data
- Language persistence across sessions
- Button styling inconsistencies

## [0.0.2] - 2024-01-XX

### Added
- Analysis cache system to save API tokens
- Cache indicators showing "FROM CACHE" badge and timestamp
- "Update Analysis" button to refresh cached data
- "Clear Cache" command for cache management
- Security findings persistence across sessions
- Enhanced translations for Spanish language

### Changed
- New polished tab styling with dark blue active tabs
- Reorganized button layout in bottom-right corner
- Improved performance with instant cached data loading

## [0.0.1] - 2024-01-XX

### Added
- Initial release
- Code analysis with Gemini 3
- Interactive architecture diagrams
- Security, logic, and best practice warnings
- Persistent diagram storage
- Secure API Key configuration
- Bilingual support (English/Spanish)