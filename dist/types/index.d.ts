export type WorkItemState = 'New' | 'Active' | 'Resolved' | 'Closed' | 'Removed' | 'To Do' | 'Doing' | 'Done';
export interface StateColor {
    state: WorkItemState;
    color: string;
    backgroundColor: string;
}
export declare const STATE_COLORS: Record<WorkItemState, StateColor>;
export type WorkItemType = 'Epic' | 'Feature' | 'User Story' | 'Task' | 'Bug' | 'Issue';
export interface WorkItem {
    id: number;
    title: string;
    type: WorkItemType;
    state: WorkItemState;
    assignedTo?: {
        displayName: string;
        id: string;
        uniqueName: string;
    };
    areaPath: string;
    iterationPath: string;
    startDate?: Date;
    targetDate?: Date;
    finishDate?: Date;
    createdDate: Date;
    changedDate: Date;
    parentId?: number;
    childrenIds: number[];
    predecessors: number[];
    successors: number[];
    remainingWork?: number;
    completedWork?: number;
    priority?: number;
    tags: string[];
    description?: string;
}
export interface GanttItem {
    id: number;
    text: string;
    start: Date;
    end: Date;
    duration?: number;
    progress: number;
    parent: number;
    type: 'task' | 'summary';
    open: boolean;
    workItem: WorkItem;
    $css?: string;
}
export type GanttLinkType = 'e2s' | 's2s' | 'e2e' | 's2e';
export interface GanttLink {
    id: string | number;
    source: number;
    target: number;
    type: GanttLinkType;
}
export interface GanttData {
    items: GanttItem[];
    links: GanttLink[];
}
export interface GanttFilters {
    areaPath?: string;
    iterationPath?: string;
    assignedTo?: string[];
    workItemTypes: WorkItemType[];
    states: WorkItemState[];
    startDateRange?: {
        start: Date;
        end: Date;
    };
    showTeamMembersOnly: boolean;
    teamMemberWhitelist: string[];
}
export type ZoomLevel = 'day' | 'week' | 'month' | 'quarter';
export interface GanttExtensionConfig {
    teamMemberWhitelist: string[];
    defaultZoom: ZoomLevel;
    showDependencies: boolean;
    allowDragResize: boolean;
    defaultFilters: GanttFilters;
    dateFieldPreference: 'scheduled' | 'iteration' | 'both';
}
export interface AdoWorkItemRelation {
    rel: string;
    url: string;
    attributes?: {
        isLocked?: boolean;
        name?: string;
    };
}
export interface AdoWorkItemFields {
    'System.Id': number;
    'System.Title': string;
    'System.WorkItemType': string;
    'System.State': string;
    'System.AssignedTo'?: {
        displayName: string;
        id: string;
        uniqueName: string;
    };
    'System.AreaPath': string;
    'System.IterationPath': string;
    'System.CreatedDate': string;
    'System.ChangedDate': string;
    'System.Tags'?: string;
    'System.Description'?: string;
    'Microsoft.VSTS.Scheduling.StartDate'?: string;
    'Microsoft.VSTS.Scheduling.TargetDate'?: string;
    'Microsoft.VSTS.Scheduling.FinishDate'?: string;
    'Microsoft.VSTS.Scheduling.RemainingWork'?: number;
    'Microsoft.VSTS.Scheduling.CompletedWork'?: number;
    'Microsoft.VSTS.Common.Priority'?: number;
    'Microsoft.VSTS.Common.StackRank'?: number;
}
export interface AdoWorkItem {
    id: number;
    rev: number;
    fields: AdoWorkItemFields;
    relations?: AdoWorkItemRelation[];
    url: string;
}
export interface AdoWiqlResult {
    queryType: string;
    queryResultType: string;
    asOf: string;
    columns: {
        referenceName: string;
        name: string;
        url: string;
    }[];
    workItems: {
        id: number;
        url: string;
    }[];
}
export interface GanttToolbarProps {
    filters: GanttFilters;
    onFiltersChange: (filters: GanttFilters) => void;
    zoom: ZoomLevel;
    onZoomChange: (zoom: ZoomLevel) => void;
    onRefresh: () => void;
    isLoading: boolean;
    availableAreaPaths: string[];
    availableIterations: string[];
    availableTeamMembers: {
        id: string;
        displayName: string;
    }[];
}
export interface GanttChartProps {
    items: GanttItem[];
    links: GanttLink[];
    zoom: ZoomLevel;
    onItemClick: (item: GanttItem) => void;
    onItemDrag?: (item: GanttItem, newStart: Date, newEnd: Date) => void;
    onItemResize?: (item: GanttItem, newStart: Date, newEnd: Date) => void;
    isLoading: boolean;
}
export interface WorkItemDetailsPanelProps {
    workItem: WorkItem | null;
    onClose: () => void;
    onSave: (workItem: WorkItem) => Promise<void>;
}
//# sourceMappingURL=index.d.ts.map