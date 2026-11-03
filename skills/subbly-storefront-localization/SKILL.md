---
name: subbly-storefront-localization
description: "Helps you write storefront code for a multi-language or multi-currency Subbly store with `@subbly/react` and Next.js: locale routing with next-intl, a language switcher, translated API content with accept-language, the cart widget language, prices in another currency with the x-currency header, the cart currency, a currency switcher saved in a cookie, and price formatting with `useCurrencyFormatter`. Use when a developer asks to translate the storefront, add languages or locales (/en, /fr), add a currency or language selector, show prices in EUR or GBP, or fix prices that show in the wrong currency or format. For storefront code only. To read or change a live store (products, orders, subscribers), use the Subbly connector tools instead."
---

# Subbly storefront localization

A Subbly shop can sell in many languages and currencies. The merchant turns them on in the store. The storefront code must ask the API for the right language and currency, keep the cart widget in step, and format prices for the locale.

## Before you start

- **Client setup.** Initialize `subblyApi` first. See the `subbly-storefront-api` skill.
- **Ask first.** Add multi-language or multi-currency support only when the user asks for it. Add only the part they ask for.
- **Shop data.** Read what the shop supports from `subblyApi.shop.load()`: `languages[].code` (for example `en`, `fr`) and `currencies[].abbreviation` (for example `USD`, `EUR`). Use only these codes. Do not hard-code a list the shop does not have.
- **Amounts.** All amounts are integers in minor units. The number of minor units depends on the currency (JPY has none). Never divide by 100 in your own code. Use a formatter (see "Format prices").

## Languages

### Routing

Use `next-intl` with locale prefixes in the URL (`/en/...`, `/fr/...`). This is the default, because search engines can index each language. Use a cookie or `localStorage` for the language only when the user asks for it.

```bash
npm install next-intl
```

You need these parts. Read `references/next-intl-setup.md` for the files.

1. `src/i18n/routing.ts`: the locales and the default locale.
2. The locale middleware: `src/middleware.ts` (Next.js 15) or `src/proxy.ts` (Next.js 16), with `createMiddleware` from `next-intl/middleware`. Without it, locale routes do not work.
3. `src/i18n/request.ts`: loads the messages for the request locale.
4. `src/i18n/navigation.ts`: locale-aware `Link`, `redirect`, `useRouter` and `usePathname` from `createNavigation`.
5. `src/app/[locale]/layout.tsx` and pages under `src/app/[locale]/`. The root `src/app/layout.tsx` keeps `<html>` and `<body>`, sets `<html lang={locale}>`, and renders the Subbly providers and the cart widget script.
6. The `next-intl` plugin in `next.config.ts`.

For text, use `useTranslations` (client) or `getTranslations` (server). For dates and numbers, use `useFormatter`.

### Translated API content

The Storefront API returns product, bundle and survey text in the language of the `accept-language` header.

- **Server code.** Send the locale in the `headers` argument of each call: `subblyApi.product.bySlug(slug, undefined, { 'accept-language': locale })`. Do not change the language on the shared client in server code: one client serves all visitors.
- **Browser code.** Call `subblyApi.client.setLanguage(locale)` one time when the locale is known, or send the header per call.

### Cart widget language

- The widget takes its language from `languageCode` in `window.subblyConfig`. Without it, it reads `?lang=`, then `<html lang>`, then the browser. With `<html lang={locale}>`, the widget starts in the right language.
- To change the language without a page load, call `getWidget()?.setLanguage(code)`. Read the current language from `getWidget()?.state.languageCode`.
- `setLanguage` throws when the code is empty. The shop must publish the language, or the widget falls back to a shop language.

### Language switcher

