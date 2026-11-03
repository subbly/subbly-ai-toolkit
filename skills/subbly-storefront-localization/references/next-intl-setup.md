# next-intl setup for a Subbly storefront

Locale routing for a Next.js App Router storefront. The files follow the next-intl conventions. Check the installed next-intl version: this page uses the v4 API. Adjust the locales to the codes in `shop.languages[].code`.

## Files

```
messages/en.json
messages/fr.json
next.config.ts
src/i18n/routing.ts
src/i18n/request.ts
src/i18n/navigation.ts
src/middleware.ts        (Next.js 15)  or  src/proxy.ts  (Next.js 16)
src/app/layout.tsx       root layout: html, body, Subbly providers, widget script
src/app/[locale]/layout.tsx
src/app/[locale]/page.tsx and the other pages
```

Move the pages from `src/app/` to `src/app/[locale]/`. Keep route handlers (`src/app/api/...`) outside `[locale]`.

## src/i18n/routing.ts

```ts
import { defineRouting } from 'next-intl/routing'

export const routing = defineRouting({
  locales: ['en', 'fr', 'de'],
  defaultLocale: 'en',
})
```

## src/middleware.ts or src/proxy.ts

```ts
import createMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'

export default createMiddleware(routing)

export const config = {
  // Skip API routes, Next.js internals and files with an extension.
  matcher: '/((?!api|trpc|_next|_vercel|.*\\..*).*)',
}
```

Next.js 16 renamed `middleware.ts` to `proxy.ts`. Use the name that matches the installed Next.js version.

## src/i18n/request.ts

```ts
import { getRequestConfig } from 'next-intl/server'
import { hasLocale } from 'next-intl'
import { routing } from './routing'

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  }
})
```

## src/i18n/navigation.ts

```ts
import { createNavigation } from 'next-intl/navigation'
import { routing } from './routing'

export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing)
```

Use this `Link` and `useRouter` in the storefront, not the ones from `next/link` and `next/navigation`. They keep the locale prefix.

## next.config.ts

```ts
import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin()

const nextConfig: NextConfig = {}

export default withNextIntl(nextConfig)
```

## src/app/layout.tsx (root)

The root layout keeps `<html>` and `<body>`, sets the language on `<html>`, and loads Subbly. Keep any `revalidate` or other route settings that the file had before.

```tsx
import { getLocale } from 'next-intl/server'
import { SubblyProvider } from '@subbly/react'
import { SubblyScript } from '@/lib/subbly/subbly-script'
import '@/lib/subbly/api'

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale()
  const apiKey = process.env.NEXT_PUBLIC_SUBBLY_API_KEY

  return (
    <html lang={locale}>
      <body>
        {apiKey && <SubblyScript apiKey={apiKey} />}
        <SubblyProvider>{children}</SubblyProvider>
      </body>
    </html>
  )
}
```

The widget reads `<html lang>`, so it starts in the page language. If your `SubblyScript` takes a `languageCode` prop (the registry version does), pass `languageCode={locale}` to set it explicitly.

## src/app/[locale]/layout.tsx

```tsx
import { notFound } from 'next/navigation'
import { hasLocale, NextIntlClientProvider } from 'next-intl'
import { setRequestLocale } from 'next-intl/server'
import { routing } from '@/i18n/routing'

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) notFound()

  setRequestLocale(locale)

  return <NextIntlClientProvider>{children}</NextIntlClientProvider>
}
```

Move the layout content that was inside `<body>` (header, footer, other providers) into this file.

## A localized product page

```tsx
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { subblyApi } from '@/lib/subbly/api'

export default async function ProductPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params
  setRequestLocale(locale)

  const t = await getTranslations('product')
  const product = await subblyApi.product.bySlug(slug, undefined, { 'accept-language': locale })

  return (
    <main>
      <h1>{product.name}</h1>
      <p>{t('subscribeAndSave')}</p>
    </main>
  )
}
```

- Store the site's own text in `messages/{locale}.json`. Product, bundle and survey text comes from the API in the requested language.
- To use a currency too, add `'x-currency'` to the same `headers` object. See `currency-switching.md`.
