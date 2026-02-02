import { SavedGanttBoard } from '../SavedBoardsService';
import { IterationInfo } from '../IterationService';

export class MockSavedBoardsService {
  private boards: SavedGanttBoard[] = [
    {
      id: 'board_1',
      name: 'Default View',
      description: 'Default board',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      filters: {
        workItemTypes: ['User Story', 'Task', 'Feature'],
        states: ['New', 'Active', 'Resolved'],
        showTeamMembersOnly: false,
        teamMemberWhitelist: []
      },
      zoom: 'week'
    }
  ];

  getSavedBoards(): SavedGanttBoard[] {
    return this.boards;
  }

  getBoard(id: string): SavedGanttBoard | null {
    return this.boards.find(b => b.id === id) || null;
  }

  saveBoard(board: any): SavedGanttBoard {
    const newBoard: SavedGanttBoard = {
      ...board,
      id: board.id || `board_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const existingIndex = this.boards.findIndex(b => b.id === newBoard.id);
    if (existingIndex >= 0) {
      this.boards[existingIndex] = newBoard;
    } else {
      this.boards.push(newBoard);
    }
    
    return newBoard;
  }

  deleteBoard(id: string): boolean {
    const initialLength = this.boards.length;
    this.boards = this.boards.filter(b => b.id !== id);
    return this.boards.length !== initialLength;
  }

  duplicateBoard(id: string, newName: string): SavedGanttBoard | null {
    const board = this.getBoard(id);
    if (!board) return null;
    return this.saveBoard({
      name: newName,
      filters: board.filters,
      zoom: board.zoom
    });
  }

  saveCurrentBoard(boardId: string): void {
    // Mock implementation
  }

  getCurrentBoardId(): string | null {
    return this.boards[0]?.id || null;
  }

  createDefaultBoard(): SavedGanttBoard {
    return this.boards[0];
  }
}

export class MockIterationService {
  private iterations: IterationInfo[] = [
    { id: 'iter_1', name: 'Sprint 1', path: 'Project\\Sprint 1', isCurrent: false },
    { id: 'iter_2', name: 'Sprint 2', path: 'Project\\Sprint 2', isCurrent: true },
    { id: 'iter_3', name: 'Sprint 3', path: 'Project\\Sprint 3', isCurrent: false }
  ];

  async initialize(): Promise<void> {
    // Mock initialization
  }

  async resolveIterationMacro(macro: string): Promise<string | null> {
    const match = macro.match(/@CurrentIteration(?:\s*([+-])\s*(\d+))?/i);
    if (!match) return macro;

    const offset = match[1] && match[2] 
      ? parseInt(match[1] + match[2], 10) 
      : 0;

    const currentIndex = this.iterations.findIndex(i => i.isCurrent);
    if (currentIndex === -1) return null;

    const targetIndex = currentIndex + offset;
    if (targetIndex < 0 || targetIndex >= this.iterations.length) {
      return null;
    }

    return this.iterations[targetIndex].path;
  }

  containsIterationMacro(value: string): boolean {
    return /@CurrentIteration/i.test(value);
  }

  async getTeamIterations(): Promise<IterationInfo[]> {
    return this.iterations;
  }

  async getCurrentIteration(): Promise<IterationInfo | null> {
    return this.iterations.find(i => i.isCurrent) || null;
  }

  async getAvailableIterationPaths(): Promise<string[]> {
    return this.iterations.map(i => i.path);
  }

  getIterationMacroOptions(): { value: string; label: string }[] {
    return [
      { value: '@CurrentIteration', label: 'Current Iteration' },
      { value: '@CurrentIteration-1', label: 'Previous Iteration' },
      { value: '@CurrentIteration+1', label: 'Next Iteration' }
    ];
  }

  clearCache(): void {
    // Mock implementation
  }
}

export const mockSavedBoardsService = new MockSavedBoardsService();
export const mockIterationService = new MockIterationService();
