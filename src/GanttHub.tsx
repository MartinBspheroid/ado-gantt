import * as React from "react";
import { useEffect, useState, useCallback, useRef } from "react";
import * as SDK from "azure-devops-extension-sdk";
import { 
  WorkItem, 
  GanttItem, 
  GanttFilters, 
  ZoomLevel,
  GroupByOption,
  ProgressSummary,
  ErrorDetails
} from "./types";
import { 
  workItemService, 
  ganttDataService, 
  progressCalculationService,
  savedBoardsService,
  SavedGanttBoard,
  iterationService
} from "./services";
import { GanttToolbar, GanttChart, WorkItemDetailsPanel, ExportControls, EmptyState } from "./components";
import "./styles/GanttHub.css";

// Debounce helper
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

export const GanttHub: React.FC = () => {
  const [workItems, setWorkItems] = useState<WorkItem[]>([]);
  const [ganttItems, setGanttItems] = useState<GanttItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ErrorDetails | null>(null);
  const [user, setUser] = useState<any>(null);
  
  const [selectedWorkItem, setSelectedWorkItem] = useState<WorkItem | null>(null);
  
  const [filters, setFilters] = useState<GanttFilters>({
    workItemTypes: ['User Story', 'Task', 'Feature'],
    states: ['New', 'Active', 'Resolved'],
    showTeamMembersOnly: false,
    teamMemberWhitelist: [],
    groupBy: 'none'
  });
  
  // Debounce filter changes to prevent rapid re-querying
  const debouncedFilters = useDebounce(filters, 300);
  
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
  
  // AbortController for cancelling in-flight requests
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Ref for export functionality
  const exportTargetRef = useRef<HTMLDivElement>(null);

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
        setError({
          type: 'unknown',
          message: 'Failed to initialize extension. Please refresh the page.',
          userAction: 'Refresh the page to try again.'
        });
      }
    };

    init();
  }, []);

  // Load work items when filters change
  const loadWorkItems = useCallback(async () => {
    // Cancel any pending requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();
    
    setIsLoading(true);
    setError(null);

    try {
      // Resolve any iteration macros in filters
      let resolvedFilters = { ...debouncedFilters };
      if (debouncedFilters.iterationPath && iterationService.containsIterationMacro(debouncedFilters.iterationPath)) {
        const resolvedPath = await iterationService.resolveIterationMacro(debouncedFilters.iterationPath);
        if (resolvedPath) {
          resolvedFilters.iterationPath = resolvedPath;
        }
      }
      
      const items = await workItemService.queryWorkItems(resolvedFilters, abortControllerRef.current.signal);
      
      // Check if request was cancelled
      if (abortControllerRef.current.signal.aborted) {
        return;
      }
      
      setWorkItems(items);
      
      // Apply grouping
      const processedItems = applyGrouping(items, groupBy);
      
      const ganttData = ganttDataService.convertToGanttItems(processedItems);
      setGanttItems(ganttData);
      
      // Calculate progress summary
      const summary = progressCalculationService.calculateProgressSummary(ganttData);
      setProgressSummary(summary);
    } catch (err: any) {
      // Don't show error for aborted requests
      if (err.name === 'AbortError' || err.message?.includes('cancelled')) {
        return;
      }
      
      console.error("Error loading work items:", err);
      
      // Parse structured error details
      let errorDetails: ErrorDetails;
      try {
        errorDetails = JSON.parse(err.message);
      } catch {
        errorDetails = {
          type: 'unknown',
          message: err.message || 'Failed to load work items',
          userAction: 'Please try refreshing the page.'
        };
      }
      
      setError(errorDetails);
    } finally {
      setIsLoading(false);
    }
  }, [debouncedFilters, groupBy]);

  useEffect(() => {
    if (user) {
      loadWorkItems();
    }
  }, [debouncedFilters, groupBy, user, loadWorkItems]);

  // Cleanup abort controller on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

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
      setError({
        type: 'unknown',
        message: 'Failed to update work item dates. Please try again.',
        userAction: 'Check your permissions and try again.'
      });
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
        <div>
          <h1>Gantt Chart</h1>
          <p>Visualize work items in a timeline view</p>
        </div>
        <ExportControls targetRef={exportTargetRef} filename={`gantt-${currentBoardId || 'default'}`} />
      </div>

      {error && (
        <div 
          className={`error-message error-message--${error.type}`} 
          role="alert" 
          aria-live="polite"
        >
          <div className="error-message-content">
            <strong>{error.message}</strong>
            {error.userAction && (
              <p className="error-message-action">{error.userAction}</p>
            )}
            {error.helpLink && (
              <a 
                href={error.helpLink} 
                target="_blank" 
                rel="noopener noreferrer"
                className="error-message-link"
              >
                Learn more →
              </a>
            )}
          </div>
          <button 
            className="error-message-close" 
            onClick={() => setError(null)}
            aria-label="Dismiss error"
          >
            ×
          </button>
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

      <div className="gantt-hub-content" ref={exportTargetRef}>
        {!isLoading && ganttItems.length === 0 ? (
          <EmptyState 
            onRefresh={loadWorkItems}
            isFiltered={
              filters.workItemTypes.length > 0 || 
              filters.states.length > 0 || 
              filters.areaPath !== undefined
            }
          />
        ) : (
          <GanttChart
            items={ganttItems}
            zoom={zoom}
            onItemClick={handleItemClick}
            onItemDrag={handleItemDrag}
            isLoading={isLoading}
          />
        )}
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
