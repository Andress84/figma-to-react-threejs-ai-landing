# Automate Workflows. Scale With AI.

A high-end interactive AI SaaS landing page designed in Figma and developed as a modern frontend portfolio showcase.

The project combines a custom responsive UI with cinematic scroll transitions, WebGL effects, procedural backgrounds, particle systems, fluid cursor interaction, smooth scrolling, frontend authentication demo flows, and accessibility-aware adaptive performance.

**Live Demo:**
https://andress84.github.io/figma-to-react-threejs-ai-landing/

**Figma:**
https://www.figma.com/design/CkBJVdCdnRiGaKfhlu3b9K/Automate-Workflows.-Scale-With-AI.?node-id=0-1&t=5Ny4wPgjOmTrOmG6-1

**Repository:**
https://github.com/Andress84/figma-to-react-threejs-ai-landing

> This is a frontend concept / portfolio project.
> The UI/UX design is original and was created specifically for this implementation.

---

## Live Demo

The public portfolio build is available on **GitHub Pages**:

https://andress84.github.io/figma-to-react-threejs-ai-landing/

The deployed demo includes the complete interactive landing-page experience:

- cinematic preloader
- WebGL Hero
- scroll-driven sections
- adaptive performance system
- fluid cursor
- responsive navigation
- pricing interactions
- FAQ accordion
- frontend Login / Sign Up / onboarding demo
- Back-to-Top navigation
- reduced-motion behavior

---

## Design

**Figma source:**
https://www.figma.com/design/CkBJVdCdnRiGaKfhlu3b9K/Automate-Workflows.-Scale-With-AI.?node-id=0-1&t=5Ny4wPgjOmTrOmG6-1

The implementation follows the original Figma direction while extending it with interactive motion, WebGL effects, scroll choreography, pointer interaction, responsive behavior, and performance-aware rendering.

---

## Overview

The landing page presents a fictional AI SaaS platform focused on workflow automation and team productivity.

The project was built as a portfolio case study demonstrating the complete workflow from:

**UI/UX design in Figma → React architecture → responsive implementation → advanced animation → WebGL interaction → adaptive performance → accessibility and deployment polish.**

The goal is not only to reproduce a static design, but to turn it into a polished, immersive web experience suitable for a modern SaaS product.

---

## Highlights

### Interactive WebGL Hero

The Hero includes a custom Three.js / React Three Fiber scene with:

- animated procedural light fields
- particle layers
- depth and atmospheric effects
- pointer interaction
- responsive rendering budgets
- controlled device pixel ratio
- adaptive frame-rate limits
- reduced-motion and constrained-device behavior
- offscreen pause / resume support

The WebGL scene is integrated with the rest of the page rather than treated as a standalone visual demo.

### Cinematic Preloader

The opening sequence uses a custom preloader built around:

**Particle Core → Energy Orbit → compression → particle release → seamless Hero reveal**

The Hero is already mounted beneath the preloader, allowing the transition to reveal the live scene without a black frame or a second page-load animation.

The preloader also handles:

- font readiness
- Hero / WebGL readiness
- bounded fallback timing
- scroll locking
- Lenis synchronization
- responsive particle density
- reduced-motion behavior
- cleanup after the reveal

### Scroll-Driven Storytelling

GSAP and ScrollTrigger coordinate transitions between major sections.

Animations include:

- masked heading reveals
- staggered card entrances
- depth-based motion
- blurred-to-sharp transitions
- metric counters
- section handoffs
- reverse-scroll behavior
- responsive motion profiles

The animation system is designed to feel cinematic without turning the page into a collection of disconnected effects.

### Smooth Scrolling

The project uses **Lenis** for smooth scrolling where the active performance / motion profile allows it.

Lenis is synchronized with GSAP / ScrollTrigger through the existing animation ticker instead of introducing independent permanent animation loops.

Navigation links, FAQ navigation, modal scroll restoration, and the Back-to-Top control reuse the same scrolling architecture.

### Custom Fluid Cursor

Desktop fine-pointer devices receive a custom cursor system featuring:

- damped pointer movement
- interactive hover state
- translucent hover circle
- WebGL fluid trail
- persistent velocity / color simulation
- fluid movement across section boundaries
- foreground masking so text, cards, buttons, and controls remain readable
- adaptive simulation budgets

The fluid layer is disabled for coarse pointers and reduced-motion environments.

### Responsive Animated Navigation

