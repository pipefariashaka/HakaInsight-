# Contributing to Code Architecture Analyzer

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing to the project.

## Code of Conduct

Be respectful and constructive in all interactions. We're building a welcoming community.

## Getting Started

### Prerequisites

- Node.js 16+
- npm 8+
- VS Code 1.80+

### Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Open in VS Code: `code .`
4. Press F5 to open Extension Development Host

### Project Structure

```
src/
├── extension.ts              # Entry point
├── extension/
│   ├── ContextMenuHandler.ts
│   └── SidebarPanelManager.ts
├── services/
│   ├── StorageManager.ts
│   ├── GeminiAPIClient.ts
│   ├── DiagramMerger.ts
│   └── PersistenceManager.ts
├── models/
│   └── index.ts
└── webview/
    └── DiagramRenderer.ts
```

## Development Workflow

### 1. Create a Branch

```bash
git checkout -b feature/your-feature-name
```

### 2. Make Changes

- Follow TypeScript best practices
- Write clear, descriptive commit messages
- Add tests for new functionality

### 3. Test Your Changes

```bash
# Compile
npm run compile

# Run tests
npm run test

# Lint
npm run lint

# Type check
npm run check-types
```

### 4. Commit and Push

```bash
git add .
git commit -m "feat: add your feature description"
git push origin feature/your-feature-name
```

### 5. Create a Pull Request

- Describe your changes clearly
- Reference any related issues
- Ensure all tests pass

## Coding Standards

### TypeScript

- Use strict mode
- Add type annotations
- Avoid `any` types
- Use interfaces for data structures

### Naming Conventions

- Classes: PascalCase (e.g., `StorageManager`)
- Functions: camelCase (e.g., `handleAnalyzeCommand`)
- Constants: UPPER_SNAKE_CASE (e.g., `API_TIMEOUT_MS`)
- Files: kebab-case (e.g., `storage-manager.ts`)

### Comments

- Add JSDoc comments for public methods
- Explain complex logic
- Keep comments up-to-date

### Error Handling

- Always handle errors gracefully
- Provide meaningful error messages
- Log errors for debugging

## Testing

### Unit Tests

- Test individual functions and classes
- Use descriptive test names
- Cover happy path and edge cases

### Property-Based Tests

- Use fast-check for generating test data
- Test universal properties
- Run with 100+ iterations

### Running Tests

```bash
# All tests
npm run test

# Specific test file
npm run test -- --grep "StorageManager"

# Watch mode
npm run watch-tests
```

## Documentation

### Code Documentation

- Add JSDoc comments to public APIs
- Explain complex algorithms
- Include examples where helpful

### Markdown Documentation

- Use clear, concise language
- Include code examples
- Keep formatting consistent

## Commit Messages

Follow conventional commits:

```
feat: add new feature
fix: fix a bug
docs: update documentation
test: add or update tests
refactor: refactor code
style: fix formatting
chore: update dependencies
```

## Pull Request Process

1. Update documentation if needed
2. Add tests for new functionality
3. Ensure all tests pass
4. Update CHANGELOG.md
5. Request review from maintainers

## Reporting Issues

### Bug Reports

Include:
- VS Code version
- Extension version
- Steps to reproduce
- Expected vs actual behavior
- Error messages/logs

### Feature Requests

Include:
- Clear description of the feature
- Use cases and benefits
- Possible implementation approach

## Performance Considerations

- Minimize API calls
- Use debouncing for frequent operations
- Cache results when appropriate
- Profile before optimizing

## Security

- Never commit API keys or secrets
- Validate user input
- Use secure storage for credentials
- Report security issues privately

## Questions?

- Check existing issues and discussions
- Read the documentation in `.kiro/`
- Ask in pull request comments

## Recognition

Contributors will be recognized in:
- CHANGELOG.md
- GitHub contributors page
- Release notes

Thank you for contributing! 🎉

