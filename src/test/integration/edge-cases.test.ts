import { describe, it, expect } from 'vitest';
import { MockGanttDataService } from '../../services/__mocks__/MockGanttDataService';
import { WorkItem, GanttItem } from '../../types';

describe('Edge Cases', () => {
  const service = new MockGanttDataService();

  describe('Null and undefined handling', () => {
    it('should handle work items with no dates', () => {
      const item: WorkItem = {
        id: 1,
        title: 'No Dates Item',
        type: 'Task',
        state: 'New',
        areaPath: 'Test',
        iterationPath: 'Sprint 1',
        createdDate: new Date('2026-01-15'),
        changedDate: new Date('2026-01-15'),
        childrenIds: [],
        priority: 1,
        tags: []
      };

      const result = service.convertToGanttItems([item]);
      
      expect(result).toHaveLength(1);
      expect(result[0].start_date).toBeInstanceOf(Date);
      expect(result[0].duration).toBeGreaterThan(0);
    });

    it('should handle work items with only start date', () => {
      const item: WorkItem = {
        id: 1,
        title: 'Start Only',
        type: 'Task',
        state: 'Active',
        areaPath: 'Test',
        iterationPath: 'Sprint 1',
        startDate: new Date('2026-01-15'),
        createdDate: new Date(),
        changedDate: new Date(),
        childrenIds: [],
        priority: 1,
        tags: []
      };

      const result = service.convertToGanttItems([item]);
      
      expect(result[0].start_date).toEqual(new Date('2026-01-15'));
      expect(result[0].end_date).toBeInstanceOf(Date);
    });

    it('should handle work items with only target date', () => {
      const item: WorkItem = {
        id: 1,
        title: 'Target Only',
        type: 'Task',
        state: 'Active',
        areaPath: 'Test',
        iterationPath: 'Sprint 1',
        targetDate: new Date('2026-01-25'),
        createdDate: new Date(),
        changedDate: new Date(),
        childrenIds: [],
        priority: 1,
        tags: []
      };

      const result = service.convertToGanttItems([item]);
      
      expect(result[0].end_date).toEqual(new Date('2026-01-25'));
      expect(result[0].start_date).toBeInstanceOf(Date);
    });

    it('should handle missing assigned user', () => {
      const item: WorkItem = {
        id: 1,
        title: 'Unassigned',
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
        // assignedTo is undefined
      };

      const result = service.convertToGanttItems([item]);
      
      expect(result).toHaveLength(1);
      expect(result[0].workItem.assignedTo).toBeUndefined();
    });

    it('should handle empty tags array', () => {
      const item: WorkItem = {
        id: 1,
        title: 'No Tags',
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

      const result = service.convertToGanttItems([item]);
      
      expect(result[0].workItem.tags).toEqual([]);
    });

    it('should handle undefined childrenIds', () => {
      const item: WorkItem = {
        id: 1,
        title: 'No Children',
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

      const result = service.convertToGanttItems([item]);
      
      expect(result).toHaveLength(1);
    });
  });

  describe('Invalid date handling', () => {
    it('should handle zero duration (same start and end)', () => {
      const item: WorkItem = {
        id: 1,
        title: 'Same Day',
        type: 'Task',
        state: 'Active',
        areaPath: 'Test',
        iterationPath: 'Sprint 1',
        startDate: new Date('2026-01-15'),
        targetDate: new Date('2026-01-15'),
        createdDate: new Date(),
        changedDate: new Date(),
        childrenIds: [],
        priority: 1,
        tags: []
      };

      const result = service.convertToGanttItems([item]);
      
      expect(result[0].duration).toBeGreaterThan(0); // Should be adjusted to minimum
    });

    it('should handle negative duration (end before start)', () => {
      const item: WorkItem = {
        id: 1,
        title: 'Negative Duration',
        type: 'Task',
        state: 'Active',
        areaPath: 'Test',
        iterationPath: 'Sprint 1',
        startDate: new Date('2026-01-25'),
        targetDate: new Date('2026-01-15'),
        createdDate: new Date(),
        changedDate: new Date(),
        childrenIds: [],
        priority: 1,
        tags: []
      };

      const result = service.convertToGanttItems([item]);
      
      // Should fix the dates so end >= start
      expect(result[0].end_date.getTime()).toBeGreaterThanOrEqual(result[0].start_date.getTime());
    });

    it('should handle very long durations', () => {
      const item: WorkItem = {
        id: 1,
        title: 'Long Duration',
        type: 'Epic',
        state: 'Active',
        areaPath: 'Test',
        iterationPath: 'Sprint 1',
        startDate: new Date('2026-01-01'),
        targetDate: new Date('2027-01-01'),
        createdDate: new Date(),
        changedDate: new Date(),
        childrenIds: [],
        priority: 1,
        tags: []
      };

      const result = service.convertToGanttItems([item]);
      
      expect(result[0].duration).toBe(365);
    });
  });

  describe('Special characters and encoding', () => {
    it('should handle unicode characters in title', () => {
      const item: WorkItem = {
        id: 1,
        title: 'Unicode: 日本語 🎉 émojis',
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

      const result = service.convertToGanttItems([item]);
      
      expect(result[0].text).toBe('Unicode: 日本語 🎉 émojis');
    });

    it('should handle special characters in title', () => {
      const item: WorkItem = {
        id: 1,
        title: 'Special: <>&"\'\n\t',
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

      const result = service.convertToGanttItems([item]);
      
      expect(result[0].text).toBe('Special: <>&"\'\n\t');
    });

    it('should handle very long titles', () => {
      const longTitle = 'A'.repeat(500);
      const item: WorkItem = {
        id: 1,
        title: longTitle,
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

      const result = service.convertToGanttItems([item]);
      
      expect(result[0].text).toHaveLength(500);
    });
  });

  describe('Numeric edge cases', () => {
    it('should handle zero work tracking values', () => {
      const item: WorkItem = {
        id: 1,
        title: 'Zero Work',
        type: 'Task',
        state: 'Active',
        areaPath: 'Test',
        iterationPath: 'Sprint 1',
        startDate: new Date(),
        targetDate: new Date(),
        createdDate: new Date(),
        changedDate: new Date(),
        childrenIds: [],
        remainingWork: 0,
        completedWork: 0,
        priority: 1,
        tags: []
      };

      const result = service.convertToGanttItems([item]);
      
      expect(result[0].progress).toBeGreaterThanOrEqual(0);
      expect(result[0].progress).toBeLessThanOrEqual(100);
    });

    it('should handle very large work values', () => {
      const item: WorkItem = {
        id: 1,
        title: 'Large Work',
        type: 'Task',
        state: 'Active',
        areaPath: 'Test',
        iterationPath: 'Sprint 1',
        startDate: new Date(),
        targetDate: new Date(),
        createdDate: new Date(),
        changedDate: new Date(),
        childrenIds: [],
        remainingWork: 999999,
        completedWork: 1,
        priority: 1,
        tags: []
      };

      const result = service.convertToGanttItems([item]);
      
      expect(result[0].progress).toBeGreaterThanOrEqual(0);
      expect(result[0].progress).toBeLessThanOrEqual(100);
    });

    it('should handle high priority values', () => {
      const item: WorkItem = {
        id: 1,
        title: 'High Priority',
        type: 'Task',
        state: 'Active',
        areaPath: 'Test',
        iterationPath: 'Sprint 1',
        startDate: new Date(),
        targetDate: new Date(),
        createdDate: new Date(),
        changedDate: new Date(),
        childrenIds: [],
        priority: 999,
        tags: []
      };

      const result = service.convertToGanttItems([item]);
      
      expect(result[0].workItem.priority).toBe(999);
    });
  });

  describe('Validation edge cases', () => {
    it('should detect duplicate IDs', () => {
      const items: GanttItem[] = [
        {
          id: 1,
          text: 'Item 1',
          start_date: new Date(),
          end_date: new Date(),
          progress: 0,
          parent: 0,
          type: 'task',
          open: true,
          workItem: {} as WorkItem,
          color: '',
          textColor: '',
          progressStatus: 'Not Started'
        },
        {
          id: 1, // Duplicate
          text: 'Item 1 Duplicate',
          start_date: new Date(),
          end_date: new Date(),
          progress: 0,
          parent: 0,
          type: 'task',
          open: true,
          workItem: {} as WorkItem,
          color: '',
          textColor: '',
          progressStatus: 'Not Started'
        }
      ];

      const validation = service.validateGanttItems(items);
      
      expect(validation.valid).toBe(false);
      expect(validation.errors.some(e => e.includes('Duplicate'))).toBe(true);
    });

    it('should detect missing parent references', () => {
      const items: GanttItem[] = [
        {
          id: 1,
          text: 'Child',
          start_date: new Date(),
          end_date: new Date(),
          progress: 0,
          parent: 999, // Non-existent parent
          type: 'task',
          open: true,
          workItem: {} as WorkItem,
          color: '',
          textColor: '',
          progressStatus: 'Not Started'
        }
      ];

      const validation = service.validateGanttItems(items);
      
      expect(validation.valid).toBe(false);
      expect(validation.errors.some(e => e.includes('non-existent parent'))).toBe(true);
    });

    it('should detect invalid progress values', () => {
      const items: GanttItem[] = [
        {
          id: 1,
          text: 'Invalid Progress',
          start_date: new Date(),
          end_date: new Date(),
          progress: 150, // Invalid
          parent: 0,
          type: 'task',
          open: true,
          workItem: {} as WorkItem,
          color: '',
          textColor: '',
          progressStatus: 'Not Started'
        }
      ];

      const validation = service.validateGanttItems(items);
      
      expect(validation.valid).toBe(false);
      expect(validation.errors.some(e => e.includes('invalid progress'))).toBe(true);
    });
  });

  describe('Empty and minimal data', () => {
    it('should handle empty array', () => {
      const result = service.convertToGanttItems([]);
      
      expect(result).toEqual([]);
      
      const stats = service.calculateStatistics(result);
      expect(stats.totalItems).toBe(0);
    });

    it('should handle single item', () => {
      const item: WorkItem = {
        id: 1,
        title: 'Only Item',
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

      const result = service.convertToGanttItems([item]);
      
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
    });
  });
});
