import { Component } from 'react'
import { createLogger } from '../lib/logger.js'

const log = createLogger('errors')

// Catches crashes while React renders, logs them, and shows a friendly screen instead of a blank page.
export default class ErrorBoundary extends Component {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error, info) {
    log.error('A component crashed', error, { componentStack: info?.componentStack })
  }

  render() {
    if (!this.state.failed) return this.props.children
    return (
      <div className="oops">
        <p className="oops-emoji">🙈</p>
        <h1>Oops!</h1>
        <button className="btn" aria-label="Try again" onClick={() => window.location.reload()}>🔄</button>
      </div>
    )
  }
}
