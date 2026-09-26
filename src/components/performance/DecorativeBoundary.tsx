import { Component, useEffect } from 'react'
import type { ReactNode } from 'react'
import { forceWebGLFallback } from './performanceStore'

function Fallback({ children, onReady }: { children?: ReactNode; onReady?: () => void }) {
  useEffect(() => { onReady?.() }, [onReady])
  return children
}

// Fail a decorative root independently, retaining the CSS atmosphere and content.
export class DecorativeBoundary extends Component<{
  children: (fail: () => void) => ReactNode
  fallback?: ReactNode
  onReady?: () => void
}, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  fail = () => { this.setState({ failed: true }) }
  render() {
    return this.state.failed || forceWebGLFallback
      ? <Fallback onReady={this.props.onReady}>{this.props.fallback}</Fallback>
      : this.props.children(this.fail)
  }
}
