// Work item state colors matching Azure DevOps
export type WorkItemState = 'New' | 'Active' | 'Resolved' | 'Closed' | 'Removed';

export interface StateColor {
  state: WorkItemState;
  color: string;
  backgroundColor: string;
}

export const STATE_COLORS: Record<WorkItemState, StateColor> = {
  'New': { state: 'New', color: '#0078d4', backgroundColor: '#deecf9' },
  'Active': { state: 'Active', color: '#ff8c00', backgroundColor: '#fff4e5' },
  'Resolved': { state: 'Resolved', color: '#773b93', backgroundColor: '#f3f2f1' },
  'Closed': { state: 'Closed', color: '#107c10', backgroundColor: '#dff6dd' },
  'Removed': { state: 'Removed', color: '#a80000', backgroundColor: '#fde7e9' }
};

// Timeline-based progress status
export type ProgressStatus = 'Not Started' | 'On Track' | 'At Risk' | 'Off Track' | 'Done';

export interface ProgressStatusInfo {
  status: ProgressStatus;
  label: string;
  color: string;
  backgroundColor: string;
  icon: string;
}

export const PROGRESS_STATUS: Record<ProgressStatus, ProgressStatusInfo> = {
  'Not Started': { 
    status: 'Not Started', 
    label: 'Not Started', 
    color: '#0078d4', 
    backgroundColor: '#deecf9',
    icon: '⏸️'
  },
  'On Track': { 
    status: 'On Track', 
    label: 'On Track', 
    color: '#107c10', 
    backgroundColor: '#dff6dd',
    icon: '✅'
  },
  'At Risk': { 
    status: 'At Risk', 
    label: 'At Risk', 
    color: '#ff8c00', 
    backgroundColor: '#fff4e5',
    icon: '⚠️'
  },
  'Off Track': { 
    status: 'Off Track', 
    label: 'Off Track', 
    color: '#a80000', 
    backgroundColor: '#fde7e9',
    icon: '❌'
  },
  'Done': { 
    status: 'Done', 
    label: 'Done', 
    color: '#107c10', 
    backgroundColor: '#107c10',
    icon: '✓'
  }
};

// Work item types
export type WorkItemType = 'Epic' | 'Feature' | 'User Story' | 'Task' | 'Bug';

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
  remainingWork?: number;
  completedWork?: number;
  priority?: number;
  tags: string[];
  description?: string;
}

// Gantt-specific view model
export interface GanttItem {
  id: number;
  text: string;
  start_date: Date;
  end_date: Date;
  duration?: number;
  progress: number;
  parent: number;
  type: 'task' | 'project';
  open: boolean;
  workItem: WorkItem;
  color: string;
  textColor: string;
  progressStatus: ProgressStatus;
}

// Progress summary for header display
export interface ProgressSummary {
  notStarted: number;
  onTrack: number;
  atRisk: number;
  offTrack: number;
  done: number;
  total: number;
}

// Filter configuration
export interface GanttFilters {
  areaPath?: string;
  iterationPath?: string;
  iterationShift?: number; // @CurrentIteration +/- n support
  assignedTo?: string[];
  workItemTypes: WorkItemType[];
  states: WorkItemState[];
  startDateRange?: { start: Date; end: Date };
  showTeamMembersOnly: boolean;
  teamMemberWhitelist: string[];
  groupBy?: GroupByOption;
}

// Zoom level for Gantt view
export type ZoomLevel = 'day' | 'week' | 'month' | 'quarter';

// Group by options for Gantt view
export type GroupByOption = 'none' | 'assignedTo' | 'type' | 'state' | 'iteration';

// Extension configuration
export interface GanttExtensionConfig {
  teamMemberWhitelist: string[];
  defaultZoom: ZoomLevel;
  showDependencies: boolean;
  allowDragResize: boolean;
  defaultFilters: GanttFilters;
  dateFieldPreference: 'scheduled' | 'iteration' | 'both';
}

// ADO API response types
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
  'System.AssignedTo'?: { displayName: string; id: string; uniqueName: string };
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
  columns: { referenceName: string; name: string; url: string }[];
  workItems: { id: number; url: string }[];
}

// Component props
export interface GanttToolbarProps {
  filters: GanttFilters;
  onFiltersChange: (filters: GanttFilters) => void;
  zoom: ZoomLevel;
  onZoomChange: (zoom: ZoomLevel) => void;
  onRefresh: () => void;
  isLoading: boolean;
  availableAreaPaths: string[];
  availableIterations: string[];
  availableTeamMembers: { id: string; displayName: string }[];
  // Progress summary
  progressSummary?: ProgressSummary;
  // Saved boards
  savedBoards?: { id: string; name: string }[];
  currentBoardId?: string | null;
  onBoardSelect?: (boardId: string) => void;
  onSaveBoard?: (name: string) => void;
  onDeleteBoard?: (boardId: string) => void;
  // Group by
  groupBy?: GroupByOption;
  onGroupByChange?: (groupBy: GroupByOption) => void;
}

export interface GanttChartProps {
  items: GanttItem[];
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
