import * as React from "react";
import { useEffect, useState, useCallback } from "react";
import * as SDK from "azure-devops-extension-sdk";
import { 
  WorkItem, 
  GanttItem, 
  GanttFilters, 
  ZoomLevel,
  GroupByOption,
  ProgressSummary
} from "./types";
import { 
  workItemService, 
  ganttDataService, 
  progressCalculationService,
  savedBoardsService,
  SavedGanttBoard,
  iterationService
} from "./services";
import { GanttToolbar, GanttChart, WorkItemDetailsPanel } from "./components";
import "./styles/GanttHub.css";

export const GanttHub: React.FC = () => {
  const [workItems, setWorkItems] = useState<WorkItem[]>([]);
  const [ganttItems, setGanttItems] = useState<GanttItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  
  const [selectedWorkItem, setSelectedWorkItem] = useState<WorkItem | null>(null);
  
  const [filters, setFilters] = useState<GanttFilters>({
    workItemTypes: ['User Story', 'Task', 'Feature'],
    states: ['New', 'Active', 'Resolved'],
    showTeamMembersOnly: false,
    teamMemberWhitelist: [],
    groupBy: 'none'
  });
  
  const [zoom, setZoom] = useState<ZoomLevel>('week');
  const [groupBy, setGroupBy] = useState<GroupByOption>('none');
  
  // Saved boards state
  const [savedBoards, setSavedBoards] = useState<SavedGanttBoard[]>([]);
  const [currentBoardId, setCurrentBoardId] = useState<string | null>(null);
  
  // Progress summary
  const [progressSummary, setProgressSummary] = useState<ProgressSummary>({
    notStarted: 0,
    onTrack: 0,
    atRisk: 0,
    offTrack: 0,
    done: 0,
    total: 0
  });
  
  const [availableAreaPaths, setAvailableAreaPaths] = useState<string[]>([]);
  const [availableIterations, setAvailableIterations] = useState<string[]>([]);
  const [availableTeamMembers, setAvailableTeamMembers] = useState<{ id: string; displayName: string }[]>([]);

  // Initialize on mount
  useEffect(() => {
    const init = async () => {
      try {
        await SDK.init();
        await SDK.ready();
        
        const currentUser = SDK.getUser();
        setUser(currentUser);
        
        await workItemService.initialize();
        await iterationService.initialize();
        
        // Load saved boards
        const boards = savedBoardsService.getSavedBoards();
        if (boards.length === 0) {
          // Create default board if none exist
          const defaultBoard = savedBoardsService.createDefaultBoard();
          setSavedBoards([defaultBoard]);
          setCurrentBoardId(defaultBoard.id);
          savedBoardsService.saveCurrentBoard(defaultBoard.id);
        } else {
          setSavedBoards(boards);
          const lastBoardId = savedBoardsService.getCurrentBoardId();
          if (lastBoardId && boards.find(b => b.id === lastBoardId)) {
            setCurrentBoardId(lastBoardId);
            loadBoard(lastBoardId);
          } else {
            setCurrentBoardId(boards[0].id);
            loadBoard(boards[0].id);
          }
        }
        
        // Load iterations for dropdown
        const iterations = await iterationService.getAvailableIterationPaths();
        setAvailableIterations(iterations);
      } catch (err: any) {
        console.error("Error initializing extension:", err);
        setError("Failed to initialize extension. Please refresh the page.");
      }
    };

    init();
  }, []);

  // Load work items when filters change
  const loadWorkItems = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Resolve any iteration macros in filters
      let resolvedFilters = { ...filters };
      if (filters.iterationPath && iterationService.containsIterationMacro(filters.iterationPath)) {
        const resolvedPath = await iterationService.resolveIterationMacro(filters.iterationPath);
        if (resolvedPath) {
          resolvedFilters.iterationPath = resolvedPath;
        }
      }
      
      const items = await workItemService.queryWorkItems(resolvedFilters);
      setWorkItems(items);
      
      // Apply grouping
      const processedItems = applyGrouping(items, groupBy);
      
      const ganttData = ganttDataService.convertToGanttItems(processedItems);
      setGanttItems(ganttData);
      
      // Calculate progress summary
      const summary = progressCalculationService.calculateProgressSummary(ganttData);
      setProgressSummary(summary);
    } catch (err: any) {
      console.error("Error loading work items:", err);
      setError("Failed to load work items. Please check your permissions and try again.");
    } finally {
      setIsLoading(false);
    }
  }, [filters, groupBy]);

  useEffect(() => {
    if (user) {
      loadWorkItems();
    }
  }, [filters, groupBy, user, loadWorkItems]);

  // Apply grouping to work items
  const applyGrouping = (items: WorkItem[], groupByOption: GroupByOption): WorkItem[] => {
    if (groupByOption === 'none') {
      return items;
    }
    
    // For grouped view, we add virtual parent items for each group
    const groups = new Map<string, WorkItem[]>();
    
    for (const item of items) {
      let groupKey: string;
      
      switch (groupByOption) {
        case 'assignedTo':
          groupKey = item.assignedTo?.displayName || 'Unassigned';
          break;
        case 'type':
          groupKey = item.type;
          break;
        case 'state':
          groupKey = item.state;
          break;
        case 'iteration':
          groupKey = item.iterationPath || 'No Iteration';
          break;
        default:
          groupKey = 'All';
      }
      
      if (!groups.has(groupKey)) {
        groups.set(groupKey, []);
      }
      groups.get(groupKey)!.push(item);
    }
    
    // Create virtual parent items for each group
    const result: WorkItem[] = [];
    let groupId = -1; // Use negative IDs for virtual groups
    
    for (const [groupName, groupItems] of groups) {
      // Create a virtual parent work item for the group
      const groupParent: WorkItem = {
        id: groupId,
        title: groupName,
        type: 'Feature', // Use Feature as group header type
        state: 'Active',
        areaPath: '',
        iterationPath: '',
        createdDate: new Date(),
        changedDate: new Date(),
        childrenIds: groupItems.map(i => i.id),
        tags: []
      };
      
      result.push(groupParent);
      
      // Add all items in this group with the virtual parent as their parent
      for (const item of groupItems) {
        result.push({
          ...item,
          parentId: groupId
        });
      }
      
      groupId--;
    }
    
    return result;
  };

  // Load a saved board
  const loadBoard = (boardId: string) => {
    const board = savedBoardsService.getBoard(boardId);
    if (board) {
      setFilters(board.filters);
      setZoom(board.zoom);
      setGroupBy(board.filters.groupBy || 'none');
      setCurrentBoardId(boardId);
      savedBoardsService.saveCurrentBoard(boardId);
    }
  };

  // Save current board
  const handleSaveBoard = (name: string) => {
    const board = savedBoardsService.saveBoard({
      name,
      filters: { ...filters, groupBy },
      zoom
    });
    setSavedBoards(savedBoardsService.getSavedBoards());
    setCurrentBoardId(board.id);
    savedBoardsService.saveCurrentBoard(board.id);
  };

  // Delete a board
  const handleDeleteBoard = (boardId: string) => {
    savedBoardsService.deleteBoard(boardId);
    const boards = savedBoardsService.getSavedBoards();
    setSavedBoards(boards);
    
    if (currentBoardId === boardId) {
      if (boards.length > 0) {
        loadBoard(boards[0].id);
      } else {
        const defaultBoard = savedBoardsService.createDefaultBoard();
        setSavedBoards([defaultBoard]);
        loadBoard(defaultBoard.id);
      }
    }
  };

  // Select a board
  const handleBoardSelect = (boardId: string) => {
    loadBoard(boardId);
  };

  const handleItemClick = useCallback((item: GanttItem) => {
    setSelectedWorkItem(item.workItem);
  }, []);

  const handleItemDrag = useCallback(async (item: GanttItem, newStart: Date, newEnd: Date) => {
    try {
      await workItemService.updateWorkItemDates(item.id, newStart, newEnd);
      await loadWorkItems();
    } catch (err: any) {
      console.error("Error updating work item dates:", err);
      setError("Failed to update work item dates. Please try again.");
    }
  }, [loadWorkItems]);

  const handleSaveWorkItem = useCallback(async (updatedWorkItem: WorkItem) => {
    try {
      await workItemService.updateWorkItemDates(
        updatedWorkItem.id,
        updatedWorkItem.startDate,
        updatedWorkItem.targetDate
      );
      await loadWorkItems();
    } catch (err: any) {
      console.error("Error saving work item:", err);
      throw err;
    }
  }, [loadWorkItems]);

  const handleCloseDetails = useCallback(() => {
    setSelectedWorkItem(null);
  }, []);

  const handleFiltersChange = useCallback((newFilters: GanttFilters) => {
    setFilters(newFilters);
    // Save to current board if one is selected
    if (currentBoardId) {
      const board = savedBoardsService.getBoard(currentBoardId);
      if (board) {
        savedBoardsService.saveBoard({
          ...board,
          filters: newFilters
        });
      }
    }
  }, [currentBoardId]);

  const handleZoomChange = useCallback((newZoom: ZoomLevel) => {
    setZoom(newZoom);
    // Save to current board if one is selected
    if (currentBoardId) {
      const board = savedBoardsService.getBoard(currentBoardId);
      if (board) {
        savedBoardsService.saveBoard({
          ...board,
          zoom: newZoom
        });
      }
    }
  }, [currentBoardId]);

  const handleGroupByChange = useCallback((newGroupBy: GroupByOption) => {
    setGroupBy(newGroupBy);
    // Save to current board if one is selected
    if (currentBoardId) {
      const board = savedBoardsService.getBoard(currentBoardId);
      if (board) {
        savedBoardsService.saveBoard({
          ...board,
          filters: { ...board.filters, groupBy: newGroupBy }
        });
      }
    }
  }, [currentBoardId]);

  return (
    <div className="gantt-hub-page">
      <div className="gantt-hub-header">
        <h1>Gantt Chart</h1>
        <p>Visualize work items in a timeline view</p>
      </div>

      {error && (
        <div className="error-message" onClick={() => setError(null)}>
          {error}
        </div>
      )}

      <GanttToolbar
        filters={filters}
        onFiltersChange={handleFiltersChange}
        zoom={zoom}
        onZoomChange={handleZoomChange}
        onRefresh={loadWorkItems}
        isLoading={isLoading}
        availableAreaPaths={availableAreaPaths}
        availableIterations={availableIterations}
        availableTeamMembers={availableTeamMembers}
        progressSummary={progressSummary}
        savedBoards={savedBoards.map(b => ({ id: b.id, name: b.name }))}
        currentBoardId={currentBoardId}
        onBoardSelect={handleBoardSelect}
        onSaveBoard={handleSaveBoard}
        onDeleteBoard={handleDeleteBoard}
        groupBy={groupBy}
        onGroupByChange={handleGroupByChange}
      />

      <div className="gantt-hub-content">
        <GanttChart
          items={ganttItems}
          zoom={zoom}
          onItemClick={handleItemClick}
          onItemDrag={handleItemDrag}
          isLoading={isLoading}
        />
      </div>

      {selectedWorkItem && (
        <WorkItemDetailsPanel
          workItem={selectedWorkItem}
          onClose={handleCloseDetails}
          onSave={handleSaveWorkItem}
        />
      )}
    </div>
  );
};

export default GanttHub;
