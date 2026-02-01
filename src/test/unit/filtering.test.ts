import { describe, it, expect } from 'vitest';
import { 
  WorkItem, 
  GanttFilters, 
  WorkItemType, 
  WorkItemState 
} from '../../types';

// Filter functions that mimic the service logic
function applyWorkItemTypeFilter(items: WorkItem[], types: WorkItemType[]): WorkItem[] {
  if (!types || types.length === 0) return items;
  return items.filter(item => types.includes(item.type));
}

function applyStateFilter(items: WorkItem[], states: WorkItemState[]): WorkItem[] {
  if (!states || states.length === 0) return items;
  return items.filter(item => states.includes(item.state));
}

function applyAreaPathFilter(items: WorkItem[], areaPath?: string): WorkItem[] {
  if (!areaPath) return items;
  return items.filter(item => item.areaPath?.startsWith(areaPath));
}

function applyDateRangeFilter(
  items: WorkItem[], 
  range?: { start: Date; end: Date }
): WorkItem[] {
  if (!range) return items;
  return items.filter(item => {
    const itemStart = item.startDate || item.createdDate;
    return itemStart >= range.start && itemStart <= range.end;
  });
}

function buildHierarchy(items: WorkItem[]): Map<number, WorkItem[]> {
  const hierarchy = new Map<number, WorkItem[]>();
  
  // Group by parent
  items.forEach(item => {
    const parentId = item.parentId || 0;
    if (!hierarchy.has(parentId)) {
      hierarchy.set(parentId, []);
    }
    hierarchy.get(parentId)!.push(item);
  });
  
  return hierarchy;
}

function getAncestors(itemId: number, items: WorkItem[]): WorkItem[] {
  const ancestors: WorkItem[] = [];
  const itemMap = new Map(items.map(i => [i.id, i]));
  
  let currentId: number | undefined = itemId;
  while (currentId) {
    const item = itemMap.get(currentId);
    if (!item) break;
    
    if (item.parentId) {
      const parent = itemMap.get(item.parentId);
      if (parent) {
        ancestors.push(parent);
        currentId = parent.id;
      } else {
        break;
      }
    } else {
      break;
    }
  }
  
  return ancestors;
}

function getDescendants(itemId: number, items: WorkItem[]): WorkItem[] {
  const descendants: WorkItem[] = [];
  const itemMap = new Map(items.map(i => [i.id, i]));
  
  const queue = [itemId];
  while (queue.length > 0) {
    const currentId = queue.shift()!;
    const item = itemMap.get(currentId);
    
    if (item?.childrenIds) {
      for (const childId of item.childrenIds) {
        const child = itemMap.get(childId);
        if (child) {
          descendants.push(child);
          queue.push(childId);
        }
      }
    }
  }
  
  return descendants;
}

