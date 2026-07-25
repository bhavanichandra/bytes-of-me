# Blog Commenting Feature — Build Spec

## Overview

Blog commenting for the `bytes-of-me` Astro site, via a hybrid of two surfaces: **Giscus** (a public, GitHub Discussions-backed inline comment widget on every blog post) and a **private, invite-only Discord server** (a curated community/discussion layer separate from the site). The two are deliberately decoupled — Giscus is the public reaction surface for any reader, Discord is a personal, hand-invited space for deeper discussion and networking. No custom backend, no server, no database — consistent with `bytes-of-me` being a fully static Astro site with no SSR adapter.

This feature was decided in a single `/grilling` session on `bytes-of-me#45` ("Map: Blog Commenting Feature") — there are no GitHub sub-issues, just that one map issue's discussion. This document consolidates those decisions into a build-ready spec, so the feature can be implemented later without re-reading the conversation. Per the map's own destination, "done" here means **decisions + this written spec — not a shipped implementation, not a prototype.**

## Non-goals / constraints

- No custom comment backend (database, API, auth, hosting) — explicitly rejected as too much ongoing engineering and security surface (comment fields are a classic XSS/injection/spam attack surface) for what this feature needs.
- No third-party SaaS commenting service (Disqus, Cusdis, Commento, etc.) — ads/tracking baggage or self-hosting burden, and a poor fit for the site's pixel/hard-stepped design language (iframe-embedded, hard to reskin).
- No Utterances (GitHub Issues-backed alternative to Giscus) — would clutter the repo's Issues tab, which is already the active Wayfinder ticket-tracking workflow for this project.
- No public "Join our Discord" call-to-action anywhere on the site — the Discord server is private/invite-only by the owner's choice, not a public growth funnel for v1.
- Discord-side automated moderation bots (e.g. Wick, Carl-bot) are not part of v1 — native Discord features (AutoMod, verification level, rules screening, 2FA-for-mods) are judged sufficient at this server's expected small, invite-only scale.
- Giscus-side automated moderation (keyword-flagging Action, Akismet integration, repeat-offender tracking) is explicitly deferred — see "Deferred / optional appendix" below, not core v1 scope.

## Mechanism decision

**Chosen: hybrid — Giscus + private Discord.**

Alternatives considered and rejected:
- **Utterances** — same GitHub-native approach as Giscus but backed by Issues instead of Discussions; rejected because it would mix comment threads into the same Issues tab used for this repo's project/task tracking.
- **Third-party SaaS** (Disqus, Cusdis, Commento) — Disqus has built-in spam/profanity filtering but carries ads and tracking; Cusdis/Commento are cleaner but either need self-hosting (a small server/DB, reintroducing backend burden) or are still an embedded widget that's hard to visually integrate with the site's design language. Rejected in favor of a solution with a better cost/control balance.
- **Fully custom backend** — full control over data model, moderation, and UI, but requires building and maintaining a database, API, auth, spam/profanity defenses, a moderation dashboard, and hosting indefinitely. Rejected outright as disproportionate effort and standing security liability for a personal blog's comment section.

**Why the hybrid works:** Giscus needs zero backend and fits a developer-audience site (readers likely already have GitHub accounts); Discord natively solves the moderation problem (profanity, spam, malware links, misbehaving users, bots) far better than any comment widget can, via its built-in AutoMod and safety tooling, while also directly serving the owner's stated goal of building real connections/community — something no comment widget does.

## Phase 1 — Discord Foundation

