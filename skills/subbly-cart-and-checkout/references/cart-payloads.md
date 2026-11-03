# Cart payloads

Payload shapes for `addToCart`, `updateCart` and the widget item methods. All types come from `@subbly/react`. The source of truth is `ConfigureItemPayload`, `CartItemAddPayload`, `CartResourceUpdateItemPayload` and `CartUpdatePayload` in the package type declarations.

## addToCart payloads

`addToCart` takes a `ConfigureItemPayload`. Pick the shape that matches the item.

### Subscription plan

```ts
await addToCart({
  productId: planId,   // a plan ID, not the parent product ID
  quantity: 1,
  options: [           // survey answers, optional
    { questionId: 12, answers: [{ id: 345 }] },
  ],
  metadata: [          // custom fields, optional
    { id: 67, values: [{ value: 'Happy birthday, Sam' }] },
  ],
})
```

### One-time variant

```ts
await addToCart({
  productId: variantId, // a variant ID, not the parent product ID
  quantity: 2,
  metadata: [{ id: 67, values: [{ id: 890 }] }], // preset value, optional
})
```

### Add-on to a subscription

An add-on is a one-time variant that ships with a subscription in the same cart.

```ts
await addToCart({
  productId: variantId,
  quantity: 1,
  addon: true,
  addonDuration: 1, // 0: every renewal (default), 1: one time only
})
```

The API rejects an add-on when the cart has no subscription.

### Gift card

```ts
await addToCart({
  productId: giftCardVariantId,
  quantity: 1,
  giftCard: {
    customerEmail: 'friend@example.com',
    customerName: 'Sam',
    message: 'Enjoy!',
  },
})
```

The three `giftCard` fields are `string | null`. If you leave out `giftCard`, the widget asks the shopper for the recipient.

### Configured bundle

```ts
await addToCart({
  productId: bundlePlanId, // the selected bundle plan or variant ID
  quantity: 1,
  bundle: {
    items: [
      { productId: 101, quantity: 2 },
      { productId: 102, quantity: 1 },
    ],
    preferences: [{ attributeId: 10, values: [1, 2] }],
  },
  options: [{ questionId: 12, answers: [{ content: 'No nuts' }] }],
})
```

`bundle.items` and `bundle.preferences` are both required when you send `bundle`. Use `[]` when there are no preferences. `useBundleForm().addToCart()` builds this payload for you (see `subbly-storefront-bundles`).

### Open a builder in the widget

```ts
await addToCart({ bundleId: 42 })            // bundle builder; optional productId, quantity, options
await addToCart({ surveyId: 7 })             // subscription box survey flow
```

These two shapes need the widget on the page. Without it, they throw `CartItemNeedsWidgetError`.

### Survey answers

`options` is `SubscriptionSurveyOption[]`: `{ questionId, answers }`. The answer shape depends on the question type:

| Question type | Answer |
|---|---|
| text, email | `{ content: string }` |
| select, multiple, plan | `{ id: number }` |
| quantity | `{ id: number, quantity: number }` |

For full survey rules, see the `subbly-subscription-surveys` skill.

### Metadata

`metadata` is `MetadataObject[]`: `{ id: metafieldId, values }`. A value is `{ value: string }` for free input, or `{ id: presetValueId }` for a preset value. For the rules, see the `subbly-storefront-metadata` skill.

## What addToCart does

| Situation | Result |
|---|---|
| Widget on the page, no `CartProvider` | The widget adds the item. It opens screens for missing choices. |
| `CartProvider` above, complete payload | The provider adds the item through the API. The widget reloads. |
| Incomplete payload, widget on the page | The widget asks the shopper for the missing choices. |
| Incomplete payload, no widget | Throws `CartItemNotConfiguredError`. The message names the missing fields. |
| Complete payload, no widget, no provider | Adds to the cart in the `subbly_cart_id` cookie, or creates a cart. |
| `bundleId` or `surveyId`, no widget | Throws `CartItemNeedsWidgetError`. |

"Complete" means the payload names a plan or variant, and has the survey answers and gift recipient that the item needs. A parent product ID with only one plan or variant counts as complete: the hook resolves it.

## updateCart payload

`updateCart` takes a `CartUpdatePayload`. Every field is optional. Send only the fields you change.

| Field | Type | Use |
|---|---|---|
| `couponCode` | `string \| null` | Apply a coupon. `null` removes it. |
| `giftCardCode` | `string \| null` | Redeem a gift card. `null` removes it. |
| `currencyCode` | `string` | Change the cart currency. Use a code from `shop.currencies[].abbreviation`. |
| `referralId` | `number \| null` | Attach the referring customer. `null` clears it. |
| `giftInfo` | `{ startsAt, numberOfOrders, message, recipientEmail } \| null` | Send a subscription as a gift. `numberOfOrders` is `number \| null`. The other three are `string \| null`. `startsAt` and `numberOfOrders` apply to subscription and bundle plans only. |
| `metadata` | `MetadataObject[] \| null` | Cart-level custom fields, for example order notes. |
| `startsAt` | `string \| null` | Chosen start date, when the shop offers start dates. |
| `customer`, `shippingAddress`, `billingAddress`, `pickupInfo`, `shippingMethodId`, `paymentMethodId` and other IDs | see types | Checkout data. The widget checkout fills these. Set them yourself only in a headless checkout. |

Example: send a 3-month gift subscription.

```ts
await updateCart({
  giftInfo: {
    startsAt: '2026-12-01',
    numberOfOrders: 3,
    message: 'Enjoy your boxes!',
    recipientEmail: 'friend@example.com',
  },
})
```

Example: read a referral ID from the URL one time.

```tsx
'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useSubblyCart } from '@subbly/react'

export function ReferralFromUrl() {
  const params = useSearchParams()
  const { updateCart } = useSubblyCart()

  useEffect(() => {
    const ref = Number(params.get('ref'))
    if (Number.isInteger(ref) && ref > 0) {
      updateCart({ referralId: ref })?.catch(() => {})
    }
  }, [params, updateCart])

  return null
}
```

The widget reads `?r=ID` by itself. Use the component above only for another parameter name, or when the widget is not on the page. Without the widget and without a `CartProvider`, `updateCart` returns `undefined`, so keep the optional chaining.

## Change or remove a cart item

Use the widget instance (or `useCart()` in a headless cart):

```ts
const widget = getWidget()
await widget?.updateItem(cartItemId, { quantity: 3 })
await widget?.removeItem(cartItemId)
```

`updateItem` takes `quantity`, plus `options` (subscription and bundle), `bundle` (bundle), or `addon`, `addonDuration`, `giftCard` (one-time). It does not take `productId` or `metadata`. To change those, remove the item and add it again.
