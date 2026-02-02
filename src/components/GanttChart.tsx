import * as React from "react";
import { useMemo } from "react";
import { Gantt } from "wx-react-gantt";
import "wx-react-gantt/dist/gantt.css";
import { GanttChartProps, WorkItemType } from "../types";
import { ganttDataService } from "../services";
import "../styles/GanttChart.css";

// Work item type icons (Azure DevOps style)
const TYPE_ICONS: Record<WorkItemType, string> = {
  'Epic': '👑',
  'Feature': '🎯',
  'User Story': '📖',
  'Task': '📋',
  'Bug': '🐛',
  'Issue': '⚠️'
};

// Work item type colors
const TYPE_COLORS: Record<WorkItemType, string> = {
  'Epic': '#773b93',
  'Feature': '#009ccc',
  'User Story': '#0078d4',
  'Task': '#f2cb1d',
  'Bug': '#cc293d',
  'Issue': '#339947'
};

// Column configuration with icons
const COLUMNS = [
  {
    id: "text",
    header: "Work Item",
    flexgrow: 3,
    align: "left" as const
  },
  {
    id: "start",
    header: "Start",
    width: 100,
    align: "center" as const
  },
  {
    id: "duration",
    header: "Days",
    width: 60,
    align: "center" as const
  }
];

// Compatibility wrapper for wx-react-gantt
const WxReactGanttCompat: React.FC<{
  tasks: any[];
  links: any[];
  scales: any[];
  columns: any[];
  cellWidth: number;
  cellHeight: number;
}> = ({ tasks, links, scales, columns, cellWidth, cellHeight }) => {
  // Use legacy React 16/17 APIs if available
  const LegacyGantt = useMemo(() => {
    try {
      // Try to use the original Gantt component
      return Gantt;
    } catch (error) {
      console.warn("Legacy Gantt component not available, using compatibility mode");
      return null;
    }
  }, []);

  if (!LegacyGantt) {
    // Fallback to a simple div if Gantt is not available
    return (
      <div className="gantt-chart">
        <div className="gantt-error">
          Gantt chart is not available in this environment
        </div>
      </div>
    );
  }

  return (
    <LegacyGantt
      tasks={tasks}
      links={links}
      scales={scales}
      columns={columns}
      cellWidth={cellWidth}
      cellHeight={cellHeight}
    />
  );
};

export const GanttChart: React.FC<GanttChartProps> = ({
  items,
  links,
  zoom,
  onItemClick,
  onItemDrag,
  isLoading
}) => {
  // Scales configuration matching SVAR docs
  const scales = useMemo(() => [
    { unit: "month", step: 1, format: "MMMM yyy" },
    { unit: "day", step: 1, format: "d" }
  ], []);

  // Get cell width based on zoom level
  const cellWidth = useMemo(() => {
    return ganttDataService.getCellWidth(zoom);
  }, [zoom]);

  // Convert items to SVAR task format or use test data
  const tasks = useMemo(() => {
    if (items.length === 0) {
      // Test data matching SVAR docs exactly
      return [
        {
          id: 20,
          text: "📋 New Task",
          start: new Date(2024, 5, 11),
          end: new Date(2024, 6, 12),
          duration: 31,
          progress: 50,
          type: "task" as const
        },
        {
          id: 47,
          text: "👑 Master Project",
          start: new Date(2024, 5, 12),
          end: new Date(2024, 7, 12),
          duration: 61,
          progress: 0,
          parent: 0,
          type: "summary" as const
        },
        {
          id: 22,
          text: "📋 Sub Task",
          start: new Date(2024, 7, 11),
          end: new Date(2024, 8, 12),
          duration: 32,
          progress: 25,
          parent: 47,
          type: "task" as const
        }
      ];
    }

    // Convert GanttItem[] to SVAR format with icons
    return items.map(item => {
      const workItemType = item.workItem?.type as WorkItemType;
      const icon = workItemType ? TYPE_ICONS[workItemType] || '' : '';

      return {
        id: item.id,
        text: `${icon} ${item.text}`,
        start: item.start,
        end: item.end,
        duration: item.duration,
        progress: item.progress,
        parent: item.parent || 0,
        type: item.type,
        // Pass CSS class for styling
        $css: item.$css
      };
    });
  }, [items]);

  // Convert links to SVAR format
  const ganttLinks = useMemo(() => {
    return links.map(link => ({
      id: link.id,
      source: link.source,
      target: link.target,
      type: link.type
    }));
  }, [links]);

  return (
    <div className="gantt-chart-container">
      {isLoading && (
        <div className="gantt-loading-overlay">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <span>Loading work items...</span>
          </div>
        </div>
      )}
      <div className="gantt-chart" style={{ width: '100%', height: 'calc(100vh - 180px)' }}>
        <WxReactGanttCompat
          tasks={tasks}
          links={ganttLinks}
          scales={scales}
          columns={COLUMNS}
          cellWidth={cellWidth}
          cellHeight={38}
        />
      </div>
    </div>
  );
};