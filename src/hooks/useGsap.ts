import { useGSAP } from '@gsap/react'
import gsap from 'gsap'

// Import from this module in animated components. useGSAP scopes gsap.context to
// a component ref and reverts its animations during StrictMode-safe cleanup.
gsap.registerPlugin(useGSAP)

export { gsap, useGSAP }
