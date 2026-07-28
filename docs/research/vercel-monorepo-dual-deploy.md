# Can One Monorepo Deploy Two Independent Vercel Projects (Site + CMS)? — Research Findings

## Context

Groundwork for consolidating three currently-separate repos — `bytes-of-me` (Astro personal site), `themuler-blogs` (markdown content, fetched at build time), and `themuler-cms` (Vite + Svelte + Tiptap CMS app) — into one open-source template monorepo. A forker of that template needs to deploy **both** the Astro site and the CMS app from the single repo, as two independently-deployed Vercel projects, each with its own build config, output directory, and custom domain.

## Verdict

**YES.** Vercel has first-class, documented support for this exact shape: one GitHub repository can back multiple Vercel Projects, each with its own **Root Directory** pointed at a different subdirectory of the repo, its own build command/output directory (via `vercel.json` or dashboard settings), its own **Ignored Build Step** (or the newer automatic unaffected-project skipping) so a push touching only one subdirectory doesn't rebuild the other, and its own independently-attached **custom domain**. Turborepo is Vercel's most polished, semi-automatic path for wiring this up, but per Vercel's own docs it is not a hard requirement — plain multi-project-per-repo works with the dashboard's Root Directory setting plus a manual `git diff`-based Ignored Build Step.

---

## Q1 — Root Directory setting: one repo, multiple Vercel projects, different subdirectories

Vercel's monorepo docs describe exactly this workflow:

> "You'll create a new project for each directory in your monorepo that you wish to import." … "Before you deploy, you'll need to specify the directory within your monorepo that you want to deploy. Click the Edit button next to the Root Directory setting to select the directory, or project, you want to deploy. This will configure the root directory of each project to its relevant directory in the repository." … "Repeat steps 2-5 to import each directory from your monorepo that you want to deploy."

And on deploy behavior once multiple projects are linked to the same repo:

> "Once you've created a separate project for each of the directories within your Git repository, every commit will issue a deployment for all connected projects and display the resulting URLs on your pull requests and commits."

Note there's a plan-based cap on how many projects can share one repo: "The number of Vercel Projects connected with the same Git repository is limited depending on your plan."

Source: [vercel.com/docs/monorepos](https://vercel.com/docs/monorepos)

For this repo's shape, that means: import the repo twice as two Vercel Projects — one with Root Directory `apps/site` (or wherever the Astro app lives), one with Root Directory `apps/cms` — via **Add New → Project → Import** the same repo twice, editing Root Directory each time.

---

## Q2 — `vercel.json` per-project config (build command, output directory, ignore command)

`vercel.json` lives in **the project's root directory** (i.e., in a monorepo, inside each app's own subdirectory, since that subdirectory is what Vercel treats as project root once Root Directory is set) and overrides dashboard settings per-deployment:

- **`buildCommand`** (`string | null`): "The `buildCommand` property can be used to override the Build Command in the Project Settings dashboard, and the `build` script from the `package.json` file for a given deployment." Example: `{ "buildCommand": "next build" }`.
- **`outputDirectory`** (`string | null`): "can be used to override the Output Directory in the Project Settings dashboard for a given deployment." Example: `{ "outputDirectory": "build" }`.
- **`installCommand`** (`string | null`): overrides the install command; "An empty string value will cause the Install Command to be skipped." Useful for scoping installs in a workspace monorepo.
- **`framework`** (`string | null`): overrides the auto-detected Framework Preset; use `null` to force "Other".
- **`ignoreCommand`** (`string | null`): "will override the Command for Ignoring the Build Step for a given deployment. When the command exits with code 1, the build will continue. When the command exits with 0, the build is ignored." Example: `{ "ignoreCommand": "git diff --quiet HEAD^ HEAD ./" }`.

