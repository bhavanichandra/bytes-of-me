# Journal — Spec

## Overview

Journal is a `/journal` page on the site: a monthly calendar of daily entries. One entry per date. Clicking a day with an
entry opens a bottom sheet with that day's optional title and note. It is a personal log, not a dashboard, and it is
discovered from the homepage through a small teaser (`JournalTeaser`), not a nav pill.

It replaces the earlier Journey page, which tracked progress against a Campaign / Quest curriculum. That concept is gone:
no campaigns, no quest labels, no quest types, no per-campaign colors, and no blog auto-linking. `/journey` redirects to
`/journal` (see `vercel.json`).

## Data model

Entries live in the `themuler-blogs` repo under `journal/`, one markdown file per date, named by date:
`journal/2026-08-11.md`. `scripts/fetch-content.sh` fetches the folder into `src/content/journal/` at build time, the same
way it fetches `blogs/` and `projects/`. The folder is optional; a missing `journal/` just means an empty journal.

```yaml
date: 2026-08-11       # yyyy-mm-dd, matches the filename
title: Short headline  # optional
```

The markdown body is the day's note. A date with no file is an unworked day; there are no explicit "not worked" records.
Because the filename is the date, there can be only one entry per day. The CMS refuses to create a second one.

## Pages and components

- `src/pages/journal.astro` — stat chips (current streak, best streak, total days), a month picker, the month's calendar,
  and the entry sheet. Keyboard: up and down arrows change month, Escape closes the sheet.
- `src/components/JournalTeaser.astro` — last 35 days as a small grid plus the current streak, linking to `/journal`.
- `src/lib/journal.ts` — pure calendar and streak logic (`buildDays`, `groupByMonth`, `currentStreak`, `bestStreak`,
  `totalDays`). Covered by `src/lib/journal.test.ts`.
- `src/lib/content.ts` — `getJournalEntries()` turns the collection into plain entries for both the page and the teaser.

An unlogged "today" does not break a live streak: it is dropped before counting.

Worked days are drawn in the site's pink accent. Motion follows the rest of the site (hard-stepped), except the entry sheet's
slide-up, which uses an eased transition.

## Authoring

Entries are written in `themuler-cms` (the Journal tab). Saves commit to the `drafts` branch of `themuler-blogs` and
reach the site through the normal publish PR. Deleting an entry in the CMS is also a commit on `drafts`, so it goes
live when that PR merges.

## Not specified

- Mobile layout below `md` stacks the month picker above the calendar by default; it has not been tuned.
