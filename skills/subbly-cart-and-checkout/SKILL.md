---
name: subbly-cart-and-checkout
description: "Helps you write storefront code for the Subbly cart and checkout: load the hosted cart widget (SubblyCart.js), add products, plans, variants, bundles and surveys to the cart with `useSubblyCart` from `@subbly/react`, apply coupons and gift cards, set referral and gift details, listen to cart events, make buy links with `useBuyLink`, and hand checkout to your own page. Use when a developer builds an add-to-cart or Buy now button, a cart icon and counter, a coupon field, a gift option, purchase tracking, a custom checkout redirect, or fixes a cart that does not open. For storefront code only. To read or change a live store (products, orders, subscribers), use the Subbly connector tools instead."
---

# Subbly cart and checkout

The Subbly cart widget is a hosted cart, product configurator and checkout. One script tag loads it on any site. In React, the `useSubblyCart` hook from `@subbly/react` drives the widget. Use this skill to load the widget, put items in the cart and react to what the shopper does.

## Before you start

- **Client setup.** Initialize `subblyApi` first. See the `subbly-storefront-api` skill.
- **Storefront API key.** The widget uses the same Storefront API key as `subblyApi` (`NEXT_PUBLIC_SUBBLY_API_KEY` in Next.js).
- **Browser only.** The widget lives on `window.subblyCart`. `getWidget()` and `getCart()` throw on the server. Call them in event handlers and effects, not during render: `'use client'` components also render on the server.
- **IDs.** The cart adds a **plan ID** (subscription) or a **variant ID** (one-time product), not the parent product ID. To get these IDs, see `subbly-storefront-products` and `subbly-storefront-bundles`.
- **Amounts.** All amounts are integers in minor units: `1999` is 19.99.

## Load the widget

Write `window.subblyConfig` first. Then load the script. The widget reads the config one time, when the script runs.

```html
<script>
  window.subblyConfig = {
    apiKey: 'your_storefront_api_key',
    settings: {
      interceptProductLinks: true,
      cartToggleEl: '.subbly-cart',
      cartCounterEl: '.subbly-cart-product-count',
    },
  }
</script>
<script type="module" src="https://assets.subbly.co/cart/cart-widget.js"></script>
```

In Next.js (App Router), put the two scripts in a component and render it in the root layout:

```tsx
// src/lib/subbly/subbly-script.tsx
import Script from 'next/script'

export function SubblyScript({ apiKey }: { apiKey: string }) {
  const config = {
    apiKey,
    settings: {
      interceptProductLinks: true,
      cartToggleEl: '.subbly-cart',
      cartCounterEl: '.subbly-cart-product-count',
    },
  }

  return (
    <>
      <Script id="subblyConfigScript">{`window.subblyConfig = ${JSON.stringify(config)}`}</Script>
      <Script id="subblyCartWidgetScript" type="module" src="https://assets.subbly.co/cart/cart-widget.js" />
    </>
  )
}
```

To install this component with the client setup, run `npx shadcn add https://registry.subbly.dev/r/subbly-lib.json`. Its `SubblyScript` also takes `apiUrl`, `languageCode`, `checkoutUrl`, `cartSummaryUrl`, `disableUrls` and `settings` props.

The script loads asynchronously. `window.subblyCart` is set when the window event `subbly-cart-initialized` fires. Until then, `getWidget()` returns `null`. The widget event `CART_READY` fires before your code can subscribe, so do not wait for it. Wait for `subbly-cart-initialized`, then read `subblyCart.cart`.

## Use the cart from React

```tsx
'use client'

import { useSubblyCart } from '@subbly/react'

export function AddToCartButton({ planId }: { planId: number }) {
  const { addToCart } = useSubblyCart()

  return <button onClick={() => addToCart({ productId: planId, quantity: 1 })}>Add to cart</button>
}
```

`useSubblyCart()` returns four functions:

| Function | What it does |
|---|---|
| `addToCart(payload)` | Adds an item. If the payload is not complete (no plan, variant, survey answers or gift recipient), the widget opens and asks the shopper. Returns `Promise<SubblyCart \| null>`. |
| `updateCart(payload)` | Changes cart-level fields: coupon, gift card, currency, referral, gift details, metadata. Returns the updated cart. |
| `getCart()` | Returns the current cart (`SubblyCart`) or `null`. It is synchronous. |
| `getWidget()` | Returns the widget instance or `null`. It is synchronous. |

Rules for `addToCart`:

- Do not open the cart after `addToCart`. The shop setting `afterItemAdded` controls what shows next (notification, summary, checkout or nothing).
- The promise resolves when the shopper finishes or closes the widget screens. To add many items in sequence, `await` each call.
- `{ bundleId }` opens the widget bundle builder. `{ surveyId }` opens the survey flow. These two need the widget on the page. Without it, they throw `CartItemNeedsWidgetError`.
- If the widget is not loaded yet, a complete payload goes straight to the cart in the `subbly_cart_id` cookie. An incomplete payload throws `CartItemNotConfiguredError`. Disable the button until the widget is ready, or send complete payloads.

