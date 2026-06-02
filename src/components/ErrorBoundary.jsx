import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error: error?.message || String(error) }
  }

  componentDidUpdate(prevProps) {
    if (prevProps.resetKey !== this.props.resetKey) {
      this.setState({ error: null })
    }
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="page-content" style={{ textAlign: 'center', padding: 40 }}>
          <div className="card" style={{ padding: 20 }}>
            <p style={{ fontSize: 14, color: '#E74C3C', marginBottom: 8, fontWeight: 600 }}>页面出错了</p>
            <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 16, wordBreak: 'break-all' }}>
              {this.state.error}
            </p>
            <button
              className="btn-primary"
              onClick={() => { this.setState({ error: null }); window.history.back() }}
              style={{ fontSize: 13, padding: '6px 18px', marginRight: 8 }}
            >
              返回
            </button>
            <button
              className="btn-outline"
              onClick={() => { this.setState({ error: null }); window.location.hash = '#/' }}
              style={{ fontSize: 13, padding: '6px 18px' }}
            >
              回首页
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
