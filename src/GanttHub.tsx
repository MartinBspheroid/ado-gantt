import * as React from "react";
import { useEffect, useState, useCallback } from "react";
import * as SDK from "azure-devops-extension-sdk";
import { 
  WorkItem, 
  GanttItem, 
  GanttFilters, 
  ZoomLevel 
} from "./types";
import { workItemService, ganttDataService } from "./services";
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
    teamMemberWhitelist: []
  });
  
  const [zoom, setZoom] = useState<ZoomLevel>('week');
  
  const [availableAreaPaths, setAvailableAreaPaths] = useState<string[]>([]);
  const [availableIterations, setAvailableIterations] = useState<string[]>([]);
  const [availableTeamMembers, setAvailableTeamMembers] = useState<{ id: string; displayName: string }[]>([]);

  useEffect(() => {
    const init = async () => {
      try {
        await SDK.init();
        await SDK.ready();
        
        const currentUser = SDK.getUser();
        setUser(currentUser);
        
        await workItemService.initialize();
        await loadWorkItems();
      } catch (err: any) {
        console.error("Error initializing extension:", err);
        setError("Failed to initialize extension. Please refresh the page.");
      }
    };

    init();
  }, []);

  const loadWorkItems = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const items = await workItemService.queryWorkItems(filters);
      setWorkItems(items);
      
      const ganttData = ganttDataService.convertToGanttItems(items);
      setGanttItems(ganttData);
    } catch (err: any) {
      console.error("Error loading work items:", err);
      setError("Failed to load work items. Please check your permissions and try again.");
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    if (user) {
      loadWorkItems();
    }
  }, [filters, user, loadWorkItems]);

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