For every payload shape (subscription, one-time, add-on, gift card, bundle, survey answers, metadata), read `references/cart-payloads.md`.

## Coupons, gift cards, referrals and gifts

```ts
const { updateCart } = useSubblyCart()

await updateCart({ couponCode: 'SAVE20' })     // apply a coupon
await updateCart({ couponCode: null })         // remove the coupon
await updateCart({ giftCardCode: 'GIFT-1234' }) // redeem a gift card
await updateCart({ giftCardCode: null })       // remove the gift card
await updateCart({ referralId: 12345 })        // attach the referring customer
```

- An invalid code rejects the promise. Catch the error and show a message to the shopper.
- Without the widget and without a `CartProvider`, `updateCart` does nothing and returns `undefined`.
- A link with `?coupon=CODE` also applies a coupon, when the cart can take it. `?r=ID` sets the referrer.
- For gift details (`giftInfo`) and cart-level metadata, read `references/cart-payloads.md`.

## Control the widget

```ts
const widget = useSubblyCart().getWidget()

widget?.open()            // open the cart summary
widget?.open('checkout')  // open the checkout
widget?.close()
widget?.setCustomerData({ email: 'ada@example.com', marketingConsent: true })
await widget?.authenticate(accessToken) // sign the customer in to the widget
await widget?.signOut()
```

To react to cart events in React, use `useSubblyCartEventEffect`:

```tsx
'use client'

import { useSubblyCartEventEffect } from '@subbly/react'

export function PurchaseTracker() {
  useSubblyCartEventEffect('PURCHASE_COMPLETED', ({ cart, purchase }) => {
    console.log('Purchase', purchase, cart.currencyCode)
  })
  return null
}
```

Known limits of `useSubblyCartEventEffect`:

- It subscribes only if `window.subblyCart` exists when the component mounts. Mount it after `subbly-cart-initialized`, or use `widget.events.on` in your own effect.
- It calls your callback only when the event has a payload. `CART_OPEN`, `CART_CLOSE` and `SIGN_OUT` have none, so use `widget.events.on` for them.

Event names are upper case: `CART_UPDATED`, not `cart_updated`. For all methods, properties, events and settings, read `references/widget-reference.md`.

## Buy links

A buy link sends the shopper straight to checkout with one item. Use it for "Buy now" buttons, emails and social posts.

```tsx
'use client'

import { useBuyLink } from '@subbly/react'

export function BuyNowLink({ planId }: { planId: number }) {
  const { buyLink } = useBuyLink({ id: planId, type: 'product' })
  return <a href={buyLink}>Buy now</a>
}
```

- `type` is `'product'` (default), `'bundle'` or `'survey'`.
- The link is `{checkoutUrl}/checkout/buy/{id}`, `/checkout/buy/bundle/{id}` or `/checkout/buy/survey/{id}`. The default `checkoutUrl` is `https://www.subbly.co`. Pass the shop's own checkout domain if it has one.
- With `interceptProductLinks: true`, the widget catches clicks on these links and opens on the same page. Add `?coupon=CODE` or `?gift=1` to the link as necessary.

## Your own cart or checkout page

- To send the shopper to your own checkout page, set `checkoutUrl` (and `cartSummaryUrl`) in `window.subblyConfig`. The widget stands down on those paths.
- To turn the widget off on one page, call `useSubblyCartWidget({ disabled: true })` in that page.
- `@subbly/react` also has a headless cart (`CartProvider`, `useCart`) and checkout hooks. `useSubblyCart` uses a `CartProvider` when one is above it. Read `references/headless-cart.md` before you start this work.

## Common mistakes

- Parent product ID in `addToCart` when the product has many plans or variants. The widget then asks the shopper to choose. Send the plan or variant ID to skip that step.
- Calling `getWidget()` during server render. It throws. Call it in a handler or an effect.
- Listening for `CART_READY`. Wait for the window event `subbly-cart-initialized` instead.
- Reading `cart.total` as the amount due today. `total` covers the first charge and later charges. In a headless cart, use `useCartSummary().totals.now.amountDue`.
- Old setting names: `disableCartSummary` is deprecated. Use `disableSummaryView`.

## References

| Reference | Read it when |
|---|---|
| [references/cart-payloads.md](references/cart-payloads.md) | You build an `addToCart`, `updateCart` or `updateItem` payload: subscription, one-time, add-on, gift card, bundle, survey answers, metadata, gift details. |
| [references/widget-reference.md](references/widget-reference.md) | You call a widget method, read a widget property, listen to an event, or set `window.subblyConfig`, `settings`, `setSettings` or URL query parameters. |
| [references/headless-cart.md](references/headless-cart.md) | You replace the widget UI with your own cart or checkout, or you see `CartProvider`, `useCart` or the checkout hooks in a project. |

Public docs: [cart widget guide](https://docs.subbly.dev/developer-resources/cart-widget) and [cart widget reference](https://docs.subbly.dev/reference/cart-widget).
