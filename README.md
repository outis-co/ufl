# User Flow Library — Claude Code skill for app user journeys

Turn your app into a **Mobbin-style library of screens and user journeys**.
The User Flow Library skill reads your repository's routes, components, styles,
and interaction states, renders screens, and groups them around user goals.
It works with Claude Code and compatible coding agents that support Agent Skills
and an authenticated UFL connection.

## Install and connect once

For Claude Code:

```sh
npx skills add outis-co/ufl --global --skill user-flow-library --agent claude-code --yes
claude mcp add --scope user --transport http user-flow-library https://mcp.userflowlibrary.com/mcp
```

Then open `/mcp` in Claude Code, select `user-flow-library`, and authenticate
to your real UFL account and intended workspace. The global skill and
user-scoped connection are available across repositories. Existing project-specific
MCP settings can override user settings; inspect them before replacing a connection.

For another agent, omit `--agent claude-code` and follow its
[MCP setup instructions](https://www.userflowlibrary.com/docs/mcp-server).

## Map your app

Then ask your agent from any application repository:

> Use the user-flow-library skill to map this app into a Mobbin-style library of screens and user journeys. Include routes and interaction states, preserve the source styling, keep the project private, and report captured, pending, and unresolved coverage.

You get a project URL with rendered screens, named journeys, and source
navigation. Request a public share link when you want others to view it.
The agent should choose complete primary journeys within the available allowance,
including relevant dialogs and drawers before secondary page catalogs.

Screens are **AI reconstructions from source**. A source-supported link is
evidence of a possible transition, not proof of a successful backend operation.
Dynamic routes, missing fixtures, account gates, and unsupported states must be
reported as coverage gaps.

The [Claude Code walkthrough](https://www.userflowlibrary.com/docs/claude-code-user-journeys)
includes the public Shadcn Admin example and routing guides.

## Real account onboarding

The agent should reuse an authenticated MCP connection or account credential.
For new users, signup, identity verification, workspace selection, and applicable
billing requirements must be completed before paid rendering. The agent handles
UI work where authorized browser automation is available; it must report any
verification step it cannot complete.

**Installing the skill does not replace account onboarding.** Anonymous trial
issuance and rendering have been disabled, and the former guest helper has been
removed. Existing guest credentials cannot reserve further AI work.

Projects must belong to the real user/workspace and remain subject to server-side
usage and billing controls. Credentials, environment files, and customer data
must never be included in uploaded source.

## Upgrade without restarting the task

With a server exposing `get_account_usage`, the agent checks the account's
shared 25-screen allowance before rendering. At the limit, it saves progress,
shows the returned upgrade link, and waits for server-confirmed payment.
It then continues the same project and pending batch without asking you to
repeat your request.

The checkout must upgrade the same billing scope as the MCP connection.
Workspaces with a configured paid plan support this flow; an unconfigured
personal billing scope is reported explicitly.

Continuation is automatic while the agent session remains running. If it ends,
the checkpoint supports resuming on the next run. The skill cannot wake a closed
agent, and it never treats a checkout redirect as proof of payment.

Documentation: https://www.userflowlibrary.com/docs

Skill listing: https://skills.sh/outis-co/ufl/user-flow-library
