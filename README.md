# bytes-of-me

Bhavani Chandra's personal site — writing, projects and the daily journal, merged
into one feed. Built with [Astro](https://astro.build) and deployed on Vercel.

## Stack

- **Framework:** Astro 7
- **Package manager:** [bun](https://bun.sh)
- **Styling:** Tailwind CSS v4 (`@tailwindcss/vite`)
- **Animation:** gsap
- **Content:** blog posts, projects and journal entries live as Markdown
  collections under `src/content/`, fetched at build time from the
  [themuler-blogs](https://github.com/bhavanichandra/themuler-blogs) repo via
  `scripts/fetch-content.sh`

## Project structure

```text
/
├── public/                 static assets, Giscus theme CSS
├── scripts/
│   └── fetch-content.sh    pulls blogs/projects/journal from themuler-blogs
├── src/
│   ├── components/         Astro UI components
│   ├── content/             synced content collections (blogs, projects, journal)
│   ├── layouts/             shared page shell (theme, nav, tag panel)
│   ├── lib/                 content loading, icons, theming helpers
│   ├── pages/                routes (home, about, now, blog/project detail pages)
│   └── styles/               global Tailwind + theme tokens
└── package.json
```

## Commands

All commands run from the root of the project:

| Command                | Action                                               |
| :---------------------- | :---------------------------------------------------- |
| `bun install`           | Install dependencies                                   |
| `bun dev`                | Fetch content, then start the dev server at `localhost:4321` |
| `bun run build`          | Fetch content, then build the production site to `./dist/` |
| `bun run preview`        | Preview the production build locally                   |
| `bun run astro ...`      | Run Astro CLI commands (`astro add`, `astro check`, …) |
| `bun test`                | Run tests                                               |

## Design notes

- Light/dark theme is token-driven (`--bg`, `--ink`, `--surface`, `--border`,
  …) in `src/styles/global.css` — components should read these instead of
  hardcoding colors.
- All text (headings, body copy, and UI labels) uses Lora; code uses Space Mono.
- Comments are powered by [Giscus](https://giscus.app) and re-theme live to
  match the site's light/dark toggle.
