# Currency switching

A full multi-currency flow for a Next.js App Router storefront:

1. A route handler keeps the chosen currency in an HTTP-only cookie.
2. Server pages read the cookie and send `x-currency` to the API.
3. A client switcher posts the new code, changes the widget currency, and reloads the page.
4. On start-up, the widget currency is synced to the cookie.

An HTTP-only cookie keeps the value off client scripts and makes it available during server render. A page that reads cookies renders on each request, so it is not static.

## Supported currencies

Read the list from the shop. Do not hard-code it.

```ts
// src/lib/subbly/currencies.ts
import { subblyApi } from '@/lib/subbly/api'

export const CURRENCY_COOKIE = 'currency'

export async function getShopCurrencies() {
  const shop = await subblyApi.shop.load()
  return shop.currencies.map((currency) => ({
    code: currency.abbreviation,
    name: currency.name,
    symbol: currency.symbol,
  }))
}
```

The shop base currency is the default when the cookie is empty. Use the first entry, or the base currency of the merchant's store.

## Route handler

```ts
// src/app/api/currency/route.ts
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { CURRENCY_COOKIE, getShopCurrencies } from '@/lib/subbly/currencies'

export async function GET() {
  const currencies = await getShopCurrencies()
  const store = await cookies()
  const active = store.get(CURRENCY_COOKIE)?.value ?? currencies[0]?.code

  return NextResponse.json({ active, currencies })
}

export async function POST(request: Request) {
  const { currency } = (await request.json()) as { currency?: string }
  const currencies = await getShopCurrencies()

  if (!currencies.some((c) => c.code === currency)) {
    return NextResponse.json({ error: `Unsupported currency: ${currency}` }, { status: 400 })
  }

  const store = await cookies()
  store.set(CURRENCY_COOKIE, currency!, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
  })

  return NextResponse.json({ active: currency, currencies })
}
```

## Server page

```tsx
// src/app/[locale]/products/page.tsx (or src/app/products/page.tsx without locales)
import { cookies } from 'next/headers'
import { subblyApi } from '@/lib/subbly/api'
import { CURRENCY_COOKIE, getShopCurrencies } from '@/lib/subbly/currencies'
import { formatMinorUnits } from '@/lib/format-amount'
import { CurrencySwitcher } from '@/components/currency-switcher'

export default async function ProductsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const currencies = await getShopCurrencies()
  const store = await cookies()
  const currency = store.get(CURRENCY_COOKIE)?.value ?? currencies[0].code

  const { data: products } = await subblyApi.product.list(
    { page: 1, perPage: 12 },
    { 'x-currency': currency, 'accept-language': locale },
  )

  return (
    <main>
      <CurrencySwitcher current={currency} currencies={currencies} />
      {products.map((product) => {
        const prices = product.type === 'subscription' // string, not ProductType: this is a server component
          ? product.plans.map((plan) => plan.price)
          : product.variants.map((variant) => variant.price)

        return (
          <article key={product.id}>
            <h2>{product.name}</h2>
            {prices.length > 0 && <p>From {formatMinorUnits(Math.min(...prices), currency, locale)}</p>}
          </article>
        )
      })}
    </main>
  )
}
```

## Switcher

```tsx
// src/components/currency-switcher.tsx
'use client'

import { useState } from 'react'
import { useSubblyCart } from '@subbly/react'

type Currency = { code: string; name: string }

export function CurrencySwitcher({ current, currencies }: { current: string; currencies: Currency[] }) {
  const { getWidget, updateCart } = useSubblyCart()
  const [busy, setBusy] = useState(false)

  const change = async (code: string) => {
    setBusy(true)
    try {
      await fetch('/api/currency', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currency: code }),
      })

      const widget = getWidget()
      if (widget) {
        await widget.setCurrency(code)
      } else {
        await updateCart({ currencyCode: code })
      }

      // Reload so that server pages fetch prices in the new currency.
      window.location.reload()
    } catch (error) {
      console.error('Currency change failed', error)
      setBusy(false)
    }
  }

  return (
    <select value={current} disabled={busy} onChange={(event) => change(event.target.value)}>
      {currencies.map((c) => (
        <option key={c.code} value={c.code}>{c.code} - {c.name}</option>
      ))}
    </select>
  )
}
```

## Sync the widget on start-up

A returning shopper can have a cart in another currency than the cookie. Sync it one time, when the widget is ready. Render this component in the root layout with the cookie value.

```tsx
'use client'

import { useEffect } from 'react'
import { useSubblyCart } from '@subbly/react'

export function WidgetCurrencySync({ currency }: { currency: string }) {
  const { getWidget } = useSubblyCart()

  useEffect(() => {
    const sync = () => {
      const widget = getWidget()
      if (widget && widget.state.currencyCode !== currency) {
        widget.setCurrency(currency).catch(() => {})
      }
    }

    if (getWidget()) sync()
    else window.addEventListener('subbly-cart-initialized', sync, { once: true })

    return () => window.removeEventListener('subbly-cart-initialized', sync)
  }, [currency, getWidget])

  return null
}
```

Use the same idea for the language: compare `widget.state.languageCode` with the locale and call `widget.setLanguage(locale)`.

## Client-side loading

When a client component loads prices itself, pass the currency as a prop and load again when it changes.

```tsx
'use client'

import { useEffect, useState } from 'react'
import { subblyApi, type ParentProduct } from '@subbly/react'

export function ProductGrid({ currency }: { currency: string }) {
  const [products, setProducts] = useState<ParentProduct[]>([])

  useEffect(() => {
    let active = true
    subblyApi.product
      .list({ page: 1, perPage: 12 }, { 'x-currency': currency })
      .then(({ data }) => active && setProducts(data))
    return () => {
      active = false
    }
  }, [currency])

  return <ul>{products.map((p) => <li key={p.id}>{p.name}</li>)}</ul>
}
```

## Format without the hook

`useCurrencyFormatter` is a client hook. In a server component, or to format in the right locale on the first render, use a small helper. It reads the number of minor units of each currency from `Intl`, the same way `@subbly/react` does.

```ts
// src/lib/format-amount.ts
export function formatMinorUnits(amount: number, currencyCode: string, locale?: string) {
  const formatter = new Intl.NumberFormat(locale, { style: 'currency', currency: currencyCode })
  const digits = formatter.resolvedOptions().minimumFractionDigits ?? 2
  return formatter.format(amount / 10 ** digits)
}
```

With next-intl, you can call `format.number(amount / 10 ** digits, { style: 'currency', currency })` from `useFormatter()` instead. Compute `digits` the same way. Do not use a fixed `/ 100`, and do not read the currency from a build-time env variable: the shopper can change it.
