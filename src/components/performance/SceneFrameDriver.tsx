import type { WebGLRenderer } from 'three'
import { useEffect, useRef } from 'react'
import { useThree } from '@react-three/fiber'
import { gsap } from '../../hooks/useGsap'
import { reportWebGLCapabilities } from './performanceStore'

function installShaderFailureHandler(renderer: WebGLRenderer, onFailure: () => void) {
  const previous = renderer.debug.onShaderError
  renderer.debug.onShaderError = onFailure
  return () => { renderer.debug.onShaderError = previous }
}

interface Props {
  active: boolean
  animate: boolean
  fps: number
  onReady?: () => void
  onFailure: () => void
}

// All decorative continuous WebGL roots share GSAP's existing browser clock.
// A local elapsed clock freezes while paused, including for clock-based V1 shaders.
export function SceneFrameDriver({ active, animate, fps, onReady, onFailure }: Props) {
  const { advance, gl, size } = useThree()
  const elapsed = useRef(0)
  const ready = useRef(false)
  const frames = useRef(0)
  useEffect(() => {
    const canvas = gl.domElement
    const lost = (event: Event) => { event.preventDefault(); onFailure() }
    canvas.addEventListener('webglcontextlost', lost)
    const restoreShaderHandler = installShaderFailureHandler(gl, onFailure)
    reportWebGLCapabilities(gl.capabilities.maxTextureSize)
    return () => {
      canvas.removeEventListener('webglcontextlost', lost)
      restoreShaderHandler()
    }
  }, [gl, onFailure])

  useEffect(() => {
    let disposed = false
    let pending = 3
    let lastTime = gsap.ticker.time
    let accumulator = 0
    let timeSinceRender = 0
    const interval = fps > 0 ? 1 / fps : 0
    const render = (time: number) => {
      const dt = Math.min(Math.max(time - lastTime, 0), 0.05)
      lastTime = time
      if (document.hidden || (!active && ready.current)) {
        gsap.ticker.remove(render)
        return
      }
      accumulator += dt
      timeSinceRender += dt
      if (pending <= 0 && interval && accumulator + 0.001 < interval) return
      elapsed.current += Math.min(timeSinceRender, 0.05)
      timeSinceRender = 0
      // Keep fractional time so 60/45/30 fps budgets also work on 144/165 Hz displays.
      accumulator = interval ? Math.max(0, accumulator - interval) : 0
      try { advance(elapsed.current, false) } catch { onFailure(); gsap.ticker.remove(render); return }
      pending--
      frames.current++
      if (import.meta.env.DEV) {
        gl.domElement.dataset.renderFrames = String(frames.current)
        gl.domElement.dataset.drawCalls = String(gl.info.render.calls)
        gl.domElement.dataset.renderActive = String(active && animate)
      }
      if (!ready.current && pending <= 1) { ready.current = true; onReady?.() }
      if (pending <= 0 && (!animate || !active)) gsap.ticker.remove(render)
    }
    const repaint = () => {
      if (disposed || (!active && ready.current)) return
      pending = 3
      lastTime = gsap.ticker.time
      gsap.ticker.add(render)
    }
    // Static profiles still get initial, font-layout and resize frames.
    if (active || !ready.current) repaint()
    void document.fonts.ready.then(repaint)
    return () => {
      disposed = true
      gsap.ticker.remove(render)
      if (import.meta.env.DEV) gl.domElement.dataset.renderActive = 'false'
    }
  }, [active, advance, animate, fps, gl, onFailure, onReady, size.width, size.height])
  return null
}
