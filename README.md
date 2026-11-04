# User Flow Library skill

Turn the repository your agent is working in into a shareable user flow map.
The default path needs no account, API key, browser approval, or dashboard clicks.

## Install globally

```sh
npx skills add outis-co/ufl --global --skill user-flow-library --yes
```

Then open an agent in **any application repository** and ask:

> Use the user-flow-library skill to map this app and return a share link.

The agent reads the app, creates an isolated trial project, renders up to five
screens, organizes them, and returns a link. Node.js 20+ is required. Installing
a skill provides instructions and a helper; the coding agent performs the
repository analysis and invokes that helper.

## No UI onboarding

- A random per-repository credential is generated locally before the first API call.
- The API creates an isolated trial, without impersonating or creating a user account.
- Credentials stay outside the repository in `~/.config/ufl-agent/`, with private file permissions.
- Re-running from the same repository resumes the same project.
- The public share link can be viewed without signing in.

Each trial has five render attempts (including failures), three organization
attempts, and a 30-day credential. Admission limits may return `429`. The helper
reports those failures; it never opens a browser or rotates credentials to
avoid limits. A trial does not become part of an existing account automatically.
Its dashboard URL requires account ownership; use the returned share URL to
view the first result.

Source is sent to UFL's server-side AI renderer. Include only the relevant
screen, component, and style files, never secrets or customer data. Rendered
screens are AI reconstructions, not captures of a running application.

Documentation: https://www.userflowlibrary.com/docs

## Development

```sh
node --test tests/*.test.mjs
```
