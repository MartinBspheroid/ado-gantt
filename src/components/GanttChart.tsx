import * as React from "react";
import { GanttChartProps } from "../types";
import { ganttDataService } from "../services";
import "../styles/GanttChart.css";

let gantt: any = null;

export const GanttChart: React.FC<GanttChartProps> = ({
  items,
  zoom,
  onItemClick,
  onItemDrag,
  onItemResize,
  isLoading
}) => {
  const ganttContainer = React.useRef<HTMLDivElement>(null);
  const ganttInitialized = React.useRef(false);

  React.useEffect(() => {
    if (typeof window === "undefined" || !ganttContainer.current) return;

    const initGantt = async () => {
      if (!ganttInitialized.current) {
        const ganttModule = await import("dhtmlx-gantt");
        gantt = ganttModule.gantt;

        configureGantt();
        gantt.init(ganttContainer.current);
        ganttInitialized.current = true;
      }
    };

    initGantt();

    return () => {
      if (gantt && ganttInitialized.current) {
        gantt.clearAll();
      }
    };
  }, []);

  const configureGantt = () => {
    if (!gantt) return;

    gantt.config.columns = [
      { name: "text", label: "Work Item", tree: true, width: 250, resize: true },
      { name: "start_date", label: "Start", align: "center", width: 90 },
      { name: "duration", label: "Days", align: "center", width: 60 },
      { name: "progress", label: "Progress", align: "center", width: 80, template: (obj: any) => `${Math.round(obj.progress * 100)}%` }
    ];

    updateZoom(zoom);

    gantt.config.drag_move = true;
    gantt.config.drag_resize = true;
    gantt.config.drag_progress = false;
    gantt.config.row_height = 36;
    gantt.config.bar_height = 24;
    gantt.config.min_column_width = 50;

    gantt.attachEvent("onTaskClick", (id: string | number) => {
      const task = gantt.getTask(id);
      if (task && task.workItem) {
        onItemClick(task);
      }
      return true;
    });

    gantt.attachEvent("onAfterTaskDrag", (id: string | number, mode: string, task: any) => {
      if (mode === "move" && onItemDrag) {
        onItemDrag(task, task.start_date, task.end_date);
      } else if (mode === "resize" && onItemResize) {
        onItemResize(task, task.start_date, task.end_date);
      }
      return true;
    });

    gantt.templates.task_class = (start: Date, end: Date, task: any) => {
      const classes = [`gantt-task-state-${task.workItem.state.toLowerCase()}`];
      if (task.workItem.type === 'Epic') classes.push('gantt-task-epic');
      if (task.workItem.type === 'Feature') classes.push('gantt-task-feature');
      if (task.type === 'project') classes.push('gantt-task-project');
      if (task.progressStatus) classes.push(`gantt-task-status-${task.progressStatus.toLowerCase().replace(' ', '-')}`);
      return classes.join(' ');
    };
    
    // Add progress status indicator to task text
    gantt.templates.task_text = (start: Date, end: Date, task: any) => {
      const statusIcon = getStatusIcon(task.progressStatus || 'Not Started');
      return `<span class="gantt-task-status-icon">${statusIcon}</span> ${task.text}`;
    };
  };

  const updateZoom = (zoomLevel: string) => {
    if (!gantt) return;

    switch (zoomLevel) {
      case 'day':
        gantt.config.scale_unit = "day";
        gantt.config.step = 1;
        gantt.config.date_scale = "%d %M";
        break;
      case 'week':
        gantt.config.scale_unit = "week";
        gantt.config.step = 1;
        gantt.config.date_scale = "Week %W";
        break;
      case 'month':
        gantt.config.scale_unit = "month";
        gantt.config.step = 1;
        gantt.config.date_scale = "%F %Y";
        break;
      case 'quarter':
        gantt.config.scale_unit = "month";
        gantt.config.step = 3;
        gantt.config.date_scale = "%Y Q%q";
        break;
    }

    gantt.render();
  };

  React.useEffect(() => {
    if (!gantt || !ganttInitialized.current) return;

    const ganttData = {
      data: items.map(item => ({
        id: item.id,
        text: item.text,
        start_date: formatDateForGantt(item.start_date),
        duration: item.duration,
        progress: item.progress / 100,
        parent: item.parent || 0,
        type: item.type,
        open: item.open,
        workItem: item.workItem,
        color: item.color,
        textColor: item.textColor
      })),
      links: []
    };

    gantt.clearAll();
    gantt.parse(ganttData);
  }, [items]);

  React.useEffect(() => {
    if (!gantt || !ganttInitialized.current) return;
    updateZoom(zoom);
  }, [zoom]);

  const formatDateForGantt = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getStatusIcon = (status: string): string => {
    switch (status) {
      case 'Done': return '✓';
      case 'On Track': return '●';
      case 'At Risk': return '⚠';
      case 'Off Track': return '✕';
      case 'Not Started': return '○';
      default: return '';
    }
  };

  return (
    <div className="gantt-chart-container">
      {isLoading && (
        <div className="gantt-loading-overlay">
          <div className="loading-spinner">Loading Gantt chart...</div>
        </div>
      )}
      <div 
        ref={ganttContainer} 
        className="gantt-chart"
        style={{ width: '100%', height: 'calc(100vh - 200px)' }}
      />
    </div>
  );
};
