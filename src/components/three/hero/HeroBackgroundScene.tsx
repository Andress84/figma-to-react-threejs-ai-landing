import { Canvas } from '@react-three/fiber'
import type { RefObject } from 'react'

import { useWebGLPerformanceProfile } from '../useWebGLPerformanceProfile'
import { HERO_CAMERA_NEUTRAL_Z, HeroScene } from './HeroScene'
import styles from './HeroBackgroundScene.module.css'

interface HeroBackgroundSceneProps {
  pointerTargetRef: RefObject<HTMLElement | null>
}

export default function HeroBackgroundScene({
  pointerTargetRef,
}: HeroBackgroundSceneProps) {
  const profile = useWebGLPerformanceProfile()

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
        <HeroScene pointerTargetRef={pointerTargetRef} profile={profile} />
      </Canvas>
    </div>
  )
}