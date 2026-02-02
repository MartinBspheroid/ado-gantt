import * as SDK from "azure-devops-extension-sdk";
import {
  WorkItem,
  WorkItemType,
  WorkItemState,
  AdoWorkItem,
  AdoWorkItemRelation,
  GanttFilters
} from "../types";

// Azure DevOps relation type strings
const RELATION_TYPES = {
  PARENT: 'System.LinkTypes.Hierarchy-Reverse',
  CHILD: 'System.LinkTypes.Hierarchy-Forward',
  PREDECESSOR: 'System.LinkTypes.Dependency-Forward',  // "Depends On" - this item depends on the linked item
  SUCCESSOR: 'System.LinkTypes.Dependency-Reverse'     // "Blocks" - this item blocks the linked item
} as const;

export class WorkItemService {
  private projectName: string = "";
  private orgUrl: string = "";
  private accessToken: string = "";

  async initialize(): Promise<void> {
    // SDK.init() is already called by GanttHub, just wait for ready
    await SDK.ready();

    const context = SDK.getWebContext();
    this.projectName = context.project?.name || "";

    // Get the organization URL from the host
    const host = SDK.getHost();
    this.orgUrl = `https://dev.azure.com/${host.name}`;

    console.log("[WorkItemService] Org URL:", this.orgUrl);
    console.log("[WorkItemService] Project:", this.projectName);

    // Get access token using SDK
    console.log("[WorkItemService] Getting access token...");
    this.accessToken = await SDK.getAccessToken();
    console.log("[WorkItemService] Got access token:", this.accessToken ? "yes (length: " + this.accessToken.length + ")" : "no");
  }

