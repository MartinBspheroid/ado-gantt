import * as SDK from "azure-devops-extension-sdk";
import { getClient } from "azure-devops-extension-api";
import { WorkItemTrackingRestClient } from "azure-devops-extension-api/WorkItemTracking";
import { 
  WorkItem, 
  WorkItemType, 
  WorkItemState,
  AdoWorkItem,
  GanttFilters 
} from "../types";

export class WorkItemService {
  private witClient: WorkItemTrackingRestClient | null = null;
  private projectName: string = "";

  async initialize(): Promise<void> {
    await SDK.init();
    await SDK.ready();
    
    this.witClient = getClient(WorkItemTrackingRestClient);
    
    const context = SDK.getWebContext();
    this.projectName = context.project?.name || "";
  }

  async queryWorkItems(filters?: GanttFilters): Promise<WorkItem[]> {
    if (!this.witClient) {
      throw new Error("Service not initialized");
    }

    const wiql = this.buildWiqlQuery(filters);
    
    try {
      const queryResult = await this.witClient.queryByWiql(
        { query: wiql },
        this.projectName
      );

      if (!queryResult.workItems || queryResult.workItems.length === 0) {
        return [];
      }

      const workItemIds = queryResult.workItems.map(wi => wi.id);
      const workItems = await this.fetchWorkItemDetails(workItemIds);
      
      return workItems;
    } catch (error) {
      console.error("Error querying work items:", error);
      throw error;
    }
  }

  async fetchWorkItemDetails(ids: number[]): Promise<WorkItem[]> {
    if (!this.witClient || ids.length === 0) {
      return [];
    }

    const batches: number[][] = [];
    for (let i = 0; i < ids.length; i += 200) {
      batches.push(ids.slice(i, i + 200));
    }

    const allWorkItems: WorkItem[] = [];

    for (const batch of batches) {
      try {
        const adoWorkItems = await this.witClient.getWorkItems(
          batch,
          undefined,
          undefined,
          undefined,
          undefined
        );

        const parsedItems = adoWorkItems.map(wi => this.parseWorkItem(wi as unknown as AdoWorkItem));
        allWorkItems.push(...parsedItems);
      } catch (error) {
        console.error("Error fetching work item batch:", error);
      }
    }

    return allWorkItems;
  }

  async updateWorkItemDates(
    workItemId: number, 
    startDate?: Date, 
    targetDate?: Date
  ): Promise<WorkItem> {
    if (!this.witClient) {
      throw new Error("Service not initialized");
    }

    const patchDocument: any[] = [];

    if (startDate) {
      patchDocument.push({
        op: "add",
        path: "/fields/Microsoft.VSTS.Scheduling.StartDate",
        value: startDate.toISOString()
      });
    }

    if (targetDate) {
      patchDocument.push({
        op: "add",
        path: "/fields/Microsoft.VSTS.Scheduling.TargetDate",
        value: targetDate.toISOString()
      });
    }

    const updatedWorkItem = await this.witClient.updateWorkItem(
      patchDocument,
      workItemId,
      this.projectName
    );

    return this.parseWorkItem(updatedWorkItem as unknown as AdoWorkItem);
  }

  async getAreaPaths(): Promise<string[]> {
    return [];
  }

  async getIterations(): Promise<string[]> {
    return [];
  }

  async getTeamMembers(): Promise<{ id: string; displayName: string; uniqueName: string }[]> {
    return [];
  }

  private buildWiqlQuery(filters?: GanttFilters): string {
    const conditions: string[] = [
      "[System.TeamProject] = @Project",
      "[System.State] <> 'Removed'"
    ];

    const types = filters?.workItemTypes || ['User Story', 'Task', 'Feature'];
    if (types.length > 0) {
      const typeList = types.map(t => `'${t}'`).join(", ");
      conditions.push(`[System.WorkItemType] IN (${typeList})`);
    }

    if (filters?.states && filters.states.length > 0) {
      const stateList = filters.states.map(s => `'${s}'`).join(", ");
      conditions.push(`[System.State] IN (${stateList})`);
    }

    if (filters?.areaPath) {
      conditions.push(`[System.AreaPath] UNDER '${filters.areaPath}'`);
    }

    if (filters?.iterationPath) {
      conditions.push(`[System.IterationPath] UNDER '${filters.iterationPath}'`);
    }

    conditions.push(
      `([Microsoft.VSTS.Scheduling.StartDate] <> '' OR [Microsoft.VSTS.Scheduling.TargetDate] <> '' OR [System.IterationPath] <> '')`
    );

    return `
      SELECT [System.Id], [System.Title], [System.WorkItemType], [System.State],
             [System.AssignedTo], [System.AreaPath], [System.IterationPath],
             [Microsoft.VSTS.Scheduling.StartDate], [Microsoft.VSTS.Scheduling.TargetDate],
             [Microsoft.VSTS.Scheduling.FinishDate], [Microsoft.VSTS.Scheduling.RemainingWork],
             [Microsoft.VSTS.Scheduling.CompletedWork], [Microsoft.VSTS.Common.Priority],
             [System.Tags], [System.Description], [System.CreatedDate], [System.ChangedDate]
      FROM workitems
      WHERE ${conditions.join(" AND ")}
      ORDER BY [Microsoft.VSTS.Common.StackRank], [System.Id]
    `;
  }

  private parseWorkItem(adoWorkItem: AdoWorkItem): WorkItem {
    const fields = adoWorkItem.fields;
    
    let parentId: number | undefined;
    const childrenIds: number[] = [];
    
    if (adoWorkItem.relations) {
      for (const rel of adoWorkItem.relations) {
        if (rel.rel === "System.LinkTypes.Hierarchy-Reverse") {
          const match = rel.url.match(/\/(\d+)$/);
          if (match) {
            parentId = parseInt(match[1], 10);
          }
        } else if (rel.rel === "System.LinkTypes.Hierarchy-Forward") {
          const match = rel.url.match(/\/(\d+)$/);
          if (match) {
            childrenIds.push(parseInt(match[1], 10));
          }
        }
      }
    }

    return {
      id: fields['System.Id'],
      title: fields['System.Title'],
      type: fields['System.WorkItemType'] as WorkItemType,
      state: fields['System.State'] as WorkItemState,
      assignedTo: fields['System.AssignedTo'],
      areaPath: fields['System.AreaPath'],
      iterationPath: fields['System.IterationPath'],
      startDate: fields['Microsoft.VSTS.Scheduling.StartDate'] 
        ? new Date(fields['Microsoft.VSTS.Scheduling.StartDate']) 
        : undefined,
      targetDate: fields['Microsoft.VSTS.Scheduling.TargetDate'] 
        ? new Date(fields['Microsoft.VSTS.Scheduling.TargetDate']) 
        : undefined,
      finishDate: fields['Microsoft.VSTS.Scheduling.FinishDate'] 
        ? new Date(fields['Microsoft.VSTS.Scheduling.FinishDate']) 
        : undefined,
      createdDate: new Date(fields['System.CreatedDate']),
      changedDate: new Date(fields['System.ChangedDate']),
      parentId,
      childrenIds,
      remainingWork: fields['Microsoft.VSTS.Scheduling.RemainingWork'],
      completedWork: fields['Microsoft.VSTS.Scheduling.CompletedWork'],
      priority: fields['Microsoft.VSTS.Common.Priority'],
      tags: fields['System.Tags'] ? fields['System.Tags'].split(';').map(t => t.trim()) : [],
      description: fields['System.Description']
    };
  }
}

export const workItemService = new WorkItemService();
