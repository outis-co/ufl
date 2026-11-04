# User Flow Library skill

Onboard an application repository into your real User Flow Library account,
render source routes into screens, organize journeys, and return a share link.

```sh
npx skills add outis-co/ufl --global --skill user-flow-library --yes
```

Then ask your agent from any application repository:

> Use the user-flow-library skill to onboard this repository into my account.

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
