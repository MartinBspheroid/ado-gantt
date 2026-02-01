import * as React from "react";
import "../styles/ErrorBoundary.css";

interface Props {
  children: React.ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log error to console for debugging
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // In production, you might want to send to a logging service
    if (process.env.NODE_ENV === "production") {
      // Example: sendToErrorTracking(error, errorInfo);
    }
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  handleReload = (): void => {
    window.location.reload();
  };

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <div className="error-boundary-container" role="alert" aria-live="assertive">
          <div className="error-boundary-content">
            <div className="error-boundary-icon" aria-hidden="true">
              ⚠️
            </div>
            <h1 className="error-boundary-title">
              Something went wrong
            </h1>
            <p className="error-boundary-message">
              The Gantt Chart extension encountered an unexpected error. 
              Please try refreshing or contact support if the problem persists.
            </p>
            
            {process.env.NODE_ENV === "development" && this.state.error && (
              <details className="error-boundary-details">
                <summary>Error Details (Development Only)</summary>
                <pre className="error-boundary-stack">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}

            <div className="error-boundary-actions">
              <button 
                className="error-boundary-btn error-boundary-btn-primary"
                onClick={this.handleReset}
                aria-label="Try again"
              >
                Try Again
              </button>
              <button 
                className="error-boundary-btn error-boundary-btn-secondary"
                onClick={this.handleReload}
                aria-label="Reload page"
              >
                Reload Page
              </button>
            </div>

            <div className="error-boundary-footer">
              <a 
                href="https://github.com/your-org/ado-gantt/issues" 
                target="_blank" 
                rel="noopener noreferrer"
                className="error-boundary-link"
              >
                Report an Issue
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
