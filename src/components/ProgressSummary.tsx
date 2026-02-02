import * as React from "react";
import { ProgressSummary as ProgressSummaryType, PROGRESS_STATUS } from "../types";
import "../styles/ProgressSummary.css";

interface ProgressSummaryProps {
  summary: ProgressSummaryType;
}

export const ProgressSummary: React.FC<ProgressSummaryProps> = ({ summary }) => {
  const { notStarted, onTrack, atRisk, offTrack, done, total } = summary;
  
  if (total === 0) {
    return null;
  }
  
  const items = [
    { key: 'done', count: done, info: PROGRESS_STATUS['Done'] },
    { key: 'onTrack', count: onTrack, info: PROGRESS_STATUS['On Track'] },
    { key: 'atRisk', count: atRisk, info: PROGRESS_STATUS['At Risk'] },
    { key: 'offTrack', count: offTrack, info: PROGRESS_STATUS['Off Track'] },
    { key: 'notStarted', count: notStarted, info: PROGRESS_STATUS['Not Started'] }
  ].filter(item => item.count > 0);
  
  return (
    <div className="progress-summary">
      <span className="progress-summary-label">Status:</span>
      <div className="progress-summary-items">
        {items.map(({ key, count, info }) => (
          <div 
            key={key}
            className="progress-summary-item"
            style={{
              backgroundColor: info.backgroundColor,
              color: info.color
            }}
            title={`${info.label}: ${count} item${count !== 1 ? 's' : ''}`}
          >
            <span className="progress-summary-icon">{info.icon}</span>
            <span className="progress-summary-count">{count}</span>
          </div>
        ))}
      </div>
      <span className="progress-summary-total">({total} total)</span>
    </div>
  );
};

export default ProgressSummary;