Source: [vercel.com/docs/project-configuration/vercel-json](https://vercel.com/docs/project-configuration/vercel-json)

For the two projects here: the Astro project's `vercel.json` (or dashboard settings) would set `framework: "astro"`/default build, `outputDirectory: "dist"`; the CMS project's `vercel.json` would set `buildCommand: "vite build"`, `outputDirectory: "dist"` (Vite's default), since Vite isn't Astro and needs its own preset/build.

---

## Q3 — Ignored Build Step (skip unrelated pushes per project)

Two mechanisms exist, and Vercel explicitly recommends preferring the first when eligible:

**A. Automatic "Skip unaffected projects"** (workspace-aware, no scripting needed):

> "Vercel automatically skips builds for projects in a monorepo that are unchanged by the commit." Requirements: "This feature is only available for projects connected to GitHub repositories," "The monorepo must be using npm, yarn, pnpm, or Bun workspaces, following JavaScript ecosystem conventions," each workspace package needs a unique `name` field, and inter-package dependencies must be declared in `package.json`. Crucially: "This setting does **not** occupy concurrent build slots, unlike the Ignored Build Step feature, reducing build queue times."

Source: [vercel.com/docs/monorepos#skipping-unaffected-projects](https://vercel.com/docs/monorepos)

**B. Manual Ignored Build Step** (git-diff based command per project), for repos that don't meet the workspace requirements above, or where finer control is wanted:

> "The command is executed within the Root Directory and can access all System Environment Variables." … "The command will always exit with either code 1 or 0: If the command exits with code 1, the build continues as normal. If the command exits with code 0, the build is immediately aborted, and the deployment state is set to CANCELED." Dashboard presets include "Only build if there are changes in a folder that you specify," or a fully custom command.

Source: [vercel.com/docs/project-configuration/project-settings#ignored-build-step](https://vercel.com/docs/project-configuration/project-settings)

Concrete scoped command (from Vercel's own KB guide):

> `git diff HEAD^ HEAD --quiet -- ./packages/frontend/` — "Vercel will only build deployments when changes are made inside of the packages/frontend/ directory." … If the Root Directory differs from the folder being diffed, adjust the relative path, e.g. `git diff HEAD^ HEAD --quiet -- ../../packages/docs`.

Source: [vercel.com/kb/guide/how-do-i-use-the-ignored-build-step-field-on-vercel](https://vercel.com/kb/guide/how-do-i-use-the-ignored-build-step-field-on-vercel)

Note: `git diff --quiet` exits `1` when there ARE differences (build continues) and `0` when there are none (build skipped) — the polarity lines up correctly with Vercel's exit-code convention without any inversion needed.

Important cost caveat documented on the Ignored Build Step: "Canceled builds are counted as full deployments as they execute a build command in the build step. This means that any canceled builds initiated using the ignore build step will still count towards your deployment quotas and concurrent build slots" — which is exactly why Vercel recommends option A (automatic skipping) over manual Ignored Build Step when the repo qualifies (workspaces set up correctly).

Source: [vercel.com/docs/project-configuration/project-settings#ignored-build-step](https://vercel.com/docs/project-configuration/project-settings)

**For Turborepo specifically**, Vercel recommends `turbo query affected` in the Ignored Build Step for cases that don't fit automatic skipping:

> "For Turborepos, we recommend using `turbo query affected` to see if the project or its dependencies have had changes. In the Ignored Build Step for your project, use: `turbo query affected --base=$VERCEL_GIT_PREVIOUS_SHA --packages <your-project-name> --exit-code`"

And when Vercel auto-configures a Turborepo project on import, it sets the Ignored Build Step to `npx turbo-ignore --fallback=HEAD^1` by default (see the table in Q5 below).

Sources: [vercel.com/docs/monorepos/turborepo#ignoring-unchanged-builds](https://vercel.com/docs/monorepos/turborepo), [vercel.com/docs/monorepos#ignoring-the-build-step](https://vercel.com/docs/monorepos)

---

## Q4 — Independent custom domains per project, same repo

Custom domains are configured entirely per-project, with no coupling to how many other Vercel Projects share the same GitHub repo:

> "You can manage all domain settings related to a project from Settings and then Domains in the sidebar" … "Hobby teams have a limit of 50 custom domains per project."

Also confirmed generically in the Project Settings doc: "You can add custom domains for each project." (linking to the same Domains guide).

Sources: [vercel.com/docs/domains/working-with-domains/add-a-domain](https://vercel.com/docs/domains/working-with-domains/add-a-domain), [vercel.com/docs/project-configuration/project-settings#custom-domains](https://vercel.com/docs/project-configuration/project-settings)

Nothing in the domain-attachment flow references "repository" at all — it's purely a Project → Settings → Domains action, using either a CNAME (subdomain) or A record (apex) per project, or Vercel nameservers. So the site project can carry e.g. `www.example.com` and the CMS project can carry e.g. `cms.example.com` (or an entirely different registered domain), fully independently, both sourced from the same GitHub repo.

---

## Q5 — Is Turborepo/pnpm workspaces required, or optional?

**Optional, but Vercel's own docs steer you toward it for the nicer automatic behaviors.** Breaking down what's actually gated on it:

- **Multi-project-per-repo + per-project Root Directory** (the core ask here): no workspace tooling required at all — this is just repeated "Import" + Root Directory setting, works on any repo shape. Confirmed by the general [monorepos](https://vercel.com/docs/monorepos) doc, which describes this with zero mention of a required build tool.
- **Automatic "skip unaffected projects"** (no Ignored Build Step scripting needed): *does* require "npm, yarn, pnpm, or Bun workspaces, following JavaScript ecosystem conventions," with unique package names and explicit inter-package `package.json` dependencies. This is a workspaces requirement, not specifically a Turborepo requirement — pnpm workspaces alone (no Turborepo) is sufficient to qualify. Source: [vercel.com/docs/monorepos#requirements](https://vercel.com/docs/monorepos).
- **Turborepo** adds on top of plain workspaces: auto-configuration of Build Command/Output Directory/Root Directory/Ignored Build Step on import (`turbo run build`, `npx turbo-ignore --fallback=HEAD^1`), remote build caching, and the more precise `turbo query affected` Ignored Build Step variant. None of this is required to get two independently-deployed projects with distinct domains — it's an optimization layer for larger/more complex monorepos or teams wanting shared build caching. Source: [vercel.com/docs/monorepos/turborepo](https://vercel.com/docs/monorepos/turborepo).

**Given this repo doesn't currently use Turborepo**, the simplest viable structure is:

```
repo-root/
  apps/
    site/         # Astro app (was bytes-of-me)
      vercel.json
      package.json
      ...
    cms/           # Vite+Svelte+Tiptap app (was themuler-cms)
      vercel.json
      package.json
      ...
  package.json     # optional root, only needed if adopting workspaces later
```

Plain npm/pnpm workspaces are enough to unlock automatic unaffected-project skipping without adopting Turborepo at all (just a root `package.json` with a `workspaces` field, or `pnpm-workspace.yaml`, listing `apps/*`, and unique `name` fields in each app's `package.json`). If that's skipped entirely (e.g. the two apps just live in plain subdirectories with no workspace manifest), everything still works — it just falls back to the manual git-diff `ignoreCommand` per project (Q3, option B) instead of the automatic skip.

---

## Setup Recipe

Assuming the structure `apps/site` (Astro) and `apps/cms` (Vite+Svelte+Tiptap), both in one repo:

### 1. Create two Vercel Projects from the same repo

- Vercel Dashboard → **Add New → Project → Import** the repo → name it e.g. `bytes-of-me-site` → before deploying, set **Root Directory** to `apps/site`.
- Repeat: **Add New → Project → Import** the *same* repo again → name it e.g. `themuler-cms` → set **Root Directory** to `apps/cms`.

(Source: [vercel.com/docs/monorepos](https://vercel.com/docs/monorepos))

### 2. `vercel.json` per app

`apps/site/vercel.json` (Astro — usually auto-detected, but explicit for clarity):
```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": "astro",
  "outputDirectory": "dist"
}
```

`apps/cms/vercel.json` (Vite+Svelte, not auto-matching the Astro preset):
```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": null,
  "buildCommand": "vite build",
  "outputDirectory": "dist"
}
```

(Source: [vercel.com/docs/project-configuration/vercel-json](https://vercel.com/docs/project-configuration/vercel-json))

### 3. Ignored Build Step per project (so a CMS-only push doesn't rebuild the site, and vice versa)

Simplest option without adopting workspaces — add an `ignoreCommand` to each app's `vercel.json` (or set the equivalent "Custom" command in Settings → Build and Deployment → Ignored Build Step):

`apps/site/vercel.json` addition:
```json
{
  "ignoreCommand": "git diff --quiet HEAD^ HEAD -- ./"
}
```
(Since Root Directory is already `apps/site`, `./` scopes the diff to that subdirectory — per the KB guide's relative-path example.)

`apps/cms/vercel.json` addition:
```json
{
  "ignoreCommand": "git diff --quiet HEAD^ HEAD -- ./"
}
```

If/when the repo adopts npm/pnpm workspaces with unique package names and declared inter-package deps, this manual step becomes unnecessary — Vercel's automatic "skip unaffected projects" takes over for free and doesn't consume a build slot on skip. (Source: [vercel.com/docs/monorepos#skipping-unaffected-projects](https://vercel.com/docs/monorepos))

If Turborepo is adopted later, replace the above with Vercel's recommended:
```
npx turbo-ignore --fallback=HEAD^1
```
or, for more precision:
```
turbo query affected --base=$VERCEL_GIT_PREVIOUS_SHA --packages <project-name> --exit-code
```
(Source: [vercel.com/docs/monorepos/turborepo](https://vercel.com/docs/monorepos/turborepo))

### 4. Attach independent custom domains

- `bytes-of-me-site` project → Settings → Domains → Add Domain → e.g. `www.example.com` (CNAME to Vercel) or apex `example.com` (A record).
- `themuler-cms` project → Settings → Domains → Add Domain → e.g. `cms.example.com`, or an entirely separate domain.

These are configured per-project with no interaction between the two, even though both trace back to the same GitHub repo. (Source: [vercel.com/docs/domains/working-with-domains/add-a-domain](https://vercel.com/docs/domains/working-with-domains/add-a-domain))

### 5. (Optional, not required) `themuler-blogs` content fetch at build time

Out of scope for this ticket's question, but worth flagging for the template design: the Astro site's `buildCommand` in `apps/site/vercel.json` can be a compound command (e.g. `"buildCommand": "node scripts/fetch-content.mjs && astro build"`) to pull `themuler-blogs` markdown before the Astro build — this doesn't interact with the dual-project setup described above; it's purely internal to the site project's own build step.

---

## Summary: is Turborepo required?

No. Confirmed directly by Vercel's docs: the core capability (multiple Vercel Projects from one repo, each with independent Root Directory, build config, Ignored Build Step, and custom domain) needs none of Turborepo or workspaces. Workspaces (npm/yarn/pnpm/Bun) are required only to unlock the *automatic* unaffected-project build-skipping feature; Turborepo is a further optional layer on top of workspaces that adds auto-configuration and remote caching. For an open-source template repo that should be as approachable as possible to fork and deploy, the recommended minimal path is: two subdirectories (`apps/site`, `apps/cms`), no workspace manifest required to start, each with its own `vercel.json` (build command, output directory, `ignoreCommand`), imported as two separate Vercel Projects. Workspaces/Turborepo can be layered in later purely as a build-cost optimization, not a functional requirement.
