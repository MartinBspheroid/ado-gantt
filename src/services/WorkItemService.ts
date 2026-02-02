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
import { iterationService } from "./IterationService";

/**
 * Custom error types for better error handling
 */
export class PermissionError extends Error {
  constructor(
    message: string,
    public resourceType: 'areaPath' | 'workItem' | 'project' | 'iteration',
    public resourceName?: string
  ) {
    super(message);
    this.name = 'PermissionError';
  }
}

export class NetworkError extends Error {
  constructor(message: string, public originalError?: Error) {
    super(message);
    this.name = 'NetworkError';
  }
}

export class QueryError extends Error {
  constructor(message: string, public wiql?: string) {
    super(message);
    this.name = 'QueryError';
  }
}

export interface ErrorDetails {
  type: 'permission' | 'network' | 'query' | 'unknown';
  message: string;
  userAction?: string;
  helpLink?: string;
  technicalDetails?: string;
}

export class WorkItemService {
  private witClient: WorkItemTrackingRestClient | null = null;
  private projectName: string = "";
  private abortController: AbortController | null = null;

  async initialize(): Promise<void> {
    await SDK.init();
    await SDK.ready();
    
    this.witClient = getClient(WorkItemTrackingRestClient);
    
    const context = SDK.getWebContext();
    this.projectName = context.project?.name || "";
    
    // Initialize iteration service
    await iterationService.initialize();
  }

  /**
   * Analyzes an error and returns structured error details with user-friendly messages
   */
  public analyzeError(error: any): ErrorDetails {
    const errorMessage = error?.message || error?.toString() || 'Unknown error';
    const statusCode = error?.statusCode || error?.response?.status;
    const errorType = error?.type || error?.name;

    // Check for permission errors
    if (this.isPermissionError(error, statusCode, errorMessage)) {
      const resourceType = this.detectResourceType(errorMessage);
      const resourceName = this.extractResourceName(errorMessage);
      
      return {
        type: 'permission',
        message: this.getPermissionErrorMessage(resourceType, resourceName),
        userAction: 'Contact your project administrator to request access or check your team membership.',
        helpLink: 'https://docs.microsoft.com/en-us/azure/devops/organizations/security/permissions',
        technicalDetails: errorMessage
      };
    }

    // Check for network errors
    if (this.isNetworkError(error, errorMessage)) {
      return {
        type: 'network',
        message: 'Unable to connect to Azure DevOps. Please check your internet connection and try again.',
        userAction: 'Refresh the page or check your network connection.',
        helpLink: 'https://status.dev.azure.com/',
        technicalDetails: errorMessage
      };
    }

    // Check for query errors (invalid WIQL)
    if (this.isQueryError(error, errorMessage)) {
      return {
        type: 'query',
        message: 'There was a problem with the search query. Please try adjusting your filters.',
        userAction: 'Try simplifying your filters or selecting different work item types.',
        technicalDetails: errorMessage
      };
    }

    // Unknown errors
    return {
      type: 'unknown',
      message: 'An unexpected error occurred while loading work items.',
      userAction: 'Please try refreshing the page. If the problem persists, contact support.',
      technicalDetails: errorMessage
    };
  }

  private isPermissionError(error: any, statusCode: number | undefined, message: string): boolean {
    // HTTP 401/403 status codes
    if (statusCode === 401 || statusCode === 403) return true;
    
    // Common permission error patterns
    const permissionPatterns = [
      /access denied/i,
      /unauthorized/i,
      /forbidden/i,
      /permission/i,
      /you do not have/i,
      /insufficient privileges/i,
      /tf30063/i, // TF30063: You are not authorized to access
      /tf400813/i, // TF400813: Resource not available for anonymous access
    ];

    return permissionPatterns.some(pattern => pattern.test(message));
  }

  private isNetworkError(error: any, message: string): boolean {
    const networkPatterns = [
      /network error/i,
      /failed to fetch/i,
      /timeout/i,
      /abort/i,
      /connection refused/i,
      /name not resolved/i,
      /offline/i,
    ];

    return networkPatterns.some(pattern => pattern.test(message)) ||
           error?.name === 'AbortError' ||
           error?.name === 'NetworkError';
  }

