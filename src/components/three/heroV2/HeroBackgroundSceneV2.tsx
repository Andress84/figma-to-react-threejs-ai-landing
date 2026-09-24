import { Canvas } from '@react-three/fiber'
import type { RefObject } from 'react'

import { useWebGLPerformanceProfile } from '../useWebGLPerformanceProfile'
import styles from '../hero/HeroBackgroundScene.module.css'
import { HeroSceneV2 } from './HeroSceneV2'
import { V2_CAMERA_Z, V2_FOV } from './fieldSettings'

interface HeroBackgroundSceneV2Props {
  pointerTargetRef: RefObject<HTMLElement | null>
  onSceneReady: () => void
}

export default function HeroBackgroundSceneV2({ pointerTargetRef, onSceneReady }: HeroBackgroundSceneV2Props) {
  const profile = useWebGLPerformanceProfile()

  return (
    <div className={styles.layer} data-quality={profile.quality} data-scene="v2" aria-hidden="true">
      <Canvas className={styles.canvas} aria-hidden="true" role="presentation" tabIndex={-1}
        camera={{ far: 45, fov: V2_FOV, near: 0.1, position: [0, 0, V2_CAMERA_Z] }}
        dpr={profile.dpr} fallback={null}
        frameloop={profile.shouldAnimateContinuously ? 'always' : 'demand'}
        gl={{ alpha: true, antialias: profile.quality === 'full',
          powerPreference: profile.quality === 'full' ? 'high-performance' : 'low-power' }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0)
          requestAnimationFrame(() => requestAnimationFrame(() => {
            if (gl.domElement.isConnected) onSceneReady()
          }))
        }}
        resize={{ debounce: { resize: 100, scroll: 0 }, scroll: false }}
      >
        <HeroSceneV2 pointerTargetRef={pointerTargetRef} profile={profile} />
      </Canvas>
    </div>
  )
}
