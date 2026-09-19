import { useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import type { RefObject } from 'react'

import type { HeroPointerPosition } from './heroSceneTypes'

export function useHeroPointer(targetRef: RefObject<HTMLElement | null>, enabled: boolean) {
  const canvas = useThree((state) => state.gl.domElement)
  const pointerRef = useRef<HeroPointerPosition>({
    active: false, distance: 0, x: 0, y: 0,
    velocityX: 0, velocityY: 0, updatedAt: 0,
  })

  useEffect(() => {
    const pointer = pointerRef.current
    const target = targetRef.current
    if (!enabled || !target) {
      pointer.active = false
      return
    }

    let bounds = canvas.getBoundingClientRect()
    let targetBounds = target.getBoundingClientRect()
    let clientX = 0
    let clientY = 0
    let inside = false
    let refreshFrame = 0

    const updatePosition = () => {
      pointer.active = inside && bounds.width > 0 && bounds.height > 0
        && clientX >= targetBounds.left && clientX <= targetBounds.right
        && clientY >= targetBounds.top && clientY <= targetBounds.bottom
      if (!pointer.active) return
      pointer.x = Math.max(-1, Math.min(1, (clientX - bounds.left) / bounds.width * 2 - 1))
      pointer.y = Math.max(-1, Math.min(1, (clientY - bounds.top) / bounds.height * 2 - 1))
      pointer.distance = Math.min(1, Math.hypot(pointer.x, pointer.y))
    }

    const refreshBounds = () => {
      refreshFrame = 0
      bounds = canvas.getBoundingClientRect()
      targetBounds = target.getBoundingClientRect()
      pointer.velocityX = 0
      pointer.velocityY = 0
      updatePosition()
    }

    const scheduleBoundsRefresh = () => {
      if (!refreshFrame) refreshFrame = requestAnimationFrame(refreshBounds)
    }

    const handleMove = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return
      const now = performance.now()
      const dt = Math.max(8, now - pointer.updatedAt) / 1000
      const trackVelocity = pointer.active && now - pointer.updatedAt < 120
      pointer.velocityX = trackVelocity ? Math.max(-1200, Math.min(1200, (event.clientX - clientX) / dt)) : 0
      pointer.velocityY = trackVelocity ? Math.max(-1200, Math.min(1200, (event.clientY - clientY) / dt)) : 0
      pointer.updatedAt = now
      clientX = event.clientX
      clientY = event.clientY
      updatePosition()
    }

    const handleEnter = (event: PointerEvent) => {
      refreshBounds()
      inside = true
      handleMove(event)
    }

    const handleLeave = () => {
      inside = false
      pointer.active = false
      pointer.velocityX = 0
      pointer.velocityY = 0
    }

    const handleVisibility = () => {
      if (document.hidden) handleLeave()
    }

    const resizeObserver = new ResizeObserver(scheduleBoundsRefresh)
    resizeObserver.observe(canvas)
    resizeObserver.observe(target)
    target.addEventListener('pointerenter', handleEnter)
    target.addEventListener('pointermove', handleMove, { passive: true })
    target.addEventListener('pointerleave', handleLeave)
    target.addEventListener('pointercancel', handleLeave)
    window.addEventListener('scroll', scheduleBoundsRefresh, { passive: true, capture: true })
    window.addEventListener('resize', scheduleBoundsRefresh, { passive: true })
    window.addEventListener('blur', handleLeave)
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      cancelAnimationFrame(refreshFrame)
      resizeObserver.disconnect()
      target.removeEventListener('pointerenter', handleEnter)
      target.removeEventListener('pointermove', handleMove)
      target.removeEventListener('pointerleave', handleLeave)
      target.removeEventListener('pointercancel', handleLeave)
      window.removeEventListener('scroll', scheduleBoundsRefresh, true)
      window.removeEventListener('resize', scheduleBoundsRefresh)
      window.removeEventListener('blur', handleLeave)
      document.removeEventListener('visibilitychange', handleVisibility)
      handleLeave()
    }
  }, [canvas, enabled, targetRef])

  return pointerRef
}