- **Access model:** private / invite-only. The owner personally invites people they know; there is no public join link anywhere on the site. This is why there is **no Discord touchpoint on the site at all in v1** — Giscus is the only public-facing comment surface (see Non-goals).
- **Channel structure:** static topic channels for general community/networking (e.g. `#general`, `#introductions`) **plus** a dedicated **Forum Channel** (`#blog-posts`) for per-post discussion, one forum "post" per blog post.
  - Rejected: a plain **Media Channel** for this purpose — confirmed via Discord's official channel-resource docs that Media Channels (`GUILD_MEDIA` type) are a gallery-style channel type for image/video-first content, not text discussion; structurally similar to Forum Channels but the wrong content model here.
  - Rejected: per-post threads inside an ordinary text channel — threads auto-archive after inactivity and aren't as browsable/searchable long-term as a Forum Channel's native post index/tags/sort.
  - Rejected: a single flat `#blog-discussion` channel with no per-post structure — multiple posts' discussions would interleave in one stream, hard to follow once there's any volume.
- **Verification level: Medium** (member must have been registered on Discord for more than 5 minutes before posting). Chosen as the balance point on Discord's 5-level scale (None / Low / Medium / High / Highest) — blocks fresh-off-the-shelf bot/raid accounts without asking legitimate invitees for a phone number (Highest) or an in-server wait period (High).
- **Rules Screening (Membership Screening): enabled** — new members must explicitly accept a rules message before they can see/post in any channel.
- **AutoMod: all native rule types enabled**
  - Keyword/profanity filter (custom word list).
  - "Block Spam Content" (Discord's own widely-reported-spam detection).
  - Malicious/scam link blocking (Discord's own maintained scam/malware domain list).
  - Mention-spam blocking (excessive @mentions).
  - Actions: block the message and alert a mod-log channel; auto-timeout for repeat/severe triggers.
- **2FA Requirement for Moderation: enabled** (Server Settings → Safety Setup) — requires anyone with moderator/admin permissions (including the owner) to have 2FA enabled on their Discord account before using mod powers (message deletion, role/permission management, etc.), protecting against a compromised mod account being used to damage the server.
- **Deferred / optional:** a dedicated anti-raid/moderation bot (e.g. Wick, Carl-bot) for capabilities Discord doesn't do natively (e.g. mass-join raid auto-lock, deeper audit-log alerting). Not needed for v1 given the server's small, invite-only scale; native AutoMod + verification + rules screening is judged sufficient. Revisit only if the server grows significantly.

## Automation — `enableComments` frontmatter field

A new frontmatter field, `enableComments` (boolean, **default `false`**), added to blog post entries in `themuler-blogs`. It gates **only** the Discord forum-thread automation — Giscus is unconditionally on for every post regardless of this flag (see Phase 2).

Mechanism:
- A step is added to the existing `themuler-blogs` publish GitHub Action (the one that already fires on push to `main` and calls the Vercel deploy hook, per `bytes-of-me#13`).
- That step diffs the push for **newly added** post files only (not edits to existing posts) and reads each new post's frontmatter.
- If `enableComments: true`, it POSTs to a Discord webhook URL (stored as a `themuler-blogs` Actions secret, following the same pattern as the existing `VERCEL_DEPLOY_HOOK_URL`) with `thread_name` set to the post's title and message content linking to the live post URL.
- Confirmed via Discord's official webhook API docs: the execute-webhook endpoint creates a new forum/media-channel post when called with a `thread_name` parameter (mutually exclusive with `thread_id`, which targets an existing thread instead) — valid only when the webhook's target channel is a Forum or Media channel, which `#blog-posts` is.
- **Idempotent by construction**: since the Action only acts on newly-added files in a given push (not on every rebuild or edit), each post can only ever trigger one forum-thread creation.

## Phase 2 — Giscus (public inline comments)

- Requires enabling **GitHub Discussions** on `bytes-of-me` (currently disabled on the repo).
- A dedicated Discussion category, **"Blog Comments"**, set to **Announcement format** — only the repo admin (or Giscus acting on their behalf) can start new discussions in that category; visitors can only reply. Rejected "Open-ended discussion" format, which would let anyone start unrelated discussions in the same category, diluting it from a clean 1:1 mirror of blog posts.
- **Mapping strategy: `term` = the post's frontmatter slug**, an explicitly-passed fixed identifier — chosen over Giscus's `pathname` mapping (breaks if a post's URL slug is ever changed) and `og:title` mapping (breaks if the post's title is ever edited, and depends on `og:title` being reliably present on every page). The frontmatter slug is already a stable, existing identifier in the content schema, making it the most durable choice.
- **Theme: a custom-hosted Giscus theme CSS file** (e.g. `public/giscus-theme.css`), not one of Giscus's stock presets — so the widget visually matches the site's warm-dark (`#1a1918`) base and grain texture instead of looking like a generic bolted-on GitHub widget, consistent with the significant existing design-language investment in this site (pixel frames, tier accent colors, grain background).
- **Reactions: enabled** (native GitHub emoji reactions on the top-level discussion post) — low-friction engagement for readers who want to react without writing a comment; introduces no extra moderation surface since reactions carry no text or links.
- **Placement/UX: a closed-by-default, dismissible slide-in side panel**, not an inline comment box placed directly in the post's reading flow (top or bottom). This reuses the site's existing slide-in panel UI vocabulary (the corner panel in `Layout.astro`, `LanyardCard`) for visual consistency, and is revealed via a small monospace terminal-style line placed at the end of each post's content, extending the existing `$ cat bio.txt` blinking-cursor convention already used in `PageIntro.astro` — e.g.:
  ```
  $ end post.md
  $ open comments --thread
  ```
  Clicking the CTA line triggers the panel's reveal, which should be **hard-stepped** (`steps()`), per the motion guidelines in `bytes-of-me#19`, not a smooth easing transition.
  - Rationale: keeps the reading flow uncluttered, matching `AGENTS.md`'s "storytelling over feature sprawl" principle, while still surfacing that comments exist (unlike a fully hidden panel with no visible affordance). Also gives a natural lazy-load boundary — the Giscus script only needs to load once the panel is opened, which is good for initial page performance, though the exact lazy-load wiring is left as an implementation detail for the builder.
- **On unconditionally for every post** — no frontmatter gate (unlike the Discord side, which is gated by `enableComments`).

## Deferred / optional appendix (not core v1 scope)

- **Phase 3 — Giscus-side automated moderation.** A GitHub Action triggered on the `discussion_comment` webhook event, checking new comments against a keyword/regex blocklist and/or the Akismet spam-check API, then acting via the GitHub Discussions GraphQL API's `minimizeComment` mutation (collapses the comment with a reason — `spam`, `abuse`, or `off-topic` — reversible, leaves a moderation trail) or `deleteDiscussionComment` (hard delete, no trail).
- **Phase 5 — repeat-offender tracking.** A stateful mechanism (e.g. a JSON file of flagged GitHub usernames committed back to the repo) to detect and escalate against users who are repeatedly flagged on the Giscus side.
- **Why deferred:** Giscus already requires a GitHub account to comment, which filters out the casual bot/throwaway spam that plagues open comment forms. Comment volume on a personal blog is expected to be low enough that manual delete/lock via GitHub's own UI is sufficient day-to-day. The heavier moderation need — profanity, bots, malware links, raids — is already covered natively by Discord's AutoMod on the community side. Building and maintaining this automation now would be disproportionate to the feature's current scale; revisit if/when comment volume ever grows enough to make manual cleanup a real chore.

## Out of scope

- A fully custom comment backend (database, API, auth, hosting) — rejected outright, see Mechanism decision.
- Any public-facing Discord invite/CTA on the site — see Non-goals.

## Related, separately-tracked idea

`bytes-of-me#48` — "Map: Open-Source Blog Template/Starter Kit" (templatizing the whole site, its content pipeline, and this commenting feature into a forkable starter for others) explicitly notes a dependency on this feature landing first. Not folded into this spec; referenced here only for provenance.

## Source material

- [bytes-of-me#45 — Map: Blog Commenting Feature](https://github.com/bhavanichandra/bytes-of-me/issues/45) — the map issue under which every decision in this spec was made, via a single `/grilling` session (no sub-issues).
