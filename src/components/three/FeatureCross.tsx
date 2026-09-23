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
}

function CrossShape({ motionRef, pointerRef }: CrossShapeProps) {
  const groupRef = useRef<Group>(null)
  const dampedPointer = useRef(new Vector2())
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
    motion.invalidate = invalidate
    invalidate()
    return () => {
      motion.invalidate = () => {}
      resources.boxes.forEach((box) => box.dispose())
      resources.edges.forEach((edge) => edge.dispose())
      resources.material.dispose()
    }
  }, [invalidate, motionRef, resources])

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
    if (pointer.distanceToSquared(target) > 0.0001) invalidate()
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
    <div className={styles.crossCanvas} onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave} aria-hidden="true">
      <Canvas camera={{ fov: 42, near: 0.1, far: 20, position: [0, 0, 3.35] }}
        dpr={[1, 1.5]} frameloop="demand" role="presentation" tabIndex={-1}
        gl={{ alpha: true, antialias: true, powerPreference: 'low-power' }}
        fallback={<svg viewBox="0 0 180 150" focusable="false">
          <g fill="none" stroke="currentColor" strokeWidth="1.25">
            <path d="m26 48 42-18 18 42-42 18z" />
            <path d="m62 22 42-18 18 42-42 18z" />
            <path d="m91 50 42-18 18 42-42 18z" />
          </g>
        </svg>}
      >
        <CrossShape motionRef={motionRef} pointerRef={pointerRef} />
      </Canvas>
    </div>
  )
}
