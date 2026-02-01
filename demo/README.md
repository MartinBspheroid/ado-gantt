# Azure DevOps Gantt Chart Demo

This is a standalone demo page showcasing the Azure DevOps Gantt extension interface using dhtmlx-gantt.

## Features

- **Azure DevOps Styling**: Authentic ADO look and feel with proper colors and typography
- **Work Item Hierarchy**: Epic → Feature → Story → Task relationships
- **State Colors**:
  - **New** - Blue (#0078d4)
  - **Active** - Orange (#ff8c00)
  - **Resolved** - Purple (#773b93)
  - **Closed** - Green (#107c10)
- **Zoom Controls**: Day, Week, Month, and Quarter views
- **Interactive Features**: Expand/collapse hierarchy, hover tooltips, and more

## Mock Data

The demo includes:
- 1 Epic (60-day span)
- 2 Features
- 7 User Stories
- 12 Tasks
- Mix of all work item states

## How to View

### Option 1: Open Directly in Browser
Simply double-click `index.html` or open it in your browser:
```
file:///root/projects/ado-gantt/demo/index.html
```

### Option 2: Use a Local Server (Recommended)
For the best experience, serve the file through a local web server:

```bash
# Using Python 3
cd /root/projects/ado-gantt/demo
python3 -m http.server 8080

# Then open: http://localhost:8080
```

```bash
# Using Node.js (npx)
cd /root/projects/ado-gantt/demo
npx serve
```

```bash
# Using PHP
cd /root/projects/ado-gantt/demo
php -S localhost:8080
```

## Dependencies

This demo loads all dependencies from CDN:
- **dhtmlx-gantt** - The Gantt chart library (CSS and JS from cdn.dhtmlx.com)

No local dependencies or build step required!

## Browser Compatibility

Works in all modern browsers:
- Chrome/Edge 80+
- Firefox 75+
- Safari 13+

## File Structure

```
/root/projects/ado-gantt/demo/
├── index.html    # Standalone demo page
└── README.md     # This file
```

## Customization

To modify the mock data, edit the `mockData` object in the `<script>` section of `index.html`.

## License

This is a demo for demonstration purposes.
