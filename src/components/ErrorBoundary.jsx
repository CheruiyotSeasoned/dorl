import { Component } from 'react'

export default class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  render() {
    if (this.state.error) {
      const msg = this.state.error?.message ?? String(this.state.error)
      return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center', fontFamily: 'sans-serif' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <h2 style={{ marginBottom: 8, fontSize: 20 }}>Something went wrong</h2>
          <p style={{ color: '#666', marginBottom: 12, maxWidth: 360, lineHeight: 1.5 }}>
            The app encountered an unexpected error. Please refresh the page.
          </p>
          <pre style={{ background: '#f5f5f5', border: '1px solid #ddd', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#c00', maxWidth: 360, overflowX: 'auto', marginBottom: 24, textAlign: 'left', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {msg}
          </pre>
          <button
            onClick={() => window.location.reload()}
            style={{ background: '#FF5E14', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 28px', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}
          >
            Refresh
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
