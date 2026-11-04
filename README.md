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

Documentation: https://www.userflowlibrary.com/docs
