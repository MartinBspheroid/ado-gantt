import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock azure-devops-extension-api before importing the service
vi.mock('azure-devops-extension-api', () => ({
  getClient: vi.fn().mockReturnValue({
    queryByWiql: vi.fn(),
    getWorkItems: vi.fn(),
    getClassificationNodes: vi.fn().mockResolvedValue({
      identifier: 'root',
      name: 'Iterations',
      structureType: 1,
      children: []
    })
  })
}));

vi.mock('azure-devops-extension-api/WorkItemTracking', () => ({
  WorkItemTrackingRestClient: class MockWorkItemTrackingRestClient {}
}));

vi.mock('azure-devops-extension-api/WorkItemTrackingProcess', () => ({
  WorkItemTrackingProcessRestClient: class MockWorkItemTrackingProcessRestClient {}
}));

vi.mock('azure-devops-extension-sdk', () => ({
  init: vi.fn().mockResolvedValue(undefined),
  ready: vi.fn().mockResolvedValue(undefined),
  getWebContext: vi.fn().mockReturnValue({
    project: { name: 'TestProject' },
    team: { name: 'TestTeam' }
  })
}));

import { IterationService, IterationInfo } from '../../services/IterationService';

describe('IterationService', () => {
  let service: IterationService;
  
  beforeEach(() => {
    service = new IterationService();
  });

  describe('containsIterationMacro', () => {
    it('should return true for @CurrentIteration', () => {
      expect(service.containsIterationMacro('@CurrentIteration')).toBe(true);
    });

    it('should return true for @CurrentIteration-1', () => {
      expect(service.containsIterationMacro('@CurrentIteration-1')).toBe(true);
    });

    it('should return true for @CurrentIteration+1', () => {
      expect(service.containsIterationMacro('@CurrentIteration+1')).toBe(true);
    });

    it('should return true for @CurrentIteration with spaces', () => {
      expect(service.containsIterationMacro('@CurrentIteration - 1')).toBe(true);
      expect(service.containsIterationMacro('@CurrentIteration + 2')).toBe(true);
    });

    it('should return true for case-insensitive match', () => {
      expect(service.containsIterationMacro('@currentiteration')).toBe(true);
      expect(service.containsIterationMacro('@CURRENTITERATION')).toBe(true);
    });

    it('should return false for regular iteration path', () => {
      expect(service.containsIterationMacro('Project\\Sprint 1')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(service.containsIterationMacro('')).toBe(false);
    });
  });

  describe('resolveIterationMacro', () => {
    it('should return path as-is if not a macro', async () => {
      const result = await service.resolveIterationMacro('Project\\Sprint 1');
      expect(result).toBe('Project\\Sprint 1');
    });

    it('should resolve @CurrentIteration to current iteration', async () => {
      // Mock the getTeamIterations method
      const mockIterations: IterationInfo[] = [
        { id: '1', name: 'Sprint 1', path: 'Project\\Sprint 1', isCurrent: false },
        { id: '2', name: 'Sprint 2', path: 'Project\\Sprint 2', isCurrent: true },
        { id: '3', name: 'Sprint 3', path: 'Project\\Sprint 3', isCurrent: false }
      ];
      
      vi.spyOn(service, 'getTeamIterations').mockResolvedValue(mockIterations);
      
      const result = await service.resolveIterationMacro('@CurrentIteration');
      expect(result).toBe('Project\\Sprint 2');
    });

    it('should resolve @CurrentIteration-1 to previous iteration', async () => {
      const mockIterations: IterationInfo[] = [
        { id: '1', name: 'Sprint 1', path: 'Project\\Sprint 1', isCurrent: false },
        { id: '2', name: 'Sprint 2', path: 'Project\\Sprint 2', isCurrent: true },
        { id: '3', name: 'Sprint 3', path: 'Project\\Sprint 3', isCurrent: false }
      ];
      
      vi.spyOn(service, 'getTeamIterations').mockResolvedValue(mockIterations);
      
      const result = await service.resolveIterationMacro('@CurrentIteration-1');
      expect(result).toBe('Project\\Sprint 1');
    });

    it('should resolve @CurrentIteration+1 to next iteration', async () => {
      const mockIterations: IterationInfo[] = [
        { id: '1', name: 'Sprint 1', path: 'Project\\Sprint 1', isCurrent: false },
        { id: '2', name: 'Sprint 2', path: 'Project\\Sprint 2', isCurrent: true },
        { id: '3', name: 'Sprint 3', path: 'Project\\Sprint 3', isCurrent: false }
      ];
      
      vi.spyOn(service, 'getTeamIterations').mockResolvedValue(mockIterations);
      
      const result = await service.resolveIterationMacro('@CurrentIteration+1');
      expect(result).toBe('Project\\Sprint 3');
    });

    it('should handle larger offsets', async () => {
      const mockIterations: IterationInfo[] = [
        { id: '1', name: 'Sprint 1', path: 'Project\\Sprint 1', isCurrent: false },
        { id: '2', name: 'Sprint 2', path: 'Project\\Sprint 2', isCurrent: false },
        { id: '3', name: 'Sprint 3', path: 'Project\\Sprint 3', isCurrent: true },
        { id: '4', name: 'Sprint 4', path: 'Project\\Sprint 4', isCurrent: false },
        { id: '5', name: 'Sprint 5', path: 'Project\\Sprint 5', isCurrent: false }
      ];
      
      vi.spyOn(service, 'getTeamIterations').mockResolvedValue(mockIterations);
      
      expect(await service.resolveIterationMacro('@CurrentIteration-2')).toBe('Project\\Sprint 1');
      expect(await service.resolveIterationMacro('@CurrentIteration+2')).toBe('Project\\Sprint 5');
    });

    it('should return null for out of bounds offset', async () => {
      const mockIterations: IterationInfo[] = [
        { id: '1', name: 'Sprint 1', path: 'Project\\Sprint 1', isCurrent: true },
        { id: '2', name: 'Sprint 2', path: 'Project\\Sprint 2', isCurrent: false }
      ];
      
      vi.spyOn(service, 'getTeamIterations').mockResolvedValue(mockIterations);
      
      expect(await service.resolveIterationMacro('@CurrentIteration-1')).toBeNull();
      expect(await service.resolveIterationMacro('@CurrentIteration+2')).toBeNull();
    });

    it('should return null when no current iteration found', async () => {
      const mockIterations: IterationInfo[] = [
        { id: '1', name: 'Sprint 1', path: 'Project\\Sprint 1', isCurrent: false },
        { id: '2', name: 'Sprint 2', path: 'Project\\Sprint 2', isCurrent: false }
      ];
      
      vi.spyOn(service, 'getTeamIterations').mockResolvedValue(mockIterations);
      
      const result = await service.resolveIterationMacro('@CurrentIteration');
      expect(result).toBeNull();
    });

    it('should find current iteration by dates when not marked', async () => {
      const now = new Date();
      const past = new Date(now);
      past.setDate(past.getDate() - 14);
      const future = new Date(now);
      future.setDate(future.getDate() + 14);
      
      const mockIterations: IterationInfo[] = [
        { 
          id: '1', 
          name: 'Past Sprint', 
          path: 'Project\\Past', 
          isCurrent: false,
          startDate: past,
          finishDate: new Date(now.getTime() - 86400000)
        },
        { 
          id: '2', 
          name: 'Current Sprint', 
          path: 'Project\\Current', 
          isCurrent: false,
          startDate: past,
          finishDate: future
        },
        { 
          id: '3', 
          name: 'Future Sprint', 
          path: 'Project\\Future', 
          isCurrent: false,
          startDate: future,
          finishDate: new Date(future.getTime() + 86400000 * 14)
        }
      ];
      
      vi.spyOn(service, 'getTeamIterations').mockResolvedValue(mockIterations);
      
      const result = await service.resolveIterationMacro('@CurrentIteration');
      expect(result).toBe('Project\\Current');
    });
  });

  describe('getIterationMacroOptions', () => {
    it('should return array of macro options', () => {
      const options = service.getIterationMacroOptions();
      
      expect(options).toHaveLength(7);
      expect(options).toContainEqual({ value: '@CurrentIteration', label: 'Current Iteration' });
      expect(options).toContainEqual({ value: '@CurrentIteration-1', label: 'Previous Iteration' });
      expect(options).toContainEqual({ value: '@CurrentIteration+1', label: 'Next Iteration' });
    });
  });

  describe('getIterationNameFromPath', () => {
    it('should extract name from simple path', () => {
      expect(service.getIterationNameFromPath('Project\\Sprint 1')).toBe('Sprint 1');
    });

    it('should extract name from deep path', () => {
      expect(service.getIterationNameFromPath('Project\\2026\\Q1\\Sprint 1')).toBe('Sprint 1');
    });

    it('should return full path if no separator', () => {
      expect(service.getIterationNameFromPath('Sprint 1')).toBe('Sprint 1');
    });
  });
});