describe('Filtering Functions', () => {
  const testItems: WorkItem[] = [
    {
      id: 1,
      title: 'Epic Item',
      type: 'Epic',
      state: 'Active',
      areaPath: 'Product\\Platform',
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
      title: 'Feature Item',
      type: 'Feature',
      state: 'New',
      areaPath: 'Product\\Platform\\Security',
      iterationPath: 'Sprint 1',
      startDate: new Date('2026-01-05'),
      targetDate: new Date('2026-01-20'),
      createdDate: new Date(),
      changedDate: new Date(),
      parentId: 1,
      childrenIds: [],
      priority: 2,
      tags: []
    },
    {
      id: 3,
      title: 'Task Item',
      type: 'Task',
      state: 'Closed',
      areaPath: 'Product\\Mobile',
      iterationPath: 'Sprint 2',
      startDate: new Date('2026-02-01'),
      targetDate: new Date('2026-02-10'),
      createdDate: new Date(),
      changedDate: new Date(),
      childrenIds: [],
      priority: 3,
      tags: []
    },
    {
      id: 4,
      title: 'Bug Item',
      type: 'Bug',
      state: 'Active',
      areaPath: 'Product\\Platform\\Bugs',
      iterationPath: 'Sprint 1',
      startDate: new Date('2026-01-10'),
      targetDate: new Date('2026-01-12'),
      createdDate: new Date(),
      changedDate: new Date(),
      childrenIds: [],
      priority: 1,
      tags: []
    }
  ];

  describe('applyWorkItemTypeFilter', () => {
    it('should filter by single type', () => {
      const result = applyWorkItemTypeFilter(testItems, ['Epic']);
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('Epic');
    });

    it('should filter by multiple types', () => {
      const result = applyWorkItemTypeFilter(testItems, ['Epic', 'Feature']);
      expect(result).toHaveLength(2);
    });

    it('should return all items when types array is empty', () => {
      const result = applyWorkItemTypeFilter(testItems, []);
      expect(result).toHaveLength(4);
    });

    it('should return empty array when no matches', () => {
      const result = applyWorkItemTypeFilter(testItems, ['User Story']);
      expect(result).toHaveLength(0);
    });
  });

  describe('applyStateFilter', () => {
    it('should filter by state', () => {
      const result = applyStateFilter(testItems, ['Active']);
      expect(result).toHaveLength(2);
      expect(result.every(i => i.state === 'Active')).toBe(true);
    });

    it('should filter by multiple states', () => {
      const result = applyStateFilter(testItems, ['Active', 'Closed']);
      expect(result).toHaveLength(3);
    });

    it('should return all items when states array is empty', () => {
      const result = applyStateFilter(testItems, []);
      expect(result).toHaveLength(4);
    });
  });

  describe('applyAreaPathFilter', () => {
    it('should filter by exact path', () => {
      const result = applyAreaPathFilter(testItems, 'Product\\Mobile');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(3);
    });

    it('should filter by parent path (under)', () => {
      const result = applyAreaPathFilter(testItems, 'Product\\Platform');
      expect(result).toHaveLength(3);
      expect(result.every(i => i.areaPath?.startsWith('Product\\Platform'))).toBe(true);
    });

    it('should return all items when no area path specified', () => {
      const result = applyAreaPathFilter(testItems, undefined);
      expect(result).toHaveLength(4);
    });
  });

  describe('applyDateRangeFilter', () => {
    it('should filter items within date range', () => {
      const range = {
        start: new Date('2026-01-01'),
        end: new Date('2026-01-15')
      };
      const result = applyDateRangeFilter(testItems, range);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should exclude items outside date range', () => {
      const range = {
        start: new Date('2026-03-01'),
        end: new Date('2026-03-31')
      };
      const result = applyDateRangeFilter(testItems, range);
      expect(result).toHaveLength(0);
    });

    it('should use createdDate when startDate is missing', () => {
      const itemsWithoutStart = [
        {
          ...testItems[0],
          startDate: undefined,
          createdDate: new Date('2026-01-10')
        }
      ];
      const range = {
        start: new Date('2026-01-01'),
        end: new Date('2026-01-15')
      };
      const result = applyDateRangeFilter(itemsWithoutStart, range);
      expect(result).toHaveLength(1);
    });

    it('should return all items when no date range specified', () => {
      const result = applyDateRangeFilter(testItems, undefined);
      expect(result).toHaveLength(4);
    });
  });
});

