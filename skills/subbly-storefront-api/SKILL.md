---
name: subbly-storefront-api
description: "Helps you write storefront code that calls the Subbly Storefront API with `subblyApi` from `@subbly/react` or with `SubblyApiClient` from `@subbly/api-client`. Covers install, the Storefront API key, client initialization, server rendering and route handlers, and every namespace: product, bundle, cart, checkout and funnels, auth, customers, subscriptions, addresses, wallet, payment intents, pickup info, surveys, metafields, shop, countries, lead and stock. Also covers params, expand, headers, x-currency, pagination, errors, 3-D Secure and customer access tokens. Use when you build a custom or headless storefront, a React shop, a customer account page, or when you need the exact method signature, payload or response type. For storefront code only. To read or change a live store (products, orders, subscribers), use the Subbly connector tools instead."
---

# Subbly Storefront API

`subblyApi` is the Storefront API client in `@subbly/react`. It wraps `SubblyApiClient` from `@subbly/api-client` and adds default `expand` lists, so responses arrive with the relations a storefront usually renders. Use this skill to set up the client and to find the right method, payload and response type.

## Before you start

- **Packages.** Install `@subbly/react` (React 19 is a peer dependency). It re-exports `subblyApi` and every type from `@subbly/api-client`, so import both from `@subbly/react`. Use `@subbly/api-client` directly only in non-React code.
- **API key.** Use a Storefront API key. Get it on the [API keys](https://subbly.co/admin/settings/api-keys) page in Subbly Admin. The Storefront key is public: the browser sends it with each request. Never put a Private API key in storefront code.
- **Keep key values out of the chat.** The key belongs to the developer's project. Do not open `.env` or other secret files, and do not print key values. To check that a key is set, ask the user, or check only that the setting name exists.
- **API URL.** `apiUrl` is optional. Set it only for a proxy or a test environment. The default URL is `https://api.subbly.co/storefront/v1/`.
- **Read before you write.** Before you write code for a step, read the reference for each method in that step. Check the payload fields and the response type. Do not guess field names.

## Initialize the client

Initialize the client once, before the first call. Put it in one module of the project. The examples in these skills import that module as `./subbly`; change the path to match the project.

```ts
// subbly.ts
import { subblyApi } from '@subbly/react'
import { config } from './config' // the project's public settings

subblyApi.initialize({ apiKey: config.subblyStorefrontKey })

export { subblyApi }
```

Import this module once when the app starts, and import `subblyApi` from it in your own code. Read the key from the project's own configuration, the way the project's build tool exposes public values to the browser.

Rules:

- `initialize({ apiKey, apiUrl?, lang? })` runs one time only. A second call does nothing and keeps the first configuration. Use `subblyApi.isInitialized()` to check.
- `initialize` without `apiKey` throws ``Subbly API missing required `apiKey` option.``
- A call before `initialize` throws `Subbly API client is access before it was initialized. Call createApiClient to initialize.` If you see this error, make sure the init module loads first.
- `<SubblyProvider>` also initializes the client, then loads the shop for `useShop()`. Pass it the same key in its `apiKey` prop (and `apiUrl` if you use one). Code that runs outside React does not render the provider, so keep the init module.
- For non-React code, create your own client: `new SubblyApiClient({ apiKey })` from `@subbly/api-client`. It has no default expands, and some method names are different (see "Raw client" below).

## Server and browser code

- Catalog calls (products, bundles, metafields, shop) need no customer token, so they can run on a server or in the browser. Load them on the server when the site renders pages there. This is better for SEO and for the first render.
- `@subbly/react` has a `react-server` export condition for React Server Components. There, `subblyApi` is the only runtime value: hooks, enums such as `ProductType` and helpers such as `formatMetafieldList` are client references. Use `import type` for types, compare with the string value (`product.type === 'subscription'`), and cast a typed param (`type: 'subscription' as ProductType`).
- The client is a module-level singleton. On the server, one client serves all requests. Do not call `subblyApi.client.setAuth()` on the server, because the token stays on the shared client for the next visitor. On the server, send the customer token per call in `headers` (see "Customer access token").
- Cart, checkout and customer calls usually run in the browser, where the cart ID and the customer token live in cookies (`subbly_cart_id`, `subbly_access_token`).

## Namespaces

Each method returns a Promise. Use `async`/`await`.

| Namespace | Methods | Reference |
|---|---|---|
| `product` | `list`, `byId`, `bySlug`, `variantById`, `planById` | `catalog.md` |
| `bundle` | `list`, `byId`, `bySlug`, `listItems`, `listGroups`, `quote` | `catalog.md` |
| `metafield` | `list`, `byId`, `bySlug` | `catalog.md` |
| `surveys` | `load` | `catalog.md` |
| `shop` | `load` | `catalog.md` |
| `countries` | `list` | `catalog.md` |
| `stock` | `subscribe` (back-in-stock alert) | `catalog.md` |
| `lead` | `subscribe` (email capture) | `catalog.md` |
| `cart` | `create`, `load`, `update`, `addItem`, `updateItem`, `removeItem`, `getStartDates`, `getGiftingDates`, `getShippingMethods`, `getLocalPickups`, `attachCustomer` | `cart-and-checkout-api.md` |
| `checkout` | `purchase`, `prePurchaseFetch`, `prePurchaseAccept`, `prePurchaseReject`, `prePurchaseRefresh`, `midPurchaseFetch`, `midPurchaseAccept`, `midPurchaseReject`, `postPurchaseFetch`, `postPurchaseAccept`, `postPurchaseReject` | `cart-and-checkout-api.md` |
| `paymentIntents` | `getPaymentIntent`, `confirm` | `cart-and-checkout-api.md` |
| `wallet` | `setup`, `setupIntent`, `store`, `list` | `cart-and-checkout-api.md` |
| `pickupInfo` | `store`, `list` | `cart-and-checkout-api.md` |
| `auth` | `login`, `register`, `registered`, `otp`, `otpLogin`, `social` | `customer-api.md` |
| `customers` | `me`, `update`, `referral` | `customer-api.md` |
| `subscriptions` | `list`, `load`, `update`, `updatePreferences`, `updateBundle` | `customer-api.md` |
| `addresses` | `store`, `list` | `customer-api.md` |

`subblyApi.client` gives the underlying `SubblyApiClient`. Use it for the methods that `subblyApi` does not wrap.

## Conventions

**Argument order.** Methods take arguments in this order: IDs, then `payload` (for writes), then `params`, then `headers`. Pass `undefined` to skip an argument: `subblyApi.product.bySlug('coffee-box', undefined, { 'x-currency': 'EUR' })`.

**Expand.** Most read methods accept `params.expand`, a list of relations to include. A relation that you do not expand comes back `null`. `subblyApi` sends a default list for each method. If you pass `expand`, your list **replaces** the default list. It does not add to it. Copy the defaults that you still need. Write expand paths in the API format (`gift_card`, `items.product.parent`). The client does not convert them.

**Field names.** Write params and payloads in camelCase. The client converts keys to snake_case for the request and converts response keys to camelCase.

**Pagination.** List methods for products, bundles, bundle items, bundle groups, metafields and subscriptions take `page` and `perPage` (1 to 100) and return `{ data, pagination }`. `pagination` has `currentPage`, `lastPage`, `from`, `to` and `total`.

**Amounts.** All amounts are integers in the minor unit of the currency: `1999` is 19.99. Use `useCurrencyFormatter` from `@subbly/react` to format them. Do not divide by 100 yourself: some currencies have no minor unit.

**Currency.** Product, bundle, survey and metafield methods accept an `x-currency` header, for example `{ 'x-currency': 'EUR' }`. It prices that one response in another shop currency. The cart has its own `currencyCode`: change it with `cart.update(cartId, { currencyCode })`. Read the shop currencies from `shop.load()` (`currencies[].abbreviation`).

**Language.** Pass `lang` to `initialize`, or call `subblyApi.client.setLanguage(code)`. The client sends it as `accept-language`. Read the shop languages from `shop.load()` (`languages[].code`).

**Errors.** A failed request rejects with the parsed API error, not an `Error`. Read `error.code` and `error.message`. The client also adds a non-enumerable `error.status` (HTTP status). When the response has no body, the rejection is an `Error` with the HTTP status text. Known codes:

| `code` | Meaning |
|---|---|
| `not_found` | The record does not exist or is not published. |
| `bad_request` | The request or payload is not valid. |
| `out_of_stock` | A product or a survey answer is out of stock. |
| `payment_requires_action` | The payment needs 3-D Secure. The error also has `paymentIntentId`. |
| `user_email_is_not_unique` | An account with this email already exists. |
| `unauthenticated` | The customer access token is missing or not valid. |

`product.bySlug`, `bundle.bySlug`, `metafield.byId` and `metafield.bySlug` use a list request. When nothing matches, they throw a plain `Error` (for example `Product with slug coffee-box not found.`), not an API error. Slugs are case-sensitive.

**Customer access token.** `auth.login`, `register`, `otpLogin` and `social` return `{ accessToken, expiresIn }`. The client does not store the token for you. In the browser, call `subblyApi.client.setAuth(accessToken)` and keep the token in the `subbly_access_token` cookie, so the cart widget uses the same session. On the server, send `{ Authorization: 'Bearer ' + accessToken }` in the `headers` argument of each call. Customer methods (`customers`, `subscriptions`, `addresses`, `wallet`, `pickupInfo`, `cart.attachCustomer`) need the token.

## Raw client

`subblyApi.client` (or your own `SubblyApiClient`) has more methods than `subblyApi`. The raw client sends no default expand, so add the expands you need.

- Resource names: `products` (not `product`), with `load`, `loadVariant`, `loadPlan` and `list`. `bundle` has `load`, `loadItems`, `loadGroups`, `list` and `quote`.
- Only on the raw client: `orders` and `invoices` (`list`, `load`), `cancellations.reasons`, subscription actions (`cancel`, `pause`, `resume`, `skip`, `reactivate` and more), subscription items, `addresses.update` and `delete`, `wallet.setDefault` and `delete`, `pickupInfo.update` and `delete`.

See `customer-api.md` for these methods.

## Common flows

- **Product or bundle page.** Load with `product.bySlug` or `bundle.bySlug` on the server. Render with the `subbly-storefront-products` or `subbly-storefront-bundles` skill.
- **Add to cart with the cart widget.** Use `useSubblyCart().addToCart` from the `subbly-cart-and-checkout` skill. Do not call `cart.addItem` directly on a page with the widget: the widget keeps its own copy of the cart and does not see the change.
- **Headless checkout.** `cart.create` (or `cart.load` with the ID from the `subbly_cart_id` cookie), `cart.addItem`, `cart.update` with customer, address and shipping method, `wallet.setup` and `wallet.store` for the card, then `checkout.purchase`. Read `cart-and-checkout-api.md` first.
- **Customer account.** `auth.login` or `auth.otp` then `auth.otpLogin`, `setAuth`, then `customers.me` and `subscriptions.list`. Read `customer-api.md` first.
- **Email capture.** `lead.subscribe` saves an email as a lead. See `catalog.md`.

## Types

Import types from `@subbly/react`, with `import type`. The main types are `ParentProduct`, `ProductSubscription`, `ProductOneTime`, `ProductPlan`, `ProductVariant`, `Bundle`, `BundleItem`, `SubblyCart`, `CartItem`, `CheckoutPurchaseResponse`, `SubblyCustomer`, `Subscription`, `SubblyShop`, `Metafield`, `Survey` and `Pagination`. `@subbly/react` also exports the enums `ProductType`, `FrequencyUnit`, `SurveyQuestionType` and `SurveyAppearanceType` as values. For a type that the references do not cover, read the type declarations in `node_modules/@subbly/api-client`.

## References

| Reference | Read it when |
|---|---|
| [references/catalog.md](references/catalog.md) | You load products, plans, variants, bundles, bundle items, metafields, surveys, the shop or countries, or you send a lead or a back-in-stock request. |
| [references/cart-and-checkout-api.md](references/cart-and-checkout-api.md) | You build a headless cart or checkout: cart payloads, shipping, gifting dates, purchase, funnels (upsells), 3-D Secure, saved cards and pickup points. |
| [references/customer-api.md](references/customer-api.md) | You build sign-in, registration, a profile page, a subscription page or an order history, or you need a raw-client method. |
| [references/response-shapes.md](references/response-shapes.md) | You need the fields of a response object: cart, cart item, purchase response, funnel step, shop, customer, address, payment method, subscription, shipping method or country. |

Public Storefront API reference (HTTP endpoints): https://docs.subbly.dev/api/storefront
