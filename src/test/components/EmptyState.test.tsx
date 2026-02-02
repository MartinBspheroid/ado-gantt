import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EmptyState } from '../../components/EmptyState';

describe('EmptyState', () => {
  it('should render empty state with default message', () => {
    render(<EmptyState />);
    
    expect(screen.getByText('No work items found')).toBeInTheDocument();
    expect(screen.getByText(/Get started by creating work items/)).toBeInTheDocument();
  });

  it('should render filtered message when isFiltered is true', () => {
    render(<EmptyState isFiltered={true} />);
    
    expect(screen.getByText('No work items match your filters')).toBeInTheDocument();
    expect(screen.getByText(/Try adjusting your filters/)).toBeInTheDocument();
  });

  it('should call onRefresh when refresh button is clicked', () => {
    const onRefresh = vi.fn();
    render(<EmptyState onRefresh={onRefresh} />);
    
    const refreshBtn = screen.getByLabelText('Refresh work items');
    fireEvent.click(refreshBtn);
    
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  it('should show adjust filters button when isFiltered is true', () => {
    const onAdjustFilters = vi.fn();
    render(<EmptyState isFiltered={true} onAdjustFilters={onAdjustFilters} />);
    
    const adjustBtn = screen.getByLabelText('Adjust filters');
    expect(adjustBtn).toBeInTheDocument();
    
    fireEvent.click(adjustBtn);
    expect(onAdjustFilters).toHaveBeenCalledTimes(1);
  });

  it('should show help text with requirements', () => {
    render(<EmptyState />);
    
    expect(screen.getByText('Work items need the following to appear:')).toBeInTheDocument();
    expect(screen.getByText('Start Date or Target Date set')).toBeInTheDocument();
    expect(screen.getByText('Or be assigned to an iteration')).toBeInTheDocument();
    expect(screen.getByText('Not be in the "Removed" state')).toBeInTheDocument();
  });

  it('should have correct ARIA attributes', () => {
    render(<EmptyState />);
    
    const status = screen.getByRole('status');
    expect(status).toBeInTheDocument();
    expect(status).toHaveAttribute('aria-live', 'polite');
  });
});
