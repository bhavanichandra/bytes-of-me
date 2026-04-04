# AGENTS.md

## Scope
These instructions apply to the entire repository rooted here.

## Product Intent
This repository is a personal website.
Its purpose is to:
- showcase ideas and experiments
- showcase project demos and selected builds
- showcase blog content, including posts sourced from Hashnode

The site should feel personal, opinionated, and intentional rather than generic or template-like.

## Project Overview
- Framework: Astro 5
- Package manager: `bun`
- Styling: Tailwind CSS v4 via `@tailwindcss/vite`
- Animation library: `gsap`
- Runtime: Bun `1.3.11`

## Experience Goals
- Prioritize storytelling over feature sprawl.
- Treat the homepage and major sections as a portfolio narrative, not a dashboard.
- Keep the design expressive and memorable while staying readable on mobile and desktop.
- Favor motion that supports meaning, especially for hero sections, project reveals, and reading flow.
- Present projects and blog entries as evidence of thinking and craft, not just as link lists.

## Content Priorities
- Ideas: highlight thinking, perspective, and themes the site owner cares about.
- Projects: emphasize demos, outcomes, notable implementation details, and links that help visitors explore quickly.
- Blogs: keep reading paths clear and make external or imported blog content feel integrated with the rest of the site.

## Structure
- Pages live in `src/pages/`.
- Reusable UI belongs in `src/components/`.
- Global styles live in `src/styles/global.css`.
- Static assets belong in `public/`.

## Working Agreement
- Prefer small, surgical changes that fit the existing Astro project structure.
- Preserve the current visual direction unless the task explicitly asks for a redesign.
- Keep components and pages simple; avoid adding abstractions unless there is repeated logic.
- Prefer `.astro` components for presentational UI in this codebase.
- When adding styles, extend the existing global styling approach instead of introducing a parallel system.
- Keep file names and component names descriptive and consistent with the current naming.
- Avoid unnecessary inline comments.

## Commands
- Install dependencies: `bun install`
- Start dev server: `bun dev`
- Build production output: `bun run build`
- Preview production build: `bun run preview`
- Run Astro CLI: `bun run astro`

## Validation
- For code changes, validate with the narrowest relevant command first.
- Use `bun run build` as the default project-level verification unless the task only requires a smaller check.

## Git Hygiene
- Do not commit generated output such as `dist/` or `.astro/` changes.
- Respect existing user changes.
- Never delete or revert unrelated modifications.
- Keep `.gitignore` aligned with generated files and dependencies.
