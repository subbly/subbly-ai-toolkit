# Product pages and components

These examples are starting points: change the markup and styles to match the site. `./subbly` stands for the module of your project that initializes `subblyApi`.

## Load the product

```ts
import { subblyApi } from './subbly'

const product = await subblyApi.product.bySlug(slug).catch(() => null)
// null: no published product has this slug. Show your "not found" page.
```

Load it where the app loads page data. When the site renders pages on a server, load it there for SEO, and pass it to `ProductDetails` as a prop.

If products and bundles share one URL pattern, try `subblyApi.product.bySlug` first. If it throws, try `subblyApi.bundle.bySlug`. Render the matching component. See `subbly-storefront-bundles`.

## Product details

```tsx
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
import type { ParentProduct, Pagination } from '@subbly/react'
import { ProductCard } from './product-card'

// Load one page of products: await subblyApi.product.list({ page, perPage: 12 })
export function ProductGrid({ data, pagination }: { data: ParentProduct[]; pagination: Pagination }) {
  return (
    <>
      <div className="grid">{data.map((p) => <ProductCard key={p.id} product={p} />)}</div>
      {pagination.currentPage < pagination.lastPage && <a href={`?page=${pagination.currentPage + 1}`}>Next page</a>}
    </>
  )
}
```

In `ProductCard`, link to `/products/${product.slug}` and show the lowest price of `product.variants` or `product.plans`.

