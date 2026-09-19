import { Canvas } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import type { RefObject } from 'react'

import { useWebGLPerformanceProfile } from '../useWebGLPerformanceProfile'
import { HERO_CAMERA_NEUTRAL_Z, HeroScene } from './HeroScene'
import type { HeroPointerPosition } from './heroSceneTypes'
import styles from './HeroBackgroundScene.module.css'

interface HeroBackgroundSceneProps {
  pointerTargetRef: RefObject<HTMLElement | null>
}

function updatePointerPosition(
  pointer: HeroPointerPosition,
  event: PointerEvent,
  bounds: DOMRect,
) {
  const x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1
  const y = ((event.clientY - bounds.top) / bounds.height) * 2 - 1

  pointer.active = true
  pointer.x = Math.max(-1, Math.min(1, x))
  pointer.y = Math.max(-1, Math.min(1, y))
  pointer.distance = Math.min(1, Math.hypot(pointer.x, pointer.y))
}

export default function HeroBackgroundScene({
  pointerTargetRef,
}: HeroBackgroundSceneProps) {
  const profile = useWebGLPerformanceProfile()
  const pointerRef = useRef<HeroPointerPosition>({
    active: false,
    distance: 0,
    x: 0,
    y: 0,
  })

  useEffect(() => {
    if (profile.quality !== 'full') {
      pointerRef.current.active = false
      return
    }

    const target = pointerTargetRef.current

    if (!target) {
      return
    }

    let bounds = target.getBoundingClientRect()
    const refreshBounds = () => {
      bounds = target.getBoundingClientRect()
    }
    const handlePointerEnter = (event: PointerEvent) => {
      refreshBounds()
      updatePointerPosition(pointerRef.current, event, bounds)
    }
    const handlePointerMove = (event: PointerEvent) => {
      updatePointerPosition(pointerRef.current, event, bounds)
    }
    const handlePointerLeave = () => {
      pointerRef.current.active = false
      pointerRef.current.distance = 0
      pointerRef.current.x = 0
      pointerRef.current.y = 0
    }
    const resizeObserver = new ResizeObserver(refreshBounds)

    target.addEventListener('pointerenter', handlePointerEnter)
    target.addEventListener('pointermove', handlePointerMove)
    target.addEventListener('pointerleave', handlePointerLeave)
    resizeObserver.observe(target)

    return () => {
      target.removeEventListener('pointerenter', handlePointerEnter)
      target.removeEventListener('pointermove', handlePointerMove)
      target.removeEventListener('pointerleave', handlePointerLeave)
      resizeObserver.disconnect()
    }
  }, [pointerTargetRef, profile.quality])

  return (
    <div
      className={styles.layer}
      data-quality={profile.quality}
      aria-hidden="true"
    >
      <Canvas
        className={styles.canvas}
        aria-hidden="true"
        role="presentation"
        tabIndex={-1}
        camera={{
          far: 40,
          fov: 42,
          near: 0.1,
          position: [0, 0, HERO_CAMERA_NEUTRAL_Z],
        }}
        dpr={profile.dpr}
        fallback={null}
        frameloop={
          profile.shouldAnimateContinuously ? 'always' : 'demand'
        }
        gl={{
          alpha: true,
          antialias: profile.quality === 'full',
          powerPreference:
            profile.quality === 'full' ? 'high-performance' : 'low-power',
        }}
        onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
        resize={{ debounce: { resize: 100, scroll: 0 }, scroll: false }}
      >
        <HeroScene pointerRef={pointerRef} profile={profile} />
      </Canvas>
    </div>
  )
}
