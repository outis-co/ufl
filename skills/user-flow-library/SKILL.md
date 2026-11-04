---
name: user-flow-library
description: Maps a repository into a User Flow Library project with rendered screens, named journeys, and a share link. Use when asked to onboard a repo to UFL, document an app's screens, or create a user flow map. Onboards without signup, browser approval, or dashboard interaction.
---

# User Flow Library

Complete the work from the user's current repository. Do not stop at instructions
for the user to execute. Do not open a browser, launch device authorization, ask
for an API key, or require an account to get the first result.

## Start

Requires Node.js 20 or newer and outbound HTTPS. Resolve `scripts/ufl.mjs`
relative to **this skill's directory**, then invoke it by absolute path with
the **target repository as the working directory**. Never change into the
installed skill's directory to run it.

```sh
node /absolute/path/to/this/skill/scripts/ufl.mjs init
```

This creates or resumes an isolated accountless project. It returns the project
ID, remaining rendering allowance, expiry, and a private local work directory.
Credentials are stored outside the repository with restrictive permissions;
the script never prints them. No browser or email verification is involved.

Trials include **five render attempts**, three organization attempts, and a
30-day credential. Failed renders consume attempts. Respect the allowance
returned by `init`; do not rotate credentials or create trials to evade limits.
The accountless project is not automatically attached to an existing account.

## Read and map the app

1. Read the target repository's routing configuration and screen source files.
2. Select three to five screens forming one real journey, within the remaining
   allowance. For larger apps report that this first result covers a subset.
3. Read local components, layouts, shared styles, design tokens, and relevant
   fixtures. Never include `.env`, credentials, private customer data, or
   unrelated source. Read [the route-mapping guide](https://www.userflowlibrary.com/docs/route-mapping/nextjs.md)
   for Next.js; replace `nextjs` with `react-router`, `expo`, `rails`, `django`,
   or `angular` for those frameworks.
4. Write `routes.json` in the work directory returned by `init`, using the API
   payload below. Source must come from files actually read. Do not fabricate
   HTML, routes, assets, or navigation behavior.

```json
{
  "flowName": "Getting started",
  "routes": [{
    "path": "/",
    "title": "Home",
    "source": "ACTUAL ROUTE SOURCE",
    "sourceFile": "app/page.tsx",
    "framework": "nextjs",
    "components": {"components/Header.tsx": "ACTUAL COMPONENT SOURCE"},
    "styles": {"app/globals.css": "ACTUAL STYLES"}
  }]
}
```

Each route requires `path`, `title`, and `source`. Use repo-relative file names
as map keys. Include nested layouts as components, CSS as styles. Entire trial
payload must fit within 300,000 characters. Keep real source intact; choose
fewer screens if necessary. These are AI reconstructions from source, not
screenshots from a running app. Report that distinction.

## Finish the pipeline

Run these from the target repository, resolving the script as above:

```sh
node /absolute/path/to/this/skill/scripts/ufl.mjs ingest /absolute/path/to/routes.json
node /absolute/path/to/this/skill/scripts/ufl.mjs organize
node /absolute/path/to/this/skill/scripts/ufl.mjs share
```

- Check `renderedCount` and `failedCount`. A successful HTTP response can still
  contain failed renders. If none rendered, report failure rather than claiming
  onboarding succeeded.
- Organize runs after ingest. Fewer than three screens may return `skipped`;
  explain that result rather than inventing journeys.
- `share` makes the trial project's contents accessible to anyone with its link.
  Creating a shareable map is part of this workflow. Honor any user instruction
  to keep it private; in that case skip `share`.
- The helper records completed requests and refuses to blindly replay uncertain
  ingestion or organization writes. Use `status` to inspect the project first.
- Do not retry `401`, `402`, or `429` in a loop or fall back to a browser. Report
  the exact blocker. `503` means the service is unavailable, not that signup is
  required.

Return the **share URL as the primary usable result**, rendered/failed counts,
journey names if returned, and the project URL. The share URL opens without an
account. The accountless credential is API-only; the signed-in dashboard URL
does not grant the user ownership of this trial. Do not promise otherwise.

## Subsequent use

Run `init` or `status` from the same repository to resume the same project.
Run from a different repository to create a separate map. Do not delete state
to reset a budget. If a caller explicitly wants an existing account/project,
use an already-authenticated UFL MCP connection and check its current tool
schemas. If that connection requires a browser, keep the default accountless
path or report the blocker; never silently trigger interactive auth.

Reference: [API](https://www.userflowlibrary.com/docs/api-reference.md),
[docs index](https://www.userflowlibrary.com/docs/llms.txt).
