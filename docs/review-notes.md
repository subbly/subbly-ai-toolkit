# Notes for directory reviewers

Paste the section for the directory into its submission form. Keep this file up to date when the plugin changes.

## Claude plugin directory

**Name.** `subbly` is the brand of the publisher, Subbly (https://www.subbly.co), the subscription commerce platform this plugin connects to. It is not related to the "subble" connector. The name matches the company, its domains (`subbly.co`, `subbly.dev`) and the MCP server host `mcp.subbly.dev`.

**Network.** The plugin has one network endpoint: the `subbly` MCP server at `https://mcp.subbly.dev/mcp`, run by Subbly, the publisher of this plugin. The user signs in to their own Subbly account with OAuth 2.1 (PKCE, dynamic client registration). The plugin stores no credential and asks for no API key.

**Credentials.** No part of the plugin reads environment variables, files or credentials from the user's machine. There are no hooks, scripts, commands or agents. The skills are Markdown only.

- The developer skills (`subbly-storefront-*`, `subbly-cart-and-checkout`, `subbly-subscription-surveys`) describe code that a developer writes in their own storefront with the public npm packages `@subbly/react` and `@subbly/api-client`. That code uses a public Subbly Storefront API key, which the developer's site sends only to Subbly (`api.subbly.co`). The plugin never uses this key.
- These skills tell the assistant not to open `.env` or other secret files and not to print key values.

**Images.** The only images are the two listing icons in `assets/` that the manifests name. Nothing runs them. They are plain RGBA images with only the `IHDR`, `IDAT` and `IEND` chunks and no data after the end marker. `scripts/` holds repository tooling: the version sync reads and writes the manifest JSON files, and never opens the images.

**Safety.** Every connector tool has a title and MCP annotations (`readOnlyHint`, `destructiveHint`, `idempotentHint`, `openWorldHint`). The skills tell the assistant to confirm each change, and to get an explicit "yes" before it archives, deletes, cancels or moves money.

**Test account.** The connector is available on the Subbly X plan. Ask Subbly for a reviewer test store: https://support.subbly.co
