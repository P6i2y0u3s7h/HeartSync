import React from 'react';
import HeartSyncLogo from './HeartSyncLogo';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('HeartSync ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="mobile-app-shell">
          <div className="auth-page-container" style={{ padding: '40px 20px', textAlign: 'center' }}>
            <div className="auth-card-wrapper animate-slide-up" style={{ padding: '32px 24px' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
                <HeartSyncLogo size="medium" layout="horizontal" />
              </div>
              <h2 style={{ color: '#9a1147', fontSize: '22px', fontWeight: '700', marginBottom: '12px' }}>
                Something went wrong
              </h2>
              <p style={{ color: '#555', fontSize: '14px', lineHeight: '1.5', marginBottom: '24px' }}>
                {this.state.error?.message || 'An unexpected rendering error occurred. Please try reloading the page.'}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <button
                  type="button"
                  onClick={this.handleReload}
                  className="btn-luminous-pill"
                >
                  Reload Page
                </button>
                <button
                  type="button"
                  onClick={this.handleGoHome}
                  style={{
                    background: 'transparent',
                    border: '1.5px solid #ff4081',
                    color: '#9a1147',
                    padding: '12px 24px',
                    borderRadius: '999px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Return to Home
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