  async queryWorkItems(filters?: GanttFilters): Promise<WorkItem[]> {
    console.log("[WorkItemService] queryWorkItems() called");
    if (!this.accessToken) {
      throw new Error("Service not initialized - no access token");
    }

    const wiql = this.buildWiqlQuery(filters);
    console.log("[WorkItemService] WIQL query:", wiql);

    try {
      // Use direct fetch with the access token instead of REST client
      const wiqlUrl = `${this.orgUrl}/${encodeURIComponent(this.projectName)}/_apis/wit/wiql?api-version=7.1`;
      console.log("[WorkItemService] WIQL URL:", wiqlUrl);

      const response = await fetch(wiqlUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query: wiql })
      });

      console.log("[WorkItemService] WIQL response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`WIQL query failed: ${response.status} - ${errorText}`);
      }

      const queryResult = await response.json();
      console.log("[WorkItemService] WIQL result:", queryResult);

      if (!queryResult.workItems || queryResult.workItems.length === 0) {
        console.log("[WorkItemService] No work items found");
        return [];
      }

      const workItemIds = queryResult.workItems.map((wi: { id: number }) => wi.id);
      console.log("[WorkItemService] Found work item IDs:", workItemIds);
      const workItems = await this.fetchWorkItemDetails(workItemIds);
      console.log("[WorkItemService] Fetched work item details:", workItems.length);

      return workItems;
    } catch (error) {
      console.error("[WorkItemService] Error querying work items:", error);
      throw error;
    }
  }

  async fetchWorkItemDetails(ids: number[]): Promise<WorkItem[]> {
    if (!this.accessToken || ids.length === 0) {
      return [];
    }

    const batches: number[][] = [];
    for (let i = 0; i < ids.length; i += 200) {
      batches.push(ids.slice(i, i + 200));
    }

    const allWorkItems: WorkItem[] = [];

    for (const batch of batches) {
      try {
        console.log("[WorkItemService] Fetching batch of", batch.length, "work items with relations");

        // Use $expand=relations to get parent/child and dependency links
        // Note: Cannot combine $expand with fields= parameter
        const idsParam = batch.join(',');
        const url = `${this.orgUrl}/_apis/wit/workitems?ids=${idsParam}&$expand=relations&api-version=7.1`;

        console.log("[WorkItemService] Fetching work items from:", url.substring(0, 100) + "...");

        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        });

        console.log("[WorkItemService] Work items response status:", response.status);

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to fetch work items: ${response.status} - ${errorText}`);
        }

        const result = await response.json();
        const adoWorkItems = result.value || [];

        console.log("[WorkItemService] Got", adoWorkItems.length, "work items from API");
        const parsedItems = adoWorkItems.map((wi: AdoWorkItem) => this.parseWorkItem(wi));
        allWorkItems.push(...parsedItems);
      } catch (error) {
        console.error("[WorkItemService] Error fetching work item batch:", error);
        throw error;
      }
    }

    return allWorkItems;
  }

  async updateWorkItemDates(
    workItemId: number,
    startDate?: Date,
    targetDate?: Date
  ): Promise<WorkItem> {
    if (!this.accessToken) {
      throw new Error("Service not initialized");
    }

    const patchDocument: Array<{ op: string; path: string; value: string }> = [];

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

    // If no dates to update, just fetch and return the current work item
    if (patchDocument.length === 0) {
      console.log("[WorkItemService] No dates to update, fetching current state");
      const items = await this.fetchWorkItemDetails([workItemId]);
      if (items.length === 0) {
        throw new Error(`Work item ${workItemId} not found`);
      }
      return items[0];
    }

    const url = `${this.orgUrl}/_apis/wit/workitems/${workItemId}?api-version=7.1`;

    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json-patch+json'
      },
      body: JSON.stringify(patchDocument)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to update work item: ${response.status} - ${errorText}`);
    }

    const updatedWorkItem = await response.json();
    return this.parseWorkItem(updatedWorkItem as AdoWorkItem);
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

    // Note: Removed date requirement - will use iteration dates or created date as fallback
    return `
      SELECT [System.Id], [System.Title], [System.WorkItemType], [System.State],
             [System.AssignedTo], [System.AreaPath], [System.IterationPath],
             [Microsoft.VSTS.Common.Priority],
             [System.Tags], [System.Description], [System.CreatedDate], [System.ChangedDate]
      FROM workitems
      WHERE ${conditions.join(" AND ")}
      ORDER BY [System.Id]
    `;
  }

  private parseWorkItem(adoWorkItem: AdoWorkItem): WorkItem {
    const fields = adoWorkItem.fields;
    const relations = this.parseRelations(adoWorkItem.relations || []);

    return {
      id: adoWorkItem.id,
      title: fields['System.Title'] || 'Untitled',
      type: (fields['System.WorkItemType'] || 'Task') as WorkItemType,
      state: (fields['System.State'] || 'New') as WorkItemState,
      assignedTo: fields['System.AssignedTo'],
      areaPath: fields['System.AreaPath'] || '',
      iterationPath: fields['System.IterationPath'] || '',
      startDate: fields['Microsoft.VSTS.Scheduling.StartDate']
        ? new Date(fields['Microsoft.VSTS.Scheduling.StartDate'])
        : undefined,
      targetDate: fields['Microsoft.VSTS.Scheduling.TargetDate']
        ? new Date(fields['Microsoft.VSTS.Scheduling.TargetDate'])
        : undefined,
      finishDate: fields['Microsoft.VSTS.Scheduling.FinishDate']
        ? new Date(fields['Microsoft.VSTS.Scheduling.FinishDate'])
        : undefined,
      createdDate: fields['System.CreatedDate']
        ? new Date(fields['System.CreatedDate'])
        : new Date(),
      changedDate: fields['System.ChangedDate']
        ? new Date(fields['System.ChangedDate'])
        : new Date(),
      parentId: relations.parentId,
      childrenIds: relations.childrenIds,
      predecessors: relations.predecessors,
      successors: relations.successors,
      remainingWork: fields['Microsoft.VSTS.Scheduling.RemainingWork'],
      completedWork: fields['Microsoft.VSTS.Scheduling.CompletedWork'],
      priority: fields['Microsoft.VSTS.Common.Priority'],
      tags: fields['System.Tags'] ? fields['System.Tags'].split(';').map((t: string) => t.trim()) : [],
      description: fields['System.Description']
    };
  }

  /**
   * Parse relations array from ADO API response
   * Extracts parent, children, predecessors, and successors
   */
  private parseRelations(relations: AdoWorkItemRelation[]): {
    parentId?: number;
    childrenIds: number[];
    predecessors: number[];
    successors: number[];
  } {
    let parentId: number | undefined;
    const childrenIds: number[] = [];
    const predecessors: number[] = [];
    const successors: number[] = [];

    for (const relation of relations) {
      const workItemId = this.extractWorkItemIdFromUrl(relation.url);
      if (workItemId === null) continue;

      switch (relation.rel) {
        case RELATION_TYPES.PARENT:
          parentId = workItemId;
          break;
        case RELATION_TYPES.CHILD:
          childrenIds.push(workItemId);
          break;
        case RELATION_TYPES.PREDECESSOR:
          // This item depends on the linked item (predecessor)
          predecessors.push(workItemId);
          break;
        case RELATION_TYPES.SUCCESSOR:
          // This item blocks the linked item (successor)
          successors.push(workItemId);
          break;
      }
    }

    return { parentId, childrenIds, predecessors, successors };
  }

  /**
   * Extract work item ID from ADO API URL
   * Example: "https://dev.azure.com/org/_apis/wit/workItems/123" -> 123
   */
  private extractWorkItemIdFromUrl(url: string): number | null {
    const match = url.match(/workItems\/(\d+)/i);
    if (match && match[1]) {
      return parseInt(match[1], 10);
    }
    return null;
  }
}

export const workItemService = new WorkItemService();
