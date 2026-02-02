# Gantt Chart for Azure Boards

Visualize your work items in an interactive Gantt chart view. Plan, track, and manage your project timeline with ease.

[![CI](https://github.com/MartinBspheroid/ado-gantt/actions/workflows/ci.yml/badge.svg)](https://github.com/MartinBspheroid/ado-gantt/actions/workflows/ci.yml)
[![GitHub Release](https://img.shields.io/github/v/release/MartinBspheroid/ado-gantt)](https://github.com/MartinBspheroid/ado-gantt/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type-safe development
- **Vite** - Fast build tooling
- **wx-react-gantt** - Gantt chart component
- **Azure DevOps Extension SDK** - Integration with Azure DevOps

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

- Node.js 18+ and npm (or Bun)
- Azure DevOps organization for testing
- Chrome with the localhost certificate accepted (for dev mode)

#### Installation

```bash
# Clone the repository
git clone https://github.com/MartinBspheroid/ado-gantt.git
cd ado-gantt

# Install dependencies
npm install
# or with Bun
bun install
```

#### Development

The extension uses Vite for fast builds and hot reloading.

```bash
# Build the extension with Vite
npm run build:vite

# Start the preview server (serves at https://localhost:3000)
bunx vite preview --port 3000

# Run linter
npm run lint
```

**First-time setup for local development:**

1. Build the extension: `npm run build:vite`
2. Start the preview server: `bunx vite preview --port 3000`
3. Visit https://localhost:3000/dist/gantt.html in Chrome and accept the SSL certificate
4. Install the dev extension in your Azure DevOps organization (see Publishing section)
5. Navigate to Boards > Gantt in your Azure DevOps project

#### Building

```bash
# Build with Vite (recommended)
npm run build:vite

# Build with webpack (legacy)
npm run build

# Create .vsix package
npm run package

# Create development package (uses localhost:3000)
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

We welcome contributions!

### Quick Start for Contributors

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes
4. Build and test locally: `npm run build:vite && bunx vite preview --port 3000`
5. Commit with conventional format: `feat(gantt): add new feature`
6. Push and create a Pull Request

## Testing

Testing infrastructure is planned for future development.

### Mock Services

Mock services are available in `src/services/__mocks__/` for development:

- `MockWorkItemService.ts` - Simulates Azure DevOps API responses
- `MockGanttDataService.ts` - Test helpers for Gantt data transformations

## Privacy & Security

This extension:
- Only accesses work items within your project
- Does not transmit data outside of Azure DevOps
- Uses standard Azure DevOps authentication
- Respects user permissions and access controls

## Support

For issues, feature requests, or contributions, please visit:
[GitHub Issues](https://github.com/MartinBspheroid/ado-gantt/issues)

## License

MIT License - see [LICENSE](LICENSE) for details.

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history.
