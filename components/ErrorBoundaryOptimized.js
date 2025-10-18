"use client";

import React, { Component, useState, useEffect } from 'react';

class ErrorBoundaryClass extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // Log dell'errore per debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback 
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          fallbackMessage={this.props.fallbackMessage}
          onRetry={() => this.setState({ hasError: false, error: null, errorInfo: null })}
        />
      );
    }

    return this.props.children;
  }
}

function ErrorFallback({ error, errorInfo, fallbackMessage, onRetry }) {
  const [showDetails, setShowDetails] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    onRetry();
  };

  const getErrorMessage = (error) => {
    if (!error) return fallbackMessage || 'Something went wrong';
    
    // Messaggi di errore user-friendly
    if (error.message?.includes('Network not supported')) {
      return 'Network not supported. Please switch to a supported network.';
    }
    if (error.message?.includes('Wallet not connected')) {
      return 'Please connect your wallet to continue.';
    }
    if (error.message?.includes('RPC')) {
      return 'Network connection issue. Please try again.';
    }
    if (error.message?.includes('timeout')) {
      return 'Request timed out. Please check your connection.';
    }
    if (error.message?.includes('Invalid address')) {
      return 'Invalid wallet address. Please check your wallet.';
    }
    
    return error.message || fallbackMessage || 'An unexpected error occurred';
  };

  return (
    <div className="bg-base-100 rounded-xl shadow-md p-6 border border-error/20">
      <div className="flex flex-col items-center gap-4">
        {/* Icona errore */}
        <div className="w-16 h-16 bg-error/10 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>

        {/* Messaggio principale */}
        <div className="text-center">
          <h3 className="text-lg font-semibold text-error mb-2">
            {getErrorMessage(error)}
          </h3>
          <p className="text-sm text-base-content/60 mb-4">
            {retryCount > 0 && `Retry attempt ${retryCount}`}
          </p>
        </div>

        {/* Azioni */}
        <div className="flex gap-3">
          <button 
            onClick={handleRetry}
            className="btn btn-primary btn-sm"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Retry
          </button>
          
          <button 
            onClick={() => setShowDetails(!showDetails)}
            className="btn btn-ghost btn-sm"
          >
            {showDetails ? 'Hide' : 'Show'} Details
          </button>
        </div>

        {/* Dettagli tecnici */}
        {showDetails && (
          <div className="w-full mt-4 p-4 bg-base-200 rounded-lg">
            <details className="text-xs">
              <summary className="cursor-pointer font-medium mb-2">Technical Details</summary>
              <div className="space-y-2">
                <div>
                  <strong>Error:</strong>
                  <pre className="mt-1 p-2 bg-base-300 rounded text-xs overflow-auto">
                    {error?.toString()}
                  </pre>
                </div>
                {errorInfo && (
                  <div>
                    <strong>Stack Trace:</strong>
                    <pre className="mt-1 p-2 bg-base-300 rounded text-xs overflow-auto max-h-32">
                      {errorInfo.componentStack}
                    </pre>
                  </div>
                )}
              </div>
            </details>
          </div>
        )}
      </div>
    </div>
  );
}

// Hook per gestire errori in componenti funzionali
export function useErrorHandler() {
  const [error, setError] = useState(null);

  const handleError = (error, context = '') => {
    console.error(`Error in ${context}:`, error);
    setError(error);
  };

  const clearError = () => {
    setError(null);
  };

  const ErrorDisplay = ({ fallbackMessage }) => {
    if (!error) return null;

    return (
      <div className="alert alert-error mb-4">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <div>
          <h3 className="font-bold">Error</h3>
          <div className="text-xs">
            {fallbackMessage || error.message || 'An error occurred'}
          </div>
        </div>
        <button onClick={clearError} className="btn btn-sm btn-ghost">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    );
  };

  return {
    error,
    handleError,
    clearError,
    ErrorDisplay
  };
}

// Componente wrapper per error boundary
export function WidgetErrorBoundary({ children, fallbackMessage }) {
  return (
    <ErrorBoundaryClass fallbackMessage={fallbackMessage}>
      {children}
    </ErrorBoundaryClass>
  );
}

export default WidgetErrorBoundary;
