# Product hooks

All hooks come from `@subbly/react`. Use them only in client components (`'use client'`).

## useProductForm

```ts
const form = useProductForm({ product }) // product: ParentProduct
```

| Return | Type | Meaning |
|---|---|---|
| `productForm` | `ProductForm` | `{ productId, quantity, metadata }`. `productId` is the selected plan or variant ID. |
| `setProductForm` | state setter | Replace the form, for example to change `quantity`. |
| `plans` | `Product[]` | The variants of a one-time product, or the plans of a subscription product. |
| `selectedProduct` | `Product \| null` | The child that matches `productForm.productId`. |
| `selectProduct(id)` | function | Select a plan or variant by ID. |
| `priceFrom` | `number \| null` | The lowest `price` in `plans`. Use it for "From $X" labels. The type allows `null`, so write `priceFrom ?? 0`. |
| `outOfStock` | `boolean` | `true` when every child has `stockCount === 0`. |
| `variantCombinations` | `ProductVariantCombination[]` | Option rows for a one-time product. Empty for a subscription product. |
| `addToCart(override?)` | `Promise<SubblyCart \| null>` | Adds `{ productId, quantity }` to the cart. An override replaces fields of that payload. |

Behaviour:

- The initial `productId` is the first child with stock (`stockCount` is `null` or above `0`). It is `null` when all children are out of stock.
- The initial `quantity` is `1`.
- `addToCart` throws `Error('Product form productId is required')` when no child is selected.
- `addToCart` does not send `productForm.metadata`. Put metadata in the override.
- The hook keeps its own state. When the `product` prop changes to another product, remount the component (for example with `key={product.id}`).

Change the quantity:

```tsx
<input
  type="number"
  min={1}
  value={productForm.quantity ?? 1}
  onChange={(e) => setProductForm((prev) => ({ ...prev, quantity: Number(e.target.value) }))}
/>
```

Send metadata with the item:

```ts
addToCart({
  productId: productForm.productId!,
  quantity: productForm.quantity,
  metadata: [{ id: metafieldId, values: [{ value: 'Happy birthday' }] }],
})
```

For the metadata payload format, see `subbly-storefront-metadata`.

## useProductImages

```ts
const { images, firstImage } = useProductImages({ images: product.images })
```

- `images`: a copy of the list, sorted by `order` (ascending).
- `firstImage`: the first sorted image, or `null` when there are no images.

## useVariantCombinations

```ts
const combinations = useVariantCombinations({ variants: product.variants })
```

It returns one row per variant:

```ts
// variant with options Size = M and Colour = Blue
{ id: 501, price: 2500, inStock: true, size: 'M', colour: 'Blue' }
```

- The option keys are the option names in lower case.
- `inStock` is `true` when `stockCount` is `null` or above `0`.
- An option named `id`, `price` or `inStock` overwrites the built-in key. Rename such options in your UI code.
- `useProductForm` returns the same list as `variantCombinations`. Use the separate hook only when you do not use the form hook.

Find the variant for a set of chosen values:

```ts
const findVariant = (chosen: Record<string, string>) =>
  combinations.find((row) =>
    Object.entries(chosen).every(([name, value]) => row[name.toLowerCase()] === value),
  ) ?? null
```

## formatBillingFrequency

```ts
import { formatBillingFrequency } from '@subbly/react'

formatBillingFrequency(plan.frequencyUnit, plan.frequencyCount)
// count 1 -> "Every Month"; count 2 -> "Every 2 Weeks"
```

- The arguments are the unit first, then the count. It does not take a plan object.
- The output is English only and the helper is deprecated. For a translated site, build the label from `frequencyCount` and `frequencyUnit` with your i18n library. See `subbly-storefront-localization`.

## useCurrencyFormatter (from the currency group)

```ts
const { formatAmount, setCurrency } = useCurrencyFormatter()
formatAmount(1999)          // "$19.99" (defaults: en-US, USD)
formatAmount(1999, 'EUR')   // same locale, another currency
setCurrency('de-DE', 'EUR') // locale first, then currency code
```

- It divides by the minor unit of the currency, so it is correct for currencies without decimals.
- The state is local to the component that calls the hook. To share one currency across the page, see `subbly-storefront-localization`.
