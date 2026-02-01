import { 
  WorkItem, 
  WorkItemType, 
  WorkItemState, 
  GanttFilters,
  AdoWorkItem,
  AdoWorkItemFields 
} from '../../types';

export interface MockScenario {
  name: string;
  workItems: WorkItem[];
  delay?: number;
  shouldError?: boolean;
  errorMessage?: string;
}

/**
 * Mock WorkItemService for testing
 * Returns predefined datasets based on scenario
 */
export class MockWorkItemService {
  private scenario: MockScenario;
  private initialized: boolean = false;

  constructor(scenario: MockScenario = { name: 'empty', workItems: [] }) {
    this.scenario = scenario;
  }

  async initialize(): Promise<void> {
    await this.simulateDelay(10);
    this.initialized = true;
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  async queryWorkItems(filters?: GanttFilters): Promise<WorkItem[]> {
    await this.simulateDelay(this.scenario.delay || 50);

    if (this.scenario.shouldError) {
      throw new Error(this.scenario.errorMessage || 'Mock service error');
    }

    let items = [...this.scenario.workItems];

    // Apply filters if provided
    if (filters) {
      items = this.applyFilters(items, filters);
    }

    return items;
  }

  async fetchWorkItemDetails(ids: number[]): Promise<WorkItem[]> {
    await this.simulateDelay(30);
    
    if (this.scenario.shouldError) {
      throw new Error(this.scenario.errorMessage || 'Mock service error');
    }

    return this.scenario.workItems.filter(wi => ids.includes(wi.id));
  }

  async updateWorkItemDates(
    workItemId: number, 
    startDate?: Date, 
    targetDate?: Date
  ): Promise<WorkItem> {
    await this.simulateDelay(100);

    if (this.scenario.shouldError) {
      throw new Error(this.scenario.errorMessage || 'Failed to update work item');
    }

    const workItem = this.scenario.workItems.find(wi => wi.id === workItemId);
    if (!workItem) {
      throw new Error(`Work item ${workItemId} not found`);
    }

    return {
      ...workItem,
      startDate: startDate || workItem.startDate,
      targetDate: targetDate || workItem.targetDate,
      changedDate: new Date()
    };
  }

  async getAreaPaths(): Promise<string[]> {
    await this.simulateDelay(20);
    
    const paths = new Set<string>();
    this.scenario.workItems.forEach(wi => {
      if (wi.areaPath) {
        paths.add(wi.areaPath);
        // Add parent paths
        const parts = wi.areaPath.split('\\');
        for (let i = 1; i < parts.length; i++) {
          paths.add(parts.slice(0, i).join('\\'));
        }
      }
    });
    
    return Array.from(paths).sort();
  }

  async getIterations(): Promise<string[]> {
    await this.simulateDelay(20);
    
    const paths = new Set<string>();
    this.scenario.workItems.forEach(wi => {
      if (wi.iterationPath) {
        paths.add(wi.iterationPath);
      }
    });
    
    return Array.from(paths).sort();
  }

  async getTeamMembers(): Promise<{ id: string; displayName: string; uniqueName: string }[]> {
    await this.simulateDelay(20);
    
    const members = new Map<string, { id: string; displayName: string; uniqueName: string }>();
    
    this.scenario.workItems.forEach(wi => {
      if (wi.assignedTo) {
        members.set(wi.assignedTo.id, wi.assignedTo);
      }
    });
    
    return Array.from(members.values()).sort((a, b) => 
      a.displayName.localeCompare(b.displayName)
    );
  }

  setScenario(scenario: MockScenario): void {
    this.scenario = scenario;
  }

  getScenario(): MockScenario {
    return this.scenario;
  }

  private applyFilters(items: WorkItem[], filters: GanttFilters): WorkItem[] {
    return items.filter(item => {
      // Filter by work item types
      if (filters.workItemTypes?.length > 0) {
        if (!filters.workItemTypes.includes(item.type)) {
          return false;
        }
      }

      // Filter by states
      if (filters.states?.length > 0) {
        if (!filters.states.includes(item.state)) {
          return false;
        }
      }

      // Filter by area path
      if (filters.areaPath && !item.areaPath?.startsWith(filters.areaPath)) {
        return false;
      }

      // Filter by iteration path
      if (filters.iterationPath && !item.iterationPath?.startsWith(filters.iterationPath)) {
        return false;
      }

      // Filter by assigned to
      if (filters.assignedTo?.length > 0) {
        if (!item.assignedTo || !filters.assignedTo.includes(item.assignedTo.id)) {
          return false;
        }
      }

      // Filter by date range
      if (filters.startDateRange) {
        const itemStart = item.startDate || item.createdDate;
        if (itemStart < filters.startDateRange.start || itemStart > filters.startDateRange.end) {
          return false;
        }
      }

      return true;
    });
  }

  private async simulateDelay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Factory for creating common mock scenarios
 */
export const MockScenarios = {
  empty: (): MockScenario => ({
    name: 'empty',
    workItems: [],
    delay: 10
  }),

  realistic: (): MockScenario => ({
    name: 'realistic',
    workItems: generateRealisticWorkItems(),
    delay: 50
  }),

  edgeCases: (): MockScenario => ({
    name: 'edgeCases',
    workItems: generateEdgeCaseWorkItems(),
    delay: 30
  }),

  error: (message: string = 'Simulated error'): MockScenario => ({
    name: 'error',
    workItems: [],
    shouldError: true,
    errorMessage: message,
    delay: 10
  }),

  largeDataset: (count: number = 150): MockScenario => {
    const items: WorkItem[] = [];
    for (let i = 1; i <= count; i++) {
      items.push({
        id: i,
        title: `Work Item ${i}`,
        type: ['Epic', 'Feature', 'User Story', 'Task', 'Bug'][i % 5] as WorkItemType,
        state: ['New', 'Active', 'Resolved', 'Closed'][i % 4] as WorkItemState,
        assignedTo: {
          displayName: `User ${(i % 10) + 1}`,
          id: `user-${(i % 10) + 1}`,
          uniqueName: `user${(i % 10) + 1}@company.com`
        },
        areaPath: `Project\\Area${(i % 5) + 1}`,
        iterationPath: `Project\\Iteration${(i % 10) + 1}`,
        startDate: new Date(Date.now() + (i * 24 * 60 * 60 * 1000)),
        targetDate: new Date(Date.now() + ((i + 7) * 24 * 60 * 60 * 1000)),
        createdDate: new Date(),
        changedDate: new Date(),
        childrenIds: [],
        priority: (i % 4) + 1,
        tags: [`tag${i % 5}`]
      });
    }
    return {
      name: 'largeDataset',
      workItems: items,
      delay: 200
    };
  },

  deepHierarchy: (depth: number = 5): MockScenario => {
    const items: WorkItem[] = [];
    const types: WorkItemType[] = ['Epic', 'Feature', 'User Story', 'Task', 'Task'];
    
    for (let i = 1; i <= depth; i++) {
      items.push({
        id: i,
        title: `Level ${i} Item`,
        type: types[Math.min(i - 1, types.length - 1)],
        state: 'Active',
        assignedTo: {
          displayName: 'Test User',
          id: 'user-001',
          uniqueName: 'test@company.com'
        },
        areaPath: 'Project\\Test',
        iterationPath: 'Project\\Sprint 1',
        startDate: new Date(Date.now() + ((i - 1) * 7 * 24 * 60 * 60 * 1000)),
        targetDate: new Date(Date.now() + (i * 14 * 24 * 60 * 60 * 1000)),
        createdDate: new Date(),
        changedDate: new Date(),
        parentId: i > 1 ? i - 1 : undefined,
        childrenIds: i < depth ? [i + 1] : [],
        priority: 1,
        tags: ['hierarchy']
      });
    }
    
    return {
      name: 'deepHierarchy',
      workItems: items,
      delay: 30
    };
  }
};

/**
 * Helper to parse JSON dates into actual Date objects
 */
function parseWorkItemFromJSON(json: any): WorkItem {
  return {
    ...json,
    startDate: json.startDate ? new Date(json.startDate) : undefined,
    targetDate: json.targetDate ? new Date(json.targetDate) : undefined,
    finishDate: json.finishDate ? new Date(json.finishDate) : undefined,
    createdDate: new Date(json.createdDate),
    changedDate: new Date(json.changedDate)
  };
}

// Export singleton for convenience
export const mockWorkItemService = new MockWorkItemService();

// Helper function to generate realistic work items
function generateRealisticWorkItems(): WorkItem[] {
  const baseDate = new Date('2026-01-01');
  
  return [
    {
      id: 1,
      title: 'Q1 2026 Product Roadmap',
      type: 'Epic',
      state: 'Active',
      assignedTo: { displayName: 'Sarah Johnson', id: 'user-001', uniqueName: 'sjohnson@company.com' },
      areaPath: 'Product\\Platform',
      iterationPath: 'Product\\Q1 2026',
      startDate: new Date('2026-01-01'),
      targetDate: new Date('2026-03-31'),
      createdDate: new Date('2025-12-15'),
      changedDate: new Date('2026-01-10'),
      childrenIds: [2, 3],
      priority: 1,
      tags: ['roadmap', 'q1-2026']
    },
    {
      id: 2,
      title: 'User Authentication System',
      type: 'Feature',
      state: 'Active',
      assignedTo: { displayName: 'Mike Chen', id: 'user-002', uniqueName: 'mchen@company.com' },
      areaPath: 'Product\\Platform\\Security',
      iterationPath: 'Product\\Q1 2026\\Sprint 1',
      startDate: new Date('2026-01-06'),
      targetDate: new Date('2026-01-31'),
      createdDate: new Date('2025-12-20'),
      changedDate: new Date('2026-01-08'),
      parentId: 1,
      childrenIds: [4],
      priority: 1,
      tags: ['security', 'auth']
    },
    {
      id: 3,
      title: 'Dashboard Analytics',
      type: 'Feature',
      state: 'New',
      assignedTo: { displayName: 'Emily Rodriguez', id: 'user-003', uniqueName: 'erodriguez@company.com' },
      areaPath: 'Product\\Platform\\Analytics',
      iterationPath: 'Product\\Q1 2026\\Sprint 2',
      startDate: new Date('2026-01-20'),
      targetDate: new Date('2026-02-15'),
      createdDate: new Date('2025-12-22'),
      changedDate: new Date('2025-12-22'),
      parentId: 1,
      childrenIds: [],
      priority: 2,
      tags: ['analytics']
    },
    {
      id: 4,
      title: 'OAuth 2.0 Integration',
      type: 'User Story',
      state: 'Active',
      assignedTo: { displayName: 'Mike Chen', id: 'user-002', uniqueName: 'mchen@company.com' },
      areaPath: 'Product\\Platform\\Security',
      iterationPath: 'Product\\Q1 2026\\Sprint 1',
      startDate: new Date('2026-01-06'),
      targetDate: new Date('2026-01-17'),
      createdDate: new Date('2025-12-20'),
      changedDate: new Date('2026-01-08'),
      parentId: 2,
      childrenIds: [],
      remainingWork: 8,
      completedWork: 12,
      priority: 1,
      tags: ['oauth']
    },
    {
      id: 5,
      title: 'Bug: Login redirect loop',
      type: 'Bug',
      state: 'Active',
      assignedTo: { displayName: 'Mike Chen', id: 'user-002', uniqueName: 'mchen@company.com' },
      areaPath: 'Product\\Platform\\Security',
      iterationPath: 'Product\\Q1 2026\\Sprint 1',
      startDate: new Date('2026-01-08'),
      targetDate: new Date('2026-01-12'),
      createdDate: new Date('2026-01-07'),
      changedDate: new Date('2026-01-08'),
      childrenIds: [],
      remainingWork: 4,
      completedWork: 2,
      priority: 1,
      tags: ['bug', 'critical']
    }
  ];
}

// Helper function to generate edge case work items
function generateEdgeCaseWorkItems(): WorkItem[] {
  return [
    {
      id: 1,
      title: 'Item with null dates',
      type: 'Task',
      state: 'New',
      assignedTo: { displayName: 'Test User', id: 'user-001', uniqueName: 'test@example.com' },
      areaPath: 'Test\\EdgeCases',
      iterationPath: 'Test\\Sprint 1',
      createdDate: new Date('2026-01-15'),
      changedDate: new Date('2026-01-15'),
      childrenIds: [],
      tags: ['null-dates']
    },
    {
      id: 2,
      title: 'Item with only start date',
      type: 'User Story',
      state: 'Active',
      assignedTo: { displayName: 'Test User', id: 'user-001', uniqueName: 'test@example.com' },
      areaPath: 'Test\\EdgeCases',
      iterationPath: 'Test\\Sprint 1',
      startDate: new Date('2026-01-20'),
      createdDate: new Date('2026-01-15'),
      changedDate: new Date('2026-01-18'),
      childrenIds: [],
      tags: ['start-only']
    },
    {
      id: 3,
      title: 'Item with only target date',
      type: 'User Story',
      state: 'Active',
      assignedTo: { displayName: 'Test User', id: 'user-001', uniqueName: 'test@example.com' },
      areaPath: 'Test\\EdgeCases',
      iterationPath: 'Test\\Sprint 1',
      targetDate: new Date('2026-01-25'),
      createdDate: new Date('2026-01-15'),
      changedDate: new Date('2026-01-18'),
      childrenIds: [],
      tags: ['target-only']
    },
    {
      id: 4,
      title: 'Item with same start and end date',
      type: 'Task',
      state: 'Active',
      assignedTo: { displayName: 'Test User', id: 'user-001', uniqueName: 'test@example.com' },
      areaPath: 'Test\\EdgeCases',
      iterationPath: 'Test\\Sprint 1',
      startDate: new Date('2026-01-20'),
      targetDate: new Date('2026-01-20'),
      createdDate: new Date('2026-01-15'),
      changedDate: new Date('2026-01-18'),
      childrenIds: [],
      tags: ['zero-duration']
    },
    {
      id: 5,
      title: 'Item with missing parent',
      type: 'Task',
      state: 'New',
      assignedTo: { displayName: 'Test User', id: 'user-001', uniqueName: 'test@example.com' },
      areaPath: 'Test\\EdgeCases',
      iterationPath: 'Test\\Sprint 1',
      startDate: new Date('2026-01-22'),
      targetDate: new Date('2026-01-24'),
      createdDate: new Date('2026-01-15'),
      changedDate: new Date('2026-01-18'),
      parentId: 99999,
      childrenIds: [],
      tags: ['missing-parent']
    }
  ];
}
