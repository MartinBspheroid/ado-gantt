import * as React from "react";
import { GroupByOption } from "../types";
import "../styles/GroupBySelector.css";

interface GroupBySelectorProps {
  groupBy: GroupByOption;
  onGroupByChange: (groupBy: GroupByOption) => void;
}

const GROUP_BY_OPTIONS: { id: GroupByOption; label: string }[] = [
  { id: 'none', label: 'No Grouping' },
  { id: 'assignedTo', label: 'Assigned To' },
  { id: 'type', label: 'Work Item Type' },
  { id: 'state', label: 'State' },
  { id: 'iteration', label: 'Iteration' }
];

export const GroupBySelector: React.FC<GroupBySelectorProps> = ({
  groupBy,
  onGroupByChange
}) => {
  return (
    <div className="group-by-selector">
      <label>Group by:</label>
      <select 
        value={groupBy}
        onChange={(e) => onGroupByChange(e.target.value as GroupByOption)}
        className="group-by-select"
      >
        {GROUP_BY_OPTIONS.map(option => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default GroupBySelector;
