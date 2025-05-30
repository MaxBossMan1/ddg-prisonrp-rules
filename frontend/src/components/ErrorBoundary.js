import React from 'react';
import styled from 'styled-components';

const ErrorContainer = styled.div`
  background-color: #34495e;
  border: 2px solid #e74c3c;
  border-radius: 12px;
  padding: 2rem;
  margin: 2rem auto;
  max-width: 600px;
  text-align: center;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
`;

const ErrorIcon = styled.div`
  font-size: 3rem;
  color: #e74c3c;
  margin-bottom: 1rem;
`;

const ErrorTitle = styled.h2`
  color: #ecf0f1;
  font-size: 1.5rem;
  margin-bottom: 1rem;
  font-weight: 600;
`;

const ErrorMessage = styled.p`
  color: #bdc3c7;
  margin-bottom: 1.5rem;
  line-height: 1.6;
`;

const ErrorDetails = styled.details`
  margin-top: 1rem;
  text-align: left;
  
  summary {
    color: #677bae;
    cursor: pointer;
    font-weight: 500;
    margin-bottom: 0.5rem;
    
    &:hover {
      color: #8a9dc9;
    }
  }
`;

const ErrorCode = styled.pre`
  background-color: #2c3e50;
  color: #ecf0f1;
  padding: 1rem;
  border-radius: 4px;
  overflow-x: auto;
  font-size: 0.85rem;
  border: 1px solid #34495e;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 1.5rem;
`;

const Button = styled.button`
  background-color: #677bae;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #8a9dc9;
  }
  
  &.secondary {
    background-color: #95a5a6;
    
    &:hover {
      background-color: #7f8c8d;
    }
  }
`;

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to console and update state with error details
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // You can also log the error to an error reporting service here
    // logErrorToService(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null 
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const { error, errorInfo } = this.state;
      const { fallback, showDetails = false } = this.props;

      // If a custom fallback is provided, use it
      if (fallback) {
        return fallback;
      }

      return (
        <ErrorContainer>
          <ErrorIcon>⚠️</ErrorIcon>
          <ErrorTitle>Something went wrong</ErrorTitle>
          <ErrorMessage>
            We encountered an unexpected error. This has been logged and we're working to fix it.
            You can try refreshing the page or going back to the homepage.
          </ErrorMessage>

          <ActionButtons>
            <Button onClick={this.handleRetry}>Try Again</Button>
            <Button className="secondary" onClick={this.handleReload}>
              Refresh Page
            </Button>
            <Button 
              className="secondary" 
              onClick={() => window.location.href = '/'}
            >
              Go Home
            </Button>
          </ActionButtons>

          {(showDetails || process.env.NODE_ENV === 'development') && error && (
            <ErrorDetails>
              <summary>Error Details (for developers)</summary>
              <ErrorCode>
                <strong>Error:</strong> {error.toString()}
                {errorInfo && (
                  <>
                    <br />
                    <strong>Component Stack:</strong>
                    {errorInfo.componentStack}
                  </>
                )}
              </ErrorCode>
            </ErrorDetails>
          )}
        </ErrorContainer>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 