import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { GanttChart } from '../../components/GanttChart';
import { GanttItem, ZoomLevel } from '../../types';

// Mock dhtmlx-gantt before imports
vi.mock('dhtmlx-gantt', () => ({
  gantt: {
    init: vi.fn(),
    clearAll: vi.fn(),
    parse: vi.fn(),
    attachEvent: vi.fn().mockReturnValue(1),
    getTask: vi.fn(),
    render: vi.fn(),
    config: {
      columns: [],
      scale_unit: 'week',
      step: 1,
      date_scale: '',
      drag_move: false,
      drag_resize: false,
      drag_progress: false,
      row_height: 0,
      bar_height: 0,
      min_column_width: 0
    },
    templates: {
      task_class: vi.fn()
    }
  }
}));

describe('GanttChart', () => {
  const mockItems: GanttItem[] = [
    {
      id: 1,
      text: 'Test Task 1',
      start_date: new Date('2026-01-01'),
      end_date: new Date('2026-01-10'),
      duration: 9,
      progress: 50,
      parent: 0,
      type: 'task',
      open: true,
      workItem: {
        id: 1,
        title: 'Test Task 1',
        type: 'Task',
        state: 'Active',
        areaPath: 'Test',
        iterationPath: 'Sprint 1',
        startDate: new Date('2026-01-01'),
        targetDate: new Date('2026-01-10'),
        createdDate: new Date(),
        changedDate: new Date(),
        childrenIds: [],
        priority: 1,
        tags: []
      },
      color: '#fff4e5',
      textColor: '#ff8c00'
    }
  ];

  const defaultProps = {
    items: mockItems,
    zoom: 'week' as ZoomLevel,
    onItemClick: vi.fn(),
    onItemDrag: vi.fn(),
    onItemResize: vi.fn(),
    isLoading: false
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Rendering', () => {
    it('should render gantt container', () => {
      const { container } = render(<GanttChart {...defaultProps} />);
      expect(container.querySelector('.gantt-chart-container')).toBeInTheDocument();
    });

    it('should show loading overlay when loading', () => {
      render(<GanttChart {...defaultProps} isLoading={true} />);
      expect(screen.getByText('Loading Gantt chart...')).toBeInTheDocument();
    });

    it('should not show loading overlay when not loading', () => {
      render(<GanttChart {...defaultProps} isLoading={false} />);
      expect(screen.queryByText('Loading Gantt chart...')).not.toBeInTheDocument();
    });
  });

  describe('CSS Classes', () => {
    it('should apply correct CSS classes to container', () => {
      const { container } = render(<GanttChart {...defaultProps} />);
      const ganttContainer = container.querySelector('.gantt-chart-container');
      expect(ganttContainer).toBeInTheDocument();
    });

    it('should apply loading overlay class when loading', () => {
      const { container } = render(<GanttChart {...defaultProps} isLoading={true} />);
      const overlay = container.querySelector('.gantt-loading-overlay');
      expect(overlay).toBeInTheDocument();
    });
  });

  describe('Props', () => {
    it('should accept items prop', () => {
      const { container } = render(<GanttChart {...defaultProps} items={mockItems} />);
      expect(container.querySelector('.gantt-chart-container')).toBeInTheDocument();
    });

    it('should accept empty items array', () => {
      const { container } = render(<GanttChart {...defaultProps} items={[]} />);
      expect(container.querySelector('.gantt-chart-container')).toBeInTheDocument();
    });

    it('should accept zoom prop', () => {
      const { container } = render(<GanttChart {...defaultProps} zoom="day" />);
      expect(container.querySelector('.gantt-chart-container')).toBeInTheDocument();
    });

    it('should accept callback props', () => {
      const onItemClick = vi.fn();
      const onItemDrag = vi.fn();
      const onItemResize = vi.fn();
      
      const { container } = render(
        <GanttChart 
          {...defaultProps} 
          onItemClick={onItemClick}
          onItemDrag={onItemDrag}
          onItemResize={onItemResize}
        />
      );
      expect(container.querySelector('.gantt-chart-container')).toBeInTheDocument();
    });
  });
});
