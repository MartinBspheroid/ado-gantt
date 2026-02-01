# Gantt Chart for Azure Boards

Visualize your work items in an interactive Gantt chart view. Plan, track, and manage your project timeline with ease.

[![CI](https://github.com/your-org/ado-gantt/actions/workflows/ci.yml/badge.svg)](https://github.com/your-org/ado-gantt/actions/workflows/ci.yml)
[![GitHub Release](https://img.shields.io/github/v/release/your-org/ado-gantt)](https://github.com/your-org/ado-gantt/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## Features

- **Interactive Timeline**: Drag and drop to adjust dates
- **Work Item Hierarchy**: View parent-child relationships
- **Dependencies**: Track work item dependencies
- **Real-time Updates**: Changes sync with Azure Boards
- **Filtering**: Filter by area path, iteration, assignee, and more
- **Zoom Levels**: View by day, week, month, or quarter

## Getting Started

### For Users

1. Install the extension from the [Azure DevOps Marketplace](https://marketplace.visualstudio.com/)
2. Navigate to Azure Boards in your project
3. Click on the "Gantt" hub
4. Configure your filters to show relevant work items

### For Developers

#### Prerequisites

- Node.js 18+ and npm
- Azure DevOps organization for testing

#### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/ado-gantt.git
cd ado-gantt

# Install dependencies
npm install
```

#### Development

```bash
# Start development build with watch mode
npm run watch

# Run linter
npm run lint

# Run tests
npm test
npm run test:watch        # Watch mode
npm run test:coverage     # With coverage report

# Run specific test suites
npm run test:unit         # Unit tests only
npm run test:components   # Component tests only
npm run test:integration  # Integration tests only
```

#### Building

```bash
# Build for production
npm run build

# Create .vsix package
npm run package

# Create development package
npm run package:dev
```

## Requirements

- Azure DevOps Services or Azure DevOps Server 2019+
- Work items with start and target dates

## Supported Work Item Types

- Epics
- Features
- User Stories
- Tasks
- Bugs

## Configuration

The extension uses the following fields from your work items:
- **Start Date**: `Microsoft.VSTS.Scheduling.StartDate`
- **Target Date**: `Microsoft.VSTS.Scheduling.TargetDate`
- **Finish Date**: `Microsoft.VSTS.Scheduling.FinishDate`
- **Remaining Work**: `Microsoft.VSTS.Scheduling.RemainingWork`
- **Completed Work**: `Microsoft.VSTS.Scheduling.CompletedWork`

## Building & Publishing

### Automated CI/CD

This project uses GitHub Actions for CI/CD:

#### CI Pipeline
- Runs on all PRs and pushes to main
- Runs tests on Node 18.x and 20.x
- Lints code and generates coverage reports
- Builds extension and uploads artifacts

#### Release Pipeline
Triggered by pushing a version tag (`v*.*.*`):
- Runs full test suite
- Builds production bundle
- Creates .vsix package
- Creates GitHub Release with artifacts

#### Publishing
Manual workflow dispatch for publishing to Azure DevOps Marketplace:
- Production: Publishes to public marketplace
- Development: Publishes private extension with sharing options

### Manual Publishing

```bash
# 1. Build the extension
npm run build

# 2. Create the package
npm run package

# 3. Publish to Azure DevOps Marketplace
npm run publish

# For development/testing with specific accounts:
npm run publish:dev -- --share-with your-organization
```

### Setting Up Publishing

#### 1. Create Azure DevOps Publisher Account

1. Go to [Azure DevOps Marketplace](https://marketplace.visualstudio.com/)
2. Sign in with your Microsoft account
3. Click "Publish Extensions" and create a publisher
4. Note your Publisher ID

#### 2. Generate Personal Access Token (PAT)

1. Go to Azure DevOps User Settings > Personal Access Tokens
2. Create a new token with these scopes:
   - Marketplace (Publish)
   - Extensions (Read & Manage)
3. Copy the generated token

#### 3. Configure GitHub Secrets

Add these secrets to your GitHub repository:

- `AZURE_DEVOPS_PAT` - Your Azure DevOps PAT
- `AZURE_DEVOPS_PUBLISHER_ID` - (Optional) Your publisher ID

#### 4. Update Extension Manifest

Edit `vss-extension.json`:
```json
{
  "publisher": "your-publisher-id",
  "name": "gantt-chart-extension",
  "version": "1.0.0"
}
```

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Quick Start for Contributors

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes
4. Run tests: `npm test`
5. Commit with conventional format: `feat(gantt): add new feature`
6. Push and create a Pull Request

## Testing

This project includes a comprehensive test suite using Vitest and React Testing Library.

### Running Tests

```bash
# Run all tests once
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run specific test suites
npm run test:unit          # Unit tests only
npm run test:components    # Component tests only
npm run test:integration   # Integration tests only
npm run test:ui            # UI mode
```

### Test Structure

```
src/test/
├── unit/                    # Unit tests for services and utilities
│   ├── GanttDataService.test.ts
│   ├── filtering.test.ts
│   └── date-calculations.test.ts
├── components/              # React component tests
│   ├── GanttToolbar.test.tsx
│   └── GanttChart.test.tsx
├── integration/             # Integration and performance tests
│   ├── data-flow.test.ts
│   ├── performance.test.ts
│   └── edge-cases.test.ts
├── fixtures/                # Test data
│   ├── realistic-workitems.json
│   ├── empty-state.json
│   ├── large-dataset.json
│   └── edge-cases.json
└── setup.ts                 # Test configuration
```

### Test Coverage

The test suite aims for:
- **>80% code coverage** across all modules
- **100% coverage** for critical data transformation logic
- **Performance benchmarks** for large datasets (500+ items)

### Mock Services

Test mocks are available in `src/services/__mocks__/`:

- `MockWorkItemService.ts` - Simulates Azure DevOps API responses
- `MockGanttDataService.ts` - Extends real service with test helpers

Example usage:
```typescript
import { MockWorkItemService, MockScenarios } from './services/__mocks__';

const service = new MockWorkItemService(MockScenarios.realistic());
const workItems = await service.queryWorkItems();
```

### CI/CD Integration

Tests are configured to run in CI environments with:
- Automatic coverage reporting
- Performance regression detection
- JUnit XML output for test results

### Writing Tests

#### Unit Tests
```typescript
import { describe, it, expect } from 'vitest';

describe('Feature', () => {
  it('should do something', () => {
    expect(true).toBe(true);
  });
});
```

#### Component Tests
```typescript
import { render, screen, fireEvent } from '@testing-library/react';

describe('Component', () => {
  it('renders correctly', () => {
    render(<Component />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

## Privacy & Security

This extension:
- Only accesses work items within your project
- Does not transmit data outside of Azure DevOps
- Uses standard Azure DevOps authentication
- Respects user permissions and access controls

## Support

For issues, feature requests, or contributions, please visit:
[GitHub Issues](https://github.com/your-org/ado-gantt/issues)

## License

MIT License - see [LICENSE](LICENSE) for details.

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history.
