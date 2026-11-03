# Subbly AI Toolkit

Connect your AI assistant to [Subbly](https://www.subbly.co), the subscription commerce platform.

The plugin gives the assistant two things:

- **The Subbly connector.** Read and change your live store: products, bundles, subscriptions, customers, orders, invoices, coupons, inventory, surveys and webhooks.
- **Skills.** Knowledge about how a Subbly store works, so the assistant picks the right product type, uses the right fields and asks before it changes anything.

> [!NOTE]
> The connector is available to [Subbly X](https://www.subbly.co/x) merchants. To ask about access, contact [Subbly support](https://support.subbly.co).

## Install

- **Claude (claude.ai, Cowork, Claude Code):** add the Subbly plugin from the Claude directory. To install it from this repository in Claude Code:

  ```
  claude plugin marketplace add subbly/subbly-ai-toolkit
  claude plugin install subbly@subbly-ai-toolkit
  ```

- **ChatGPT and Codex:** add the Subbly plugin from the plugin directory.
- **Cursor:** in the agent chat, run `/add-plugin subbly`.
- **Gemini CLI:** `gemini extensions install https://github.com/subbly/subbly-ai-toolkit`
- **Grok Build:** add the Subbly plugin from the Grok plugin marketplace. Grok Build reads the Claude plugin in this repository. To try it from a clone: `grok --plugin-dir .`
- **Grok (grok.com):** go to Connectors, choose New Connector, then Custom, and enter `https://mcp.subbly.dev/mcp`.
- **Any other MCP client:** add the server `https://mcp.subbly.dev/mcp` (streamable HTTP). See [Connect a client](https://docs.subbly.dev/developer-resources/subbly-mcp/connect-a-client).

When you first use the connector, sign in with your Subbly account. The plugin stores no credentials.

The plugin connects to one network endpoint, `https://mcp.subbly.dev/mcp`, with OAuth sign-in to your Subbly account. It needs no API key.

## Try it

- "Which subscriptions renew in the next 7 days?"
- "Create a monthly coffee subscription with 3-, 6- and 12-month plans."
- "Skip next month's box for jane@example.com."
- "Add a Subbly product page and cart to my Next.js storefront."

## Skills

| For | Skills |
|---|---|
| Start here | `subbly` |
| Merchants (uses the connector) | `subbly-catalog`, `subbly-subscriptions`, `subbly-customers-and-orders`, `subbly-coupons`, `subbly-webhooks`, `subbly-store-insights` |
| Developers (storefront code with `@subbly/react`) | `subbly-storefront-api`, `subbly-storefront-products`, `subbly-storefront-bundles`, `subbly-cart-and-checkout`, `subbly-storefront-metadata`, `subbly-subscription-surveys`, `subbly-lead-capture`, `subbly-storefront-localization`, `subbly-storefront-troubleshooting` |

## Safety

The connector changes your live store. The skills tell the assistant to confirm each change before it makes it, and to ask for an explicit "yes" before it archives, deletes, cancels or moves money. Archive and delete cannot be undone; unpublish is the safe way to hide something.

## Telemetry

None. The plugin sends no usage data. The connector calls the Subbly API only when the assistant uses a tool.

## Repository layout

| Path | Contents |
|---|---|
| `skills/` | One folder for each skill, with a `SKILL.md` and optional `references/` |
| `.mcp.json` | The `subbly` connector |
| `.claude-plugin/` | Claude manifest and marketplace |
| `.codex-plugin/` | ChatGPT and Codex manifest |
| `.cursor-plugin/` | Cursor manifest |
| `plugin.json` | Agent Plugins manifest (GitHub Copilot, VS Code) |
| `gemini-extension.json` | Gemini CLI extension |
| `server.json` | MCP Registry entry |
| `assets/` | Logos |
| `scripts/` | Version sync and zip build |

## Develop

```
npm run validate     # check manifest versions, then claude plugin validate --strict
npm run build        # dist/subbly-<version>.zip for upload
claude --plugin-dir .   # load the plugin in Claude Code for one session
```

To release, change `version` in `package.json`, run `npm run version:sync`, add a `CHANGELOG.md` entry, then build.

## Links

- [Developer docs](https://docs.subbly.dev)
- [Help center](https://support.subbly.co)
- [Terms](https://www.subbly.co/terms) · [Privacy](https://www.subbly.co/privacy)

## License

[MIT](LICENSE)
