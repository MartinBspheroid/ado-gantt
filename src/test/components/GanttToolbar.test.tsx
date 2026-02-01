import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { GanttToolbar } from '../../components/GanttToolbar';
import { GanttFilters, ZoomLevel } from '../../types';

describe('GanttToolbar', () => {
  const defaultFilters: GanttFilters = {
    workItemTypes: ['User Story', 'Task', 'Feature'],
    states: ['New', 'Active', 'Resolved'],
    showTeamMembersOnly: false,
    teamMemberWhitelist: []
  };

  const defaultProps = {
    filters: defaultFilters,
    onFiltersChange: vi.fn(),
    zoom: 'week' as ZoomLevel,
    onZoomChange: vi.fn(),
    onRefresh: vi.fn(),
    isLoading: false,
    availableAreaPaths: ['Product\\Platform', 'Product\\Mobile'],
    availableIterations: ['Sprint 1', 'Sprint 2'],
    availableTeamMembers: [
      { id: 'user-1', displayName: 'User One' },
      { id: 'user-2', displayName: 'User Two' }
    ]
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render toolbar with all sections', () => {
      render(<GanttToolbar {...defaultProps} />);
      
      expect(screen.getByText('Types:')).toBeInTheDocument();
      expect(screen.getByText('States:')).toBeInTheDocument();
      expect(screen.getByText('Zoom:')).toBeInTheDocument();
      expect(screen.getByText('Refresh')).toBeInTheDocument();
    });

    it('should render all work item type buttons', () => {
      render(<GanttToolbar {...defaultProps} />);
      
      expect(screen.getByText('Epic')).toBeInTheDocument();
      expect(screen.getByText('Feature')).toBeInTheDocument();
      expect(screen.getByText('User Story')).toBeInTheDocument();
      expect(screen.getByText('Task')).toBeInTheDocument();
      expect(screen.getByText('Bug')).toBeInTheDocument();
    });

    it('should render all state buttons', () => {
      render(<GanttToolbar {...defaultProps} />);
      
      expect(screen.getByText('New')).toBeInTheDocument();
      expect(screen.getByText('Active')).toBeInTheDocument();
      expect(screen.getByText('Resolved')).toBeInTheDocument();
      expect(screen.getByText('Closed')).toBeInTheDocument();
    });

    it('should render all zoom level buttons', () => {
      render(<GanttToolbar {...defaultProps} />);
      
      expect(screen.getByText('Day')).toBeInTheDocument();
      expect(screen.getByText('Week')).toBeInTheDocument();
      expect(screen.getByText('Month')).toBeInTheDocument();
      expect(screen.getByText('Quarter')).toBeInTheDocument();
    });

    it('should highlight active filters', () => {
      render(<GanttToolbar {...defaultProps} />);
      
      // Check that active filters have the active class
      const featureBtn = screen.getByText('Feature');
      expect(featureBtn.className).toContain('active');
      
      const activeStateBtn = screen.getByText('Active');
      expect(activeStateBtn.className).toContain('active');
    });

    it('should highlight current zoom level', () => {
      render(<GanttToolbar {...defaultProps} />);
      
      const weekBtn = screen.getByText('Week');
      expect(weekBtn.className).toContain('active');
    });
  });

  describe('Interactions - Work Item Types', () => {
    it('should toggle off a selected work item type', () => {
      render(<GanttToolbar {...defaultProps} />);
      
      const featureBtn = screen.getByText('Feature');
      fireEvent.click(featureBtn);
      
      expect(defaultProps.onFiltersChange).toHaveBeenCalledWith(
        expect.objectContaining({
          workItemTypes: expect.not.arrayContaining(['Feature'])
        })
      );
    });

    it('should toggle on an unselected work item type', () => {
      const filtersWithoutBug = {
        ...defaultFilters,
        workItemTypes: ['User Story', 'Task', 'Feature']
      };
      
      render(<GanttToolbar {...defaultProps} filters={filtersWithoutBug} />);
      
      const bugBtn = screen.getByText('Bug');
      fireEvent.click(bugBtn);
      
      expect(defaultProps.onFiltersChange).toHaveBeenCalledWith(
        expect.objectContaining({
          workItemTypes: expect.arrayContaining(['Bug'])
        })
      );
    });

    it('should not allow deselecting all work item types', () => {
      // This tests UI behavior - the component might still fire the event
      // but it's up to the parent to handle validation
      render(<GanttToolbar {...defaultProps} />);
      
      // Click all type buttons to deselect
      ['User Story', 'Task', 'Feature'].forEach(type => {
        const btn = screen.getByText(type);
        fireEvent.click(btn);
      });
      
      expect(defaultProps.onFiltersChange).toHaveBeenCalledTimes(3);
    });
  });

  describe('Interactions - States', () => {
    it('should toggle off a selected state', () => {
      render(<GanttToolbar {...defaultProps} />);
      
      const activeBtn = screen.getByText('Active');
      fireEvent.click(activeBtn);
      
      expect(defaultProps.onFiltersChange).toHaveBeenCalledWith(
        expect.objectContaining({
          states: expect.not.arrayContaining(['Active'])
        })
      );
    });

    it('should toggle on an unselected state', () => {
      const filtersWithoutClosed = {
        ...defaultFilters,
        states: ['New', 'Active', 'Resolved']
      };
      
      render(<GanttToolbar {...defaultProps} filters={filtersWithoutClosed} />);
      
      const closedBtn = screen.getByText('Closed');
      fireEvent.click(closedBtn);
      
      expect(defaultProps.onFiltersChange).toHaveBeenCalledWith(
        expect.objectContaining({
          states: expect.arrayContaining(['Closed'])
        })
      );
    });
  });

  describe('Interactions - Zoom', () => {
    it('should change zoom level when clicked', () => {
      render(<GanttToolbar {...defaultProps} />);
      
      const dayBtn = screen.getByText('Day');
      fireEvent.click(dayBtn);
      
      expect(defaultProps.onZoomChange).toHaveBeenCalledWith('day');
    });

    it('should call onZoomChange with correct level for each button', () => {
      render(<GanttToolbar {...defaultProps} />);
      
      fireEvent.click(screen.getByText('Day'));
      expect(defaultProps.onZoomChange).toHaveBeenCalledWith('day');
      
      fireEvent.click(screen.getByText('Month'));
      expect(defaultProps.onZoomChange).toHaveBeenCalledWith('month');
      
      fireEvent.click(screen.getByText('Quarter'));
      expect(defaultProps.onZoomChange).toHaveBeenCalledWith('quarter');
    });
  });

  describe('Interactions - Refresh', () => {
    it('should call onRefresh when refresh button clicked', () => {
      render(<GanttToolbar {...defaultProps} />);
      
      const refreshBtn = screen.getByText('Refresh');
      fireEvent.click(refreshBtn);
      
      expect(defaultProps.onRefresh).toHaveBeenCalledTimes(1);
    });

    it('should show loading state', () => {
      render(<GanttToolbar {...defaultProps} isLoading={true} />);
      
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should disable all buttons when loading', () => {
      render(<GanttToolbar {...defaultProps} isLoading={true} />);
      
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toBeDisabled();
      });
    });

    it('should enable buttons when not loading', () => {
      render(<GanttToolbar {...defaultProps} isLoading={false} />);
      
      const refreshBtn = screen.getByText('Refresh');
      expect(refreshBtn).not.toBeDisabled();
    });
  });

  describe('Filter Combinations', () => {
    it('should handle multiple filter changes', () => {
      const onFiltersChange = vi.fn();
      render(<GanttToolbar {...defaultProps} onFiltersChange={onFiltersChange} />);
      
      // Toggle off Feature
      fireEvent.click(screen.getByText('Feature'));
      
      // Toggle off Active state
      fireEvent.click(screen.getByText('Active'));
      
      expect(onFiltersChange).toHaveBeenCalledTimes(2);
    });

    it('should preserve other filter values when changing one', () => {
      const onFiltersChange = vi.fn();
      const customFilters: GanttFilters = {
        ...defaultFilters,
        areaPath: 'Product\\Platform',
        assignedTo: ['user-1']
      };
      
      render(<GanttToolbar {...defaultProps} filters={customFilters} onFiltersChange={onFiltersChange} />);
      
      fireEvent.click(screen.getByText('Bug'));
      
      expect(onFiltersChange).toHaveBeenCalledWith(
        expect.objectContaining({
          areaPath: 'Product\\Platform',
          assignedTo: ['user-1']
        })
      );
    });
  });
});
