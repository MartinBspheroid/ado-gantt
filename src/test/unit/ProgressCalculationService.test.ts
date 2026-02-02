import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProgressCalculationService } from '../../services/ProgressCalculationService';
import { WorkItem, GanttItem, ProgressSummary } from '../../types';

describe('ProgressCalculationService', () => {
  let service: ProgressCalculationService;

  beforeEach(() => {
    service = new ProgressCalculationService();
    // Mock current date for consistent testing
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-15')); // Mid-point of our test dates
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('calculateProgressStatus', () => {
    it('should return Done for Closed state', () => {
      const workItem: WorkItem = {
        id: 1,
        title: 'Closed Task',
        type: 'Task',
        state: 'Closed',
        areaPath: 'Test',
        iterationPath: 'Sprint 1',
        startDate: new Date('2026-01-01'),
        targetDate: new Date('2026-01-31'),
        createdDate: new Date(),
        changedDate: new Date(),
        childrenIds: [],
        tags: []
      };

      const status = service.calculateProgressStatus(workItem);
      expect(status).toBe('Done');
    });

    it('should return Done for Resolved state', () => {
      const workItem: WorkItem = {
        id: 1,
        title: 'Resolved Task',
        type: 'Task',
        state: 'Resolved',
        areaPath: 'Test',
        iterationPath: 'Sprint 1',
        startDate: new Date('2026-01-01'),
        targetDate: new Date('2026-01-31'),
        createdDate: new Date(),
        changedDate: new Date(),
        childrenIds: [],
        tags: []
      };

      const status = service.calculateProgressStatus(workItem);
      expect(status).toBe('Done');
    });

    it('should return Not Started for New state', () => {
      const workItem: WorkItem = {
        id: 1,
        title: 'New Task',
        type: 'Task',
        state: 'New',
        areaPath: 'Test',
        iterationPath: 'Sprint 1',
        startDate: new Date('2026-01-01'),
        targetDate: new Date('2026-01-31'),
        createdDate: new Date(),
        changedDate: new Date(),
        childrenIds: [],
        tags: []
      };

      const status = service.calculateProgressStatus(workItem);
      expect(status).toBe('Not Started');
    });

    it('should return Off Track when current date >= end date and not Closed', () => {
      // Set current date past the target date
      vi.setSystemTime(new Date('2026-02-05'));
      
      const workItem: WorkItem = {
        id: 1,
        title: 'Overdue Task',
        type: 'Task',
        state: 'Active',
        areaPath: 'Test',
        iterationPath: 'Sprint 1',
        startDate: new Date('2026-01-01'),
        targetDate: new Date('2026-02-01'), // Target date has passed
        createdDate: new Date(),
        changedDate: new Date(),
        childrenIds: [],
        tags: []
      };

      const status = service.calculateProgressStatus(workItem);
      expect(status).toBe('Off Track');
    });

    it('should return On Track when current date < midpoint', () => {
      // Set current date before midpoint (Jan 1-31, midpoint is around Jan 16)
      vi.setSystemTime(new Date('2026-01-10'));
      
      const workItem: WorkItem = {
        id: 1,
        title: 'Active Task',
        type: 'Task',
        state: 'Active',
        areaPath: 'Test',
        iterationPath: 'Sprint 1',
        startDate: new Date('2026-01-01'),
        targetDate: new Date('2026-01-31'),
        createdDate: new Date(),
        changedDate: new Date(),
        childrenIds: [],
        tags: []
      };

      const status = service.calculateProgressStatus(workItem);
      expect(status).toBe('On Track');
    });

    it('should return At Risk when current date >= midpoint but < end date', () => {
      // Set current date after midpoint but before end
      vi.setSystemTime(new Date('2026-01-20'));
      
      const workItem: WorkItem = {
        id: 1,
        title: 'Active Task',
        type: 'Task',
        state: 'Active',
        areaPath: 'Test',
        iterationPath: 'Sprint 1',
        startDate: new Date('2026-01-01'),
        targetDate: new Date('2026-01-31'),
        createdDate: new Date(),
        changedDate: new Date(),
        childrenIds: [],
        tags: []
      };

      const status = service.calculateProgressStatus(workItem);
      expect(status).toBe('At Risk');
    });
  });

  describe('calculateProgressSummary', () => {
    it('should calculate correct summary', () => {
      const items: GanttItem[] = [
        { id: 1, progressStatus: 'Done', workItem: {} as WorkItem } as GanttItem,
        { id: 2, progressStatus: 'Done', workItem: {} as WorkItem } as GanttItem,
        { id: 3, progressStatus: 'On Track', workItem: {} as WorkItem } as GanttItem,
        { id: 4, progressStatus: 'At Risk', workItem: {} as WorkItem } as GanttItem,
        { id: 5, progressStatus: 'Off Track', workItem: {} as WorkItem } as GanttItem,
        { id: 6, progressStatus: 'Not Started', workItem: {} as WorkItem } as GanttItem,
      ];

      const summary = service.calculateProgressSummary(items);

      expect(summary.total).toBe(6);
      expect(summary.done).toBe(2);
      expect(summary.onTrack).toBe(1);
      expect(summary.atRisk).toBe(1);
      expect(summary.offTrack).toBe(1);
      expect(summary.notStarted).toBe(1);
    });

    it('should handle empty array', () => {
      const summary = service.calculateProgressSummary([]);
      
      expect(summary.total).toBe(0);
      expect(summary.done).toBe(0);
      expect(summary.onTrack).toBe(0);
      expect(summary.atRisk).toBe(0);
      expect(summary.offTrack).toBe(0);
      expect(summary.notStarted).toBe(0);
    });
  });

  describe('getStatusColor', () => {
    it.each([
      ['Done', '#107c10'],
      ['On Track', '#107c10'],
      ['At Risk', '#ff8c00'],
      ['Off Track', '#a80000'],
      ['Not Started', '#0078d4']
    ])('should return correct color for %s', (status, expectedColor) => {
      const color = service.getStatusColor(status as any);
      expect(color.color).toBe(expectedColor);
    });

    it('should return default color for unknown status', () => {
      const color = service.getStatusColor('Unknown' as any);
      expect(color.color).toBe('#666666');
    });
  });
});
