# Contributing to ADO Gantt Extension

Thank you for your interest in contributing to the Azure DevOps Gantt Extension! This document provides guidelines and instructions for contributing.

## Table of Contents

- [Development Setup](#development-setup)
- [Branching Strategy](#branching-strategy)
- [Making Changes](#making-changes)
- [Testing](#testing)
- [Submitting Changes](#submitting-changes)
- [Release Process](#release-process)

## Development Setup

### Prerequisites

- Node.js 18+ and npm
- Azure DevOps organization (for testing)
- Git

### Local Setup

1. Fork and clone the repository:
```bash
git clone https://github.com/your-org/ado-gantt.git
cd ado-gantt
```

2. Install dependencies:
```bash
npm install
```

3. Create a development configuration file:
```bash
cp config/dev.json.example config/dev.json
# Edit config/dev.json with your publisher info
```

4. Start the development build:
```bash
npm run watch
```

## Branching Strategy

We use a simplified Git Flow model:

- `main` - Production-ready code
- `develop` - Integration branch for features
- `feature/*` - Feature branches
- `bugfix/*` - Bug fix branches
- `hotfix/*` - Urgent production fixes

### Creating a Branch

```bash
# For new features
git checkout -b feature/your-feature-name develop

# For bug fixes
git checkout -b bugfix/issue-description develop

# For hotfixes
git checkout -b hotfix/critical-fix main
```

## Making Changes

### Code Style

- Use TypeScript for all new code
- Follow the existing code style
- Run the linter before committing: `npm run lint`

### Commit Messages

Use conventional commit format:

```
<type>(<scope>): <subject>

<body>

<footer>
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, semicolons, etc)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Build process or auxiliary tool changes

Example:
```
feat(gantt): add zoom controls to toolbar

Implement zoom in/out buttons and dropdown for zoom levels.
Includes keyboard shortcuts (Ctrl++, Ctrl+-, Ctrl+0).

Closes #123
```

## Testing

All changes must include tests. We maintain high test coverage:

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:unit          # Unit tests only
npm run test:components    # Component tests only
npm run test:integration   # Integration tests only

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Test Requirements

- Unit tests for all utility functions
- Component tests for React components
- Integration tests for data flow
- Minimum 80% code coverage

### Writing Tests

```typescript
import { describe, it, expect } from 'vitest';
import { myFunction } from './myModule';

describe('myModule', () => {
  describe('myFunction', () => {
    it('should return expected result', () => {
      const result = myFunction('input');
      expect(result).toBe('expected output');
    });
  });
});
```

## Submitting Changes

### Pull Request Process

1. Ensure all tests pass: `npm test`
2. Update documentation if needed
3. Fill out the Pull Request template completely
4. Request review from maintainers
5. Address review feedback
6. Squash commits if requested

### PR Checklist

- [ ] Tests added/updated and passing
- [ ] Code follows style guidelines
- [ ] Documentation updated
- [ ] CHANGELOG.md updated (for user-facing changes)
- [ ] Version bumped (if applicable)

## Release Process

### Versioning

We follow [Semantic Versioning](https://semver.org/):

- `MAJOR.MINOR.PATCH`
- Major: Breaking changes
- Minor: New features (backward compatible)
- Patch: Bug fixes

### Creating a Release

1. Update version in `package.json` and `vss-extension.json`
2. Update CHANGELOG.md
3. Create a PR to main
4. After merge, create a tag:
```bash
git checkout main
git pull
git tag -a v1.2.3 -m "Release version 1.2.3"
git push origin v1.2.3
```

The CI will automatically build and create a GitHub Release.

### Manual Publishing

To publish manually (requires proper permissions):

```bash
# Production
npm run publish

# Development
npm run publish:dev -- --share-with your-org
```

## Questions?

- Open an issue for bug reports or feature requests
- Join discussions in existing issues
- Contact maintainers for security concerns

Thank you for contributing!
