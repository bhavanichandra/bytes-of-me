# Batch-Publish Workflow for `themuler-cms` — Research Findings

## Context

`themuler-cms` (Sveltia CMS, static/CDN-loaded, GitHub-OAuth, no backend) commits content edits to the `themuler-blogs` repo. The desired workflow: edits across multiple different entries accumulate with no PR opened, until the owner explicitly signals "ready to publish," at which point **one** PR opens covering everything accumulated. A GitHub Action then runs an LLM editorial-review pass on the PR diff, posting suggestions as review comments (not auto-committed). The owner reviews and merges manually, which triggers the existing `themuler-blogs` → Vercel deploy-hook Action.

This document evaluates whether any existing tool satisfies this natively, and otherwise recommends a pattern.

## Verdict / Recommendation

**No git-based CMS — including Sveltia itself — natively bundles edits to multiple different entries into one PR opened by an explicit separate "publish" signal.** The two workflow shapes that exist in the wild are:

1. **Per-entry branch + per-entry PR** (Decap/Sveltia's `editorial_workflow` design) — the wrong shape; explicitly rejected by the desired workflow.
2. **Per-session branch, manual or automatic PR** (Keystatic, TinaCMS, Pages CMS-under-branch-protection) — closer, but still tied to the CMS's own branch-switching UI, and "session" boundaries are still drawn by the CMS, not by the site owner's own "ready to publish" action.

**Recommended approach: Question 4's CMS-agnostic pattern — keep Sveltia in `simple` publish mode, pointed at a persistent `drafts` branch, and drive PR-opening with an external trigger (script or GitHub Action) that runs `gh pr create --base main --head drafts` on demand.**

Rationale:
- Sveltia does not implement `editorial_workflow` at all yet (see Q2/Q4below) — its only functional mode today is direct/simple commits to a configured branch. Changing where it commits (`drafts` instead of `main`) requires only a one-line config change to `themuler-cms`'s `config.yml` (`backend.branch: drafts`), not a CMS migration.
- This is architecturally identical to what Keystatic (session branch, manual PR-open) and TinaCMS (session branch, automatic PR-open) already do under the hood, per the source-level findings in Q3 — so it isn't a novel or fragile idea, just implemented one layer below the CMS instead of inside it.
- It fully decouples "accumulate edits" from "open PR," which is exactly the requirement, and needs zero new hosted infrastructure: no Keystatic server runtime, no GitHub App, no switch away from the already-working Sveltia setup in `themuler-cms`.
- The LLM editorial-review Action (Q5) attaches the same way regardless of CMS — it triggers on `pull_request` events against `main`, so it is unaffected by this choice and can be built with `anthropics/claude-code-action`.

Cost: one small new script/Action (`open-draft-pr.yml`, manually dispatched) plus a documented process for resetting/rebasing the `drafts` branch after each merge (see Q4 gotchas below). This is meaningfully less new infrastructure than adopting Keystatic (which would additionally require replacing `themuler-cms`'s static/CDN deployment with a Next.js-style server runtime and GitHub App auth) or TinaCMS (requires TinaCloud or self-hosted GraphQL backend for the editorial workflow feature).

---

## Q1 — Other git-based CMS tools with native multi-entry-then-single-PR publish

Checked against primary docs/source, restricted to tools that commit directly to a git repo (no hosted DB/proprietary content API):

| Tool | Branch/PR granularity | Native multi-entry bundling into one explicitly-triggered PR? | Source |
|---|---|---|---|
| **Decap CMS** | One branch + one PR **per entry** (`cms/<collection>/<slug>`) | No — explicitly entry-centric | [decapcms.org/docs/editorial-workflows](https://decapcms.org/docs/editorial-workflows/) |
| **Sveltia CMS** | `editorial_workflow` mode is **not implemented yet** ("will be added before the 1.0 release"); only `simple` (direct commit) mode is functional today | N/A — feature doesn't exist yet | [sveltiacms.app/en/docs/workflows/editorial](https://sveltiacms.app/en/docs/workflows/editorial) |
| **Keystatic** (GitHub mode) | One branch **per manually-created session** (`CreateBranchDialog`), not per entry. Local edits across any number of entries are queued and committed together via an explicit "Commit changes…" batch-commit dialog. PR is **not created automatically** — the UI only deep-links to GitHub's `/pull/new/<branch>` compare page, or shows the existing PR number if one exists (`useAssociatedPullRequest`). | **Partially** — multiple entries *can* land in one PR, but only within one branch/session, and PR-opening is a manual GitHub-UI action, not a distinct "publish" signal inside Keystatic itself | Source-level: `packages/keystatic/src/app/branch-selection.tsx` (`CreateBranchDialog`), `packages/keystatic/src/app/shell/BatchCommits.tsx` (`BatchCommitsDialog`), `packages/keystatic/src/app/dashboard/BranchSection.tsx` (`href={`${repoURL}/pull/new/${currentBranch}`}`) in [github.com/Thinkmill/keystatic](https://github.com/Thinkmill/keystatic). Docs at [keystatic.com/docs/github-mode](https://keystatic.com/docs/github-mode) do **not** document this branch/PR granularity — this had to be inferred from source, as flagged in the task. |
| **TinaCMS** (Editorial Workflow, TinaCloud) | One branch **per save-triggered session** off a protected branch ("When you are on a protected branch and click 'Save,' a modal will prompt you to enter the name of the new branch"), and "all subsequent edits are made on this new branch" — i.e., multiple different entries can accumulate on that branch. A **draft PR is created automatically** the first time you save to a new branch name. | **Closest native match** to the desired shape — session-scoped branch, multiple entries bundle, PR auto-opens — but the "session" is still whatever branch name the editor typed at first-save time, not a distinct later "ready to publish" trigger; and it requires TinaCloud (or a self-hosted Tina data layer), not a static/CDN-only setup like Sveltia. | [tina.io/docs/tinacloud/editorial-workflow](https://tina.io/docs/tinacloud/editorial-workflow) |
| **Pages CMS** | Branch-scoped editing (reads `.pages.yml` "per repository and per branch"), but has **no built-in PR-creation feature** at all in the codebase — when a repo has branch-protection rules requiring PRs, the app's own error message tells the user to "save to a different branch or fork, or ask a maintainer to relax the repository rule," implying manual PR creation on GitHub afterward. | No native PR bundling feature found | Docs: [pagescms.org/docs/configuration](https://pagescms.org/docs/configuration/). Source-level: grep of [github.com/pages-cms/pages-cms](https://github.com/pages-cms/pages-cms) `app/api/[owner]/[repo]/[branch]/files/[path]/route.ts:355` — the only PR-related string in the codebase is that branch-protection error message; no `pulls.create`/PR-open code exists. |
| **Outstatic** | Git-backed, commits directly via GitHub API; marketing copy claims "pull requests for content changes" as a general capability but no documented mechanism for bundling multiple entries into one explicitly-triggered PR was found | Unverified / thin | [outstatic.com/blog/git-based-cms-vs-traditional-cms](https://outstatic.com/blog/git-based-cms-vs-traditional-cms) — this is a blog post, not a docs/source reference; flagging as low-confidence and not relied on for the verdict above. |
| **CloudCannon** | Git-based storage with built-in "branching, previews and approval workflows," but it is a **paid, proprietary hosted platform** with its own backend/service layer, not a static-CDN, no-backend tool like Sveltia — out of scope for "no external hosted database/API." | Not evaluated further (scope mismatch) | [cloudcannon.com/git-cms](https://cloudcannon.com/git-cms/) |
| **Stackbit / Netlify Visual Editor** (Forestry's rough successor lineage) | Now fully folded into Netlify's proprietary Visual Editor product, tied to Netlify hosting/build pipeline, not a portable git-commit CMS | Not evaluated further (scope mismatch — Netlify-hosting-coupled, and this site deploys via Vercel) | [netlify.com/integrations/stackbit](https://www.netlify.com/integrations/stackbit/) |
| **Forestry.io** | Discontinued/sunset (superseded by Tina); not independently verified for a 2026 shutdown notice in this pass, but no active docs site was reachable | Not evaluated further | — |

No tool found — beyond the CMS-agnostic pattern in Q4 — separates "accumulate across entries" from "explicit publish trigger" as two distinct, owner-controlled steps. TinaCMS's editorial workflow is the closest native approximation, but it ties the "session" boundary to the first save's branch name, requires TinaCloud, and does not have an obvious mechanism to explicitly say "everything queued so far, publish now" independent from just saving.

---

## Q2 — Does Decap's `editorial_workflow` differ from what's described for Sveltia?

**No functional difference relevant here.** Decap CMS's docs are explicit: `editorial_workflow` creates **one branch and one PR per entry**, named `cms/<collectionName>/<entrySlug>`. Workflow states map to git operations as:

- **Draft (save)**: commits to a new `cms/<collection>/<slug>` branch and opens a PR.
- **In review**: pushes additional commits to that same entry's branch/PR.
- **Ready/Approve**: merges that entry's PR (optionally with `squash_merges: true` to collapse its commit history) and deletes its branch.

Source: [decapcms.org/docs/editorial-workflows](https://decapcms.org/docs/editorial-workflows/) (GitHub, GitLab, and Bitbucket backends all documented as working this way).

Sveltia CMS is described as "a complete modern rewrite of Netlify/Decap CMS" with high config compatibility, and its own docs list `editorial_workflow` under the same `publish_mode` config key Decap uses — but per Q1/Q4, **Sveltia has not implemented this mode yet** ("not yet supported... will be added before the 1.0 release," [sveltiacms.app/en/docs/workflows/editorial](https://sveltiacms.app/en/docs/workflows/editorial)). So the practical answer for this project is: Sveltia's editorial workflow, once shipped, is expected to inherit Decap's exact per-entry branch/PR semantics (same config schema), and it is **not currently available at all** in `themuler-cms` today — `themuler-cms` is necessarily running in `simple` (direct-commit) mode right now.

---

## Q3 — Does Keystatic's `branchPrefix` + PR workflow bundle multiple entries into one PR?

**Yes, but the granularity is per-branch-session, not automatic, and not documented in prose — verified from source.** Keystatic's own docs at [keystatic.com/docs/github-mode](https://keystatic.com/docs/github-mode) only explain that `branchPrefix` "scope[s] out what GitHub branches Keystatic should interact with" (filters which branches appear/are creatable in the branch picker) — they do **not** explain branch-creation or PR-creation mechanics. That required reading source in [github.com/Thinkmill/keystatic](https://github.com/Thinkmill/keystatic) (cloned locally for this research, commit at time of research: default branch HEAD, July 2026):

- **Branch creation is a manual, explicit user action**, not automatic per-entry: `CreateBranchDialog` in `packages/keystatic/src/app/branch-selection.tsx` is only invoked from an explicit "New branch" button (`packages/keystatic/src/app/dashboard/BranchSection.tsx`). There is no code path that creates a branch as a side effect of editing an entry.
- **Edits across multiple different entries accumulate as local/pending changes** and are committed together in one batch: `packages/keystatic/src/app/shell/BatchCommits.tsx` implements a `BatchCommitsDialog` with an "commit changes…" button and a `useChanged`/`useTree` diff list (added/changed/removed items across possibly many entries), all committed to whatever branch is currently checked out in one shot.
- **PR creation is not automated at all.** `BranchSection.tsx` renders an action button that, if no PR exists yet for the current branch, links out to GitHub's own compare/create page: `href={`${repoURL}/pull/new/${currentBranch}`}`, `target="_blank"`. If a PR already exists (detected via `useAssociatedPullRequest`), it instead links to that existing PR. Keystatic never calls a "create PR" API itself.

**Conclusion:** Keystatic's model is exactly "one working branch per session, batch-commit everything on it, then the human opens one PR for that branch via plain GitHub UI" — i.e., structurally the *same shape* as the Q4 CMS-agnostic pattern recommended below, just implemented as first-class UI inside a heavier tool. This directly supports treating the CMS-agnostic pattern as low-risk: it's not a novel workflow, it's what the more full-featured git-CMS already does, minus the UI chrome.

Docs gap explicitly noted: Keystatic's public docs do not mention branch-per-session vs. branch-per-entry at all; this entire answer is inferred from source, not docs prose, per the task's instruction to flag that distinction.

---

## Q4 — CMS-agnostic `drafts` branch → explicit PR-open pattern

### Mechanism
1. Configure the CMS (Sveltia, using `simple`/direct-commit publish mode — the only mode Sveltia currently supports, see Q1/Q2) to commit to a persistent branch, e.g. `drafts`, instead of `main`. In Sveltia/Decap-compatible `config.yml`, this is the `backend.branch` key.
2. Edits to any number of entries, across any number of CMS sessions, land as ordinary commits on `drafts`. No PR exists yet; there is zero CMS-level friction, because this is Sveltia's normal (and only currently implemented) `simple` publish behavior — just pointed at a non-default branch.
3. "Ready to publish" is a distinct, explicit action outside the CMS: `gh pr create --base main --head drafts --title "..." --body "..."`, either run manually or wrapped in a `workflow_dispatch`-triggered GitHub Action in `themuler-blogs`. This opens exactly one PR covering every commit accumulated on `drafts` since it last diverged from `main`.
4. The existing `pull_request`-triggered LLM review Action (Q5) and the existing merge → Vercel deploy-hook Action are unaffected — they already key off PR/merge events on `main`.

### Is this used in the wild?
This is a well-known **general git pattern** — a persistent integration/staging branch with PRs opened on demand into the trunk — documented extensively for code (e.g., release branches, "long-lived feature branch" discussions: [github.com/orgs/community/discussions/161932](https://github.com/orgs/community/discussions/161932)). I could not find a canonical, citable, primary-source write-up of this *exact* pattern applied specifically to a git-backed headless CMS's content branch (i.e., no CMS vendor, marketplace Action, or blog post documents "point Sveltia/Decap `simple` mode at a non-main branch, then script the PR open" as a named recipe). This should be read as **an inferred/derived pattern, not a documented one** — it composes two well-documented primitives (Sveltia's `backend.branch` config option, and `gh pr create`/GitHub's compare-PR mechanism) that are individually well-supported, but the composition itself is not something I found written up anywhere. Flagging this explicitly rather than overstating precedent.

### Real gotchas
- **Stale `drafts` branch after each merge.** Once `drafts` → `main` is merged, `drafts` is now "ahead of nothing" in content terms but its history has diverged from the new `main` tip (unless the merge was a fast-forward, which it will only be if `drafts` had no commits `main` didn't also get some other way). In practice, after every publish, `drafts` needs to be reset to match the new `main` (e.g. `git checkout drafts && git reset --hard origin/main && git push --force-with-lease`) or merge/rebase `main` back into `drafts`. If this reset step is skipped, the next PR from `drafts` will show the *entire already-merged history* as new changes, or hit conflicts. This reset must be scripted as part of the same publish Action that opens/merges the PR — it is not optional housekeeping.
- **Conflict scenarios.** If anyone (or any Action) commits to `main` directly between publishes (bypassing `drafts`), `drafts` will conflict on its next PR. Since this is a single-owner site with one deploy path, risk is low but not zero (e.g. a hotfix commit to `main`).
- **GitHub API rate limits.** Sveltia authenticates as the owner via GitHub OAuth and commits via the GitHub Contents/Git Data API; `gh pr create` is a separate, low-volume call. For a single-author personal site, standard authenticated REST rate limits (5,000 req/hr) are not a practical concern.
- **Branch protection interaction.** If `main` has required-status-checks or required-reviews branch protection, the PR from `drafts` will still need to satisfy those before merge — this is desired behavior here (it's what triggers the LLM review gate), not a gotcha.
- **Sveltia CDN/static nature means no server-side "publish" button can live inside the CMS itself** — the explicit publish trigger genuinely has to be external (script, Action, or a manually-run `gh` command), which matches the desired workflow's description of a "explicit signal" step anyway.

---

## Q5 — Existing GitHub Actions for LLM-based PR review comments (prose-oriented)

**Primary recommendation: `anthropics/claude-code-action` (the official Anthropic action).** It is generic-purpose (not code-review-locked) and directly supports the desired shape:

- Repo: [github.com/anthropics/claude-code-action](https://github.com/anthropics/claude-code-action) (also listed on GitHub Marketplace as "Claude Code Action Official")
- Docs: [code.claude.com/docs/en/github-actions](https://code.claude.com/docs/en/github-actions)
- Example workflow demonstrating PR-diff review with **inline review comments** (not auto-commits): [examples/pr-review-comprehensive.yml](https://github.com/anthropics/claude-code-action/blob/main/examples/pr-review-comprehensive.yml) — triggers on `pull_request: [opened, synchronize, ready_for_review, reopened]`, and its `claude_args` allowlist includes `mcp__github_inline_comment__create_inline_comment` plus `gh pr comment`/`gh pr diff`/`gh pr view`, i.e., it posts suggestions as PR review comments rather than pushing commits — matching "posts suggestions as PR review comments (not auto-committed)."
- The `prompt` input is fully freeform text (or a skill invocation), so the code-review example is trivially adaptable to a prose/grammar/technical-accuracy review prompt instead of a coding-standards review — this is explicit in the docs ("Custom prompts: Use the `prompt` parameter... to customize Claude's behavior for different workflows or tasks").
- Auth: install the official Claude GitHub App ([github.com/apps/claude](https://github.com/apps/claude)) plus an `ANTHROPIC_API_KEY` repo secret — no custom GitHub App needed unless self-hosting via Bedrock/Vertex.

**Other marketplace options found** (via GitHub Marketplace search), listed for completeness but not primary-sourced beyond the marketplace listing text, and none are prose/documentation-specific out of the box (all are framed as *code* reviewers that would need prompt customization same as above):
- [LLM Code Reviewer](https://github.com/marketplace/actions/llm-code-reviewer) — multi-model (OpenAI/Gemini) PR reviewer.
- [Pierre Review](https://github.com/marketplace/actions/pierre-review) — LLM PR summarizer/commenter.
- [AI-based PR Reviewer & Summarizer (Bedrock Claude)](https://github.com/marketplace/actions/ai-based-pr-reviewer-summarizer-with-chat-capabilities-bedrock-claude) — Claude-via-Bedrock variant, relevant if avoiding a direct Anthropic API key is preferred.

No dedicated, well-known "prose/documentation editorial review" marketplace Action (distinct from code review tools) was found as a primary-sourced, actively maintained project — the practical path is customizing `anthropics/claude-code-action`'s prompt, which is explicitly designed to be reusable this way.

---

## Sources consulted directly (docs/source, not secondary blogs)

- [decapcms.org/docs/editorial-workflows](https://decapcms.org/docs/editorial-workflows/)
- [sveltiacms.app/en/docs/workflows/editorial](https://sveltiacms.app/en/docs/workflows/editorial)
- [keystatic.com/docs/github-mode](https://keystatic.com/docs/github-mode)
- [github.com/Thinkmill/keystatic](https://github.com/Thinkmill/keystatic) — `packages/keystatic/src/app/branch-selection.tsx`, `packages/keystatic/src/app/shell/BatchCommits.tsx`, `packages/keystatic/src/app/dashboard/BranchSection.tsx`
- [tina.io/docs/tinacloud/editorial-workflow](https://tina.io/docs/tinacloud/editorial-workflow)
- [pagescms.org/docs/configuration](https://pagescms.org/docs/configuration/) and [github.com/pages-cms/pages-cms](https://github.com/pages-cms/pages-cms) — `app/api/[owner]/[repo]/[branch]/files/[path]/route.ts`
- [cloudcannon.com/git-cms](https://cloudcannon.com/git-cms/)
- [netlify.com/integrations/stackbit](https://www.netlify.com/integrations/stackbit/)
- [code.claude.com/docs/en/github-actions](https://code.claude.com/docs/en/github-actions)
- [github.com/anthropics/claude-code-action](https://github.com/anthropics/claude-code-action) — `examples/pr-review-comprehensive.yml`

## Notes on lower-confidence claims

- Outstatic's PR-bundling behavior is sourced only from its own marketing blog post, not docs or source — flagged as unverified in the Q1 table.
- The Q4 "drafts branch + scripted PR" composition is my own synthesis of two well-documented primitives; I found no primary source describing this exact recipe for a headless CMS, so it should be treated as a recommended pattern, not a proven-in-production one, going into implementation.
