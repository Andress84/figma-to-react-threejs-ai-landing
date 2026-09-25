# Automate Workflows. Scale With AI.

A high-end interactive AI SaaS landing page designed in Figma and developed as a modern frontend portfolio showcase.

The project combines a custom responsive UI with cinematic scroll transitions, WebGL effects, procedural backgrounds, particle systems, fluid cursor interaction, smooth scrolling, and accessibility-aware motion.

> This is a frontend concept / portfolio project.
> The UI/UX design is original and was created specifically for this implementation.

## Design

**Figma source:**
https://www.figma.com/design/CkBJVdCdnRiGaKfhlu3b9K/Automate-Workflows.-Scale-With-AI.?node-id=0-1&t=5Ny4wPgjOmTrOmG6-1

The implementation follows the original Figma direction while extending it with interactive motion, WebGL effects, scroll choreography, pointer interaction, and responsive behavior.

---

## Overview

The landing page presents a fictional AI SaaS platform focused on workflow automation and team productivity.

The project was built as a portfolio case study demonstrating the complete workflow from:

**UI/UX design in Figma → React architecture → responsive implementation → advanced animation → WebGL interaction → performance and accessibility polish.**

The goal is not only to reproduce a static design, but to turn it into a polished, immersive web experience suitable for a modern SaaS product.

---

## Highlights

### Interactive WebGL Hero

The Hero includes a custom Three.js / React Three Fiber scene with:

- animated procedural light fields
- particle layers
- depth and atmospheric effects
- pointer interaction
- responsive rendering profiles
- controlled device pixel ratio
- reduced-motion and constrained-device behavior

The WebGL scene is integrated with the rest of the page rather than treated as a standalone visual demo.

### Cinematic Preloader

The opening sequence uses a custom preloader built around:

**Particle Core → Energy Orbit → compression → particle release → seamless Hero reveal**

The Hero is already mounted beneath the preloader, allowing the transition to reveal the live scene without a black frame or a second page-load animation.

The preloader also handles:

- font readiness
- Hero/WebGL readiness
- bounded fallback timing
- scroll locking
- Lenis synchronization
- responsive particle density
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

The project uses **Lenis** for smooth scrolling on full-performance devices.

Lenis is synchronized with GSAP / ScrollTrigger through the existing animation ticker instead of introducing independent animation loops.

Navigation links, FAQ navigation, and the Back-to-Top control use the same scrolling architecture.

### Custom Fluid Cursor

Desktop fine-pointer devices receive a custom cursor system featuring:

- damped pointer movement
- interactive hover state
- translucent hover circle
- WebGL fluid trail
- persistent velocity/color simulation
- fluid movement across section boundaries
- foreground masking so text, cards, buttons, and controls remain readable

The fluid layer is dynamically loaded and disabled for coarse pointers and reduced-motion environments.

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

### FAQ

The FAQ section includes:

- animated section entrance
- atmospheric star field
- animated decorative rings
- smooth accordion transitions
- accessible expandable questions
- direct navigation through the `#faq` anchor

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

- animated show/hide behavior
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

---

## Architecture

The application is organized around reusable UI primitives, section-specific components, animation hooks, data modules, and isolated WebGL systems.

```text
src/
├── assets/
├── components/
│   ├── animation/
│   ├── sections/
│   ├── three/
│   └── ui/
├── data/
├── hooks/
├── styles/
├── types/
├── App.tsx
└── main.tsx
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
- performance profiling
- shaders and Three.js utilities

### `components/ui`

Contains shared interface and experience-level components such as:

- buttons
- layout primitives
- global cursor
- preloader
- Back-to-Top control

### `components/animation` and `hooks`

Contain shared motion infrastructure including:

- Lenis integration
- reusable smooth-scroll targeting
- GSAP setup
- section transition timelines
- performance-aware animation behavior

---

## Performance Strategy

The project uses three rendering profiles:

- `full`
- `constrained`
- `reduced`

The active profile depends on pointer capabilities and the user's motion preferences.

Performance measures include:

- DPR caps for WebGL
- lower-cost rendering on coarse-pointer devices
- reduced particle density where appropriate
- lazy loading of expensive visual systems
- pausing unnecessary animation work
- reusing the GSAP ticker instead of adding multiple permanent RAF loops
- cleanup of listeners, timelines, canvases, and WebGL resources
- reduced-motion fallbacks

The interface remains usable without the full WebGL experience.

---

## Accessibility

Accessibility is treated as part of the implementation rather than an afterthought.

Current considerations include:

- semantic section structure
- keyboard-accessible controls
- visible focus behavior
- animated mobile-menu focus management
- Escape-key menu closing
- skip-to-content navigation
- appropriate ARIA states
- decorative graphics excluded from accessibility semantics
- `prefers-reduced-motion` handling
- native cursor fallback for touch/coarse-pointer devices

---

## Responsive Design

The implementation is designed for:

- large desktop displays
- standard desktop / laptop screens
- tablets
- mobile devices

Layouts and animation behavior are adapted rather than simply scaled down.

Heavy pointer/WebGL interactions are reduced or removed where they do not make sense on touch devices.

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
- respect reduced-motion behavior
- maintain responsive and keyboard behavior
- clean up animation and WebGL resources correctly

---

## Important Notes

This repository represents a **frontend portfolio / concept implementation**, not a complete production SaaS application.

Some UI actions such as authentication, account creation, and product CTAs are presentation-level interactions and are not connected to a production backend.

The focus of the project is:

- UI/UX execution
- React architecture
- responsive frontend development
- advanced interaction design
- GSAP motion
- Three.js / WebGL
- performance-aware animation
- polished product presentation

---

## Design & Development

UI/UX design and frontend implementation by **Andrii Kurus / LaimAnd**.

**Figma:**
https://www.figma.com/design/CkBJVdCdnRiGaKfhlu3b9K/Automate-Workflows.-Scale-With-AI.?node-id=0-1&t=5Ny4wPgjOmTrOmG6-1

---

## Status

Active portfolio project.

The primary landing-page experience, responsive layouts, motion system, WebGL effects, navigation, pricing interaction, FAQ, preloader, custom cursor, and final CTA are implemented.

Further work may include deployment polish, performance optimization, visual fine-tuning, and production integration where required.