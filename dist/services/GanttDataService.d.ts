import { WorkItem, GanttItem, GanttData, ZoomLevel } from "../types";
/**
 * Service for converting WorkItems to SVAR Gantt format
 */
export declare class GanttDataService {
    /**
     * Convert work items to gantt data (items + links)
     * This is the main entry point for data conversion
     */
    convertToGanttData(workItems: WorkItem[]): GanttData;
    convertToGanttItems(workItems: WorkItem[]): GanttItem[];
    private createGanttItem;
    /**
     * Build CSS classes for task styling based on work item type and state
     */
    private buildCssClasses;
    /**
     * Extract dependency links from work items
     * Only creates links where both source and target exist in the dataset
     */
    private extractGanttLinks;
    private calculateDates;
    private calculateProgress;
    private sortGanttItems;
    /**
     * Get SVAR scales configuration for zoom level
     */
    getScalesConfig(zoom: ZoomLevel): Array<{
        unit: string;
        step: number;
        format: string;
    }>;
    /**
     * Get cell width based on zoom level
     */
    getCellWidth(zoom: ZoomLevel): number;
}
export declare const ganttDataService: GanttDataService;
//# sourceMappingURL=GanttDataService.d.ts.map