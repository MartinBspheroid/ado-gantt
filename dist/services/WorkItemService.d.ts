import { WorkItem, GanttFilters } from "../types";
export declare class WorkItemService {
    private projectName;
    private orgUrl;
    private accessToken;
    initialize(): Promise<void>;
    queryWorkItems(filters?: GanttFilters): Promise<WorkItem[]>;
    fetchWorkItemDetails(ids: number[]): Promise<WorkItem[]>;
    updateWorkItemDates(workItemId: number, startDate?: Date, targetDate?: Date): Promise<WorkItem>;
    getAreaPaths(): Promise<string[]>;
    getIterations(): Promise<string[]>;
    getTeamMembers(): Promise<{
        id: string;
        displayName: string;
        uniqueName: string;
    }[]>;
    private buildWiqlQuery;
    private parseWorkItem;
    /**
     * Parse relations array from ADO API response
     * Extracts parent, children, predecessors, and successors
     */
    private parseRelations;
    /**
     * Extract work item ID from ADO API URL
     * Example: "https://dev.azure.com/org/_apis/wit/workItems/123" -> 123
     */
    private extractWorkItemIdFromUrl;
}
export declare const workItemService: WorkItemService;
//# sourceMappingURL=WorkItemService.d.ts.map