describe('Hierarchy Building', () => {
  const hierarchyItems: WorkItem[] = [
    {
      id: 1,
      title: 'Root Epic',
      type: 'Epic',
      state: 'Active',
      areaPath: 'Test',
      iterationPath: 'Sprint 1',
      startDate: new Date(),
      targetDate: new Date(),
      createdDate: new Date(),
      changedDate: new Date(),
      childrenIds: [2, 3],
      priority: 1,
      tags: []
    },
    {
      id: 2,
      title: 'Feature 1',
      type: 'Feature',
      state: 'Active',
      areaPath: 'Test',
      iterationPath: 'Sprint 1',
      startDate: new Date(),
      targetDate: new Date(),
      createdDate: new Date(),
      changedDate: new Date(),
      parentId: 1,
      childrenIds: [4],
      priority: 1,
      tags: []
    },
    {
      id: 3,
      title: 'Feature 2',
      type: 'Feature',
      state: 'Active',
      areaPath: 'Test',
      iterationPath: 'Sprint 1',
      startDate: new Date(),
      targetDate: new Date(),
      createdDate: new Date(),
      changedDate: new Date(),
      parentId: 1,
      childrenIds: [],
      priority: 1,
      tags: []
    },
    {
      id: 4,
      title: 'Task 1',
      type: 'Task',
      state: 'Active',
      areaPath: 'Test',
      iterationPath: 'Sprint 1',
      startDate: new Date(),
      targetDate: new Date(),
      createdDate: new Date(),
      changedDate: new Date(),
      parentId: 2,
      childrenIds: [],
      priority: 1,
      tags: []
    }
  ];

  describe('buildHierarchy', () => {
    it('should build correct hierarchy map', () => {
      const hierarchy = buildHierarchy(hierarchyItems);
      
      expect(hierarchy.has(0)).toBe(true); // Root level
      expect(hierarchy.has(1)).toBe(true); // Children of item 1
      expect(hierarchy.has(2)).toBe(true); // Children of item 2
      
      expect(hierarchy.get(0)).toHaveLength(1); // Only root epic at level 0
      expect(hierarchy.get(1)).toHaveLength(2); // 2 features under epic
      expect(hierarchy.get(2)).toHaveLength(1); // 1 task under feature 1
    });

    it('should group items by parent', () => {
      const hierarchy = buildHierarchy(hierarchyItems);
      
      const childrenOfOne = hierarchy.get(1) || [];
      expect(childrenOfOne.map(i => i.id)).toContain(2);
      expect(childrenOfOne.map(i => i.id)).toContain(3);
    });

    it('should handle empty array', () => {
      const hierarchy = buildHierarchy([]);
      expect(hierarchy.size).toBe(0);
    });

    it('should handle items without parents', () => {
      const itemsWithoutParents = hierarchyItems.filter(i => !i.parentId);
      const hierarchy = buildHierarchy(itemsWithoutParents);
      
      expect(hierarchy.get(0)).toHaveLength(1);
      expect(hierarchy.get(0)?.[0].id).toBe(1);
    });
  });

  describe('getAncestors', () => {
    it('should return empty array for root item', () => {
      const ancestors = getAncestors(1, hierarchyItems);
      expect(ancestors).toHaveLength(0);
    });

    it('should return parent for direct child', () => {
      const ancestors = getAncestors(2, hierarchyItems);
      expect(ancestors).toHaveLength(1);
      expect(ancestors[0].id).toBe(1);
    });

    it('should return all ancestors for nested item', () => {
      const ancestors = getAncestors(4, hierarchyItems);
      expect(ancestors).toHaveLength(2);
      expect(ancestors[0].id).toBe(2);
      expect(ancestors[1].id).toBe(1);
    });

    it('should handle missing parent gracefully', () => {
      const items = [
        {
          ...hierarchyItems[0],
          parentId: 999 // Non-existent parent
        }
      ];
      const ancestors = getAncestors(1, items);
      expect(ancestors).toHaveLength(0);
    });
  });

  describe('getDescendants', () => {
    it('should return empty array for leaf item', () => {
      const descendants = getDescendants(4, hierarchyItems);
      expect(descendants).toHaveLength(0);
    });

    it('should return direct children', () => {
      const descendants = getDescendants(1, hierarchyItems);
      expect(descendants).toHaveLength(3); // Feature 1, Feature 2, Task 1
    });

    it('should return nested children', () => {
      const descendants = getDescendants(2, hierarchyItems);
      expect(descendants).toHaveLength(1);
      expect(descendants[0].id).toBe(4);
    });

    it('should handle missing children gracefully', () => {
      const descendants = getDescendants(999, hierarchyItems);
      expect(descendants).toHaveLength(0);
    });
  });
});
