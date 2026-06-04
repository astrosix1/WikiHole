import { Component } from 'react';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('WikiHole Error:', error);
    console.error('ErrorInfo:', errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    // Reload the app
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0f172a',
          color: '#f5f5f5',
          padding: '20px',
        }}>
          <div style={{
            maxWidth: '600px',
            textAlign: 'center',
            backgroundColor: '#1e293b',
            padding: '40px',
            borderRadius: '12px',
            border: '1px solid #334155',
          }}>
            <h1 style={{ fontSize: '28px', marginBottom: '16px' }}>
              🕳️ Oops! Something went wrong
            </h1>
            <p style={{ fontSize: '14px', color: '#cbd5e1', marginBottom: '24px', lineHeight: '1.6' }}>
              WikiHole encountered an unexpected error. The rabbit hole got a bit too deep!
            </p>

            {this.state.error && (
              <details style={{
                backgroundColor: '#0f172a',
                padding: '16px',
                borderRadius: '8px',
                marginBottom: '24px',
                textAlign: 'left',
                fontSize: '12px',
                color: '#94a3b8',
              }}>
                <summary style={{ cursor: 'pointer', marginBottom: '8px' }}>
                  Error details (click to expand)
                </summary>
                <pre style={{
                  overflow: 'auto',
                  padding: '12px',
                  backgroundColor: '#1e293b',
                  borderRadius: '4px',
                  fontSize: '11px',
                  marginTop: '8px',
                }}>
{`${this.state.error.toString()}\n\n${this.state.errorInfo?.componentStack || 'No stack trace'}`}
                </pre>
              </details>
            )}

            <button
              onClick={this.handleReset}
              style={{
                padding: '12px 24px',
                fontSize: '14px',
                fontWeight: '600',
                backgroundColor: '#1abd7f',
                color: '#0f172a',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#15a870'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#1abd7f'}
            >
              🔄 Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