  private isQueryError(error: any, message: string): boolean {
    const queryPatterns = [
      /wiql/i,
      /query/i,
      /syntax error/i,
      /invalid query/i,
    ];

    return queryPatterns.some(pattern => pattern.test(message));
  }

  private detectResourceType(message: string): 'areaPath' | 'workItem' | 'project' | 'iteration' {
    if (/area.path|areapath|area path/i.test(message)) return 'areaPath';
    if (/iteration|sprint/i.test(message)) return 'iteration';
    if (/project/i.test(message)) return 'project';
    return 'workItem';
  }

  private extractResourceName(message: string): string | undefined {
    // Try to extract area path or project name from error message
    const areaPathMatch = message.match(/area\s*path\s*['"]?([^'"]+)['"]?/i);
    if (areaPathMatch) return areaPathMatch[1];

    const projectMatch = message.match(/project\s*['"]?([^'"]+)['"]?/i);
    if (projectMatch) return projectMatch[1];

    return undefined;
  }

  private getPermissionErrorMessage(resourceType: string, resourceName?: string): string {
    const messages: Record<string, string> = {
      areaPath: resourceName 
        ? `You don't have permission to view work items in the "${resourceName}" area path.`
        : "You don't have permission to view work items in this area path.",
      iteration: resourceName
        ? `You don't have access to the "${resourceName}" iteration.`
        : "You don't have permission to access this iteration.",
      project: "You don't have access to this project. Please verify your team membership.",
      workItem: "You don't have permission to view these work items."
    };

    return messages[resourceType] || messages.workItem;
  }

  /**
   * Cancel any in-flight requests
   */
  public cancelPendingRequests(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  async queryWorkItems(filters?: GanttFilters, signal?: AbortSignal): Promise<WorkItem[]> {
    if (!this.witClient) {
      throw new Error("Service not initialized");
    }

    // Create new abort controller for this request
    this.abortController = new AbortController();
    const abortSignal = signal || this.abortController.signal;

    const wiql = this.buildWiqlQuery(filters);
    
    try {
      const queryResult = await this.witClient.queryByWiql(
        { query: wiql },
        this.projectName
      );

      if (abortSignal.aborted) {
        throw new Error('Request was cancelled');
      }

      if (!queryResult.workItems || queryResult.workItems.length === 0) {
        return [];
      }

      const workItemIds = queryResult.workItems.map(wi => wi.id);
      const workItems = await this.fetchWorkItemDetails(workItemIds, abortSignal);
      
      return workItems;
    } catch (error: any) {
      // Don't throw for aborted requests
      if (error.name === 'AbortError' || error.message?.includes('cancelled')) {
        console.log('Request was cancelled');
        return [];
      }

      console.error("Error querying work items:", error);
      
      // Analyze and throw structured error
      const errorDetails = this.analyzeError(error);
      throw new Error(JSON.stringify(errorDetails));
    }
  }

  async fetchWorkItemDetails(ids: number[], signal?: AbortSignal): Promise<WorkItem[]> {
    if (!this.witClient || ids.length === 0) {
      return [];
    }

    const batches: number[][] = [];
    for (let i = 0; i < ids.length; i += 200) {
      batches.push(ids.slice(i, i + 200));
    }

    const allWorkItems: WorkItem[] = [];

    for (const batch of batches) {
      // Check if request was cancelled before each batch
      if (signal?.aborted) {
        throw new Error('Request was cancelled');
      }

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
        // Continue with other batches even if one fails
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

    try {
      const updatedWorkItem = await this.witClient.updateWorkItem(
        patchDocument,
        workItemId,
        this.projectName
      );

      return this.parseWorkItem(updatedWorkItem as unknown as AdoWorkItem);
    } catch (error: any) {
      const errorDetails = this.analyzeError(error);
      throw new Error(JSON.stringify(errorDetails));
    }
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
      // Handle iteration macros like @CurrentIteration-1
      let iterationCondition: string;
      if (iterationService.containsIterationMacro(filters.iterationPath)) {
        // For macros, use them directly in WIQL - ADO will resolve them
        iterationCondition = `[System.IterationPath] UNDER '${filters.iterationPath}'`;
      } else {
        iterationCondition = `[System.IterationPath] UNDER '${filters.iterationPath}'`;
      }
      conditions.push(iterationCondition);
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
