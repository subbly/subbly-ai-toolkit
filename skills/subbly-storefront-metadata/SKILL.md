---
name: subbly-storefront-metadata
description: "Write storefront code with @subbly/react that shows Subbly metadata (custom fields) on product, bundle and cart pages, and that collects customer input as metadata when an item goes into the cart. Use when a developer wants to display product specs, materials, care notes or other custom fields, or to add a personalization, engraving, gift message or order notes field to a product form or the cart. Covers metafield definitions, the metadata payload for preset and free-form values, and input components per data type. It does not create or edit metafield definitions in the admin. For storefront code only. To read or change a live store (products, orders, subscribers), use the Subbly connector tools instead."
---

# Storefront metadata

A **metafield** is the definition of a custom field: its name, slug, data type and preset values. **Metadata** is the values of that field on a product, variant, plan, bundle, cart item or cart. Use this skill to show metadata on a storefront and to collect it from customers.

## Before you start

- Set up the API client first. See the `subbly-storefront-api` skill.
- Import `subblyApi`, hooks and types from `@subbly/react`. The package re-exports every type from `@subbly/api-client`.
- The merchant creates metafields in the Subbly admin. Storefront code cannot create them. The storefront only gets metafields with storefront access.
- To add items to the cart, use `useSubblyCart()` from the `subbly-cart-and-checkout` skill.

## Two jobs

| Job | What you do |
|---|---|
| **Display** | Read `metadata` from a product, variant, plan, bundle or cart and render it. |
| **Collect** | Load the metafield definition, render an input, and send the values with `addToCart` or `updateCart`. |

## Display metadata

`subblyApi.product.list`, `byId`, `bySlug`, `variantById` and `planById` expand `metadata` by default. The bundle methods expand it too. Each `metadata` entry is a full `Metafield` with its `values`.

Use the helpers from `@subbly/react` for a simple list:

```tsx
import { formatMetafieldList, hasVisibleMetafields } from '@subbly/react'
import type { ParentProduct } from '@subbly/react'

export function ProductSpecs ({ product }: { product: ParentProduct }) {
  if (!hasVisibleMetafields(product.metadata)) return null

  return (
    <dl>
      {formatMetafieldList(product.metadata).map((line) => (
        <div key={line.id}>
          <dt>{line.name}</dt>
          <dd>{line.value}</dd>
        </div>
      ))}
    </dl>
  )
}
```

- In React Server Components, the helpers are not available at run time. Call them in components that run in the browser.
- `formatMetafieldList(metadata)` returns one line per field: `{ id, name, value, oneLine }`. It joins multiple values with a comma. It adds the unit. It formats `date` and `datetime` as `dd MMM yyyy`.
- It skips fields with no values. It also skips `multi_line_text`, `rich_text`, `boolean`, `color`, `rating`, `url` and `json`. Render those types yourself if you need them.
- `formatMetafieldValue(value, dataType, unit?)` formats one value.
- To find one field, match on `slug`, for example `product.metadata?.find((m) => m.slug === 'material')`. Do not match on `name`: the merchant can rename it.

**Important:** if you pass your own `params.expand` to a product or bundle method, it replaces the default list. Include `'metadata'` in it, or `metadata` comes back `null`.

For a cart, the `subblyApi.cart` methods expand `metadata` (cart level) and `items.metadata` by default. The same rule applies: a custom `expand` list replaces the default.

## Load metafield definitions

To collect input, you need the definition. Load it by slug: slugs stay the same between environments, IDs do not.

```ts
import { subblyApi } from '@subbly/react'

const engraving = await subblyApi.metafield.bySlug('engraving')
const fields = await subblyApi.metafield.list({ slugs: ['engraving', 'gift-message'] })
```

- `subblyApi.metafield.list(params?, headers?)` returns `{ data: Metafield[], pagination }`. Params: `ids`, `slugs`, `page`, `perPage`, `preset`, `expand`.
- `subblyApi.metafield.byId(id)` and `bySlug(slug)` return one `Metafield`. They throw `Metafield with slug ... not found.` when there is no match.

## Collect metadata

Send metadata as `MetadataObject[]`: one entry per metafield, with `id` set to the **metafield** ID.

| Metafield | Value shape | Example |
|---|---|---|
| `preset: false` (free input) | `{ value: string }` | `{ id: 101, values: [{ value: 'Sam & Alex' }] }` |
| `preset: true` (choose from list) | `{ id: presetValueId }` | `{ id: 102, values: [{ id: 15 }] }` |

The preset value ID is `metafield.values[n].id`. Send every value as a string, also numbers, dates and booleans.

### On a cart item

Add `metadata` to the `addToCart` payload. It works for one-time variants, subscription plans and bundle plans.

```tsx
import { useSubblyCart } from '@subbly/react'

export function AddEngravedRing ({ variantId, engravingId }: { variantId: number; engravingId: number }) {
  const { addToCart } = useSubblyCart()

  const onSubmit = (text: string) =>
    addToCart({
      productId: variantId,
      quantity: 1,
      ...(text ? { metadata: [{ id: engravingId, values: [{ value: text }] }] } : {}),
    })

  // render a form that calls onSubmit
}
```

`productId` is the variant ID or plan ID, not the parent product ID.

### On the cart

Use `updateCart` for order-wide fields such as delivery notes:

```ts
const { updateCart } = useSubblyCart()

await updateCart({
  metadata: [{ id: orderNotesId, values: [{ value: 'Leave at the back door' }] }],
})
```

## Rules

1. For a preset field, send only IDs that exist in `metafield.values`.
2. When `multiple` is `false`, send one value. When it is `true`, you can send more than one.
3. Do not put the unit in the value. The unit is on the metafield (`unit`, for example `kg`).
4. Leave out a field that the customer skipped. Do not send an entry with empty `values`.
5. The `Metafield` type has no `required` flag. Decide in your own code which fields the customer must fill.
6. `values[].metadata` (swatch `color`, `imageUrl`) is filled only on product attribute values. On cart, order and subscription metafields it is `null`. Always have a plain fallback (a select or a text label).
7. A metafield with `variant: true` comes from variant options. Show it as part of variant selection, not as a separate input.

## References

| Reference | Read it when |
|---|---|
| `references/types.md` | You need the exact `Metafield`, `MetafieldValue`, `MetadataObject` and `MetafieldType` shapes, or which input fits each data type. |
| `references/metafield-inputs.md` | You build the input UI: one component per data type, a switch that picks it, and a full product form with metadata. |

Storefront API reference: https://docs.subbly.dev/api/storefront
