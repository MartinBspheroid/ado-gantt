import { describe, it, expect, beforeEach } from 'vitest';
import { SavedBoardsService, SavedGanttBoard } from '../../services/SavedBoardsService';
import { GanttFilters, ZoomLevel } from '../../types';

describe('SavedBoardsService', () => {
  let service: SavedBoardsService;
  
  // Mock localStorage
  let localStorageMock: { [key: string]: string } = {};
  
  beforeEach(() => {
    // Clear mock storage before each test
    localStorageMock = {};
    
    // Create fresh service instance
    service = new SavedBoardsService();
    
    // Override localStorage methods
    Object.defineProperty(global, 'localStorage', {
      value: {
        getItem: (key: string) => localStorageMock[key] || null,
        setItem: (key: string, value: string) => { localStorageMock[key] = value; },
        removeItem: (key: string) => { delete localStorageMock[key]; }
      },
      writable: true
    });
  });

  describe('getSavedBoards', () => {
    it('should return empty array when no boards saved', () => {
      const boards = service.getSavedBoards();
      expect(boards).toEqual([]);
    });

    it('should return saved boards from localStorage', () => {
      const mockBoards: SavedGanttBoard[] = [
        {
          id: 'board_1',
          name: 'Test Board',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          filters: {
            workItemTypes: ['Task'],
            states: ['Active'],
            showTeamMembersOnly: false,
            teamMemberWhitelist: []
          },
          zoom: 'week'
        }
      ];
      localStorageMock['ado-gantt-saved-boards'] = JSON.stringify(mockBoards);
      
      const boards = service.getSavedBoards();
      expect(boards).toHaveLength(1);
      expect(boards[0].name).toBe('Test Board');
    });
  });

  describe('saveBoard', () => {
    it('should create new board with generated ID', () => {
      const newBoard = service.saveBoard({
        name: 'New Board',
        filters: {
          workItemTypes: ['Task'],
          states: ['Active'],
          showTeamMembersOnly: false,
          teamMemberWhitelist: []
        },
        zoom: 'month'
      });

      expect(newBoard.id).toBeDefined();
      expect(newBoard.name).toBe('New Board');
      expect(newBoard.createdAt).toBeDefined();
      expect(newBoard.updatedAt).toBeDefined();
    });

    it('should update existing board', () => {
      const board = service.saveBoard({
        name: 'Original Name',
        filters: {
          workItemTypes: ['Task'],
          states: ['Active'],
          showTeamMembersOnly: false,
          teamMemberWhitelist: []
        },
        zoom: 'week'
      });

      const updatedBoard = service.saveBoard({
        id: board.id,
        name: 'Updated Name',
        filters: board.filters,
        zoom: board.zoom
      });

      expect(updatedBoard.id).toBe(board.id);
      expect(updatedBoard.name).toBe('Updated Name');
    });

    it('should throw error when updating non-existent board', () => {
      expect(() => {
        service.saveBoard({
          id: 'non_existent',
          name: 'Test',
          filters: {
            workItemTypes: ['Task'],
            states: ['Active'],
            showTeamMembersOnly: false,
            teamMemberWhitelist: []
          },
          zoom: 'week'
        });
      }).toThrow();
    });
  });

  describe('deleteBoard', () => {
    it('should delete existing board', () => {
      const board = service.saveBoard({
        name: 'To Delete',
        filters: {
          workItemTypes: ['Task'],
          states: ['Active'],
          showTeamMembersOnly: false,
          teamMemberWhitelist: []
        },
        zoom: 'week'
      });

      const result = service.deleteBoard(board.id);
      
      expect(result).toBe(true);
      expect(service.getSavedBoards()).toHaveLength(0);
    });

    it('should return false when deleting non-existent board', () => {
      const result = service.deleteBoard('non_existent');
      expect(result).toBe(false);
    });
  });

  describe('duplicateBoard', () => {
    it('should duplicate existing board with new name', () => {
      const original = service.saveBoard({
        name: 'Original',
        filters: {
          workItemTypes: ['Task'],
          states: ['Active'],
          showTeamMembersOnly: false,
          teamMemberWhitelist: []
        },
        zoom: 'week'
      });

      const duplicate = service.duplicateBoard(original.id, 'Duplicate');
      
      expect(duplicate).not.toBeNull();
      expect(duplicate!.name).toBe('Duplicate');
      expect(duplicate!.id).not.toBe(original.id);
      expect(duplicate!.filters).toEqual(original.filters);
    });

    it('should return null when duplicating non-existent board', () => {
      const result = service.duplicateBoard('non_existent', 'Duplicate');
      expect(result).toBeNull();
    });
  });

  describe('getBoard', () => {
    it('should return board by ID', () => {
      const board = service.saveBoard({
        name: 'Test Board',
        filters: {
          workItemTypes: ['Task'],
          states: ['Active'],
          showTeamMembersOnly: false,
          teamMemberWhitelist: []
        },
        zoom: 'week'
      });

      const retrieved = service.getBoard(board.id);
      
      expect(retrieved).not.toBeNull();
      expect(retrieved!.name).toBe('Test Board');
    });

    it('should return null for non-existent board', () => {
      const result = service.getBoard('non_existent');
      expect(result).toBeNull();
    });
  });

  describe('createDefaultBoard', () => {
    it('should create default board', () => {
      // Set up localStorage to return empty array first
      localStorageMock['ado-gantt-saved-boards'] = JSON.stringify([]);
      
      const board = service.createDefaultBoard();
      
      expect(board.name).toBe('Default View');
      expect(board.filters.workItemTypes).toContain('User Story');
      expect(board.zoom).toBe('week');
      
      // Verify it was saved
      const saved = service.getSavedBoards();
      expect(saved).toHaveLength(1);
    });
  });

  describe('import/export', () => {
    it('should export board as JSON', () => {
      const board = service.saveBoard({
        name: 'Export Test',
        filters: {
          workItemTypes: ['Task'],
          states: ['Active'],
          showTeamMembersOnly: false,
          teamMemberWhitelist: []
        },
        zoom: 'week'
      });

      const exported = service.exportBoard(board.id);
      
      expect(exported).not.toBeNull();
      const parsed = JSON.parse(exported!);
      expect(parsed.name).toBe('Export Test');
    });

    it('should import board from JSON', () => {
      const board = service.saveBoard({
        name: 'Import Test',
        filters: {
          workItemTypes: ['Task'],
          states: ['Active'],
          showTeamMembersOnly: false,
          teamMemberWhitelist: []
        },
        zoom: 'week'
      });

      const exported = service.exportBoard(board.id);
      const imported = service.importBoard(exported!);
      
      expect(imported).not.toBeNull();
      expect(imported!.name).toBe('Import Test (Imported)');
    });

    it('should return null for invalid JSON', () => {
      const result = service.importBoard('invalid json');
      expect(result).toBeNull();
    });
  });

  describe('current board tracking', () => {
    it('should save and retrieve current board ID', () => {
      service.saveCurrentBoard('board_123');
      expect(service.getCurrentBoardId()).toBe('board_123');
    });

    it('should return null when no current board', () => {
      expect(service.getCurrentBoardId()).toBeNull();
    });
  });
});
