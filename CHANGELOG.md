# Changelog

## 0.1.3

- Removed the version sync and zip scripts, the SVG logos and `package.json` again. The Claude plugin directory refuses them until Subbly is a Verified organization. The files stay in the git history.
- The Cursor manifest uses the PNG icon.
- Added a root `mcp.json` and the ChatGPT listing, review cases and country list in `plugin.json` under `extensions.com.openai`.
- The ChatGPT website link is the Subbly MCP page.
- The connector is not only for Subbly X merchants. The README, the `subbly` skill and the review notes now say that some tools and fields depend on the plan.

## 0.1.2

- Added `privacyPolicyUrl` to the Claude manifest.
- Restored the version sync and zip scripts, the SVG logos and `package.json`. The Claude plugin directory still refused them, so 0.1.3 removes them again.

## 0.1.1

- Removed the scripts, the SVG logos and `package.json` so that the Claude plugin directory would accept the plugin. 0.1.2 restores them.

## 0.1.0

- Manifests for Claude, ChatGPT/Codex, Cursor, Copilot and Gemini. Grok Build reads the Claude manifest.
- `subbly` connector at `https://mcp.subbly.dev/mcp` with OAuth sign-in.
- `subbly` entry skill: store model, merchant words, money and safety rules, and which skill to use.
- Merchant skills: `subbly-catalog`, `subbly-subscriptions`, `subbly-customers-and-orders`, `subbly-coupons`, `subbly-webhooks`, `subbly-store-insights`.
- Developer skills for `@subbly/react` storefronts: `subbly-storefront-api`, `subbly-storefront-products`, `subbly-storefront-bundles`, `subbly-cart-and-checkout`, `subbly-storefront-metadata`, `subbly-subscription-surveys`, `subbly-storefront-troubleshooting`.
