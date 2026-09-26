import { DecorativeBoundary } from '../performance/DecorativeBoundary'
import { usePerformanceProfile, useSceneActivity } from '../performance/usePerformanceProfile'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import type { PointerEvent, RefObject } from 'react'
import { BoxGeometry, EdgesGeometry, LineBasicMaterial, MathUtils, Vector2 } from 'three'
import type { Group } from 'three'

import styles from '../sections/FeaturesSection.module.css'

export interface FeatureCrossMotion {
  progress: number
  invalidate: () => void
}

interface CrossShapeProps {
  motionRef: RefObject<FeatureCrossMotion>
  pointerRef: RefObject<Vector2>
  active: boolean
  onFailure: () => void
}

function CrossShape({ motionRef, pointerRef, active, onFailure }: CrossShapeProps) {
  const groupRef = useRef<Group>(null)
  const dampedPointer = useRef(new Vector2())
  const gl = useThree(state => state.gl)
  const invalidate = useThree((state) => state.invalidate)
  const resources = useMemo(() => {
    const boxes = [
      new BoxGeometry(1.9, 0.42, 0.42),
      new BoxGeometry(0.42, 1.9, 0.42),
      new BoxGeometry(0.42, 0.42, 1.7),
    ]
    const edges = boxes.map((box) => new EdgesGeometry(box))
    const material = new LineBasicMaterial({
      color: 0xd8dde7, transparent: true, opacity: 0.72, depthWrite: false,
    })
    return { boxes, edges, material }
  }, [])

  useEffect(() => {
    const motion = motionRef.current
    motion.invalidate = active ? invalidate : () => {}
    invalidate()
    return () => {
      motion.invalidate = () => {}
    }
  }, [active, invalidate, motionRef])

  useEffect(() => {
    const lost = (event: Event) => { event.preventDefault(); onFailure() }
    gl.domElement.addEventListener('webglcontextlost', lost)
    return () => {
      gl.domElement.removeEventListener('webglcontextlost', lost)
    }
  }, [gl, onFailure])

  useEffect(() => {
    return () => {
      resources.boxes.forEach((box) => box.dispose())
      resources.edges.forEach((edge) => edge.dispose())
      resources.material.dispose()
    }
  }, [resources])

  useFrame((_, delta) => {
    const group = groupRef.current
    if (!group) return
    const target = pointerRef.current
    const pointer = dampedPointer.current
    const dt = Math.min(delta, 0.05)
    pointer.x = MathUtils.damp(pointer.x, target.x, 6, dt)
    pointer.y = MathUtils.damp(pointer.y, target.y, 6, dt)
    const progress = motionRef.current.progress
    group.rotation.set(
      0.28 + progress * 1.2 + pointer.y * 0.045,
      -0.3 + progress * 2.35 + pointer.x * 0.06,
      0.12 + progress * 0.28,
    )
    if (active && pointer.distanceToSquared(target) > 0.0001) invalidate()
  })

  return (
    <group ref={groupRef}>
      {resources.edges.map((edge, index) => (
        <lineSegments key={edge.uuid} geometry={edge} material={resources.material}
          rotation={index === 1 ? [0, 0.12, 0] : index === 2 ? [0.22, 0, 0] : [0, 0, 0]} />
      ))}
    </group>
  )
}

export default function FeatureCross({ motionRef, interactive }: {
  motionRef: RefObject<FeatureCrossMotion>
  interactive: boolean
}) {
  const pointerRef = useRef(new Vector2())
  const targetRef = useRef<HTMLDivElement>(null)
  const { active } = useSceneActivity(targetRef)
  const profile = usePerformanceProfile()

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!interactive || event.pointerType !== 'mouse') return
    const bounds = event.currentTarget.getBoundingClientRect()
    pointerRef.current.set(
      (event.clientX - bounds.left) / bounds.width * 2 - 1,
      (event.clientY - bounds.top) / bounds.height * 2 - 1,
    )
    motionRef.current.invalidate()
  }

  function handlePointerLeave() {
    pointerRef.current.set(0, 0)
    motionRef.current.invalidate()
  }

  return (
    <div ref={targetRef} className={styles.crossCanvas} onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave} aria-hidden="true">
      <DecorativeBoundary fallback={<svg viewBox="0 0 180 150" focusable="false"><path fill="none" stroke="currentColor" d="m26 48 42-18 18 42-42 18z m36-26 42-18 18 42-42 18z m29 28 42-18 18 42-42 18z" /></svg>}>{fail => <Canvas camera={{ fov: 42, near: 0.1, far: 20, position: [0, 0, 3.35] }}
        dpr={[1, Math.min(1.5, profile.budget.dpr)]} frameloop={active ? 'demand' : 'never'} role="presentation" tabIndex={-1}
        gl={{ alpha: true, antialias: true, powerPreference: 'low-power' }}
        fallback={<svg viewBox="0 0 180 150" focusable="false">
          <g fill="none" stroke="currentColor" strokeWidth="1.25">
            <path d="m26 48 42-18 18 42-42 18z" />
            <path d="m62 22 42-18 18 42-42 18z" />
            <path d="m91 50 42-18 18 42-42 18z" />
          </g>
        </svg>}
      >
        <CrossShape motionRef={motionRef} pointerRef={pointerRef} active={active} onFailure={fail} />
      </Canvas>}</DecorativeBoundary>
    </div>
  )
}
