import { WorkItem, GanttItem, ZoomLevel, STATE_COLORS, WorkItemState } from "../types";

export class GanttDataService {
  
  convertToGanttItems(workItems: WorkItem[]): GanttItem[] {
    const itemMap = new Map<number, WorkItem>();
    workItems.forEach(wi => itemMap.set(wi.id, wi));

    const ganttItems: GanttItem[] = [];
    const processedIds = new Set<number>();

    for (const workItem of workItems) {
      if (processedIds.has(workItem.id)) continue;
      
      const ganttItem = this.createGanttItem(workItem);
      ganttItems.push(ganttItem);
      processedIds.add(workItem.id);

      if (workItem.parentId && !processedIds.has(workItem.parentId)) {
        const parent = itemMap.get(workItem.parentId);
        if (parent) {
          const parentGanttItem = this.createGanttItem(parent, true);
          ganttItems.push(parentGanttItem);
          processedIds.add(parent.id);
        }
      }
    }

    return this.sortGanttItems(ganttItems);
  }

  private createGanttItem(workItem: WorkItem, asProject: boolean = false): GanttItem {
    const { startDate, endDate, duration } = this.calculateDates(workItem);
    const stateColor = STATE_COLORS[workItem.state as WorkItemState] || STATE_COLORS['New'];
    const progress = this.calculateProgress(workItem);

    return {
      id: workItem.id,
      text: workItem.title,
      start_date: startDate,
      end_date: endDate,
      duration: duration,
      progress: progress,
      parent: workItem.parentId || 0,
      type: asProject ? 'project' : 'task',
      open: true,
      workItem: workItem,
      color: stateColor.backgroundColor,
      textColor: stateColor.color
    };
  }

  private calculateDates(workItem: WorkItem): { 
    startDate: Date; 
    endDate: Date; 
    duration: number;
  } {
    let startDate: Date;
    let endDate: Date;

    if (workItem.startDate && workItem.targetDate) {
      startDate = workItem.startDate;
      endDate = workItem.targetDate;
    } else if (workItem.startDate) {
      startDate = workItem.startDate;
      endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 5);
    } else if (workItem.targetDate) {
      endDate = workItem.targetDate;
      startDate = new Date(endDate);
      startDate.setDate(startDate.getDate() - 5);
    } else {
      startDate = workItem.createdDate || new Date();
      endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 5);
    }

    if (endDate <= startDate) {
      endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 1);
    }

    const durationMs = endDate.getTime() - startDate.getTime();
    const duration = Math.ceil(durationMs / (1000 * 60 * 60 * 24));

    return { startDate, endDate, duration };
  }

  private calculateProgress(workItem: WorkItem): number {
    switch (workItem.state) {
      case 'New':
        return 0;
      case 'Active':
        break;
      case 'Resolved':
        return 90;
      case 'Closed':
        return 100;
      case 'Removed':
        return 0;
    }

    if (workItem.completedWork !== undefined && workItem.remainingWork !== undefined) {
      const total = workItem.completedWork + workItem.remainingWork;
      if (total > 0) {
        return Math.round((workItem.completedWork / total) * 100);
      }
    }

    return 50;
  }

  private sortGanttItems(items: GanttItem[]): GanttItem[] {
    return items.sort((a, b) => {
      const aHasChildren = items.some(i => i.parent === a.id);
      const bHasChildren = items.some(i => i.parent === b.id);
      
      if (aHasChildren && !bHasChildren) return -1;
      if (!aHasChildren && bHasChildren) return 1;

      return a.start_date.getTime() - b.start_date.getTime();
    });
  }

  getZoomConfig(zoom: ZoomLevel): { unit: string; step: number; dateScale: string } {
    switch (zoom) {
      case 'day':
        return { unit: 'day', step: 1, dateScale: '%d %M' };
      case 'week':
        return { unit: 'week', step: 1, dateScale: 'Week %W' };
      case 'month':
        return { unit: 'month', step: 1, dateScale: '%F %Y' };
      case 'quarter':
        return { unit: 'month', step: 3, dateScale: '%Y Q%q' };
      default:
        return { unit: 'week', step: 1, dateScale: 'Week %W' };
    }
  }

  getTodayMarker(): { start_date: Date; css: string; text: string; title?: string } {
    return {
      start_date: new Date(),
      css: 'gantt-today-marker',
      text: 'Today',
      title: 'Today'
    };
  }
}

export const ganttDataService = new GanttDataService();