The Header includes:

- desktop navigation
- active-section tracking
- smooth anchor navigation
- animated mobile menu
- hamburger-to-close morph
- staggered mobile navigation reveal
- keyboard focus management
- Escape-key support
- scroll locking while the menu is open

Current primary navigation:

**Home → Product → Pricing → FAQ**

### Product / Feature Section

The **Built for Modern Teams. Powered by AI.** section includes:

- animated title and supporting copy
- responsive feature cards
- staggered depth-based card reveals
- interactive card surfaces
- animated 3D wireframe artwork on large screens
- shared atmospheric background particles

### Results Section

The results sequence includes:

- scroll-driven introduction
- animated metrics
- number counting
- staggered supporting details
- subtle pointer-based depth
- CTA reveal
- transition continuity from the Features section

### Pricing

The Pricing section contains:

- Starter, Pro, and Business plans
- Monthly / Yearly billing switch
- animated billing-state transition
- highlighted Pro plan
- shared pointer-following glow across pricing cards
- hover elevation
- animated WebGL-style background atmosphere
- star / particle depth
- performance-aware rendering budgets

### FAQ

The FAQ section includes:

- animated section entrance
- atmospheric star field
- animated decorative rings
- smooth accordion transitions
- accessible expandable questions
- direct navigation through the `#faq` anchor

### Frontend Auth / Onboarding Demo

The project includes a presentation-level authentication flow for portfolio demonstration.

Current demo flows include:

- Login modal
- Sign Up flow
- frontend validation
- password visibility control
- loading and success states
- simple onboarding flow
- Pricing plan context passed into the sign-up experience
- Monthly / Yearly billing context preservation
- focus trapping and focus restoration
- Escape / backdrop / close-button dismissal
- Lenis and page-scroll restoration after closing
- responsive short-height / mobile behavior

No production authentication backend or credential persistence is used.

### Final CTA

The final CTA includes:

- animated energy orbit
- orbiting particles
- moving violet illumination
- scroll-linked entrance
- responsive clipping inside the CTA panel
- reduced-motion behavior

### Back to Top

A responsive Back-to-Top control appears after meaningful page scrolling and returns the visitor to the Hero through the existing smooth-scroll system.

It includes:

- animated show / hide behavior
- keyboard accessibility
- responsive positioning
- reduced-motion support

---

## Tech Stack

### Core

- React 19
- TypeScript
- Vite

### 3D / WebGL

- Three.js
- React Three Fiber
- Drei
- custom shaders
- Canvas2D where a lightweight temporary rendering layer is more appropriate

### Animation

- GSAP
- ScrollTrigger
- `@gsap/react`
- Lenis

### Styling

- CSS Modules
- modern native CSS
- CSS custom properties
- responsive Grid / Flexbox layouts
- Poppins via `@fontsource/poppins`

### Tooling

- ESLint
- TypeScript compiler
- Vite production build
- Git
- GitHub Actions
- GitHub Pages

---

## Architecture

The application is organized around reusable UI primitives, section-specific components, shared motion infrastructure, adaptive-performance modules, data modules, and isolated WebGL systems.

```text
src/
├── assets/
├── components/
│   ├── animation/
│   ├── auth/
│   ├── performance/
│   ├── sections/
│   ├── three/
│   └── ui/
├── data/
├── hooks/
├── styles/
├── types/
├── App.tsx
└── main.tsx

scripts/
└── performance-policy.test.ts
```

### `components/sections`

Contains page-level sections and section-specific UI such as:

- Header
- Hero
- Features
- Results
- Pricing
- FAQ
- Final CTA
- Footer

### `components/three`

Contains WebGL / React Three Fiber systems such as:

- Hero rendering
- procedural effects
- feature artwork
- Pricing field rendering
- shaders and Three.js utilities
- performance-aware scene integration

### `components/ui`

Contains shared interface and experience-level components such as:

- buttons
- global cursor
- preloader
- Back-to-Top control

### `components/auth`

Contains the frontend-only authentication and onboarding demo experience.

### `components/animation` and `hooks`

Contain shared motion infrastructure including:

- Lenis integration
- reusable smooth-scroll targeting
- GSAP setup
- section transition timelines
- reduced-motion helpers
- performance-aware animation behavior

### `components/performance`

Contains the shared adaptive-performance infrastructure used across WebGL scenes and decorative effects:

