import { WorkItem, GanttFilters } from "../types";
export declare class WorkItemService {
    private witClient;
    private projectName;
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
}
export declare const workItemService: WorkItemService;
//# sourceMappingURL=WorkItemService.d.ts.map