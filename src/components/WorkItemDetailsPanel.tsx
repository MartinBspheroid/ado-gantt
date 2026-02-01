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
    <div className="details-panel-overlay" onClick={onClose}>
      <div className="details-panel" onClick={e => e.stopPropagation()}>
        <div className="details-panel-header">
          <h2>Work Item {editedWorkItem.id}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="work-item-details">
          <div className="work-item-header">
            <span className="work-item-type">{editedWorkItem.type}</span>
            <span 
              className="work-item-state"
              style={{ backgroundColor: stateColor.backgroundColor, color: stateColor.color }}
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
                <label>Start Date</label>
                <input
                  type="date"
                  value={formatDateForInput(editedWorkItem.startDate)}
                  onChange={handleStartDateChange}
                  disabled={isSaving}
                />
              </div>
              <div className="form-field">
                <label>Target Date</label>
                <input
                  type="date"
                  value={formatDateForInput(editedWorkItem.targetDate)}
                  onChange={handleTargetDateChange}
                  disabled={isSaving}
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
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
            <button 
              className="link-btn"
              onClick={() => window.open(adoUrl, '_blank')}
            >
              Open in Azure DevOps
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
