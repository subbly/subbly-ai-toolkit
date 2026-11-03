---
name: subbly-lead-capture
description: "Write storefront code with @subbly/react that adds a lead capture form to a Subbly storefront and saves each email as a lead in Subbly, with optional Klaviyo and Mailchimp sync and Cloudflare Turnstile captcha. Use when a developer asks for a newsletter signup, email capture, opt-in or waitlist form, a mailing list widget, or to connect a signup form to Klaviyo or Mailchimp. Installs a ready form component and a Next.js API route from the public Subbly shadcn registry, with a plain server-side fallback. For storefront code only. To read or change a live store (products, orders, subscribers), use the Subbly connector tools instead."
---

# Lead capture

A lead is an email address (with an optional name) that the shop collects before a purchase. Subbly stores leads for the merchant. Use this skill to add a signup form that creates a lead and, when configured, also subscribes the email in Klaviyo or Mailchimp.

## Before you start

- For a Next.js App Router project with shadcn/ui and Tailwind CSS, use the registry item. Do not write the form and route from the beginning, unless the user asks for that.
- For other stacks, use the fallback at the end of this skill.
- The registry code imports the API client from `src/lib/subbly/api.ts`. That file reads `NEXT_PUBLIC_SUBBLY_API_KEY` and throws when it is missing. See the `subbly-storefront-api` skill.
- Check that `src/app/api/subscribe/route.ts` does not exist yet. If it exists, the form may already be installed, or another feature uses that route. Ask the user before you replace it.

## Install from the registry

1. Make sure `components.json` (from `npx shadcn init`) has the Subbly registry. The item depends on `@subbly/subbly-lib`, which resolves only through this entry:

   ```json
   {
     "registries": {
       "@subbly": "https://registry.subbly.dev/r/{name}.json"
     }
   }
   ```

2. Run this command in the project root:

   ```bash
   npx shadcn@latest add https://registry.subbly.dev/r/lead-capture.json
   ```

3. If shadcn asks to overwrite a file that already exists (for example `src/lib/subbly/api.ts` or `button.tsx`), answer no, unless the user wants to replace it.

The command adds these files and installs their npm dependencies (`zod`, `react-hook-form`, `@hookform/resolvers`, `react-turnstile`, `@subbly/react`):

| File | What it does |
|---|---|
| `src/components/lead-capture-form.tsx` | Client form: email, optional first and last name, Zod validation, optional Turnstile captcha, success and error states. |
| `src/app/api/subscribe/route.ts` | `POST /api/subscribe`. Checks the captcha, validates the body, sends to each provider. |
| `src/app/api/subscribe/subbly-lead.ts` | Creates the Subbly lead with `subblyApi.lead.subscribe`. |
| `src/app/api/subscribe/klaviyo.ts` | Klaviyo profile import and list subscription. |
| `src/app/api/subscribe/mailchimp.ts` | Mailchimp audience member. |
| `src/app/api/subscribe/captcha.ts` | Cloudflare Turnstile token check. |

It also adds the shared Subbly files from `@subbly/subbly-lib` (`src/lib/subbly/api.ts` and others) when they are missing.

## Use the form

```tsx
import { LeadCaptureForm } from '@/components/lead-capture-form'

export default function Page () {
  return (
    <LeadCaptureForm
      title="Stay in the loop"
      description="Get news about new boxes and member offers."
      showFirstName
    />
  )
}
```

| Prop | Type | Default | Use |
|---|---|---|---|
| `title` | `string` | none | Heading above the form. |
| `description` | `string` | none | Text below the heading. |
| `showFirstName` | `boolean` | `false` | Show a first name field. |
| `showLastName` | `boolean` | `false` | Show a last name field. |

The form is a client component. You can put it in any page or layout. The project owns the files after install: change the markup and Tailwind classes to match the site design.

## How it works

1. The form sends `POST /api/subscribe` with `email`, optional `firstName` and `lastName`, `page` (the current path) and `origin: 'Website'`.
2. When `NEXT_PUBLIC_TURNSTILE_SITE_KEY` is set, the form shows the captcha and sends the token in the `x-captcha-token` header.
3. The route checks the token when `TURNSTILE_SECRET_KEY` is set.
4. The route validates the body with Zod. A name must have 3 to 50 characters.
5. The route starts each provider call and does not wait for them. It returns `{ success: true }`. Provider errors go to the server log only.
6. Subbly always runs. Klaviyo and Mailchimp run only when their variables are set.

## Environment variables

| Variable | Needed for | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUBBLY_API_KEY` | Subbly lead | Storefront API key. Required. |
| `KLAVIYO_PRIVATE_API_KEY` | Klaviyo | Private key (`pk_...`) with profile, subscription and list access. Without it, Klaviyo is skipped. |
| `KLAVIYO_LIST_ID` | Klaviyo | List to subscribe to. Without it, the profile is created but not subscribed to a list. |
| `MAILCHIMP_API_KEY` | Mailchimp | Mailchimp runs only when all three Mailchimp variables are set. |
| `MAILCHIMP_LIST_ID` | Mailchimp | Audience ID. |
| `MAILCHIMP_SERVER_PREFIX` | Mailchimp | Data center prefix, for example `us7`. |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Captcha | Shows the captcha widget. |
| `TURNSTILE_SECRET_KEY` | Captcha | Turns on the server check. Set both captcha keys or neither. |

Put the values in `.env.local`. Never commit them. Only variables with the `NEXT_PUBLIC_` prefix reach the browser.

## Customize

- **Fields.** Add the field to the Zod schema in the form and in the route. To keep extra data on the Subbly lead, pass it as `metadata` (an object) to `subblyApi.lead.subscribe`.
- **Name rules.** The form allows names up to 50 characters but does not set a minimum. The route needs 3 or more. Align the two schemas if short names must pass.
- **Captcha errors.** `verifyCaptcha` throws on a missing or failed token, so the route answers with a server error. Catch it and return a 400 if you want a clear message in the form.
- **Another provider.** Add a file next to `klaviyo.ts`. Read its keys from environment variables, return early when they are missing, and call it from the route without `await`.
- **Success state.** Replace the "Thank you" block with your own component or a redirect.

## Fallback without the registry

Create the lead from server code (a route handler, server action or backend). The Storefront API key is public, but third-party keys are not.

```ts
import { subblyApi } from '@subbly/react'

// Use the variable name of your project.
subblyApi.initialize({ apiKey: process.env.SUBBLY_STOREFRONT_API_KEY as string })

export async function createLead (email: string, firstName?: string) {
  return subblyApi.lead.subscribe({ email, firstName, metadata: { source: 'footer-form' } })
}
```

- `subblyApi.lead.subscribe(payload, headers?)` takes `{ email, firstName?, lastName?, metadata? }`.
- It returns `{ id, email, firstName, lastName, ipAddress, userAgent }`. When you call it from a server, `ipAddress` and `userAgent` belong to the server.
- `initialize` runs once. A second call is ignored.

## Rules

1. Do not call Klaviyo or Mailchimp from the browser. Their keys are private.
2. Do not hard-code keys. Read them from environment variables.
3. Do not create a second signup route. Use `/api/subscribe`.
4. Ask for marketing consent where the law needs it, and show a link to the privacy policy next to the form.

The merchant sees new leads in the Subbly admin at https://subbly.co/admin/leads.
