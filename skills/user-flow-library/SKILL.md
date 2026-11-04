---
name: user-flow-library
description: Onboards a repository into the user's authenticated User Flow Library account, maps source routes into screens and journeys, and returns project and share links. Use when asked to onboard a repo to UFL or document an app's user flows. Requires real account onboarding and respects billing and usage limits.
---

# User Flow Library

Work from the user's application repository. Installing this skill globally
makes it available across repositories; it does not authenticate the user.

**A real user account and authorized workspace are required before creating
projects or spending on AI.** Never create anonymous identities or trials,
invent an account, bypass verification, or rotate identities to get more quota.
The old accountless bootstrap/helper has been withdrawn.

## Onboard the user

1. Check for an already-authenticated UFL MCP connection. Inspect its tool
   schemas and confirm the current account and intended workspace. Reuse that
   authorization instead of asking the user to repeat onboarding.
   Connect in the workspace that will own the subscription. If available, call
   `get_account_usage` to confirm its `scope` and `upgradeAvailable`. A personal
   account with no paid plan needs workspace onboarding before connecting MCP;
   do not promise that a workspace payment upgrades a personal-scoped token.
2. If an account credential is already provided securely, use the authenticated
   API documented at https://www.userflowlibrary.com/docs/api-reference.md.
   Never read arbitrary unrelated credentials or print tokens.
3. For a new user, complete actual signup/sign-in and the supported authorization
   flow. Use authorized browser automation when available so the agent performs
   the UI work. Preserve identity verification and explicit payment consent.
   Do not invent headless signup or billing endpoints.
4. If the provider requires a verification step the agent cannot complete,
   state the exact blocker. Do not silently fall back to an anonymous project,
   mark onboarding complete, or spend on rendering.

The intended experience is for the agent to do the onboarding work, while the
result belongs to the user's real account. Zero human UI work is a goal, not
permission to skip account verification or billing controls.

## Map the repository

Read the real router configuration, route components, imported local components,
layouts, styles, and design tokens. Do not upload environment files, credentials,
customer data, or unrelated code.

Read the relevant framework recipe from
https://www.userflowlibrary.com/docs/llms.txt. The route-mapping pages cover
Next.js, React Router/Remix, Expo, Rails, Django, and Angular.

Collect route path, human title, actual source text, repo-relative source file,
framework, imported components, and styles. Never invent HTML or navigation.
Choose a coherent first journey within the account's available allowance.

## Create the project and render

Prefer the authenticated MCP tools when connected. Discover their current
schemas instead of guessing parameters. Otherwise follow the documented HTTP
pipeline on https://www.userflowlibrary.com:

1. Create a project in the authenticated account/workspace with `POST /api/projects`.
2. Send real source to `POST /api/projects/{id}/ingest-screens` in batches of
   at most 40 routes, further limited by the account's available allowance.
3. Check `renderedCount` and `failedCount`; report partial failures.
4. Organize with `POST /api/projects/{id}/organize`.
5. If sharing was requested, get a link with `GET /api/projects/{id}/share`.
   Honor instructions to keep the project private.

Authenticate every request. Check account entitlement before paid work and
respect server-side enforcement. If billing or allowance cannot be confirmed,
stop rather than assume it is free. Never bypass `401`, `402`, or `429`.

## At the 25-screen allowance: upgrade and continue

The allowance belongs to the authenticated account/workspace across repositories.
A new repository or project does not reset it.

1. Call `get_account_usage` with `required_screens: 1` before ingesting. Make each
   free batch no larger than `remainingCount` (and never larger than 40).
2. Before a write, save the project ID, completed screen IDs, pending batch, and
   remaining route list in a private checkpoint outside the source repository.
   Do not put credentials in the checkpoint. Save successful responses as receipts.
3. On `payment_required` / `AI_QUOTA_EXCEEDED`, show the exact returned `upgradeUrl`:
   **"You've used your 25 free AI screens. Upgrade here: [link]. I'll continue
   this project automatically once payment is confirmed."**
   If the batch only exceeds the *remaining* free allowance, render a smaller
   batch first; do not say all 25 were used when some remain.
4. Keep the same connection, account/workspace, project, and pending batch.
   Do not recreate them or make paid AI calls while waiting.
5. While the agent session remains active, call `get_account_usage` with
   `required_screens` equal to the pending batch size and `wait_seconds: 20`.
   It polls verified server-side billing state. Repeat for up to ten minutes,
   respecting service errors and rate-limit responses.
6. When `readyToResume` is true, retry only the batch rejected with
   `safeToRetry: true`; continue the remaining batches, organize, and share.
   Do not ask the user to repeat the request or type "done."

A checkout page opening, a redirect, or a user saying "paid" is not proof of an
active subscription. Never mark payment complete yourself. If the agent session
ends or polling times out, retain the checkpoint and resume from it on the next
run. A disconnected MCP client cannot be woken by this skill.

`BILLING_SETUP_REQUIRED` means no supported paid plan exists for that scope.
Report the configuration issue instead of showing a misleading payment prompt.
If `get_account_usage` is absent from the connected server's tool list, report
that the MCP server needs the billing/resume update; do not fabricate the tool
or claim automatic continuation is available.

After an uncertain write, inspect the existing project before repeating it.
Reuse the same project on subsequent runs unless the user requests a new one.

## Deliver

Return the project URL, requested share URL, route coverage, rendered/failed
counts, and journey names. Explain that rendered screens are AI reconstructions
from source. Only claim onboarding succeeded when the project belongs to the
authenticated user's account and the requested pipeline completed.
