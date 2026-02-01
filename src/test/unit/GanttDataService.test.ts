import { describe, it, expect, beforeEach } from 'vitest';
import { GanttDataService } from '../../services/GanttDataService';
import { 
  WorkItem, 
  GanttItem, 
  WorkItemType, 
  WorkItemState,
  ZoomLevel 
} from '../../types';

describe('GanttDataService', () => {
  let service: GanttDataService;

  beforeEach(() => {
    service = new GanttDataService();
  });

  describe('convertToGanttItems', () => {
    it('should convert a simple work item to gantt item', () => {
      const workItem: WorkItem = {
        id: 1,
        title: 'Test Task',
        type: 'Task',
        state: 'Active',
        areaPath: 'Test',
        iterationPath: 'Sprint 1',
        startDate: new Date('2026-01-01'),
        targetDate: new Date('2026-01-10'),
        createdDate: new Date(),
        changedDate: new Date(),
        childrenIds: [],
        priority: 1,
        tags: []
      };

      const result = service.convertToGanttItems([workItem]);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
      expect(result[0].text).toBe('Test Task');
      expect(result[0].type).toBe('task');
      expect(result[0].parent).toBe(0);
    });

    it('should handle work items with parent relationships', () => {
      const workItems: WorkItem[] = [
        {
          id: 1,
          title: 'Parent',
          type: 'Feature',
          state: 'Active',
          areaPath: 'Test',
          iterationPath: 'Sprint 1',
          startDate: new Date('2026-01-01'),
          targetDate: new Date('2026-01-31'),
          createdDate: new Date(),
          changedDate: new Date(),
          childrenIds: [2],
          priority: 1,
          tags: []
        },
        {
          id: 2,
          title: 'Child',
          type: 'Task',
          state: 'Active',
          areaPath: 'Test',
          iterationPath: 'Sprint 1',
          startDate: new Date('2026-01-05'),
          targetDate: new Date('2026-01-15'),
          createdDate: new Date(),
          changedDate: new Date(),
          parentId: 1,
          childrenIds: [],
          priority: 1,
          tags: []
        }
      ];

      const result = service.convertToGanttItems(workItems);

      const child = result.find(i => i.id === 2);
      expect(child).toBeDefined();
      expect(child?.parent).toBe(1);
    });

    it('should calculate correct duration from dates', () => {
      const workItem: WorkItem = {
        id: 1,
        title: 'Test',
        type: 'Task',
        state: 'Active',
        areaPath: 'Test',
        iterationPath: 'Sprint 1',
        startDate: new Date('2026-01-01'),
        targetDate: new Date('2026-01-10'),
        createdDate: new Date(),
        changedDate: new Date(),
        childrenIds: [],
        priority: 1,
        tags: []
      };

      const result = service.convertToGanttItems([workItem]);

      expect(result[0].duration).toBe(9);
    });

    it('should handle work items without dates (use created date)', () => {
      const createdDate = new Date('2026-01-15');
      const workItem: WorkItem = {
        id: 1,
        title: 'No Dates',
        type: 'Task',
        state: 'New',
        areaPath: 'Test',
        iterationPath: 'Sprint 1',
        createdDate,
        changedDate: createdDate,
        childrenIds: [],
        priority: 1,
        tags: []
      };

      const result = service.convertToGanttItems([workItem]);

      expect(result[0].start_date).toEqual(createdDate);
      expect(result[0].duration).toBe(5); // Default duration
    });

    it('should handle work item with only start date', () => {
      const workItem: WorkItem = {
        id: 1,
        title: 'Start Only',
        type: 'Task',
        state: 'Active',
        areaPath: 'Test',
        iterationPath: 'Sprint 1',
        startDate: new Date('2026-01-01'),
        createdDate: new Date(),
        changedDate: new Date(),
        childrenIds: [],
        priority: 1,
        tags: []
      };

      const result = service.convertToGanttItems([workItem]);

      expect(result[0].start_date).toEqual(new Date('2026-01-01'));
      expect(result[0].duration).toBe(5);
    });

    it('should handle work item with only target date', () => {
      const workItem: WorkItem = {
        id: 1,
        title: 'Target Only',
        type: 'Task',
        state: 'Active',
        areaPath: 'Test',
        iterationPath: 'Sprint 1',
        targetDate: new Date('2026-01-15'),
        createdDate: new Date(),
        changedDate: new Date(),
        childrenIds: [],
        priority: 1,
        tags: []
      };

      const result = service.convertToGanttItems([workItem]);

      expect(result[0].end_date).toEqual(new Date('2026-01-15'));
      expect(result[0].duration).toBe(5);
    });

    it('should fix zero or negative duration', () => {
      const workItem: WorkItem = {
        id: 1,
        title: 'Same Day',
        type: 'Task',
        state: 'Active',
        areaPath: 'Test',
        iterationPath: 'Sprint 1',
        startDate: new Date('2026-01-01'),
        targetDate: new Date('2026-01-01'),
        createdDate: new Date(),
        changedDate: new Date(),
        childrenIds: [],
        priority: 1,
        tags: []
      };

      const result = service.convertToGanttItems([workItem]);

      expect(result[0].duration).toBeGreaterThan(0);
    });

    it('should handle empty array', () => {
      const result = service.convertToGanttItems([]);
      expect(result).toEqual([]);
    });
  });

  describe('calculateProgress', () => {
    it('should return 0 for New state', () => {
      const workItem: WorkItem = {
        id: 1,
        title: 'New Task',
        type: 'Task',
        state: 'New',
        areaPath: 'Test',
        iterationPath: 'Sprint 1',
        startDate: new Date(),
        targetDate: new Date(),
        createdDate: new Date(),
        changedDate: new Date(),
        childrenIds: [],
        priority: 1,
        tags: []
      };

      const result = service.convertToGanttItems([workItem]);
      expect(result[0].progress).toBe(0);
    });

    it('should return 100 for Closed state', () => {
      const workItem: WorkItem = {
        id: 1,
        title: 'Closed Task',
        type: 'Task',
        state: 'Closed',
        areaPath: 'Test',
        iterationPath: 'Sprint 1',
        startDate: new Date(),
        targetDate: new Date(),
        createdDate: new Date(),
        changedDate: new Date(),
        childrenIds: [],
        priority: 1,
        tags: []
      };

      const result = service.convertToGanttItems([workItem]);
      expect(result[0].progress).toBe(100);
    });

    it('should return 90 for Resolved state', () => {
      const workItem: WorkItem = {
        id: 1,
        title: 'Resolved Task',
        type: 'Task',
        state: 'Resolved',
        areaPath: 'Test',
        iterationPath: 'Sprint 1',
        startDate: new Date(),
        targetDate: new Date(),
        createdDate: new Date(),
        changedDate: new Date(),
        childrenIds: [],
        priority: 1,
        tags: []
      };

      const result = service.convertToGanttItems([workItem]);
      expect(result[0].progress).toBe(90);
    });

    it('should calculate progress from completed/remaining work', () => {
      const workItem: WorkItem = {
        id: 1,
        title: 'Active Task',
        type: 'Task',
        state: 'Active',
        areaPath: 'Test',
        iterationPath: 'Sprint 1',
        startDate: new Date(),
        targetDate: new Date(),
        createdDate: new Date(),
        changedDate: new Date(),
        childrenIds: [],
        remainingWork: 5,
        completedWork: 15,
        priority: 1,
        tags: []
      };

      const result = service.convertToGanttItems([workItem]);
      expect(result[0].progress).toBe(75);
    });

    it('should return 50 for Active state without work tracking', () => {
      const workItem: WorkItem = {
        id: 1,
        title: 'Active Task',
        type: 'Task',
        state: 'Active',
        areaPath: 'Test',
        iterationPath: 'Sprint 1',
        startDate: new Date(),
        targetDate: new Date(),
        createdDate: new Date(),
        changedDate: new Date(),
        childrenIds: [],
        priority: 1,
        tags: []
      };

      const result = service.convertToGanttItems([workItem]);
      expect(result[0].progress).toBe(50);
    });
  });

  describe('getZoomConfig', () => {
    it('should return day zoom config', () => {
      const config = service.getZoomConfig('day');
      expect(config.unit).toBe('day');
      expect(config.step).toBe(1);
    });

    it('should return week zoom config', () => {
      const config = service.getZoomConfig('week');
      expect(config.unit).toBe('week');
      expect(config.step).toBe(1);
    });

    it('should return month zoom config', () => {
      const config = service.getZoomConfig('month');
      expect(config.unit).toBe('month');
      expect(config.step).toBe(1);
    });

    it('should return quarter zoom config', () => {
      const config = service.getZoomConfig('quarter');
      expect(config.unit).toBe('month');
      expect(config.step).toBe(3);
    });

    it('should default to week for invalid zoom', () => {
      const config = service.getZoomConfig('invalid' as ZoomLevel);
      expect(config.unit).toBe('week');
    });
  });

  describe('sortGanttItems', () => {
    it('should sort items with parents before children', () => {
      const workItems: WorkItem[] = [
        {
          id: 2,
          title: 'Child',
          type: 'Task',
          state: 'Active',
          areaPath: 'Test',
          iterationPath: 'Sprint 1',
          startDate: new Date('2026-01-01'),
          targetDate: new Date('2026-01-10'),
          createdDate: new Date(),
          changedDate: new Date(),
          parentId: 1,
          childrenIds: [],
          priority: 1,
          tags: []
        },
        {
          id: 1,
          title: 'Parent',
          type: 'Feature',
          state: 'Active',
          areaPath: 'Test',
          iterationPath: 'Sprint 1',
          startDate: new Date('2026-01-05'),
          targetDate: new Date('2026-01-15'),
          createdDate: new Date(),
          changedDate: new Date(),
          childrenIds: [2],
          priority: 1,
          tags: []
        }
      ];

      const result = service.convertToGanttItems(workItems);
      
      // Parent should come before child
      const parentIndex = result.findIndex(i => i.id === 1);
      const childIndex = result.findIndex(i => i.id === 2);
      expect(parentIndex).toBeLessThan(childIndex);
    });
  });

  describe('getTodayMarker', () => {
    it('should return today marker', () => {
      const marker = service.getTodayMarker();
      
      expect(marker.css).toBe('gantt-today-marker');
      expect(marker.text).toBe('Today');
      
      // Date should be today
      const today = new Date();
      expect(marker.start_date.getDate()).toBe(today.getDate());
      expect(marker.start_date.getMonth()).toBe(today.getMonth());
      expect(marker.start_date.getFullYear()).toBe(today.getFullYear());
    });
  });

  describe('state colors', () => {
    it.each([
      ['New', '#deecf9'],
      ['Active', '#fff4e5'],
      ['Resolved', '#f3f2f1'],
      ['Closed', '#dff6dd'],
      ['Removed', '#fde7e9']
    ])('should apply correct color for %s state', (state, expectedColor) => {
      const workItem: WorkItem = {
        id: 1,
        title: 'Test',
        type: 'Task',
        state: state as WorkItemState,
        areaPath: 'Test',
        iterationPath: 'Sprint 1',
        startDate: new Date(),
        targetDate: new Date(),
        createdDate: new Date(),
        changedDate: new Date(),
        childrenIds: [],
        priority: 1,
        tags: []
      };

      const result = service.convertToGanttItems([workItem]);
      expect(result[0].color).toBe(expectedColor);
    });
  });
});
