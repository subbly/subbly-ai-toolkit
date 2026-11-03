---
name: subbly-storefront-troubleshooting
description: "Helps you check and fix the Subbly integration in storefront code: a React app that uses `@subbly/react`, `subblyApi` and the hosted cart widget. Covers the Storefront API key, client initialization, SubblyProvider, the cart widget script, and common errors: 'API client accessed before it was initialized', missing apiKey, useShop outside SubblyProvider, cart does not open, getWidget returns null, events do not fire, CartItemNotConfiguredError, 404 or slug not found, wrong currency or prices, out of stock, 3-D Secure, and TypeScript errors. Use when a developer reports that the Subbly cart, products or API calls do not work in their site. For storefront code only. To read or change a live store, use the Subbly connector tools instead."
---

# Subbly storefront troubleshooting

Use this skill to check a storefront that uses `@subbly/react` and the hosted cart widget, and to fix the common faults. Start with the setup checklist. Most faults come from a missing or wrong setup step.

## Before you start

- Read the error text in the browser console and in the server log. Find it in the error table below.
- Open the browser network tab. Look at the failed request to `api.subbly.co` and its response body.
- Do not change the store data to fix a code fault. Store data changes belong to the merchant (connector tools).

## Setup checklist

Check each item in this order.

1. **Package.** `@subbly/react` is in `package.json`. React 19 is a peer dependency.
2. **API key.** The project passes a **Storefront** API key to `subblyApi.initialize` (and to `SubblyProvider` and `window.subblyConfig`). The key comes from the [API keys](https://subbly.co/admin/settings/api-keys) page in Subbly Admin. Do not open `.env` or other secret files, and do not print the key. Ask the user to confirm that the key is set, or check only that the setting name exists in the code. After a change to the key, rebuild or restart the app.
3. **Client init module.** One module calls `subblyApi.initialize(...)`, and the app imports it once at start. See the `subbly-storefront-api` skill.
4. **Provider.** The root component wraps the app in `<SubblyProvider>` when the code uses `useShop`, `useGateways` or other shop hooks.
5. **Widget script.** The page sets `window.subblyConfig`, then loads the cart widget script with `type="module"`. See the `subbly-cart-and-checkout` skill.

## API client faults

**"Subbly API client is access before it was initialized"** (the package spells it this way)

- Cause: code called `subblyApi` before `initialize` ran.
- Fix: import the init module before the first call, when the app starts. Code that runs outside React (for example, server-side data loading) does not render `SubblyProvider`, so it must import `subblyApi` from the init module.

**"Subbly API missing required `apiKey` option."** or **"Missing required apiKey config"**

- Cause: `initialize` or the widget got an empty key. The setting is empty, has another name, is not exposed to the browser by the build, or the app did not restart after a change.
- Fix: make sure the project passes its Storefront key, then rebuild or restart. Do not print the key value to check it.

**`initialize` seems to ignore a new key**

- `initialize` runs one time only. Later calls keep the first configuration. Restart the app after you change the key.

**"useShop must be used within a &lt;SubblyProvider&gt;."**

- Wrap the tree in `<SubblyProvider>` in the root component.

**401 or `unauthenticated` on customer calls**

- The customer access token is missing. In the browser, call `subblyApi.client.setAuth(token)`. On the server, send the token in the `headers` argument. See the `subbly-storefront-api` skill.

## Cart widget faults

**The cart does not open, `getWidget()` returns `null`, no widget in the page**

1. Check that the page loads the script, and that `window.subblyConfig` is set before the script runs.
2. Check the script URL: `https://assets.subbly.co/cart/cart-widget.js`, with `type="module"`.
3. In the network tab, filter for `cart-widget.js`. The status must be 200.
4. In the console, look for errors before the widget starts, for example a Content Security Policy that blocks `assets.subbly.co` or `api.subbly.co`.
5. The widget starts asynchronously. Code that runs on page load sees `null`. Wait for the window event `subbly-cart-initialized`.

**`addToCart` throws `CartItemNotConfiguredError`**

- The payload is missing a plan, variant, survey answers or gift recipient, and the widget is not on the page (or not loaded yet). Send a complete payload, or wait for the widget before you enable the button.

**`addToCart` throws `CartItemNeedsWidgetError`**

- `{ bundleId }` and `{ surveyId }` need the widget. Load the widget, or build the bundle or survey page yourself.

**`addToCart` works, but the widget does not show the item**

- Code called `subblyApi.cart.addItem` directly. The widget keeps its own copy of the cart. Use `addToCart`, or call `getWidget()?.reload()` after a direct API call.

**Events do not fire**

- Event names are upper case: `CART_UPDATED`, `PURCHASE_COMPLETED`.
- `CART_READY` fires before your code can subscribe. Use the window event `subbly-cart-initialized`.
- `useSubblyCartEventEffect` subscribes only if the widget exists at mount. It skips events with no payload (`CART_OPEN`, `CART_CLOSE`, `SIGN_OUT`). For these cases, use `widget.events.on` after `subbly-cart-initialized`.

**The cart counter stops updating after a page change**

- On client-side navigation, the widget does not always refresh `cartCounterEl`. Update the counter from `CART_UPDATED`.

**The widget shows on your own checkout page**

- Set `checkoutUrl` or `disableUrls` in `window.subblyConfig`, or call `useSubblyCartWidget({ disabled: true })` on that page.

**A coupon or gift card does not apply**

- `updateCart` rejects with the API error. Catch it and show the message. Check the code in the store with the merchant: it can be expired, limited to some products, or used up.

## Data faults

**404, `not_found`, or "Product with slug ... not found."**

- Slugs are case-sensitive. Use the exact slug.
- The product or bundle must be published and visible on the storefront.
- An ID can be a parent product ID or a plan or variant ID. `product.byId` takes a parent ID. `product.planById` and `product.variantById` take child IDs.

**Prices are 100 times too large or too small**

- Amounts are integers in minor units. Format them with `useCurrencyFormatter().formatAmount(amount)`. Do not divide by 100 in your own code: some currencies have no minor unit.

**Prices are in the wrong currency**

- Send `{ 'x-currency': code }` in the `headers` argument of product and bundle calls. The cart has its own currency: change it with `updateCart({ currencyCode })` or `widget.setCurrency(code)`.

**Bundle items cannot be selected, or the bundle hook crashes**

- `useBundleForm` needs a bundle with at least one plan and one ruleset. Check that the bundle loads with its plans and rulesets. See the `subbly-storefront-bundles` skill.

**Hydration warnings, or `Subbly cart widget must be accessed from browser environment`**

- Code called `getCart()` or `getWidget()` during render or on the server. Call them in an effect or an event handler.

## TypeScript faults

- Import types from `@subbly/react` with `import type { ParentProduct, SubblyCart } from '@subbly/react'`.
- Typed params use the enums: `ProductType.subscription`. In React Server Components, use `'subscription' as ProductType` (see below).
- Pass `undefined`, not `null`, to skip an optional `params` argument: `subblyApi.product.bySlug(slug, undefined, headers)`.
- `getCart()` and `getWidget()` can return `null`. Check the value before you use it.
- Narrow a product with `product.type === 'subscription'` before you read `plans`, and with `'one_time'` before you read `variants`. The string comparison narrows the type and works in server and client code.
- An error about a client module or client reference in a React Server Component: server code read a hook, enum or helper from `@subbly/react`. There, only `subblyApi` is a real value. Use `import type`, compare with strings, or move the code into a component that runs in the browser.

## Error table

| Error text | Cause | Fix |
|---|---|---|
| `Subbly API client is access before it was initialized...` | `initialize` did not run first | Import the init module when the app starts |
| ``Subbly API missing required `apiKey` option.`` | `initialize` got no key | Pass the key |
| `useShop must be used within a <SubblyProvider>.` | No provider | Wrap the app in `SubblyProvider` |
| `useCart must be used within a <CartProvider>.` | Headless cart hook without provider | Add `CartProvider`, or use `useSubblyCart` |
| `Subbly cart widget must be accessed from browser environment` | Widget access on the server | Move the call to an effect or handler |
| `The cart is not initialized` | Widget call before a cart exists | Wait for `subbly-cart-initialized` |
| `CartItemNotConfiguredError` | Incomplete payload, no widget | Send a complete payload |
| `CartItemNeedsWidgetError` | `bundleId` or `surveyId` without widget | Load the widget |
| `Product with slug ... not found.` | Wrong slug, or not published | Check the slug and the product status |
| `code: out_of_stock` | Product or survey answer out of stock | Show the item as sold out |
| `code: payment_requires_action` | 3-D Secure needed | Use the widget checkout, or handle the payment intent |

## Get help

If the fault stays, collect the console error, the failed request and its response, and the package versions. Then contact [Subbly support](https://support.subbly.co).
