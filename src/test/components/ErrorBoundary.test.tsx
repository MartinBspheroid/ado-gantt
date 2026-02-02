import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary } from '../../components/ErrorBoundary';

// Component that throws an error
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

describe('ErrorBoundary', () => {
  const originalConsoleError = console.error;
  
  beforeEach(() => {
    // Suppress console.error for expected errors
    console.error = vi.fn();
  });
  
  afterEach(() => {
    console.error = originalConsoleError;
  });

  it('should render children when there is no error', () => {
    render(
      <ErrorBoundary>
        <div data-testid="child">Child content</div>
      </ErrorBoundary>
    );
    
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('should render error UI when child throws', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );
    
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Try Again')).toBeInTheDocument();
    expect(screen.getByText('Reload Page')).toBeInTheDocument();
  });

  it('should call onReset when Try Again button is clicked', () => {
    const onReset = vi.fn();
    
    render(
      <ErrorBoundary onReset={onReset}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );
    
    const tryAgainBtn = screen.getByText('Try Again');
    fireEvent.click(tryAgainBtn);
    
    expect(onReset).toHaveBeenCalledTimes(1);
  });

  it('should have correct ARIA attributes', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );
    
    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveAttribute('aria-live', 'assertive');
  });

  it('should show error details in development mode', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );
    
    expect(screen.getByText('Error Details (Development Only)')).toBeInTheDocument();
    
    process.env.NODE_ENV = originalEnv;
  });

  it('should not show error details in production mode', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );
    
    expect(screen.queryByText('Error Details (Development Only)')).not.toBeInTheDocument();
    
    process.env.NODE_ENV = originalEnv;
  });
});
