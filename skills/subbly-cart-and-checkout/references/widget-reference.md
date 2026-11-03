# Cart widget reference

A compact list of what the hosted cart widget exposes. In React, get the instance with `useSubblyCart().getWidget()`. In plain JavaScript, use `window.subblyCart`. Both are `null` (or `undefined`) until the window event `subbly-cart-initialized` fires. The type is `SubblyCartWidgetInstance` from `@subbly/react`.

For every parameter and edge case, see the public [cart widget reference](https://docs.subbly.dev/reference/cart-widget).

## Wait for the widget

```ts
const onWidgetReady = (fn: (widget: NonNullable<typeof window.subblyCart>) => void) => {
  if (window.subblyCart) {
    fn(window.subblyCart)
    return
  }
  window.addEventListener('subbly-cart-initialized', () => fn(window.subblyCart!), { once: true })
}
```

- `subbly-cart-loaded` fires when the code is downloaded. There is no instance yet.
- `subbly-cart-initialized` fires when `window.subblyCart` is set. Wait for this one.

## Methods

| Method | Returns | What it does |
|---|---|---|
| `open(view?)` | `void` | Opens the summary (default) or `'checkout'`. With `checkoutUrl` set, `'checkout'` goes to that page. |
| `close()`, `toggle()` | `void` | Closes or toggles the widget. |
| `configureItem(payload)` | `Promise<{ finalized: boolean }>` | Adds an item and opens screens for missing choices. Accepts parent product, bundle and survey IDs. Resolves when the shopper closes the screens. `addToCart` calls this. |
| `addItem(payload)` | `Promise<SubblyCart>` | Adds a complete item (plan or variant ID) with no screens. |
| `updateItem(cartItemId, payload)` | `Promise<SubblyCart>` | Changes a cart line. |
| `removeItem(cartItemId)` | `Promise<SubblyCart>` | Removes a cart line. |
| `updateCart(payload)` | `Promise<SubblyCart>` | Changes cart-level fields. Calls run in a queue. Throws `The cart is not initialized` when there is no cart. |
| `applyCoupon(code)`, `removeCoupon()` | `Promise<SubblyCart>` | Coupon on the cart. |
| `setPendingCoupon(code)` | `void` | Holds a coupon and applies it when the cart can take it. Not in the `@subbly/react` type yet. |
| `applyGiftCard(code)`, `removeGiftCard()` | `Promise<SubblyCart>` | Gift card on the cart. |
| `setCurrency(code)` | `Promise<SubblyCart>` | Changes the cart currency and prices. |
| `setLanguage(code)` | `void` | Changes the widget language. Use a code from `shop.languages[].code`. |
| `setSettings(settings)` | `void` | Overrides the shop cart settings (colors, fonts, layout, `afterItemAdded`) until the next page load. |
| `resetCart()` | `Promise<SubblyCart>` | Creates a new empty cart with the same currency. |
| `setCustomerData({ email, marketingConsent?, tosConsent? })` | `void` | Prefills the checkout for a guest. Does nothing when a customer is signed in. |
| `configureGift(null, mount)` | `void` | Shows the gift screen now (`true`) or after the current screen (`false`). |
| `authenticate(accessToken?)` | `Promise<void>` | Signs a customer in. Without a token, it uses the `subbly_access_token` cookie. Rejects when the token is not valid. |
| `signOut()` | `Promise<void>` | Signs the customer out. The cart stays. |
| `reload(cartId?)` | `Promise<void>` | Reloads the cart and sign-in state. Pass `cartId` to adopt a cart made outside the widget. |
| `configure({ checkoutUrl?, cartSummaryUrl?, disableUrls? })` | `void` | Changes the URL configuration at runtime. Call it with `?.`: older widget versions do not have it. |
| `disable()`, `enable()` | `void` | Stands the widget down on this page, or brings it back. Call them with `?.`. |
| `loadShop()` | `Promise<SubblyShop>` | Reloads the shop data. |

## Properties

| Property | What it holds |
|---|---|
| `cart` | The current cart (`SubblyCart`). A live object: clone it for a snapshot. Treat it as read-only. |
| `shop` | The shop (`SubblyShop`): currencies, languages, settings. |
| `state` | `{ currencyCode, languageCode }`, a snapshot. |
| `events` | The event emitter. |
| `sdk` | The `@subbly/sdk` client the widget uses. Prefer `subblyApi` in your own code. |

## Events

```ts
const { events } = widget
const onUpdate = (_err: unknown, cart?: SubblyCart) => console.log(cart?.items.length)

events.on('CART_UPDATED', onUpdate)
events.off('CART_UPDATED', onUpdate) // remove it in your effect cleanup
```

Every handler gets `(err, payload)`. `err` is always `null` today, so read the second argument.

| Event | Payload |
|---|---|
| `CART_READY` | `SubblyCart`. Fires before your code can subscribe. Wait for `subbly-cart-initialized` instead. |
| `CART_UPDATED` | `SubblyCart` |
| `CART_RESET` | `SubblyCart` (the new cart) |
| `CART_OPEN`, `CART_CLOSE` | none |
| `PURCHASE_COMPLETED` | `{ cart, purchase }`. `purchase` is a `CheckoutPurchaseResponse`. Its filled fields depend on the cart. |
| `EMAIL_COLLECTED` | `{ email }` |
| `SIGN_IN`, `SIGN_UP` | `{ customer }` |
| `SIGN_OUT` | none |

## window.subblyConfig

Only `apiKey` is required.

| Key | Use |
|---|---|
| `apiKey` | Storefront API key. |
| `apiUrl` | API base URL. Default `https://api.subbly.co/storefront/v1/`. |
| `languageCode` | Widget language. Without it, the widget reads `?lang=`, then `<html lang>`, then the browser. |
| `cartId`, `accessToken` | Start with a known cart or a signed-in customer. Defaults are the cookies `subbly_cart_id` and `subbly_access_token`. |
| `checkoutUrl`, `cartSummaryUrl` | Pages on your site that own the checkout or the cart summary. The widget sends the shopper there and stands down on those paths. |
| `disableUrls` | Paths where the widget stands down. `*` matches in one path segment, `**` across segments. |
| `init` | `false` stops the automatic start. Then call `window.SubblyCart.initialize(config)` yourself. |
| `globalName` | Name of the global instance. Default `subblyCart`. `useSubblyCart` reads `subblyCart` only, so do not change it in a React project. |
| `settings` | Page settings, see below. |

## settings (page integration)

| Key | Default | Use |
|---|---|---|
| `interceptProductLinks` | `false` | Catch clicks on `/checkout/buy/...` links and `data-subbly-product` elements, and open the widget. |
| `cartToggleEl` | `''` | Selector or element that opens and closes the widget. |
| `cartCounterEl` | `''` | Selector or element that shows the item count. On client-side route changes, update it yourself from `CART_UPDATED`. |
| `cartButton`, `cartButtonImage` | `false`, none | Show the floating cart button, with an optional image URL. |
| `localizationSettings` | `false` | Show the currency and language picker in the widget header. |
| `disableSummaryView` | `false` | Skip the cart summary and open the checkout. `disableCartSummary` is the deprecated name. |
| `hideBundleItems` | `false` | Hide the products inside a bundle. |

## setSettings (shop cart settings)

`setSettings` takes `Partial<ShopCartSettings>`. Useful keys:

- `afterItemAdded`: `'notify'`, `'summary'`, `'checkout'` or `'close'`. What shows after an add.
- `widgetView`: `'pop-up'` or `'fullscreen'`.
- `checkoutLayoutOneStep`: one-step checkout.
- Colors: `accentColor`, `backgroundColor`, `headerBackgroundColor`, `headerFontColor`, `footerBackground`, `footerFontColor`, `fontColorPrimary`, `fontColorSecondary`, `cardBackgroundColor`, `cardBorderColor`, `inputBackground`, `inputBorderColor`, `inputFontColor`, `widgetBackgroundColor`.
- Typography and shape: `fontStyle` (a Google font name), `buttonStyle`, `cardStyle`, `headerHeight`, `logoUrl`.
- `itemAddedScreen` is deprecated. Use `afterItemAdded: 'notify'`.

To style the widget from your own CSS, use its CSS variables, not its class names. Class names change between releases. See [Style it](https://docs.subbly.dev/developer-resources/cart-widget/style-it).

## URL query parameters

The widget reads these from the page URL when it starts.

| Parameter | Effect |
|---|---|
| `?coupon=CODE` | Holds the coupon and applies it when the cart can take it. Used one time. |
| `?r=ID` | Sets the referring customer. Used one time. |
| `?gift=1` | Opens the gift screen. Used one time. |
| `?lang=fr` | Widget language, when `languageCode` is not set. |
| `?email=`, `?firstName=`, `?lastName=` | Prefill the checkout. |
| `?disableSummaryView=1`, `?hideBundleItems=1` | Same as the settings. |
| `?custom_success_url=URL` | Your own receipt page. |
