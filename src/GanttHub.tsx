import * as React from "react";
import { useEffect, useState, useCallback } from "react";
import * as SDK from "azure-devops-extension-sdk";
import {
  WorkItem,
  GanttItem,
  GanttLink,
  GanttFilters,
  ZoomLevel
} from "./types";
import { workItemService, ganttDataService } from "./services";
import { GanttToolbar, GanttChart, WorkItemDetailsPanel } from "./components";
import "./styles/GanttHub.css";

export const GanttHub: React.FC = () => {
  const [workItems, setWorkItems] = useState<WorkItem[]>([]);
  const [ganttItems, setGanttItems] = useState<GanttItem[]>([]);
  const [ganttLinks, setGanttLinks] = useState<GanttLink[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  
  const [selectedWorkItem, setSelectedWorkItem] = useState<WorkItem | null>(null);
  
  const [filters, setFilters] = useState<GanttFilters>({
    // Support both Agile and Basic process templates
    workItemTypes: ['Epic', 'Feature', 'User Story', 'Task', 'Bug', 'Issue'],
    states: ['New', 'Active', 'Resolved', 'To Do', 'Doing', 'Done'],
    showTeamMembersOnly: false,
    teamMemberWhitelist: []
  });
  
  const [zoom, setZoom] = useState<ZoomLevel>('week');
  
  const [availableAreaPaths, setAvailableAreaPaths] = useState<string[]>([]);
  const [availableIterations, setAvailableIterations] = useState<string[]>([]);
  const [availableTeamMembers, setAvailableTeamMembers] = useState<{ id: string; displayName: string }[]>([]);

  const [initialized, setInitialized] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>("Starting...");

  useEffect(() => {
    const init = async () => {
      try {
        setDebugInfo("SDK.init()...");
        await SDK.init();
        setDebugInfo("SDK.ready()...");
        await SDK.ready();
        setDebugInfo("SDK ready, getting user...");

        const currentUser = SDK.getUser();
        setUser(currentUser);
        setDebugInfo(`User: ${currentUser?.displayName || 'unknown'}`);

        setDebugInfo("Initializing workItemService...");
        await workItemService.initialize();
        setDebugInfo("Service initialized, ready to load");
        setInitialized(true);
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);
        setDebugInfo(`Init error: ${errMsg}`);
        setError(`Failed to initialize: ${errMsg}`);
        setIsLoading(false);
      }
    };

    init();
  }, []);

  const loadWorkItems = useCallback(async () => {
    setDebugInfo("Loading work items...");
    setIsLoading(true);
    setError(null);

    try {
      setDebugInfo("Querying work items...");
      const items = await workItemService.queryWorkItems(filters);
      setDebugInfo(`Got ${items.length} work items`);
      setWorkItems(items);

      const ganttData = ganttDataService.convertToGanttData(items);
      setDebugInfo(`Converted to ${ganttData.items.length} Gantt items, ${ganttData.links.length} links`);
      setGanttItems(ganttData.items);
      setGanttLinks(ganttData.links);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      setDebugInfo(`Load error: ${errMsg}`);
      setError(`Failed to load: ${errMsg}`);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    if (initialized) {
      console.log("[GanttHub] Initialized, loading work items...");
      loadWorkItems();
    }
  }, [filters, initialized, loadWorkItems]);

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
  }, []);

  const handleZoomChange = useCallback((newZoom: ZoomLevel) => {
    setZoom(newZoom);
  }, []);

  return (
    <div className="gantt-hub-page">
      <div className="gantt-hub-header">
        <div className="gantt-hub-title">
          <h1>Gantt Chart</h1>
          <span className="gantt-hub-subtitle">Timeline view of work items</span>
        </div>
        <div className="gantt-hub-stats">
          <span className="stat-item">{ganttItems.length} items</span>
        </div>
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
      />

      <div className="gantt-hub-content">
        <GanttChart
          items={ganttItems}
          links={ganttLinks}
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
