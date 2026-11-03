---
name: subbly-storefront-products
description: "Write storefront code with @subbly/react that loads and shows Subbly products: one-time products with variants and subscription products with plans. Use when you build a product page, product list or grid, plan picker, variant selector (size, colour), price display, image gallery or add-to-cart button, or when you sell add-ons, gift cards, pre-order subscriptions or volume pricing on a custom storefront. Covers the product types, the subblyApi.product methods, the useProductForm, useProductImages and useVariantCombinations hooks, and example components. For storefront code only. To read or change a live store (products, orders, subscribers), use the Subbly connector tools instead."
---

# Subbly storefront products

This skill helps you show Subbly products on a custom storefront and add them to the cart. It uses `@subbly/react`. Bundles (boxes that the customer builds) have their own skill: `subbly-storefront-bundles`.

## Before you start

- The project must have `@subbly/react` installed and `subblyApi` initialized. For setup, the full method list and error handling, see the `subbly-storefront-api` skill.
- Import hooks, helpers, enums and types from `@subbly/react`. It re-exports every type from `@subbly/api-client`.
- Import `subblyApi` from the module of your project that calls `subblyApi.initialize()`. The examples import it as `./subbly`.
- Every price is an integer in minor units: `1999` means 19.99. Format prices before you show them. `useCurrencyFormatter().formatAmount(amount)` does this.
- To price a response in another shop currency, send the `x-currency` header. See "Currency" in the `subbly-storefront-api` skill.

## Product model

A parent product has one of two types. The type is fixed. Use the `ProductType` enum to compare and to filter.

| Type | `ProductType` | Purchasable children | Child type |
|---|---|---|---|
| One-time | `ProductType.oneTime` (`'one_time'`) | `variants` (at least one) | `ProductVariant` |
| Subscription | `ProductType.subscription` (`'subscription'`) | `plans` (at least one) | `ProductPlan` |

- `ParentProduct` is `ProductOneTime | ProductSubscription`. Check `product.type` to narrow it.
- `Product` is `ProductPlan | ProductVariant`. This is the item that goes into the cart.
- **The cart takes the child ID, not the parent ID.** Send a variant ID or a plan ID as `productId`.
- `pricings` on a subscription product is deprecated. Use `plans`.
- `stockCount` is `null` when stock is not tracked. `0` means out of stock.
- `metadata` holds custom fields. To show or collect them, see `subbly-storefront-metadata`.
- `plan.survey` holds the preference survey of a plan. To render it, see `subbly-subscription-surveys`.

For every field, read `references/types.md`.

## Load products

The `subblyApi.product` methods add default expands for you: parents get `variants`, `plans` and `metadata`; children get `parent` and `metadata`.

| Method | Returns | Use it for |
|---|---|---|
| `list(params?, headers?)` | `{ data: ParentProduct[], pagination }` | Product grids and catalog pages |
| `byId(id, params?, headers?)` | `ParentProduct` | A page keyed by ID |
| `bySlug(slug, params?, headers?)` | `ParentProduct` | A page keyed by URL slug |
| `variantById(id, params?, headers?)` | `Product` | One variant, with its parent |
| `planById(id, params?, headers?)` | `Product` | One plan, with its parent |

`list` filters: `page`, `perPage`, `type`, `tags`, `slugs`, `digital`, `giftCard`, `expand`.

```ts
import type { ProductType } from '@subbly/react'
import { subblyApi } from './subbly'

const { data, pagination } = await subblyApi.product.list({
  type: 'subscription' as ProductType,
  tags: ['featured'],
  perPage: 12,
})
```

Rules:

- The `type` filter is typed as the `ProductType` enum, so a bare string literal fails type checking. Pass `ProductType.subscription`. In React Server Components the enum is not available at run time, so pass `'subscription' as ProductType` (with `import type`) there.
- Tags filter the list. The product response does not contain tags.
- If you pass `expand`, it replaces the default expand list. Include `variants`, `plans` and `metadata` again when you need them.
- `bySlug` throws an `Error` when no product has that slug. Catch it and show a "not found" page.
- Slugs are exact. Do not change their case.
- The API returns only published products.

## Hooks

| Hook | What it does |
|---|---|
| `useProductForm({ product })` | Holds the selected plan or variant and the quantity. Gives `plans`, `priceFrom`, `selectedProduct`, `outOfStock`, `variantCombinations`, `selectProduct(id)` and `addToCart(override?)`. |
| `useProductImages({ images })` | Sorts images by `order`. Gives `images` and `firstImage` (or `null`). |
| `useVariantCombinations({ variants })` | Turns variants into flat option rows (`{ id, price, inStock, size: 'M', ... }`) for a variant selector. |

The helper `formatBillingFrequency(unit, count)` returns English text such as "Every 2 Weeks". It is deprecated because it cannot be translated. For translated text, build the label from `plan.frequencyCount` and `plan.frequencyUnit` with your i18n library.

For return values, behaviour and examples, read `references/hooks.md`.

## Add a product to the cart

`useProductForm` preselects the first child that is in stock. Its `addToCart()` sends `{ productId, quantity }` through `useSubblyCart().addToCart`. For the cart and widget, see `subbly-cart-and-checkout`.

```tsx
import { useProductForm, type ParentProduct } from '@subbly/react'

export function BuyButton({ product }: { product: ParentProduct }) {
  const { selectedProduct, outOfStock, addToCart } = useProductForm({ product })

  return (
    <button disabled={!selectedProduct || outOfStock} onClick={() => addToCart()}>
      {outOfStock ? 'Sold out' : 'Add to cart'}
    </button>
  )
}
```

Rules:

- `addToCart()` throws when no plan or variant is selected. Disable the button until `selectedProduct` is set.
- When the hosted cart widget is on the page, it collects any missing step (plan, variant, survey answers, gift card recipient). Without the widget, a payload with a missing step throws an error.
- `productForm.metadata` is not sent by `addToCart()`. To send metadata, pass it in the override with the `productId`. See `subbly-storefront-metadata`.
- The override must be a complete payload. It replaces fields of the default payload. For example: `addToCart({ productId: variantId, quantity: 2 })`.

## Special products

| Case | How to detect it | What to do |
|---|---|---|
| Add-on | A one-time variant that rides with a subscription in the cart | Add it with `addon: true` and `addonDuration` |
| Gift card | `product.giftCard === true` (one-time) | Add it with a `giftCard` recipient object |
| Pre-order | `product.preOrderEndAt` is a future date (subscription) | Show a pre-order badge and the date |
| Volume price | `variant.priceScheme` or `plan.priceScheme` has `ranges` | Show the price per quantity break |

For payloads and examples, read `references/special-products.md`.

## Common mistakes

- Sending the parent product ID to the cart. Send the variant or plan ID.
- Dividing by 100 to format money. Some currencies have no minor unit. Use `formatAmount`.
- Reading `product.plans` before you narrow `product.type`.
- Calling `useProductForm` outside a component that runs in the browser. Load the product first and pass it as a prop.

## References

| Reference | Read it when |
|---|---|
| `references/types.md` | You need a field of a product, variant, plan, image or price scheme, or the list parameters. |
| `references/hooks.md` | You use `useProductForm`, `useProductImages`, `useVariantCombinations` or `formatBillingFrequency`. |
| `references/special-products.md` | You sell add-ons, gift cards, pre-order subscriptions or volume-priced products. |
| `references/product-page.md` | You build a product page or grid, a plan picker or a variant selector, or install the prebuilt registry block. |
