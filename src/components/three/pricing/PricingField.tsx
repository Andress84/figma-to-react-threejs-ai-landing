import { SceneFrameDriver } from '../../performance/SceneFrameDriver'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { RefObject } from 'react'
import { Color, MathUtils, Vector2 } from 'three'
import type { ShaderMaterial } from 'three'

import { gsap } from '../../../hooks/useGsap'
import type { WebGLPerformanceProfile } from '../useWebGLPerformanceProfile'
import styles from '../../sections/PricingSection.module.css'
import { pricingFragmentShader, pricingVertexShader } from './pricingFieldShaders'

interface PricingFieldProps {
  fieldRef: RefObject<HTMLDivElement | null>
  profile: WebGLPerformanceProfile
  visible: boolean
  onFailure: () => void
}

function Field({ fieldRef, profile, visible }: PricingFieldProps) {
  const materialRef = useRef<ShaderMaterial>(null)
  const { size } = useThree()
  const pointer = useRef({
    x: 0, y: 0, active: false, known: false, updatedAt: 0, vx: 0, vy: 0,
  })
  const boundsDirty = useRef(true)
  const bounds = useRef<DOMRect | null>(null)
  const layout = useRef({ top: 0, height: 1 })
  const full = profile.quality === 'full'
  const uniforms = useMemo(() => ({
    uTime: { value: 12 },
    uSize: { value: new Vector2(1, 1) },
    uLayout: { value: new Vector2(0, 1) },
    uPointer: { value: new Vector2(-1000, -1000) },
    uWake: { value: new Vector2(-1000, -1000) },
    uVelocity: { value: new Vector2() },
    uPresence: { value: 0 },
    uRadius: { value: 240 },
    uWarm: { value: new Color('#be4926') },
    uCool: { value: new Color('#236ba6') },
    uAmber: { value: new Color('#d78245') },
    uViolet: { value: new Color('#553e80') },
  }), [])

  useEffect(() => {
    const field = fieldRef.current
    if (!field) return
    const section = field.parentElement!
    const refresh = () => { boundsDirty.current = true }
    const measure = new ResizeObserver(refresh)
    measure.observe(field)
    measure.observe(section)
    const leave = () => { pointer.current.active = false; pointer.current.known = false }
    const move = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return
      const p = pointer.current
      const now = gsap.ticker.time
      const dt = Math.max(1 / 120, now - p.updatedAt)
      const tracking = p.known && dt < 0.15
      p.vx = tracking ? MathUtils.clamp((event.clientX - p.x) / dt, -900, 900) : 0
      p.vy = tracking ? MathUtils.clamp((event.clientY - p.y) / dt, -900, 900) : 0
      p.x = event.clientX
      p.y = event.clientY
      p.updatedAt = now
      p.known = true
    }
    // The field extends above Pricing. Window coordinates let that overlap react
    // correctly, while the actual canvas bounds limit the interaction locally.
    if (full && visible) {
      window.addEventListener('pointermove', move, { passive: true })
      window.addEventListener('blur', leave)
      document.documentElement.addEventListener('pointerleave', leave)
    }
    window.addEventListener('scroll', refresh, { passive: true, capture: true })
    refresh()
    return () => {
      measure.disconnect()
      window.removeEventListener('pointermove', move)
      window.removeEventListener('blur', leave)
      document.documentElement.removeEventListener('pointerleave', leave)
      window.removeEventListener('scroll', refresh, true)
      leave()
    }
  }, [fieldRef, full, visible])

  useFrame((_, delta) => {
    const field = fieldRef.current
    if (!field || !materialRef.current) return
    const live = materialRef.current.uniforms as typeof uniforms
    if (boundsDirty.current) {
      bounds.current = field.getBoundingClientRect()
      const section = field.parentElement!.getBoundingClientRect()
      layout.current = { top: section.top - bounds.current.top, height: section.height }
      boundsDirty.current = false
    }
    const rect = bounds.current!
    const dt = Math.min(Math.max(delta, 0), 0.05)
    if (profile.shouldAnimateContinuously) live.uTime.value += dt
    live.uSize.value.set(size.width, size.height)
    live.uLayout.value.set(layout.current.top, layout.current.height)
    live.uRadius.value = Math.min(260, size.width * 0.23)
    const p = pointer.current
    p.active = full && p.known && p.x >= rect.left && p.x <= rect.right
      && p.y >= rect.top && p.y <= rect.bottom
    const current = live.uPointer.value
    const wake = live.uWake.value
    const idle = Math.max(0, gsap.ticker.time - p.updatedAt)
    const velocityDecay = p.active ? Math.exp(-idle * 6) : 0
    live.uVelocity.value.x = MathUtils.damp(live.uVelocity.value.x, p.vx / 900 * velocityDecay, 6, dt)
    live.uVelocity.value.y = MathUtils.damp(live.uVelocity.value.y, p.vy / 900 * velocityDecay, 6, dt)
    if (p.active) {
      const x = p.x - rect.left
      const y = p.y - rect.top
      if (live.uPresence.value < 0.002) { current.set(x, y); wake.copy(current) }
      current.x = MathUtils.damp(current.x, x, 7, dt)
      current.y = MathUtils.damp(current.y, y, 7, dt)
    }
    wake.lerp(current, 1 - Math.exp(-3.5 * dt))
    // Even stationary hover returns to the continuing flow, with no spring bounce.
    const targetPresence = p.active ? Math.exp(-Math.max(0, idle - 0.16) * 1.8) : 0
    live.uPresence.value = full
      ? MathUtils.damp(live.uPresence.value, targetPresence, p.active ? 6 : 2.8, dt)
      : 0
  })


  return (
    <mesh frustumCulled={false}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial key={profile.quality} ref={materialRef} uniforms={uniforms}
        defines={{ FIELD_DETAIL: full ? 1 : 0 }}
        vertexShader={pricingVertexShader} fragmentShader={pricingFragmentShader}
        transparent depthTest={false} depthWrite={false} toneMapped={false} />
    </mesh>
  )
}

export default function PricingField(props: PricingFieldProps) {
  const [ready, setReady] = useState(false)
  const { profile } = props
  const dpr = profile.budget.pricingDpr
  return (
    <div className={styles.fieldCanvas} data-ready={ready}>
      <Canvas frameloop="never" dpr={[1, dpr]} fallback={null}
        role="presentation" tabIndex={-1} aria-hidden="true"
        gl={{ alpha: true, antialias: false, powerPreference: 'low-power' }}
        onCreated={({ gl }) => { gl.setClearColor(0x000000, 0); setReady(true) }}
        resize={{ debounce: { resize: 100, scroll: 0 }, scroll: false }}>
        <Field {...props} />
        <SceneFrameDriver active={props.visible} animate={profile.shouldAnimateContinuously}
          fps={profile.budget.pricingFps} onFailure={props.onFailure} />
      </Canvas>
    </div>
  )
}
