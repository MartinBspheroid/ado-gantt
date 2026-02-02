import { 
  WorkItem, 
  GanttItem, 
  ZoomLevel, 
  GanttFilters 
} from '../../types';
import { GanttDataService } from '../GanttDataService';

export interface MockTransformationOptions {
  addRandomProgress?: boolean;
  customColors?: boolean;
  dateOffset?: number;
}

/**
 * Mock GanttDataService for testing
 * Extends the real service with additional test helpers
 */
export class MockGanttDataService extends GanttDataService {
  private transformationOptions: MockTransformationOptions = {};

  setTransformationOptions(options: MockTransformationOptions): void {
    this.transformationOptions = options;
  }

  /**
   * Convert work items with additional test-specific transformations
   */
  convertToGanttItemsWithOptions(
    workItems: WorkItem[], 
    options?: MockTransformationOptions
  ): GanttItem[] {
    const opts = { ...this.transformationOptions, ...options };
    
    let items = super.convertToGanttItems(workItems);

    if (opts.addRandomProgress) {
      items = items.map(item => ({
        ...item,
        progress: Math.floor(Math.random() * 100)
      }));
    }

    if (opts.customColors) {
      items = items.map(item => ({
        ...item,
        color: this.getRandomColor(),
        textColor: '#000000'
      }));
    }

    return items;
  }

  /**
   * Generate test data with specific patterns
   */
  generateSequentialWorkItems(
    count: number, 
    startDate: Date = new Date(),
    durationDays: number = 7
  ): WorkItem[] {
    const items: WorkItem[] = [];
    
    for (let i = 1; i <= count; i++) {
      const itemStart = new Date(startDate);
      itemStart.setDate(itemStart.getDate() + ((i - 1) * durationDays));
      
      const itemEnd = new Date(itemStart);
      itemEnd.setDate(itemEnd.getDate() + durationDays);

      items.push({
        id: i,
        title: `Sequential Item ${i}`,
        type: 'Task',
        state: 'Active',
        areaPath: 'Test\\Sequential',
        iterationPath: 'Test\\Sprint 1',
        startDate: itemStart,
        targetDate: itemEnd,
        createdDate: new Date(),
        changedDate: new Date(),
        childrenIds: [],
        predecessors: [],
        successors: [],
        priority: 1,
        tags: ['sequential']
      });
    }

    return items;
  }

  /**
   * Generate parallel work items (same time period)
   */
  generateParallelWorkItems(
    count: number,
    startDate: Date = new Date(),
    durationDays: number = 14
  ): WorkItem[] {
    const items: WorkItem[] = [];
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + durationDays);

    for (let i = 1; i <= count; i++) {
      items.push({
        id: i,
        title: `Parallel Item ${i}`,
        type: 'Task',
        state: 'Active',
        areaPath: 'Test\\Parallel',
        iterationPath: 'Test\\Sprint 1',
        startDate: new Date(startDate),
        targetDate: new Date(endDate),
        createdDate: new Date(),
        changedDate: new Date(),
        childrenIds: [],
        predecessors: [],
        successors: [],
        priority: 1,
        tags: ['parallel']
      });
    }

    return items;
  }

  /**
   * Generate overlapping work items
   */
  generateOverlappingWorkItems(count: number): WorkItem[] {
    const items: WorkItem[] = [];
    const baseDate = new Date();

    for (let i = 1; i <= count; i++) {
      const startOffset = Math.floor(Math.random() * 7);
      const duration = 5 + Math.floor(Math.random() * 10);
      
      const startDate = new Date(baseDate);
      startDate.setDate(startDate.getDate() + startOffset);
      
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + duration);

      items.push({
        id: i,
        title: `Overlapping Item ${i}`,
        type: 'Task',
        state: 'Active',
        areaPath: 'Test\\Overlapping',
        iterationPath: 'Test\\Sprint 1',
        startDate,
        targetDate: endDate,
        createdDate: new Date(),
        changedDate: new Date(),
        childrenIds: [],
        predecessors: [],
        successors: [],
        priority: 1,
        tags: ['overlapping']
      });
    }

    return items;
  }

  /**
   * Simulate data transformation with performance measurement
   */
  measureTransformationTime(workItems: WorkItem[]): { 
    items: GanttItem[]; 
    durationMs: number;
    itemsPerSecond: number;
  } {
    const start = performance.now();
    const items = this.convertToGanttItems(workItems);
    const end = performance.now();
    const durationMs = end - start;

    return {
      items,
      durationMs,
      itemsPerSecond: Math.round((workItems.length / durationMs) * 1000)
    };
  }

  /**
   * Validate gantt items for common issues
   */
  validateGanttItems(items: GanttItem[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    for (const item of items) {
      // Check required fields
      if (!item.id) errors.push(`Item missing id`);
      if (!item.text) errors.push(`Item ${item.id} missing text`);
      if (!item.start) errors.push(`Item ${item.id} missing start`);
      if (!item.end) errors.push(`Item ${item.id} missing end`);

      // Check date validity
      if (item.start && item.end) {
        if (item.end < item.start) {
          errors.push(`Item ${item.id} has end before start`);
        }
      }

      // Check progress range
      if (item.progress < 0 || item.progress > 100) {
        errors.push(`Item ${item.id} has invalid progress: ${item.progress}`);
      }

      // Check for parent reference validity
      if (item.parent && item.parent !== 0) {
        const parentExists = items.some(i => i.id === item.parent);
        if (!parentExists) {
          errors.push(`Item ${item.id} references non-existent parent ${item.parent}`);
        }
      }
    }

    // Check for duplicate IDs
    const ids = items.map(i => i.id);
    const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
    if (duplicates.length > 0) {
      errors.push(`Duplicate IDs found: ${[...new Set(duplicates)].join(', ')}`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Calculate statistics for gantt items
   */
  calculateStatistics(items: GanttItem[]): {
    totalItems: number;
    tasks: number;
    summaries: number;
    averageDuration: number;
    averageProgress: number;
    dateRange: { start: Date; end: Date } | null;
  } {
    if (items.length === 0) {
      return {
        totalItems: 0,
        tasks: 0,
        summaries: 0,
        averageDuration: 0,
        averageProgress: 0,
        dateRange: null
      };
    }

    const tasks = items.filter(i => i.type === 'task').length;
    const summaries = items.filter(i => i.type === 'summary').length;

    const totalDuration = items.reduce((sum, i) => sum + (i.duration || 0), 0);
    const totalProgress = items.reduce((sum, i) => sum + i.progress, 0);

    const dates = items.flatMap(i => [i.start, i.end]);
    const startDates = dates.filter(d => d).map(d => d.getTime());
    
    return {
      totalItems: items.length,
      tasks,
      summaries,
      averageDuration: Math.round(totalDuration / items.length),
      averageProgress: Math.round(totalProgress / items.length),
      dateRange: startDates.length > 0 ? {
        start: new Date(Math.min(...startDates)),
        end: new Date(Math.max(...startDates))
      } : null
    };
  }

  private getRandomColor(): string {
    const colors = [
      '#deecf9', '#fff4e5', '#f3f2f1', '#dff6dd', '#fde7e9',
      '#e6f3ff', '#fff8e6', '#f0f0f0', '#e6f4ea', '#fce8e6'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }
}

// Export singleton for convenience
export const mockGanttDataService = new MockGanttDataService();
