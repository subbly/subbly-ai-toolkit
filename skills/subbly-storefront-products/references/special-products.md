# Add-ons, gift cards, pre-orders and volume prices

All examples use `useSubblyCart` from `@subbly/react`. For the cart itself, see `subbly-cart-and-checkout`.

## Add-ons

An add-on is a one-time variant that the customer adds to a subscription. It ships with the subscription orders.

- A one-time product can be an add-on only when the cart holds a subscription.
- If the cart has no subscription, or the product cannot be an add-on, the API rejects the item with a validation error ("The addon is prohibited").
- `addonDuration` sets how long the add-on stays on the subscription:

| `addonDuration` | Effect |
|---|---|
| `0` (default) | The add-on is charged and shipped with every renewal. |
| `1` | The add-on is charged and shipped one time only. |

```tsx
import { useSubblyCart } from '@subbly/react'

export function AddOnButton({ variantId }: { variantId: number }) {
  const { addToCart } = useSubblyCart()

  return (
    <button onClick={() => addToCart({ productId: variantId, quantity: 1, addon: true, addonDuration: 1 })}>
      Add to my next box
    </button>
  )
}
```

Show add-on offers only after a subscription is in the cart. A cart page or a post-add step is a good place.

## Gift cards

A gift card is a one-time product with `giftCard: true`. The customer buys store credit for another person.

Load gift card products:

```ts
const { data: giftCards } = await subblyApi.product.list({ giftCard: true })
```

Add a gift card with its recipient:

```ts
await addToCart({
  productId: giftCardVariantId, // a variant ID, for example one per amount
  quantity: 1,
  giftCard: {
    customerEmail: 'recipient@example.com',
    customerName: 'Jane Doe',
    message: 'Happy birthday!',
  },
})
```

- All three recipient fields are required keys. Each accepts `null`.
- If you leave out `giftCard`, the hosted cart widget asks the customer for the recipient. Without the widget, `addToCart` throws because a step is missing.
- `giftCardExpiration` on the product holds the expiry setting. It is `null` when the merchant set none.

## Pre-order subscriptions

A subscription product with `preOrderEndAt` set to a future date is on pre-order. Customers can subscribe before the product is available. Plans also carry `preOrderEndAt`.

- Plans of a pre-order product cannot have a trial.
- Compare the date with today. A past date means the pre-order is over.

```tsx
import { ProductType, type ParentProduct } from '@subbly/react'

export function PreOrderBadge({ product }: { product: ParentProduct }) {
  if (product.type !== ProductType.subscription || !product.preOrderEndAt) return null

  const endsAt = new Date(product.preOrderEndAt)
  if (endsAt <= new Date()) return null

  return <span className="badge">Pre-order until {endsAt.toLocaleDateString()}</span>
}
```

## Volume prices

A variant or plan with a `priceScheme` has quantity breaks. Each range gives the unit `amount` that applies from `range` units up. Without a matching range, the unit price is `price`.

```ts
import type { Product } from '@subbly/react'

export const unitPriceFor = (product: Product, quantity: number): number => {
  const ranges = [...(product.priceScheme?.ranges ?? [])].sort((a, b) => b.range - a.range)
  return ranges.find((r) => quantity >= r.range)?.amount ?? product.price
}
```

Show the breaks as a table ("1-4: $10, 5+: $8") next to the quantity input. The cart computes the final price. Do not send a price to the API.
