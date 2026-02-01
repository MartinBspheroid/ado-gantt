import { GanttFilters, ZoomLevel, GanttExtensionConfig } from "../types";

/**
 * Saved Gantt Board configuration
 */
export interface SavedGanttBoard {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  filters: GanttFilters;
  zoom: ZoomLevel;
  columnWidths?: Record<string, number>;
  expandedItems?: number[];
}

/**
 * Service for managing saved Gantt board configurations
 * Ported from EPAM's ado-delivery-gantt implementation
 * 
 * Stores configurations in localStorage for extension context
 * or can be extended to use Azure DevOps user settings
 */
export class SavedBoardsService {
  private readonly STORAGE_KEY = 'ado-gantt-saved-boards';
  private readonly CURRENT_BOARD_KEY = 'ado-gantt-current-board';
  
  /**
   * Get all saved boards
   */
  getSavedBoards(): SavedGanttBoard[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading saved boards:', error);
    }
    return [];
  }
  
  /**
   * Get a specific saved board by ID
   */
  getBoard(id: string): SavedGanttBoard | null {
    const boards = this.getSavedBoards();
    return boards.find(b => b.id === id) || null;
  }
  
  /**
   * Save a new board or update existing
   */
  saveBoard(board: Omit<SavedGanttBoard, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): SavedGanttBoard {
    const boards = this.getSavedBoards();
    const now = new Date().toISOString();
    
    let savedBoard: SavedGanttBoard;
    
    if (board.id) {
      // Update existing
      const existingIndex = boards.findIndex(b => b.id === board.id);
      if (existingIndex >= 0) {
        savedBoard = {
          ...boards[existingIndex],
          ...board,
          updatedAt: now
        };
        boards[existingIndex] = savedBoard;
      } else {
        throw new Error(`Board with id ${board.id} not found`);
      }
    } else {
      // Create new
      savedBoard = {
        ...board,
        id: this.generateId(),
        createdAt: now,
        updatedAt: now
      };
      boards.push(savedBoard);
    }
    
    this.saveBoards(boards);
    return savedBoard;
  }
  
  /**
   * Delete a saved board
   */
  deleteBoard(id: string): boolean {
    const boards = this.getSavedBoards();
    const filtered = boards.filter(b => b.id !== id);
    
    if (filtered.length !== boards.length) {
      this.saveBoards(filtered);
      return true;
    }
    return false;
  }
  
  /**
   * Duplicate an existing board
   */
  duplicateBoard(id: string, newName: string): SavedGanttBoard | null {
    const board = this.getBoard(id);
    if (!board) return null;
    
    return this.saveBoard({
      name: newName,
      description: board.description,
      filters: board.filters,
      zoom: board.zoom,
      columnWidths: board.columnWidths,
      expandedItems: board.expandedItems
    });
  }
  
  /**
   * Rename a board
   */
  renameBoard(id: string, newName: string): SavedGanttBoard | null {
    const board = this.getBoard(id);
    if (!board) return null;
    
    return this.saveBoard({
      ...board,
      id: board.id,
      name: newName
    });
  }
  
  /**
   * Save current board configuration
   */
  saveCurrentBoard(boardId: string): void {
    try {
      localStorage.setItem(this.CURRENT_BOARD_KEY, boardId);
    } catch (error) {
      console.error('Error saving current board:', error);
    }
  }
  
  /**
   * Get the last used board ID
   */
  getCurrentBoardId(): string | null {
    try {
      return localStorage.getItem(this.CURRENT_BOARD_KEY);
    } catch (error) {
      console.error('Error loading current board:', error);
      return null;
    }
  }
  
  /**
   * Create a default board configuration
   */
  createDefaultBoard(): SavedGanttBoard {
    return this.saveBoard({
      name: 'Default View',
      description: 'Default Gantt board configuration',
      filters: {
        workItemTypes: ['User Story', 'Task', 'Feature'],
        states: ['New', 'Active', 'Resolved'],
        showTeamMembersOnly: false,
        teamMemberWhitelist: []
      },
      zoom: 'week'
    });
  }
  
  /**
   * Export board configuration as JSON
   */
  exportBoard(id: string): string | null {
    const board = this.getBoard(id);
    if (!board) return null;
    return JSON.stringify(board, null, 2);
  }
  
  /**
   * Import board configuration from JSON
   */
  importBoard(json: string): SavedGanttBoard | null {
    try {
      const board = JSON.parse(json) as SavedGanttBoard;
      // Generate new ID to avoid conflicts
      return this.saveBoard({
        name: `${board.name} (Imported)`,
        description: board.description,
        filters: board.filters,
        zoom: board.zoom,
        columnWidths: board.columnWidths,
        expandedItems: board.expandedItems
      });
    } catch (error) {
      console.error('Error importing board:', error);
      return null;
    }
  }
  
  /**
   * Save expanded/collapsed state of items
   */
  saveExpandedState(boardId: string, expandedItems: number[]): void {
    const board = this.getBoard(boardId);
    if (board) {
      this.saveBoard({
        ...board,
        id: boardId,
        expandedItems
      });
    }
  }
  
  /**
   * Get expanded/collapsed state of items
   */
  getExpandedState(boardId: string): number[] {
    const board = this.getBoard(boardId);
    return board?.expandedItems || [];
  }
  
  /**
   * Save column widths
   */
  saveColumnWidths(boardId: string, columnWidths: Record<string, number>): void {
    const board = this.getBoard(boardId);
    if (board) {
      this.saveBoard({
        ...board,
        id: boardId,
        columnWidths
      });
    }
  }
  
  /**
   * Get column widths
   */
  getColumnWidths(boardId: string): Record<string, number> {
    const board = this.getBoard(boardId);
    return board?.columnWidths || {};
  }
  
  private saveBoards(boards: SavedGanttBoard[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(boards));
    } catch (error) {
      console.error('Error saving boards:', error);
      throw new Error('Failed to save boards. Storage may be full.');
    }
  }
  
  private generateId(): string {
    return `board_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const savedBoardsService = new SavedBoardsService();
