import { WorkItem, GanttItem, GanttLink, GanttData, ZoomLevel, STATE_COLORS, WorkItemState } from "../types";

/**
 * Service for converting WorkItems to SVAR Gantt format
 */
export class GanttDataService {

  /**
   * Convert work items to gantt data (items + links)
   * This is the main entry point for data conversion
   */
  convertToGanttData(workItems: WorkItem[]): GanttData {
    const items = this.convertToGanttItems(workItems);
    const links = this.extractGanttLinks(workItems, items);
    return { items, links };
  }

  convertToGanttItems(workItems: WorkItem[]): GanttItem[] {
    const itemMap = new Map<number, WorkItem>();
    workItems.forEach(wi => itemMap.set(wi.id, wi));

    // Build set of valid item IDs in the dataset
    const validIds = new Set(workItems.map(wi => wi.id));

    // Build set of items that have children in the dataset
    const parentIds = new Set<number>();
    for (const workItem of workItems) {
      if (workItem.parentId && itemMap.has(workItem.parentId)) {
        parentIds.add(workItem.parentId);
      }
      // Also check childrenIds array
      for (const childId of workItem.childrenIds) {
        if (itemMap.has(childId)) {
          parentIds.add(workItem.id);
        }
      }
    }

    const ganttItems: GanttItem[] = [];
    const processedIds = new Set<number>();

    for (const workItem of workItems) {
      if (processedIds.has(workItem.id)) continue;

      const hasChildren = parentIds.has(workItem.id);
      // Only set parent if parent exists in the dataset
      const validParentId = workItem.parentId && validIds.has(workItem.parentId) ? workItem.parentId : 0;
      const ganttItem = this.createGanttItem(workItem, hasChildren, validParentId);
      ganttItems.push(ganttItem);
      processedIds.add(workItem.id);

      // If this item has a parent not yet processed, add the parent too
      if (workItem.parentId && !processedIds.has(workItem.parentId)) {
        const parent = itemMap.get(workItem.parentId);
        if (parent) {
          const parentHasChildren = parentIds.has(parent.id);
          // Parent's parent must also be validated
          const parentValidParentId = parent.parentId && validIds.has(parent.parentId) ? parent.parentId : 0;
          const parentGanttItem = this.createGanttItem(parent, parentHasChildren, parentValidParentId);
          ganttItems.push(parentGanttItem);
          processedIds.add(parent.id);
        }
      }
    }

    return this.sortGanttItems(ganttItems);
  }

  private createGanttItem(workItem: WorkItem, hasChildren: boolean = false, validParentId: number = 0): GanttItem {
    const { startDate, endDate, duration } = this.calculateDates(workItem);
    const progress = this.calculateProgress(workItem);

    // Items with children are rendered as 'summary' type in SVAR
    const itemType = hasChildren ? 'summary' : 'task';

    // Build CSS class based on work item type and state
    const cssClasses = this.buildCssClasses(workItem);

    // SVAR expects no parent property for root items, not parent: 0
    const ganttItem: GanttItem = {
      id: workItem.id,
      text: workItem.title,
      start: startDate,
      end: endDate,
      duration: duration,
      progress: progress,
      parent: validParentId,
      type: itemType,
      open: true,
      workItem: workItem,
      $css: cssClasses
    };

    return ganttItem;
  }

  /**
   * Build CSS classes for task styling based on work item type and state
   */
  private buildCssClasses(workItem: WorkItem): string {
    const classes: string[] = [];

    // Add type-based class
    const typeClass = `gantt-task-${workItem.type.toLowerCase().replace(/\s+/g, '-')}`;
    classes.push(typeClass);

    // Add state-based class
    const stateClass = `gantt-state-${workItem.state.toLowerCase().replace(/\s+/g, '-')}`;
    classes.push(stateClass);

    return classes.join(' ');
  }

  /**
   * Extract dependency links from work items
   * Only creates links where both source and target exist in the dataset
   */
  private extractGanttLinks(workItems: WorkItem[], ganttItems: GanttItem[]): GanttLink[] {
    const itemIds = new Set(ganttItems.map(item => item.id));
    const links: GanttLink[] = [];
    let linkId = 1;

    for (const workItem of workItems) {
      // Create links from predecessors (end-to-start by default)
      // Predecessor means: the predecessor must finish before this item can start
      for (const predecessorId of workItem.predecessors) {
        // Only create link if both items are in our dataset
        if (itemIds.has(predecessorId) && itemIds.has(workItem.id)) {
          links.push({
            id: linkId++,
            source: predecessorId,  // Predecessor (must finish first)
            target: workItem.id,    // This item (starts after)
            type: 'e2s'             // End-to-start (SVAR format)
          });
        }
      }
    }

    console.log(`[GanttDataService] Created ${links.length} dependency links`);
    return links;
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
    // Handle both Agile and Basic process states
    switch (workItem.state) {
      case 'New':
      case 'To Do':
        return 0;
      case 'Active':
      case 'Doing':
        break; // Fall through to work-based calculation
      case 'Resolved':
        return 90;
      case 'Closed':
      case 'Done':
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
    return [...items].sort((a: GanttItem, b: GanttItem) => {
      const aHasChildren = items.some(i => i.parent === a.id);
      const bHasChildren = items.some(i => i.parent === b.id);

      if (aHasChildren && !bHasChildren) return -1;
      if (!aHasChildren && bHasChildren) return 1;

      return a.start.getTime() - b.start.getTime();
    });
  }

  /**
   * Get SVAR scales configuration for zoom level
   */
  getScalesConfig(zoom: ZoomLevel): Array<{ unit: string; step: number; format: string }> {
    switch (zoom) {
      case 'day':
        return [
          { unit: 'month', step: 1, format: 'MMMM yyyy' },
          { unit: 'day', step: 1, format: 'd' }
        ];
      case 'week':
        return [
          { unit: 'month', step: 1, format: 'MMMM yyyy' },
          { unit: 'week', step: 1, format: "'W'w" }
        ];
      case 'month':
        return [
          { unit: 'year', step: 1, format: 'yyyy' },
          { unit: 'month', step: 1, format: 'MMM' }
        ];
      case 'quarter':
        return [
          { unit: 'year', step: 1, format: 'yyyy' },
          { unit: 'quarter', step: 1, format: 'QQQ' }
        ];
      default:
        return [
          { unit: 'month', step: 1, format: 'MMMM yyyy' },
          { unit: 'week', step: 1, format: "'W'w" }
        ];
    }
  }

  /**
   * Get cell width based on zoom level
   */
  getCellWidth(zoom: ZoomLevel): number {
    switch (zoom) {
      case 'day':
        return 40;
      case 'week':
        return 100;
      case 'month':
        return 80;
      case 'quarter':
        return 120;
      default:
        return 100;
    }
  }
}

export const ganttDataService = new GanttDataService();
