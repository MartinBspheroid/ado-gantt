import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MockWorkItemService, MockScenarios } from '../../services/__mocks__/MockWorkItemService';
import { MockGanttDataService } from '../../services/__mocks__/MockGanttDataService';
import { GanttFilters, WorkItemType, WorkItemState } from '../../types';

/**
 * End-to-end integration tests simulating the full data flow:
 * 1. Query work items from service
 * 2. Apply filters
 * 3. Transform to Gantt format
 * 4. Validate output
 */
describe('Integration: Full Data Flow', () => {
  let workItemService: MockWorkItemService;
  let ganttDataService: MockGanttDataService;

  beforeEach(() => {
    workItemService = new MockWorkItemService();
    ganttDataService = new MockGanttDataService();
  });

  describe('Load → Filter → Transform flow', () => {
    it('should complete full flow with realistic dataset', async () => {
      // Setup
      workItemService.setScenario(MockScenarios.realistic());
      
      // Step 1: Load work items
      const filters: GanttFilters = {
        workItemTypes: ['Epic', 'Feature', 'User Story', 'Task'],
        states: ['New', 'Active', 'Resolved', 'Closed'],
        showTeamMembersOnly: false,
        teamMemberWhitelist: []
      };
      
      const workItems = await workItemService.queryWorkItems(filters);
      expect(workItems.length).toBeGreaterThan(0);
      
      // Step 2: Transform to Gantt items
      const ganttItems = ganttDataService.convertToGanttItems(workItems);
      expect(ganttItems.length).toBeGreaterThan(0);
      
      // Step 3: Validate
      const validation = ganttDataService.validateGanttItems(ganttItems);
      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should handle empty dataset gracefully', async () => {
      workItemService.setScenario(MockScenarios.empty());
      
      const workItems = await workItemService.queryWorkItems();
      expect(workItems).toHaveLength(0);
      
      const ganttItems = ganttDataService.convertToGanttItems(workItems);
      expect(ganttItems).toHaveLength(0);
      
      const stats = ganttDataService.calculateStatistics(ganttItems);
      expect(stats.totalItems).toBe(0);
    });

    it('should propagate errors from service', async () => {
      workItemService.setScenario(MockScenarios.error('Database connection failed'));
      
      await expect(workItemService.queryWorkItems()).rejects.toThrow('Database connection failed');
    });
  });

  describe('Filter combinations', () => {
    beforeEach(() => {
      workItemService.setScenario(MockScenarios.realistic());
    });

    it('should filter by work item types and transform', async () => {
      const filters: GanttFilters = {
        workItemTypes: ['Epic', 'Feature'],
        states: ['New', 'Active', 'Resolved', 'Closed'],
        showTeamMembersOnly: false,
        teamMemberWhitelist: []
      };
      
      const workItems = await workItemService.queryWorkItems(filters);
      const ganttItems = ganttDataService.convertToGanttItems(workItems);
      
      // All items should be Epic or Feature
      ganttItems.forEach(item => {
        expect(['Epic', 'Feature']).toContain(item.workItem.type);
      });
    });

    it('should filter by states and transform', async () => {
      const filters: GanttFilters = {
        workItemTypes: ['Epic', 'Feature', 'User Story', 'Task', 'Bug'],
        states: ['Active'],
        showTeamMembersOnly: false,
        teamMemberWhitelist: []
      };
      
      const workItems = await workItemService.queryWorkItems(filters);
      const ganttItems = ganttDataService.convertToGanttItems(workItems);
      
      // All items should be Active
      ganttItems.forEach(item => {
        expect(item.workItem.state).toBe('Active');
      });
    });

    it('should filter by area path and transform', async () => {
      const filters: GanttFilters = {
        workItemTypes: ['Epic', 'Feature', 'User Story', 'Task', 'Bug'],
        states: ['New', 'Active', 'Resolved', 'Closed'],
        areaPath: 'Product\\Platform\\Security',
        showTeamMembersOnly: false,
        teamMemberWhitelist: []
      };
      
      const workItems = await workItemService.queryWorkItems(filters);
      const ganttItems = ganttDataService.convertToGanttItems(workItems);
      
      ganttItems.forEach(item => {
        expect(item.workItem.areaPath).toMatch(/^Product\\Platform\\Security/);
      });
    });

    it('should apply multiple filters together', async () => {
      const filters: GanttFilters = {
        workItemTypes: ['Task', 'Bug'],
        states: ['Active', 'New'],
        areaPath: 'Product',
        showTeamMembersOnly: false,
        teamMemberWhitelist: []
      };
      
      const workItems = await workItemService.queryWorkItems(filters);
      const ganttItems = ganttDataService.convertToGanttItems(workItems);
      
      ganttItems.forEach(item => {
        expect(['Task', 'Bug']).toContain(item.workItem.type);
        expect(['Active', 'New']).toContain(item.workItem.state);
        expect(item.workItem.areaPath).toMatch(/^Product/);
      });
    });
  });

  describe('Update operations', () => {
    beforeEach(() => {
      workItemService.setScenario(MockScenarios.realistic());
    });

    it('should update work item dates and reflect in gantt data', async () => {
      // Get initial data
      const workItems = await workItemService.queryWorkItems();
      const initialItem = workItems[0];
      
      // Update dates
      const newStartDate = new Date('2026-03-01');
      const newTargetDate = new Date('2026-03-15');
      
      const updatedItem = await workItemService.updateWorkItemDates(
        initialItem.id,
        newStartDate,
        newTargetDate
      );
      
      expect(updatedItem.startDate).toEqual(newStartDate);
      expect(updatedItem.targetDate).toEqual(newTargetDate);
      
      // Transform and verify
      const ganttItems = ganttDataService.convertToGanttItems([updatedItem]);
      expect(ganttItems[0].start_date).toEqual(newStartDate);
    });

    it('should handle concurrent updates', async () => {
      const workItems = await workItemService.queryWorkItems();
      const itemIds = workItems.slice(0, 3).map(i => i.id);
      
      const updatePromises = itemIds.map(id => 
        workItemService.updateWorkItemDates(id, new Date(), new Date())
      );
      
      const results = await Promise.all(updatePromises);
      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result.changedDate).toBeDefined();
      });
    });
  });

  describe('Hierarchy handling', () => {
    it('should maintain parent-child relationships through transformation', async () => {
      workItemService.setScenario(MockScenarios.deepHierarchy(5));
      
      const workItems = await workItemService.queryWorkItems();
      const ganttItems = ganttDataService.convertToGanttItems(workItems);
      
      // Find parent-child pairs
      const childItems = ganttItems.filter(i => i.parent !== 0);
      expect(childItems.length).toBeGreaterThan(0);
      
      // Verify each child has a valid parent in the dataset
      childItems.forEach(child => {
        const parentExists = ganttItems.some(i => i.id === child.parent);
        expect(parentExists).toBe(true);
      });
    });

    it('should handle orphan items (parent not in dataset)', async () => {
      // Create scenario where child references missing parent
      const scenario = MockScenarios.realistic();
      const childItem = scenario.workItems.find(i => i.parentId === 99999);
      
      if (childItem) {
        const ganttItems = ganttDataService.convertToGanttItems([childItem]);
        expect(ganttItems).toHaveLength(1);
        expect(ganttItems[0].parent).toBe(99999);
      }
    });
  });

  describe('Metadata operations', () => {
    beforeEach(() => {
      workItemService.setScenario(MockScenarios.realistic());
    });

    it('should retrieve unique area paths', async () => {
      const areaPaths = await workItemService.getAreaPaths();
      expect(areaPaths.length).toBeGreaterThan(0);
      expect(new Set(areaPaths).size).toBe(areaPaths.length); // All unique
    });

    it('should retrieve unique iterations', async () => {
      const iterations = await workItemService.getIterations();
      expect(iterations.length).toBeGreaterThan(0);
    });

    it('should retrieve unique team members', async () => {
      const members = await workItemService.getTeamMembers();
      expect(members.length).toBeGreaterThan(0);
      
      // Each member should have required fields
      members.forEach(member => {
        expect(member.id).toBeDefined();
        expect(member.displayName).toBeDefined();
        expect(member.uniqueName).toBeDefined();
      });
    });
  });
});
