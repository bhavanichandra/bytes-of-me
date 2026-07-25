# Journey / Progress-Tracking Page — Build Spec

## Overview

Journey is a `/journey` page on the `bytes-of-me` Astro site: a game-styled, Mario-Kart-esque monthly calendar grid that tracks daily work (Campaign / Sub Quest / Side Quest) against the curriculum authored in the sibling `stackcraft` repo (`stackcraft/curriculum/`, structured as Campaign → Main Quest → Sub Quest / Side Quest). Clicking a worked day opens a "Quest Debrief" panel showing that day's Campaign, quest, a note, and a link to the matching blog post once one is published. It exists to make curriculum progress visible and narratively framed (a personal worklog), not as an admin dashboard. It is discovered from the homepage via a small teaser widget, not a nav pill.

This feature was decided across `stackcraft` issues #32–#38 (map + 6 sub-issues, all closed) but never implemented — only a throwaway prototype branch (`prototype/journey-log-grid` on `bytes-of-me`, using mock data) exists. This document consolidates those decisions plus the concrete details already worked out in that prototype code, so it can be implemented without re-reading any GitHub issue.

## Non-goals / constraints

- The homepage stays bio-first and visually unchanged as the front door — no redesign, no dashboard framing. Journey is additive.
- `/journey` is not a literal dashboard; it's narrative-styled, consistent with `AGENTS.md`'s "portfolio narrative, not a dashboard" guidance.
- Not copying gridmylife.com's literal boolean-streak-tracker visual design — only the "click a day in a grid" concept was borrowed.
- No rail nav pill for Journey (superseding an earlier draft in stackcraft#35 that considered one) — discovery is teaser-only, per stackcraft#38's final resolution.
- Blog commenting is a separate, unrelated feature (see `docs/specs/blog-commenting.md` once written) — not part of this scope.
- `bytes-of-me` does not fetch `stackcraft`'s `curriculum/` at build time — Campaign/Quest labels are duplicated into journey entries' own frontmatter instead (see Data model), keeping `themuler-blogs` self-contained.

## Information architecture

- Page lives at `src/pages/journey.astro`, route `/journey`.
- `/journey` is content-only: it does **not** render the shared `PageIntro` bio or the Blogs/Projects nav (`Rail`/`RailNav`) that other pages use — those don't apply to a focused sub-page. It has its own small `← back` link (top-left, `font-mono text-xs`) as the only way back to the homepage, since dropping the shared nav also removed that path.
- Discovery is exclusively via a `JourneyTeaser` widget in the homepage's narrow left rail, positioned below the existing Blogs/Projects nav pills. No entry is added to the Blogs/Projects pill nav itself.

## Data model

Progress data lives in the `themuler-blogs` repo (the same repo `bytes-of-me` already fetches `blogs/`/`projects/` from at build time via `scripts/fetch-content.sh`), in a new `journey/` folder — one markdown file per day, named by date, e.g. `journey/2026-07-24.md`.

Frontmatter per entry:
```yaml
date: 2026-07-24        # yyyy-mm-dd, also derivable from filename
campaign: nlp-transformers   # matches a Campaign key/slug from stackcraft's curriculum
quest: "Sub Quest 2"    # free-text quest label
quest_type: sub          # "sub" | "side" — Sub Quest or Side Quest
```
The markdown body is the day's note (free text, shown in the Quest Debrief panel).

Only days that were actually worked get a file — an "unworked" day is simply the absence of an entry for that date, not an explicit `worked: false` record. (The prototype's mock data used an explicit `worked: boolean` field per day for its full-year mock generation convenience — that's an artifact of mocking, not a decision to persist a record for every calendar day.)

Blog posts (in `themuler-blogs`'s `blogs/` collection) gain one new **optional** frontmatter field, `quest`, using the same identifier convention as journey entries' `quest` field. At build time, a journey day auto-links to a blog post when their `quest` values match — no manual cross-referencing needed after publishing.

Campaign identity (label + accent color) is not fetched from `stackcraft` — each journey entry's `campaign` value is a slug that resolves via a small static lookup table maintained in `bytes-of-me` itself (mirroring the prototype's `CAMPAIGNS` map in `journeyMockData.ts`, e.g. `{ "ai-foundations": { label: "AI Foundations", color: "#22d3ee" }, ... }`). This table must be kept in sync with `stackcraft/curriculum/`'s actual Campaign folder names by hand; there is no automated sync (flagged as an open question below).

`bytes-of-me` fetches `journey/*.md` the same way it fetches `blogs/`/`projects/`, via `fetch-content.sh`, replacing the prototype's mock data generator (`buildMockDays()` in `journeyMockData.ts`, which is prototype-only and must not ship).

## Authoring mechanism

Real journey entries (and blog/project content generally) are authored through **Sveltia CMS**, not hand-edited markdown/YAML:

- An admin UI mounted at `bytes-of-me/public/admin`, covering `blogs`, `projects`, and `journey` as three collections in one tool, committing directly to `themuler-blogs`.
- Chosen over Decap CMS (unmaintained, assumes Netlify hosting) and over a custom SvelteKit + backend (rejected as too much new infrastructure for what's fundamentally a form that writes markdown files).
- Auth: GitHub OAuth via a small serverless function inside `bytes-of-me`, deployable on Vercel's Hobby tier (well within its free-tier invocation/CPU limits for personal-use auth traffic). Access is naturally restricted to the repo owner via GitHub's own permission model — no additional access control needed.

**Not yet designed (explicit TODO for the builder):**
- The exact Sveltia CMS collection schema (field-by-field widget config for `blogs`, `projects`, and `journey` collections in Sveltia's `config.yml`).
- The OAuth serverless function implementation itself (route, token exchange, session handling).

## UI/UX spec

Design language throughout: Space Grotesk (prose) / Space Mono (labels/accents), pixel-corner `PixelFrame` components, hard-stepped (`steps()`) motion only — never smooth easing — dark grain background (`#1a1918` base), consistent with the rest of the site (`AGENTS.md`, existing `PixelFrame`/`PixelIcon` components).

**Header row:** a `$ cat journey.log` mono label, plus three `PixelFrame` stat chips: "Current streak", "Best streak" (both neutral), and "Total days" (pink-accented, `#f472b6`/pink-400 tint).

**Month selector + calendar (two-column layout, `md:grid-cols-[26rem_1fr]`):**
- Left: a 2-column button list of all 12 months (`Jan`–`Dec` 2026), each row showing a small `PixelIcon` tinted to that month's dominant Campaign color (dominant = the Campaign with the most worked days that month), the month label, and — for months with zero logged days — a "No logs yet" sub-label at reduced opacity. The currently-selected month gets a pink left-border/background highlight and a `▶` marker.
- Right: one large calendar grid for the selected month only (other months' panels are `hidden`, toggled via a small carousel script, not re-rendered). 7 columns (Mon–Sun labels), day-of-month number shown in every cell. Worked days: solid pink (`bg-pink-400`) cells, clickable, subtle `hover:scale-105`. Unworked/empty days: dim (`bg-white/5`), disabled, non-interactive.
- Switching months triggers a `steps(4, end)` "blip" animation (fade+scale, 0.35s) on the newly shown panel, respecting `prefers-reduced-motion`.
- Keyboard: `ArrowUp`/`ArrowDown` move the selected month (ignored while focus is in an input/textarea/contenteditable).

**Quest Debrief panel:** a bottom-sheet (fixed, bottom-anchored, slides up via `translate-y` transition — the one non-`steps()` transition in this spec, using `duration-300 ease-out`, since it's a sheet reveal not a "hard" UI beat) opened by clicking any worked day cell, with a dimmed backdrop (click-to-close, plus `Escape` key and an explicit close button). Shows: date, Campaign name (colored to match that Campaign's accent), a Sub Quest/Side Quest tag pill, the day's note (falling back to `"Worked on {quest}."` if no note), and — when the day's quest matches a published blog post — a "Field notes: {blog title} →" link to `/blogs/{post-id}`.

**Empty note fallback:** if a worked day has no note text, the debrief still shows a generated fallback line (`Worked on {quest}.`) rather than leaving that area blank.

## Homepage integration

`JourneyTeaser` (`src/components/JourneyTeaser.astro`, not prefixed `prototype/` once real) sits in the homepage's narrow left rail, below the existing Blogs/Projects nav pills:
- A "Journey" mono label header.
- A wrapped 7-per-row grid of the last 35 days (5 weeks), each cell colored to its Campaign's accent when worked, dim (`bg-white/5`) otherwise — sized to fit the rail's ~16rem width.
- Current streak count (pink-accented number + "day streak" label).
- A "View →" link, whole widget wrapped in a single `<a href="/journey">`.

## Open questions / not yet specified

- Sveltia CMS collection schema details (exact fields/widgets per collection) and the OAuth serverless function implementation — mechanism is decided, wiring isn't built.
- How the Campaign slug→label/color lookup table in `bytes-of-me` stays in sync with `stackcraft/curriculum/`'s actual folder structure (currently no automated link between the two; drift is possible if curriculum folders are renamed/added).
- Whether/how a retrospective Side-Quest-revisit convention (appending a follow-up section to an earlier blog post) is reflected in the journey log, if at all.
- Exact `journey/` filename collision behavior if more than one entry is logged for the same date (not addressed in any prior decision).
- Mobile layout for the month-selector + calendar two-column layout — the prototype only specifies `md:grid-cols-[26rem_1fr]`; behavior below `md` isn't specified anywhere in the source issues or prototype beyond it presumably stacking to a single column via the mobile-first default.

## Source material

- [stackcraft#32 — Wayfinder Map: Journey/Progress-Tracking Page](https://github.com/bhavanichandra/stackcraft/issues/32) (map, closed)
- [stackcraft#33 — Where does the journey/log page live, dashboard vs narrative framing?](https://github.com/bhavanichandra/stackcraft/issues/33)
- [stackcraft#34 — Prototype the day-grid + daily-log UI direction](https://github.com/bhavanichandra/stackcraft/issues/34)
- [stackcraft#35 — Where does Journey surface relative to the homepage?](https://github.com/bhavanichandra/stackcraft/issues/35)
- [stackcraft#36 — Define how real progress state is derived](https://github.com/bhavanichandra/stackcraft/issues/36)
- [stackcraft#37 — Scope the blog-commenting feature relative to this map](https://github.com/bhavanichandra/stackcraft/issues/37)
- [stackcraft#38 — Design the homepage teaser strip and nav item for Journey](https://github.com/bhavanichandra/stackcraft/issues/38)
- `bytes-of-me` branch `prototype/journey-log-grid`, commits `9fbff97` (initial variants + `/journey` page), `fe36534` (Quest Debrief panel + month carousel refinement), `82d4368` (homepage teaser + content-only `/journey`) — local clone at `~/personal/bytes-of-me-journey-prototype`.
