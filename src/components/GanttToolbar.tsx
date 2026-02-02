import * as React from "react";
import { GanttToolbarProps, ZoomLevel, WorkItemType, WorkItemState, GroupByOption } from "../types";
import { SavedBoardsSelector } from "./SavedBoardsSelector";
import { GroupBySelector } from "./GroupBySelector";
import { ProgressSummary } from "./ProgressSummary";
import { ThemeToggle } from "./ThemeToggle";
import "../styles/GanttToolbar.css";

const WORK_ITEM_TYPES: { id: WorkItemType; text: string }[] = [
  { id: 'Epic', text: 'Epic' },
  { id: 'Feature', text: 'Feature' },
  { id: 'User Story', text: 'User Story' },
  { id: 'Task', text: 'Task' },
  { id: 'Bug', text: 'Bug' }
];

const STATES: { id: WorkItemState; text: string }[] = [
  { id: 'New', text: 'New' },
  { id: 'Active', text: 'Active' },
  { id: 'Resolved', text: 'Resolved' },
  { id: 'Closed', text: 'Closed' }
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
  availableIterations,
  progressSummary,
  savedBoards,
  currentBoardId,
  onBoardSelect,
  onSaveBoard,
  onDeleteBoard,
  groupBy,
  onGroupByChange
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
      {/* Saved Boards Section */}
      {savedBoards && onBoardSelect && onSaveBoard && onDeleteBoard && (
        <div className="toolbar-section toolbar-saved-boards">
          <SavedBoardsSelector
            boards={savedBoards}
            currentBoardId={currentBoardId || null}
            onSelect={onBoardSelect}
            onSave={onSaveBoard}
            onDelete={onDeleteBoard}
            onDuplicate={(id, name) => {
              // Duplicate logic will be handled by parent
              const board = savedBoards.find(b => b.id === id);
              if (board) {
                onSaveBoard(name);
              }
            }}
          />
        </div>
      )}

      {/* Progress Summary */}
      {progressSummary && <ProgressSummary summary={progressSummary} />}

      <div className="toolbar-section toolbar-filters">
        <div className="filter-group">
          <label id="type-filter-label">Types:</label>
          <div className="filter-buttons" role="group" aria-labelledby="type-filter-label">
            {WORK_ITEM_TYPES.map(type => (
              <button
                key={type.id}
                className={`filter-btn ${filters.workItemTypes.includes(type.id) ? 'active' : ''}`}
                onClick={() => handleWorkItemTypeToggle(type.id)}
                disabled={isLoading}
                aria-pressed={filters.workItemTypes.includes(type.id)}
                aria-label={`Filter by ${type.text}`}
              >
                {type.text}
              </button>
            ))}
          </div>
        </div>

        <div className="filter-group">
          <label id="state-filter-label">States:</label>
          <div className="filter-buttons" role="group" aria-labelledby="state-filter-label">
            {STATES.map(state => (
              <button
                key={state.id}
                className={`filter-btn ${filters.states.includes(state.id) ? 'active' : ''}`}
                onClick={() => handleStateToggle(state.id)}
                disabled={isLoading}
                aria-pressed={filters.states.includes(state.id)}
                aria-label={`Filter by ${state.text} state`}
              >
                {state.text}
              </button>
            ))}
          </div>
        </div>

        {/* Group By Selector */}
        {groupBy !== undefined && onGroupByChange && (
          <div className="filter-group">
            <GroupBySelector
              groupBy={groupBy}
              onGroupByChange={onGroupByChange}
            />
          </div>
        )}
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
                aria-pressed={zoom === level.id}
                aria-label={`Zoom to ${level.text.toLowerCase()} view`}
              >
                {level.text}
              </button>
            ))}
          </div>
        </div>

        <ThemeToggle disabled={isLoading} />

        <button 
          className="refresh-btn"
          onClick={onRefresh}
          disabled={isLoading}
          aria-label="Refresh work items"
        >
          {isLoading ? 'Loading...' : 'Refresh'}
        </button>
      </div>
    </div>
  );
};
