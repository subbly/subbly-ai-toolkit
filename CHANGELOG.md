# Changelog

## 0.1.1

- Removed the files that the Claude plugin directory refuses: the version sync and zip scripts, the SVG logos and `package.json`. The repo now holds only Markdown, JSON and PNG files.
- The Cursor manifest uses the PNG icon.
- Added `privacyPolicyUrl` to the Claude manifest.
- The version is now changed by hand in each manifest. `CONTRIBUTING.md` lists them.

## 0.1.0

- Manifests for Claude, ChatGPT/Codex, Cursor, Copilot and Gemini. Grok Build reads the Claude manifest.
- `subbly` connector at `https://mcp.subbly.dev/mcp` with OAuth sign-in.
- `subbly` entry skill: store model, merchant words, money and safety rules, and which skill to use.
- Merchant skills: `subbly-catalog`, `subbly-subscriptions`, `subbly-customers-and-orders`, `subbly-coupons`, `subbly-webhooks`, `subbly-store-insights`.
- Developer skills for `@subbly/react` storefronts: `subbly-storefront-api`, `subbly-storefront-products`, `subbly-storefront-bundles`, `subbly-cart-and-checkout`, `subbly-storefront-metadata`, `subbly-subscription-surveys`, `subbly-storefront-troubleshooting`.