```tsx
'use client'

import { useLocale } from 'next-intl'
import { usePathname } from '@/i18n/navigation'
import { routing } from '@/i18n/routing'

const names: Record<string, string> = { en: 'English', fr: 'Français', de: 'Deutsch' }

export function LanguageSwitcher() {
  const locale = useLocale()
  const pathname = usePathname() // path without the locale prefix

  return (
    <select
      value={locale}
      onChange={(event) => {
        // Full page load: the server, the API calls and the widget all start in the new language.
        window.location.href = `/${event.target.value}${pathname}`
      }}
    >
      {routing.locales.map((code) => (
        <option key={code} value={code}>{names[code] ?? code}</option>
      ))}
    </select>
  )
}
```

Use a full page load, not client navigation. Then every server call and the widget read the new locale.

## Currencies

### Prices in another currency

Product, bundle, survey and metafield methods take an `x-currency` header. It prices that response in another shop currency.

```ts
const headers = { 'x-currency': 'EUR' }

const products = await subblyApi.product.list({ page: 1, perPage: 12 }, headers)
const product = await subblyApi.product.bySlug('coffee-box', undefined, headers)
const bundle = await subblyApi.bundle.bySlug('snack-box', undefined, headers)
const items = await subblyApi.bundle.listItems(bundle.id, { page: 1 }, headers)
```

- Load prices on the server when you can. The first render then shows the right currency, which is better for SEO.
- To send both language and currency, put both keys in one `headers` object.

### Cart currency

The cart has its own `currencyCode`. The `x-currency` header does not change it. When the shopper changes currency, change the cart too:

```ts
const { updateCart, getWidget } = useSubblyCart()

const widget = getWidget()
if (widget) {
  await widget.setCurrency('EUR') // re-prices the cart and the widget
} else {
  await updateCart({ currencyCode: 'EUR' })
}
```

Read the cart currency from `getCart()?.currencyCode` or `getWidget()?.state.currencyCode`. Set `localizationSettings: true` in the widget `settings` to show the widget's own currency and language picker.

### Keep the currency

Keep the chosen currency in an HTTP-only cookie, set by a route handler. Server pages read the cookie and send `x-currency`. A client switcher posts the new code, changes the widget currency, then reloads the page. Read `references/currency-switching.md` for the route handler, the server page, the switcher and the start-up sync of the widget.

## Format prices

Use `useCurrencyFormatter` from `@subbly/react`. It divides by the right number of minor units for each currency.

```tsx
'use client'

import { useEffect } from 'react'
import { useLocale } from 'next-intl'
import { useCurrencyFormatter } from '@subbly/react'

export function Price({ amount, currencyCode }: { amount: number; currencyCode: string }) {
  const locale = useLocale()
  const { formatAmount, setCurrency } = useCurrencyFormatter()

  useEffect(() => {
    setCurrency(locale, currencyCode)
  }, [locale, currencyCode, setCurrency])

  return <span>{formatAmount(amount)}</span>
}
```

- `setCurrency(locale, currencyCode)` takes the locale first. The default is `en-US` and `USD`.
- The state is local to each component. A `setCurrency` call in one component does not change another component.
- `formatAmount(amount, currencyCode)` formats one amount in another currency, with the current locale.
- For a server component, or to avoid the first render in `en-US`, use the helper in `references/currency-switching.md`.

## Common mistakes

- `amount / 100` in your own code. It is wrong for currencies with no minor units. Use a formatter.
- Changing the `x-currency` header but not the cart. The cart then shows another currency than the product page.
- `subblyApi.client.setLanguage` or `setHeaders` in server code. The next visitor gets the same language.
- Passing `null` to skip `params`. Pass `undefined`.
- A locale or currency list that does not match the shop. Read `shop.languages` and `shop.currencies`.

## References

| Reference | Read it when |
|---|---|
| [references/next-intl-setup.md](references/next-intl-setup.md) | You add locale routing with next-intl: routing, middleware or proxy, request config, navigation, layouts and the Next.js plugin. |
| [references/currency-switching.md](references/currency-switching.md) | You add a currency switcher, keep the currency in a cookie, load prices on the server or client in the chosen currency, or format prices without the hook. |
