import { describe, it, expect, beforeEach } from 'vitest';
import { MockGanttDataService } from '../../services/__mocks__/MockGanttDataService';
import { MockScenarios } from '../../services/__mocks__/MockWorkItemService';

describe('Performance Tests', () => {
  let service: MockGanttDataService;

  beforeEach(() => {
    service = new MockGanttDataService();
  });

  describe('Transformation Performance', () => {
    it('should transform 10 items in under 100ms', () => {
      const items = service.generateSequentialWorkItems(10);
      
      const result = service.measureTransformationTime(items);
      
      expect(result.durationMs).toBeLessThan(100);
      expect(result.items).toHaveLength(10);
    });

    it('should transform 100 items in under 500ms', () => {
      const items = service.generateSequentialWorkItems(100);
      
      const result = service.measureTransformationTime(items);
      
      expect(result.durationMs).toBeLessThan(500);
      expect(result.items).toHaveLength(100);
    });

    it('should transform 500 items in under 1000ms', () => {
      const items = service.generateSequentialWorkItems(500);
      
      const result = service.measureTransformationTime(items);
      
      expect(result.durationMs).toBeLessThan(1000);
      expect(result.items).toHaveLength(500);
    });

    it('should handle 1000 items with acceptable performance', () => {
      const items = service.generateSequentialWorkItems(1000);
      
      const result = service.measureTransformationTime(items);
      
      // Should complete in reasonable time (under 2 seconds)
      expect(result.durationMs).toBeLessThan(2000);
      expect(result.itemsPerSecond).toBeGreaterThan(500);
    });
  });

  describe('Large Dataset Scenarios', () => {
    it('should process large realistic dataset efficiently', () => {
      const scenario = MockScenarios.largeDataset(150);
      
      const result = service.measureTransformationTime(scenario.workItems);
      
      expect(result.durationMs).toBeLessThan(500);
      expect(result.items).toHaveLength(150);
    });

    it('should validate large datasets efficiently', () => {
      const items = service.generateSequentialWorkItems(500);
      const ganttItems = service.convertToGanttItems(items);
      
      const start = performance.now();
      const validation = service.validateGanttItems(ganttItems);
      const duration = performance.now() - start;
      
      expect(validation.valid).toBe(true);
      expect(duration).toBeLessThan(100); // Validation should be fast
    });

    it('should calculate statistics efficiently for large datasets', () => {
      const items = service.generateSequentialWorkItems(500);
      const ganttItems = service.convertToGanttItems(items);
      
      const start = performance.now();
      const stats = service.calculateStatistics(ganttItems);
      const duration = performance.now() - start;
      
      expect(stats.totalItems).toBe(500);
      expect(duration).toBeLessThan(50); // Stats calculation should be very fast
    });
  });

  describe('Memory Efficiency', () => {
    it('should handle parallel work items efficiently', () => {
      const items = service.generateParallelWorkItems(100);
      
      const result = service.measureTransformationTime(items);
      
      expect(result.durationMs).toBeLessThan(300);
      expect(result.items).toHaveLength(100);
    });

    it('should handle overlapping work items efficiently', () => {
      const items = service.generateOverlappingWorkItems(100);
      
      const result = service.measureTransformationTime(items);
      
      expect(result.durationMs).toBeLessThan(300);
      expect(result.items).toHaveLength(100);
    });

    it('should handle deep hierarchies efficiently', () => {
      const deepItems = [];
      const depth = 50;
      
      for (let i = 1; i <= depth; i++) {
        deepItems.push({
          id: i,
          title: `Level ${i}`,
          type: 'Task',
          state: 'Active',
          areaPath: 'Test',
          iterationPath: 'Sprint 1',
          startDate: new Date(Date.now() + (i * 24 * 60 * 60 * 1000)),
          targetDate: new Date(Date.now() + ((i + 1) * 24 * 60 * 60 * 1000)),
          createdDate: new Date(),
          changedDate: new Date(),
          parentId: i > 1 ? i - 1 : undefined,
          childrenIds: i < depth ? [i + 1] : [],
          priority: 1,
          tags: []
        } as any);
      }
      
      const result = service.measureTransformationTime(deepItems);
      
      expect(result.durationMs).toBeLessThan(200);
      expect(result.items).toHaveLength(depth);
    });
  });

  describe('Benchmarks', () => {
    it('should maintain consistent performance across multiple runs', () => {
      const items = service.generateSequentialWorkItems(100);
      const times: number[] = [];
      
      // Run transformation 5 times
      for (let i = 0; i < 5; i++) {
        const result = service.measureTransformationTime(items);
        times.push(result.durationMs);
      }
      
      // Calculate average and variance
      const avg = times.reduce((a, b) => a + b, 0) / times.length;
      const variance = times.reduce((sum, time) => sum + Math.pow(time - avg, 2), 0) / times.length;
      const stdDev = Math.sqrt(variance);
      
      // Performance should be consistent (low variance)
      expect(avg).toBeLessThan(300);
      expect(stdDev).toBeLessThan(50); // Should not vary too much
    });

    it('benchmark: 10 items', () => {
      const items = service.generateSequentialWorkItems(10);
      const result = service.measureTransformationTime(items);
      
      console.log(`10 items: ${result.durationMs.toFixed(2)}ms (${result.itemsPerSecond.toFixed(0)} items/sec)`);
      expect(result.itemsPerSecond).toBeGreaterThan(100);
    });

    it('benchmark: 100 items', () => {
      const items = service.generateSequentialWorkItems(100);
      const result = service.measureTransformationTime(items);
      
      console.log(`100 items: ${result.durationMs.toFixed(2)}ms (${result.itemsPerSecond.toFixed(0)} items/sec)`);
      expect(result.itemsPerSecond).toBeGreaterThan(500);
    });

    it('benchmark: 500 items', () => {
      const items = service.generateSequentialWorkItems(500);
      const result = service.measureTransformationTime(items);
      
      console.log(`500 items: ${result.durationMs.toFixed(2)}ms (${result.itemsPerSecond.toFixed(0)} items/sec)`);
      expect(result.itemsPerSecond).toBeGreaterThan(500);
    });
  });
});
