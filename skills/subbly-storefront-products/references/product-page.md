# Product pages and components

These examples use the Next.js App Router. They are starting points: change the markup and styles to match the site. `@/lib/subbly/api` stands for the module of your project that initializes `subblyApi`.

## Product page (server)

Load the product on the server for SEO. Pass it to a client component for the form.

```tsx
// app/products/[slug]/page.tsx
import { notFound } from 'next/navigation'
import { subblyApi } from '@/lib/subbly/api'
import { ProductDetails } from '@/components/product-details'

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const product = await subblyApi.product.bySlug(slug).catch(() => null)

  if (!product) notFound()

  return <ProductDetails product={product} />
}
```

If products and bundles share one URL pattern, try `subblyApi.product.bySlug` first. If it throws, try `subblyApi.bundle.bySlug`. Render the matching component. See `subbly-storefront-bundles`.

## Product details (client)

```tsx
'use client'

import {
  ProductType,
  useCurrencyFormatter,
  useProductForm,
  useProductImages,
  type ParentProduct,
} from '@subbly/react'
import { PlanPicker } from './plan-picker'
import { VariantPicker } from './variant-picker'

export function ProductDetails({ product }: { product: ParentProduct }) {
  const { formatAmount } = useCurrencyFormatter()
  const { images, firstImage } = useProductImages({ images: product.images })
  const {
    productForm, plans, selectedProduct, priceFrom, outOfStock,
    variantCombinations, selectProduct, addToCart,
  } = useProductForm({ product })

  return (
    <section>
      {firstImage && <img src={firstImage.url} alt={product.name} />}
      <div>{images.slice(1).map((image) => <img key={image.id} src={image.url} alt="" />)}</div>

      <h1>{product.name}</h1>
      {product.description && <div dangerouslySetInnerHTML={{ __html: product.description }} />}

      <p>{selectedProduct ? formatAmount(selectedProduct.price) : `From ${formatAmount(priceFrom ?? 0)}`}</p>

      {product.type === ProductType.subscription && plans.length > 1 && (
        <PlanPicker plans={product.plans} value={productForm.productId} onChange={selectProduct} />
      )}

      {product.type === ProductType.oneTime && plans.length > 1 && (
        <VariantPicker
          options={product.options}
          combinations={variantCombinations}
          value={productForm.productId}
          onChange={selectProduct}
        />
      )}

      <button disabled={!selectedProduct || outOfStock} onClick={() => addToCart()}>
        {outOfStock ? 'Sold out' : 'Add to cart'}
      </button>
    </section>
  )
}
```

Sanitize `description` before you render it as HTML if your site does not trust the admin content.

## Plan picker

A subscription product can have many plans (billing frequency, prepaid terms, trials).

```tsx
'use client'

import { useCurrencyFormatter, type ProductPlan } from '@subbly/react'

type Props = { plans: ProductPlan[]; value: number | null; onChange: (id: number) => void }

export function PlanPicker({ plans, value, onChange }: Props) {
  const { formatAmount } = useCurrencyFormatter()

  return (
    <fieldset>
      <legend>Choose a plan</legend>
      {plans.map((plan) => (
        <label key={plan.id}>
          <input
            type="radio"
            name="plan"
            checked={value === plan.id}
            disabled={plan.stockCount === 0}
            onChange={() => onChange(plan.id)}
          />
          {plan.pricingName || plan.name}: {formatAmount(plan.price)} every{' '}
          {plan.frequencyCount > 1 ? `${plan.frequencyCount} ${plan.frequencyUnit}s` : plan.frequencyUnit}
          {plan.trialLength ? ` (trial: ${formatAmount(plan.trialPrice ?? 0)})` : null}
          {plan.setupFee ? ` + ${formatAmount(plan.setupFee)} setup fee` : null}
        </label>
      ))}
    </fieldset>
  )
}
```

Put the frequency text through your i18n library on a translated site.

## Variant picker

Use one control per option (Size, Colour). Find the variant that matches all chosen values.

```tsx
'use client'

import type { ProductOption, ProductVariantCombination } from '@subbly/react'

type Props = {
  options: ProductOption[]
  combinations: ProductVariantCombination[]
  value: number | null
  onChange: (variantId: number) => void
}

export function VariantPicker({ options, combinations, value, onChange }: Props) {
  const current = combinations.find((row) => row.id === value)

  const choose = (optionName: string, optionValue: string) => {
    const wanted = Object.fromEntries(
      options.map((o) => [o.name.toLowerCase(), String(current?.[o.name.toLowerCase()] ?? '')]),
    )
    wanted[optionName.toLowerCase()] = optionValue

    const match =
      combinations.find((row) => options.every((o) => row[o.name.toLowerCase()] === wanted[o.name.toLowerCase()])) ??
      combinations.find((row) => row[optionName.toLowerCase()] === optionValue)

    if (match) onChange(match.id)
  }

  return (
    <>
      {options.map((option) => (
        <label key={option.id}>
          {option.name}
          <select
            value={String(current?.[option.name.toLowerCase()] ?? '')}
            onChange={(e) => choose(option.name, e.target.value)}
          >
            {option.values.map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
        </label>
      ))}
      {current && !current.inStock && <p>This option is sold out.</p>}
    </>
  )
}
```

## Product grid

```tsx
// app/shop/page.tsx
import { subblyApi } from '@/lib/subbly/api'
import { ProductCard } from '@/components/product-card'

export default async function ShopPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const page = Number((await searchParams).page ?? 1)
  const { data, pagination } = await subblyApi.product.list({ page, perPage: 12 })

  return (
    <>
      <div className="grid">{data.map((p) => <ProductCard key={p.id} product={p} />)}</div>
      {pagination.currentPage < pagination.lastPage && <a href={`?page=${page + 1}`}>Next page</a>}
    </>
  )
}
```

In `ProductCard`, link to `/products/${product.slug}` and show the lowest price of `product.variants` or `product.plans`.

## Prebuilt registry components

Subbly publishes shadcn/ui components in a public registry. Use them when the project already uses shadcn/ui and Tailwind CSS.

1. Add the registry to `components.json`:

   ```json
   { "registries": { "@subbly": "https://registry.subbly.dev/r/{name}.json" } }
   ```

2. Install the block:

   ```bash
   npx shadcn@latest add @subbly/product-info-section
   ```

| Item | What it adds |
|---|---|
| `product-info-section` | A full product section: gallery, name, description, plan picker, variant selector, quantity and add-to-cart button. Installs the items below. |
| `variant-selector` | Dropdown and radio variant selectors. |
| `plan-option-card` | A card for one subscription plan. |
| `quantity-selector` | A quantity input with plus and minus buttons. |
| `add-to-cart-button` | A button that calls `addToCart` with a `ConfigureItemPayload`. |
| `hooks` | `useFormatAmount`, a price formatter built on `next-intl`. |

After the install:

- Read the installed files under `src/components/subbly/`. The project owns them. Change them to match the site design.
- The `useFormatAmount` hook needs `next-intl` to be set up. It divides by 100, and `NEXT_PUBLIC_SHOP_CURRENCY` overrides the currency argument. For currencies without decimals or for a multi-currency site, use `useCurrencyFormatter` instead. See `subbly-storefront-localization`.
- Render the section with `<ProductInfoSection product={product} />` in the product page.