- device capability classification
- High / Balanced / Low / Reduced quality tiers
- shared rendering budgets
- runtime frame-performance monitoring
- downgrade-only quality adaptation
- visibility and background activity tracking
- shared scene frame scheduling
- WebGL capability reporting and fallback handling

---

## Adaptive Performance Strategy

The project includes a shared adaptive-performance system designed to keep the experience usable on both high-end hardware and weaker laptops, tablets, and smartphones.

Instead of applying one rendering configuration to every device, the application selects one of four performance tiers:

- `high`
- `balanced`
- `low`
- `reduced`

### Initial Device Classification

The initial rendering tier is selected from a combination of signals rather than viewport width alone.

Current signals include:

- `prefers-reduced-motion`
- pointer / hover capability
- logical CPU core count
- available device-memory hints where supported
- effective pixel pressure based on viewport size and device pixel ratio

No single weak hardware signal automatically forces the lowest quality profile.

### Runtime Adaptation

A lightweight performance monitor can downgrade rendering quality if sustained slow frame windows are detected.

Runtime adaptation is intentionally **downgrade-only**:

```text
High → Balanced → Low
```

The application does not repeatedly upgrade and downgrade during the same session, which avoids visual instability and quality oscillation.

### Rendering Budgets

Each tier has its own rendering budget for:

- WebGL DPR
- Hero frame rate
- Pricing frame rate
- procedural field resolution
- particle density
- star-field density
- AI / stream particle counts
- atmospheric effects
- fluid-cursor simulation resolution
- fluid dye / output resolution
- pressure iterations

The full visual composition remains available on capable hardware, while lower tiers first reduce resolution and simulation cost before removing important visual structure.

### High

The High tier preserves the approved full-quality experience:

- WebGL DPR capped at `1.75`
- full Hero field detail
- highest particle budgets
- highest fluid-cursor resolution
- uncapped Hero scene scheduling where appropriate
- Pricing targeted at up to 60 fps

### Balanced

Balanced remains visually close to High while reducing GPU / CPU cost:

- WebGL DPR capped at `1.25`
- Hero capped at 60 fps
- Pricing capped at 45 fps
- reduced procedural-field density
- reduced particle budgets
- lighter fluid simulation

### Low

Low is designed for weaker or constrained hardware:

- WebGL DPR capped at `1`
- Hero capped at 30 fps
- Pricing capped at 30 fps
- substantially lighter procedural fields
- lower particle and star counts
- reduced GPU buffer / simulation pressure
- fluid cursor retains a 60 Hz solver at a lighter resolution so motion stays smooth

### Reduced

Reduced is activated when the user requests reduced motion:

- substantially reduced continuous animation
- lightweight visual budgets
- reduced particle work
- no stream-particle load
- functional navigation and content remain available without depending on decorative motion

### Offscreen and Background Pausing

Expensive visual systems do not render continuously when they are not needed.

The shared performance layer can pause decorative work when:

- Hero / WebGL scenes are offscreen
- the browser tab becomes hidden
- an application overlay temporarily covers the experience
- a scene has completed the static frames it needs

This reduces unnecessary GPU and CPU usage while the visitor is reading other sections or while the page is not visible.

### Shared Frame Scheduling

Decorative WebGL scenes reuse the existing GSAP ticker rather than introducing separate permanent animation loops.

The shared frame driver supports:

- uncapped rendering where appropriate
- 60 / 45 / 30 fps rendering budgets
- fractional frame timing on high-refresh-rate displays
- pause / resume without elapsed-time jumps
- initial repaint frames
- font-layout repaint
- resize repaint
- static / reduced-motion rendering paths

### WebGL Resilience

The performance system also monitors rendering capability and failure states.

Current safeguards include:

- WebGL capability reporting
- maximum texture-size checks
- WebGL context-loss handling
- shader-error handling
- constrained fallback behavior when GPU capability is limited
- CSS / DOM content remaining usable if advanced rendering becomes unavailable

### Performance Principles

The implementation follows several rules:

- preserve visual quality on capable hardware
- reduce resolution and simulation cost before removing major effects
- pause work that is not visible
- avoid duplicate `requestAnimationFrame` / ticker loops
- avoid unnecessary GPU-data rebuilding
- stop settled simulations where possible
- clean up listeners, timers, tickers, canvases, and WebGL resources
- keep responsive layout independent from hardware classification
- respect `prefers-reduced-motion`
- keep the page usable without the full WebGL experience

