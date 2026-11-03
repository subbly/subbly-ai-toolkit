# Headless cart and checkout

`@subbly/react` can run the cart without the widget UI. You render the cart, and the hooks call the Storefront API. Use this path only when the user asks for their own cart page or checkout. The hosted widget checkout already handles payment gateways, 3-D Secure, shipping, taxes and funnels. A custom checkout must do all of this.

Read the hook types in the package declarations before you use a hook. This page gives the map, not every field.

## CartProvider

Put `CartProvider` above the pages that use the cart. It loads the cart in the `subbly_cart_id` cookie (the same cookie the widget uses), or creates a cart.

```tsx
'use client'

import { CartProvider } from '@subbly/react'
import { useRouter } from 'next/navigation'

export function Providers({ children }: { children: React.ReactNode }) {
  const router = useRouter()

  return (
    <CartProvider
      onItemAdded={({ action }) => {
        if (action === 'checkout') router.push('/checkout')
      }}
    >
      {children}
    </CartProvider>
  )
}
```

| Prop | Use |
|---|---|
| `cartId` | Load this cart instead of the stored one. |
| `storage` | `'cookie'` (default, shared with the widget and readable on the server) or `'localStorage'`. |
| `storageKey` | Name of the stored cart ID. Default `subbly_cart_id`. |
| `createPayload` | Payload for a new cart, for example `{ currencyCode: 'EUR' }`. |
| `onItemAdded` | Called after an add, with `{ action, cart, item, payload }`. `action` is the shop setting `afterItemAdded` (`'notify'`, `'summary'`, `'checkout'` or `'close'`). The provider shows nothing itself: show your toast or go to your page here. |

Keep `storage` at `'cookie'` if any page still uses the widget or `useSubblyCart` without the provider. Other storage makes those pages use a different cart.

## useCart

`useCart()` throws outside a `CartProvider`. It returns:

- State: `cart` (`SubblyCart | null`), `loading`, `error`, `count` (active item quantity).
- Item actions: `addItem(payload)`, `updateItem(itemId, payload)`, `removeItem(itemId)`.
- Cart actions: `update(payload)`, `applyCoupon(code)`, `removeCoupon()`, `applyGiftCard(code)`, `removeGiftCard()`, `setCurrency(code)`, `reload()`, `reset()`.
- Drawer state: `isOpen`, `open()`, `close()`, `toggle()`.

Each action resolves to the whole updated cart. Writes run one at a time. There are no optimistic updates, so show `loading`.

`useSubblyCart()` uses the provider when one is above it. Code that calls `addToCart` and `updateCart` keeps working.

## Derived cart hooks

All of these read the cart from `CartProvider`.

| Hook | Returns |
|---|---|
| `useCartItems()` | Items in groups: `all`, `active`, `unavailable`, `subscriptions`, `oneTime`, and more, with `count`. |
| `useCartSummary()` | `{ totals, breakdown }`: amounts due now and later, with tax, discounts and shipping. |
| `useCartReceipt(options?)` | Lines for an order summary. |
| `useCheckoutRequirements(options?)` | What the checkout still needs (address, shipping, payment). |
| `useShippingMethods(...)`, `useLocalPickups()` | Delivery rates for an address, and pickup points. |
| `useStartDates()`, `useGiftingDates(...)` | Start dates and gift dates the shop offers. |
| `useSavedAddresses(...)`, `useSavedPickupInfos(...)` | Saved data of a signed-in customer. |

Use `useCartSummary().totals.now.amountDue` for the amount due today. `cart.total` adds the first charge and later charges together.

## Checkout hooks

| Hook | Use |
|---|---|
| `usePurchase({ cartId, authenticatePayment? })` | Runs `checkout.purchase`. On a 3-D Secure response, it calls your `authenticatePayment(paymentIntentId)` (a gateway SDK call), then retries. Returns `{ purchase, receipt, loading, error, reset }`. |
| `useCheckoutSubmit(...)` | The full submit sequence of a checkout form. |
| `useGuestRegistration(...)` | Creates a guest customer at checkout. |
| `usePaymentMethods(currencyCode?, options?)` | Payment options for the currency. |
| `useGateways(currencyCode?)` | The shop payment gateways for a currency (needs `SubblyProvider`). |
| `useExpressPurchaseFlow(...)` | Express wallets (one-click pay buttons). |
| `useFunnel({ cartId, stage })` | Upsell offers. `stage` is `'pre'`, `'mid'` or `'post'`. |
| `useReceipt(response)` | A receipt from a `CheckoutPurchaseResponse`. |

For the raw API methods (cart, checkout, funnels, payment intents, wallet), read `references/cart-and-checkout-api.md` in the `subbly-storefront-api` skill.

## Run the widget next to your pages

- Set `checkoutUrl` and `cartSummaryUrl` in `window.subblyConfig` to send the shopper to your pages. The widget stands down on those paths.
- To stand the widget down on one page from React, call `useSubblyCartWidget({ disabled: true })` in that page. It enables the widget again on unmount.
- To change the URLs at runtime, call `useSubblyCartWidget({ config: { checkoutUrl: '/checkout' } })`.
- After your code creates a new cart, call `getWidget()?.reload(cart.id)` so the widget uses the same cart.

The hosted widget still collects missing choices (plan, variant, survey, gift recipient) for `addToCart`. If you remove the widget from the site, every `addToCart` payload must be complete. Otherwise it throws `CartItemNotConfiguredError`.
