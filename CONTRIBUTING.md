# Contributing

This repo is the public plugin for Claude, ChatGPT/Codex, Cursor, Copilot and Gemini. One plugin, named `subbly`. Never rename it: installs are keyed by name.

## Rules

- This repo is public. Do not add internal URLs, builder-only tools (`tool_run`, `tool_describe`), customer data, keys or private repo content.
- This repo owns the public skills. Internal Subbly skill sources are reference only: rewrite, do not copy.
- Skills must work on every host. Refer to connector tools by their bare name (`list_products`). Do not depend on hooks, agents or Claude Code-only features.
- The connector uses OAuth. `.mcp.json` holds only the URL; never add an `X-API-KEY` header.
- No telemetry.

## Skills

- One folder per skill under `skills/`, with `SKILL.md` and optional `references/`. Name it `subbly-<topic>`, and use the same `name` in the frontmatter. Some hosts load skills without the plugin name, so the prefix keeps them apart from other skills.
- Merchant skills use the connector tools. Developer skills (`subbly-storefront-*` and others for `@subbly/react`) are for code. Each description says which one it is.
- Name only tools that exist in the connector. The tool's input schema holds field limits; a skill holds the business rules that the schema does not.
- `skills/subbly` is the entry point. When you add a skill, add it to the entry skill so the assistant can find it.
- `description` says what the skill covers and when to use it, with the words a merchant or developer uses.
- Write in ASD-STE100 Simplified Technical English. Business language for merchant tasks.
- Every write needs user confirmation; archive, delete, cancel and money actions need an explicit "yes".

## Versions

`package.json` holds the version. Run `npm run version:sync` after a change, then `npm run validate`. Add a `CHANGELOG.md` entry for each release.
