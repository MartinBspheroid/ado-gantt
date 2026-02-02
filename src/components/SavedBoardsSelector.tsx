import * as React from "react";
import { SavedGanttBoard } from "../services/SavedBoardsService";
import "../styles/SavedBoardsSelector.css";

interface SavedBoardsSelectorProps {
  boards: { id: string; name: string }[];
  currentBoardId: string | null;
  onSelect: (boardId: string) => void;
  onSave: (name: string) => void;
  onDelete: (boardId: string) => void;
  onDuplicate: (boardId: string, newName: string) => void;
}

export const SavedBoardsSelector: React.FC<SavedBoardsSelectorProps> = ({
  boards,
  currentBoardId,
  onSelect,
  onSave,
  onDelete,
  onDuplicate
}) => {
  const [isEditing, setIsEditing] = React.useState(false);
  const [newBoardName, setNewBoardName] = React.useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState<string | null>(null);
  const [showDuplicateInput, setShowDuplicateInput] = React.useState<string | null>(null);
  const [duplicateName, setDuplicateName] = React.useState("");
  
  const handleSaveNew = () => {
    if (newBoardName.trim()) {
      onSave(newBoardName.trim());
      setNewBoardName("");
      setIsEditing(false);
    }
  };
  
  const handleDuplicate = (boardId: string) => {
    if (duplicateName.trim()) {
      onDuplicate(boardId, duplicateName.trim());
      setDuplicateName("");
      setShowDuplicateInput(null);
    }
  };
  
  const currentBoard = boards.find(b => b.id === currentBoardId);
  
  return (
    <div className="saved-boards-selector">
      <div className="saved-boards-dropdown">
        <select 
          value={currentBoardId || ""}
          onChange={(e) => onSelect(e.target.value)}
          className="board-select"
        >
          <option value="">-- Select Board --</option>
          {boards.map(board => (
            <option key={board.id} value={board.id}>
              {board.name}
            </option>
          ))}
        </select>
        
        <button 
          className="board-btn new-btn"
          onClick={() => setIsEditing(true)}
          title="Save current view as new board"
        >
          + New
        </button>
      </div>
      
      {isEditing && (
        <div className="board-editor-overlay">
          <div className="board-editor">
            <h4>Save New Board</h4>
            <input
              type="text"
              value={newBoardName}
              onChange={(e) => setNewBoardName(e.target.value)}
              placeholder="Board name"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveNew();
                if (e.key === 'Escape') setIsEditing(false);
              }}
            />
            <div className="board-editor-actions">
              <button onClick={handleSaveNew} className="save-btn">Save</button>
              <button onClick={() => setIsEditing(false)} className="cancel-btn">Cancel</button>
            </div>
          </div>
        </div>
      )}
      
      {currentBoard && (
        <div className="board-actions">
          <button 
            className="board-btn"
            onClick={() => setShowDuplicateInput(currentBoardId)}
            title="Duplicate board"
          >
            Copy
          </button>
          <button 
            className="board-btn delete-btn"
            onClick={() => setShowDeleteConfirm(currentBoardId)}
            title="Delete board"
          >
            Delete
          </button>
        </div>
      )}
      
      {showDeleteConfirm && (
        <div className="board-editor-overlay">
          <div className="board-editor">
            <h4>Delete Board?</h4>
            <p>Are you sure you want to delete "{currentBoard?.name}"?</p>
            <div className="board-editor-actions">
              <button 
                onClick={() => {
                  onDelete(showDeleteConfirm);
                  setShowDeleteConfirm(null);
                }} 
                className="delete-confirm-btn"
              >
                Delete
              </button>
              <button 
                onClick={() => setShowDeleteConfirm(null)} 
                className="cancel-btn"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      
      {showDuplicateInput && (
        <div className="board-editor-overlay">
          <div className="board-editor">
            <h4>Duplicate Board</h4>
            <input
              type="text"
              value={duplicateName}
              onChange={(e) => setDuplicateName(e.target.value)}
              placeholder="New board name"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleDuplicate(showDuplicateInput);
                if (e.key === 'Escape') setShowDuplicateInput(null);
              }}
            />
            <div className="board-editor-actions">
              <button onClick={() => handleDuplicate(showDuplicateInput)} className="save-btn">Duplicate</button>
              <button onClick={() => setShowDuplicateInput(null)} className="cancel-btn">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SavedBoardsSelector;
