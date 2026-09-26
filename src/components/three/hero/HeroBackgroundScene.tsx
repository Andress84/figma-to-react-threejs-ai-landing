import { Canvas } from '@react-three/fiber'
import { DecorativeBoundary } from '../../performance/DecorativeBoundary'
import { SceneFrameDriver } from '../../performance/SceneFrameDriver'
import { useSceneActivity } from '../../performance/usePerformanceProfile'
import type { RefObject } from 'react'

import { useWebGLPerformanceProfile } from '../useWebGLPerformanceProfile'
import { HERO_CAMERA_NEUTRAL_Z, HeroScene } from './HeroScene'
import styles from './HeroBackgroundScene.module.css'

interface HeroBackgroundSceneProps {
  pointerTargetRef: RefObject<HTMLElement | null>
  onSceneReady: () => void
}

export default function HeroBackgroundScene({
  pointerTargetRef,
  onSceneReady,
}: HeroBackgroundSceneProps) {
  const profile = useWebGLPerformanceProfile()
  const { active } = useSceneActivity(pointerTargetRef)

  return (
    <div
      className={styles.layer}
      data-quality={profile.quality}
      aria-hidden="true"
    >
      <DecorativeBoundary onReady={onSceneReady}>{fail => <Canvas
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
        frameloop="never"
        gl={{
          alpha: true,
          antialias: profile.quality === 'full',
          powerPreference:
            profile.quality === 'full' ? 'high-performance' : 'low-power',
        }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0)

        }}
        resize={{ debounce: { resize: 100, scroll: 0 }, scroll: false }}
      >
        <HeroScene pointerTargetRef={pointerTargetRef} profile={profile} active={active} />
        <SceneFrameDriver active={active} animate={profile.shouldAnimateContinuously}
          fps={profile.budget.fps} onReady={onSceneReady} onFailure={fail} />
      </Canvas>}</DecorativeBoundary>
    </div>
  )
}