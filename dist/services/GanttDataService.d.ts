import { WorkItem, GanttItem, ZoomLevel } from "../types";
export declare class GanttDataService {
    convertToGanttItems(workItems: WorkItem[]): GanttItem[];
    private createGanttItem;
    private calculateDates;
    private calculateProgress;
    private sortGanttItems;
    getZoomConfig(zoom: ZoomLevel): {
        unit: string;
        step: number;
        dateScale: string;
    };
    getTodayMarker(): {
        start_date: Date;
        css: string;
        text: string;
        title?: string;
    };
}
export declare const ganttDataService: GanttDataService;
//# sourceMappingURL=GanttDataService.d.ts.map