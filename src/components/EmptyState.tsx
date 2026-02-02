import * as React from "react";
import "../styles/EmptyState.css";

interface EmptyStateProps {
  onRefresh?: () => void;
  onAdjustFilters?: () => void;
  isFiltered?: boolean;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  onRefresh,
  onAdjustFilters,
  isFiltered = false
}) => {
  return (
    <div 
      className="empty-state"
      role="status"
      aria-live="polite"
    >
      <div className="empty-state-icon" aria-hidden="true">
        📊
      </div>
      <h2 className="empty-state-title">
        {isFiltered ? "No work items match your filters" : "No work items found"}
      </h2>
      <p className="empty-state-message">
        {isFiltered 
          ? "Try adjusting your filters or refreshing to see more work items."
          : "Get started by creating work items with start and target dates in Azure DevOps."
        }
      </p>
      <div className="empty-state-actions">
        {isFiltered && onAdjustFilters && (
          <button 
            className="empty-state-btn empty-state-btn-secondary"
            onClick={onAdjustFilters}
            aria-label="Adjust filters"
          >
            Adjust Filters
          </button>
        )}
        {onRefresh && (
          <button 
            className="empty-state-btn empty-state-btn-primary"
            onClick={onRefresh}
            aria-label="Refresh work items"
          >
            Refresh
          </button>
        )}
      </div>
      <div className="empty-state-help">
        <p>Work items need the following to appear:</p>
        <ul>
          <li>Start Date or Target Date set</li>
          <li>Or be assigned to an iteration</li>
          <li>Not be in the "Removed" state</li>
        </ul>
      </div>
    </div>
  );
};

export default EmptyState;
