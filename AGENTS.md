# AGENTS.md

## Project

AI SaaS Landing Page — public portfolio frontend showcase.

The original UI/UX design was created by the project author.

The goal is to reproduce the supplied design as a polished,
production-style React frontend suitable for GitHub and GitHub Pages.

## Core Stack

- React
- TypeScript
- Vite
- Modern CSS
- Three.js
- React Three Fiber
- React Three Drei
- GSAP
- ESLint

## Architecture

Use the existing structure:

src/
├── assets/
├── components/
│   ├── sections/
│   ├── three/
│   └── ui/
├── data/
├── hooks/
├── styles/
├── types/
├── App.tsx
└── main.tsx

## Development Rules

- Preserve the supplied design closely.
- Do not redesign sections unless explicitly requested.
- Use semantic HTML.
- Use React functional components and TypeScript.
- Keep components focused and reusable.
- Prefer composition over monolithic components.
- Do not place the entire page inside App.tsx.
- Do not introduce unnecessary dependencies.
- Do not use Tailwind CSS.
- Do not use Bootstrap.
- Do not introduce a UI component library.
- Use modern native CSS and CSS custom properties.
- Keep reusable design values in the token system.
- Build responsive layouts mobile-first.
- Support keyboard navigation where appropriate.
- Respect prefers-reduced-motion.
- Decorative elements must not pollute accessibility semantics.

## Animation

Use Three.js / React Three Fiber for WebGL effects:

- procedural backgrounds
- particles
- flowing light effects
- shaders
- subtle pointer interaction

Use GSAP for DOM animation:

- reveals
- counters
- scroll-based motion
- transitions
- micro-interactions

Do not use Three.js for ordinary DOM animation.

Animations must enhance the design without harming readability,
accessibility or performance.

## Performance

- The page must remain usable without WebGL.
- Do not block initial content rendering with Three.js.
- Lazy-load expensive effects when appropriate.
- Keep WebGL DPR under control.
- Avoid excessive particle counts.
- Optimize image assets.
- Avoid unnecessary React re-renders.
- Preserve good Lighthouse performance.
- Provide a reduced-motion experience.

## Styling

- Use the global token system.
- Prefer CSS Modules for substantial component-specific styling.
- Avoid inline styles unless values genuinely need runtime calculation.
- Use clamp() where appropriate.
- Prefer CSS Grid and Flexbox.
- Avoid excessive magic numbers.

## Quality Gate

Before considering work complete, run:

npm run lint
npm run build

Do not leave TypeScript, ESLint or build errors.

## Scope Discipline

When asked to work on one section, do not implement unrelated sections.

For broad architectural changes, inspect the existing project first
and explain the intended approach before modifying multiple areas.