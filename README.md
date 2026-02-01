# Gantt Chart for Azure Boards

Visualize your work items in an interactive Gantt chart view. Plan, track, and manage your project timeline with ease.

## Features

- **Interactive Timeline**: Drag and drop to adjust dates
- **Work Item Hierarchy**: View parent-child relationships
- **Dependencies**: Track work item dependencies
- **Real-time Updates**: Changes sync with Azure Boards
- **Filtering**: Filter by area path, iteration, assignee, and more
- **Zoom Levels**: View by day, week, month, or quarter

## Getting Started

1. Install the extension from the Marketplace
2. Navigate to Azure Boards in your project
3. Click on the "Gantt" hub
4. Configure your filters to show relevant work items

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

## Privacy & Security

This extension:
- Only accesses work items within your project
- Does not transmit data outside of Azure DevOps
- Uses standard Azure DevOps authentication
- Respects user permissions and access controls

## Support

For issues, feature requests, or contributions, please visit:
[GitHub Issues](https://github.com/your-org/ado-gantt-extension/issues)

## License

MIT License - see [LICENSE](LICENSE) for details.
