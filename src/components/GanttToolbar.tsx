import * as React from "react";
import { GanttToolbarProps, ZoomLevel, WorkItemType, WorkItemState } from "../types";
import "../styles/GanttToolbar.css";

// Support both Agile and Basic process templates
const WORK_ITEM_TYPES: { id: WorkItemType; text: string }[] = [
  { id: 'Epic', text: 'Epic' },
  { id: 'Feature', text: 'Feature' },
  { id: 'User Story', text: 'User Story' },
  { id: 'Task', text: 'Task' },
  { id: 'Bug', text: 'Bug' },
  { id: 'Issue', text: 'Issue' }
];

const STATES: { id: WorkItemState; text: string }[] = [
  // Agile states
  { id: 'New', text: 'New' },
  { id: 'Active', text: 'Active' },
  { id: 'Resolved', text: 'Resolved' },
  { id: 'Closed', text: 'Closed' },
  // Basic states
  { id: 'To Do', text: 'To Do' },
  { id: 'Doing', text: 'Doing' },
  { id: 'Done', text: 'Done' }
];

const ZOOM_LEVELS: { id: ZoomLevel; text: string }[] = [
  { id: 'day', text: 'Day' },
  { id: 'week', text: 'Week' },
  { id: 'month', text: 'Month' },
  { id: 'quarter', text: 'Quarter' }
];

export const GanttToolbar: React.FC<GanttToolbarProps> = ({
  filters,
  onFiltersChange,
  zoom,
  onZoomChange,
  onRefresh,
  isLoading,
  availableAreaPaths,
  availableIterations
}) => {
  const handleWorkItemTypeToggle = (typeId: WorkItemType) => {
    const currentTypes = filters.workItemTypes;
    let newTypes: WorkItemType[];
    if (currentTypes.includes(typeId)) {
      newTypes = currentTypes.filter(t => t !== typeId);
    } else {
      newTypes = [...currentTypes, typeId];
    }
    onFiltersChange({ ...filters, workItemTypes: newTypes });
  };

  const handleStateToggle = (stateId: WorkItemState) => {
    const currentStates = filters.states;
    let newStates: WorkItemState[];
    if (currentStates.includes(stateId)) {
      newStates = currentStates.filter(s => s !== stateId);
    } else {
      newStates = [...currentStates, stateId];
    }
    onFiltersChange({ ...filters, states: newStates });
  };

  return (
    <div className="gantt-toolbar">
      <div className="toolbar-section toolbar-filters">
        <div className="filter-group">
          <label>Types:</label>
          <div className="filter-buttons">
            {WORK_ITEM_TYPES.map(type => (
              <button
                key={type.id}
                className={`filter-btn ${filters.workItemTypes.includes(type.id) ? 'active' : ''}`}
                onClick={() => handleWorkItemTypeToggle(type.id)}
                disabled={isLoading}
              >
                {type.text}
              </button>
            ))}
          </div>
        </div>

        <div className="filter-group">
          <label>States:</label>
          <div className="filter-buttons">
            {STATES.map(state => (
              <button
                key={state.id}
                className={`filter-btn ${filters.states.includes(state.id) ? 'active' : ''}`}
                onClick={() => handleStateToggle(state.id)}
                disabled={isLoading}
              >
                {state.text}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="toolbar-section toolbar-actions">
        <div className="zoom-controls">
          <label>Zoom:</label>
          <div className="filter-buttons">
            {ZOOM_LEVELS.map(level => (
              <button
                key={level.id}
                className={`filter-btn ${zoom === level.id ? 'active' : ''}`}
                onClick={() => onZoomChange(level.id)}
                disabled={isLoading}
              >
                {level.text}
              </button>
            ))}
          </div>
        </div>

        <button 
          className="refresh-btn"
          onClick={onRefresh}
          disabled={isLoading}
        >
          {isLoading ? 'Loading...' : 'Refresh'}
        </button>
      </div>
    </div>
  );
};