---

## Accessibility

Accessibility is treated as part of the implementation rather than an afterthought.

Current considerations include:

- semantic section structure
- keyboard-accessible controls
- visible focus behavior
- animated mobile-menu focus management
- modal focus trapping
- focus restoration after modal / menu dismissal
- Escape-key support
- skip-to-content navigation
- appropriate ARIA states
- decorative graphics excluded from accessibility semantics
- `prefers-reduced-motion` handling
- native cursor fallback for touch / coarse-pointer devices

---

## Responsive Design

The implementation is designed for:

- large desktop displays
- standard desktop / laptop screens
- tablets
- mobile devices
- short landscape viewports

Layouts and animation behavior are adapted rather than simply scaled down.

Heavy pointer / WebGL interactions are reduced or disabled where they do not make sense on touch or reduced-motion devices.

---

## Deployment

The public portfolio build is deployed through **GitHub Pages**.

**Live site:**
https://andress84.github.io/figma-to-react-threejs-ai-landing/

Deployment uses:

- Vite production builds
- GitHub Actions
- GitHub Pages
- repository-relative asset paths through the configured Vite `base`

The current Vite base path is configured for:

```text
/figma-to-react-threejs-ai-landing/
```

---

## Getting Started

### Requirements

Use a current Node.js / npm environment.

### Install

```bash
npm install
```

### Development server

```bash
npm run dev
```

### Production build

```bash
npm run build
```

### Preview production build

```bash
npm run preview
```

### Lint

```bash
npm run lint
```

---

## Quality Checks

Before considering a change complete, run:

```bash
npm run lint
npm run build
git diff --check
```

The project is developed with TypeScript and ESLint enabled, and changes should not introduce TypeScript, lint, runtime, or build errors.

The adaptive-performance policy also has a dedicated repository test script:

```text
scripts/performance-policy.test.ts
```

---

## Development Guidelines

When extending the project:

- preserve the original design language
- avoid unnecessary redesigns of completed sections
- keep section-specific behavior isolated
- use React functional components and TypeScript
- prefer composition over monolithic components
- use CSS Modules for substantial component styling
- use design tokens / CSS variables for shared visual values
- use GSAP for DOM and scroll animation
- use Three.js / React Three Fiber for actual 3D, shaders, particles, and procedural visual effects
- do not use Three.js for ordinary DOM transitions
- avoid unnecessary dependencies
- avoid duplicate animation loops
- reuse the existing Lenis / GSAP architecture
- reuse the shared performance layer instead of adding independent device checks
- respect reduced-motion behavior
- maintain responsive and keyboard behavior
- clean up animation and WebGL resources correctly

---

## Important Notes

This repository represents a **frontend portfolio / concept implementation**, not a complete production SaaS application.

Authentication, account creation, onboarding, and product CTAs are presentation-level frontend interactions and are not connected to a production backend.

No real credentials are stored or authenticated.

The focus of the project is:

- UI / UX execution
- React architecture
- responsive frontend development
- advanced interaction design
- GSAP motion
- Three.js / WebGL
- adaptive performance
- accessibility-aware animation
- polished product presentation
- production-style frontend deployment

---

## Design & Development

UI/UX design and frontend implementation by **Andrii Kurus / LaimAnd**.

**Live Demo:**
https://andress84.github.io/figma-to-react-threejs-ai-landing/

**Figma:**
https://www.figma.com/design/CkBJVdCdnRiGaKfhlu3b9K/Automate-Workflows.-Scale-With-AI.?node-id=0-1&t=5Ny4wPgjOmTrOmG6-1

**GitHub:**
https://github.com/Andress84/figma-to-react-threejs-ai-landing

---

## Status

Active portfolio project.

The current implementation includes:

- complete responsive landing-page UI
- cinematic preloader
- interactive WebGL Hero
- scroll-driven Features and Results sections
- Pricing interaction
- FAQ
- Final CTA
- animated responsive navigation
- global fluid cursor
- frontend Login / Sign Up / onboarding demo
- Back-to-Top navigation
- High / Balanced / Low / Reduced adaptive-performance tiers
- offscreen and background rendering suspension
- reduced-motion behavior
- GitHub Pages deployment

The core frontend experience and the adaptive-performance optimization pass are complete.

Possible future work includes:

- production backend integration
- real authentication
- analytics
- further bundle / code-splitting optimization
- continued visual fine-tuning
