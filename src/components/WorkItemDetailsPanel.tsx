import * as React from "react";
import { useState, useEffect } from "react";
import { WorkItemDetailsPanelProps, WorkItem, STATE_COLORS } from "../types";
import "../styles/WorkItemDetailsPanel.css";

export const WorkItemDetailsPanel: React.FC<WorkItemDetailsPanelProps> = ({
  workItem,
  onClose,
  onSave
}) => {
  const [editedWorkItem, setEditedWorkItem] = useState<WorkItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (workItem) {
      setEditedWorkItem({ ...workItem });
    }
  }, [workItem]);

  if (!workItem || !editedWorkItem) {
    return null;
  }

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = e.target.value ? new Date(e.target.value) : undefined;
    setEditedWorkItem(prev => prev ? { ...prev, startDate: date } : null);
  };

  const handleTargetDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = e.target.value ? new Date(e.target.value) : undefined;
    setEditedWorkItem(prev => prev ? { ...prev, targetDate: date } : null);
  };

  const handleSave = async () => {
    if (!editedWorkItem) return;
    
    setIsSaving(true);
    try {
      await onSave(editedWorkItem);
      onClose();
    } catch (error) {
      console.error("Error saving work item:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const stateColor = STATE_COLORS[editedWorkItem.state] || STATE_COLORS['New'];
  const adoUrl = `${window.location.origin}/${editedWorkItem.areaPath.split('\\')[0]}/_workitems/edit/${editedWorkItem.id}`;

  const formatDateForInput = (date?: Date) => {
    if (!date) return '';
    return date.toISOString().split('T')[0];
  };

  return (
    <div 
      className="details-panel-overlay" 
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="details-panel-title"
    >
      <div 
        className="details-panel" 
        onClick={e => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            onClose();
          }
        }}
        tabIndex={-1}
      >
        <div className="details-panel-header">
          <h2 id="details-panel-title">Work Item {editedWorkItem.id}</h2>
          <button 
            className="close-btn" 
            onClick={onClose}
            aria-label="Close details panel"
          >
            ×
          </button>
        </div>

        <div className="work-item-details">
          <div className="work-item-header">
            <span className="work-item-type">{editedWorkItem.type}</span>
            <span 
              className="work-item-state"
              style={{ backgroundColor: stateColor.backgroundColor, color: stateColor.color }}
              role="status"
              aria-label={`State: ${editedWorkItem.state}`}
            >
              {editedWorkItem.state}
            </span>
          </div>

          <div className="details-section">
            <h3>Title</h3>
            <p className="work-item-title">{editedWorkItem.title}</p>
          </div>

          <div className="details-section">
            <h3>Schedule</h3>
            <div className="form-row">
              <div className="form-field">
                <label htmlFor="start-date">Start Date</label>
                <input
                  id="start-date"
                  type="date"
                  value={formatDateForInput(editedWorkItem.startDate)}
                  onChange={handleStartDateChange}
                  disabled={isSaving}
                  aria-label="Start date"
                />
              </div>
              <div className="form-field">
                <label htmlFor="target-date">Target Date</label>
                <input
                  id="target-date"
                  type="date"
                  value={formatDateForInput(editedWorkItem.targetDate)}
                  onChange={handleTargetDateChange}
                  disabled={isSaving}
                  aria-label="Target date"
                />
              </div>
            </div>
          </div>

          <div className="details-section">
            <h3>Assignment</h3>
            <div className="info-row">
              <span className="info-label">Assigned To:</span>
              <span className="info-value">
                {editedWorkItem.assignedTo?.displayName || 'Unassigned'}
              </span>
            </div>
            <div className="info-row">
              <span className="info-label">Area Path:</span>
              <span className="info-value">{editedWorkItem.areaPath}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Iteration:</span>
              <span className="info-value">{editedWorkItem.iterationPath}</span>
            </div>
          </div>

          <div className="details-actions">
            <button 
              className="save-btn"
              onClick={handleSave}
              disabled={isSaving}
              aria-label={isSaving ? 'Saving changes' : 'Save changes'}
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
            <button 
              className="link-btn"
              onClick={() => window.open(adoUrl, '_blank')}
              aria-label="Open work item in Azure DevOps"
            >
              Open in Azure DevOps
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
