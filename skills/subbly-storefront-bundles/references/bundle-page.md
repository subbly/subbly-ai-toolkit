# Bundle pages

These examples use the Next.js App Router. They are starting points: change the markup and styles to match the site. `@/lib/subbly/api` stands for the module of your project that initializes `subblyApi`. In client components, `subblyApi` from `@subbly/react` works after that module (or `SubblyProvider`) has run.

## Page (server)

```tsx
// app/bundles/[slug]/page.tsx
import { notFound } from 'next/navigation'
import { subblyApi } from '@/lib/subbly/api'
import { BundleConfigurator } from '@/components/bundle-configurator'

export default async function BundlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const bundle = await subblyApi.bundle.bySlug(slug).catch(() => null)

  if (!bundle) notFound()

  const showGallery = !bundle.configurable || bundle.selectionType === 'single_product'

  return (
    <main>
      {showGallery && bundle.images.map((image) => <img key={image.id} src={image.url} alt={bundle.name} />)}
      <h1>{bundle.name}</h1>
      <BundleConfigurator key={bundle.id} bundle={bundle} />
    </main>
  )
}
```

If products and bundles share one URL pattern (for example `/products/[slug]`), try `subblyApi.product.bySlug` first. If it throws, try `subblyApi.bundle.bySlug`.

## Pick the mode (client)

```tsx
'use client'

import type { Bundle } from '@subbly/react'
import { FixedBundle } from './fixed-bundle'
import { ItemListBundle } from './item-list-bundle'
import { GroupedBundle } from './grouped-bundle'

export function BundleConfigurator({ bundle }: { bundle: Bundle }) {
  if (!bundle.configurable) return <FixedBundle bundle={bundle} />
  if (bundle.selectionType === 'variant') return <ItemListBundle bundle={bundle} />
  return <GroupedBundle bundle={bundle} />
}
```

## Shared plan picker

```tsx
'use client'

import { useCurrencyFormatter, type BundlePlanProduct, type PlanPriceCalculatorMap } from '@subbly/react'

type Props = {
  options: BundlePlanProduct[]
  value: number
  subtotal: number
  calculators: PlanPriceCalculatorMap
  hidePrice?: boolean // pass hidePlanPrice from useBundleForm
  onChange: (id: number) => void
}

export function BundlePlanPicker({ options, value, subtotal, calculators, hidePrice, onChange }: Props) {
  const { formatAmount } = useCurrencyFormatter()

  return (
    <fieldset>
      {options.map((option) => {
        const price = calculators.get(option.id)?.(subtotal) ?? subtotal
        return (
          <label key={option.id}>
            <input type="radio" checked={value === option.id} onChange={() => onChange(option.id)} />
            {option.name} {!hidePrice && price > 0 && formatAmount(price)}
          </label>
        )
      })}
    </fieldset>
  )
}
```

- A plan option is a `ProductPlan` (subscription) or a `ProductVariant` (one-time). Check `'frequencyUnit' in option` to show "every month" text for subscriptions.
- `hidePlanPrice` is `true` unless `priceType` is `total`. When it is `true`, show the item total (`itemsPrice`) or the quote instead of a plan price.

## Fixed bundle

```tsx
'use client'

import { useBundleForm, type Bundle } from '@subbly/react'
import { BundlePlanPicker } from './bundle-plan-picker'

export function FixedBundle({ bundle }: { bundle: Bundle }) {
  const { form, updateForm, planOptions, planPriceCalculatorMap, hidePlanPrice, addToCart } = useBundleForm({ bundle })

  return (
    <>
      <BundlePlanPicker
        options={planOptions}
        value={form.productId}
        subtotal={0}
        calculators={planPriceCalculatorMap}
        hidePrice={hidePlanPrice}
        onChange={(productId) => updateForm({ productId })}
      />
      <button onClick={() => addToCart()}>Add to cart</button>
    </>
  )
}
```

If `quantitySelectors` is set, add a quantity choice with `updateForm({ quantity })`.

## Item list bundle (`selectionType: 'variant'`)

```tsx
'use client'

import { useEffect, useState } from 'react'
import {
  subblyApi, useBundleForm, useBundleItemsForm, useBundleValidation, useCurrencyFormatter,
  type Bundle, type BundleItem,
} from '@subbly/react'
import { BundlePlanPicker } from './bundle-plan-picker'

export function ItemListBundle({ bundle }: { bundle: Bundle }) {
  const { formatAmount } = useCurrencyFormatter()
  const {
    form, updateForm, planOptions, planPriceCalculatorMap, hidePlanPrice, itemsPrice, calculateItemPrice,
    rulesetOptions, rulesetId, setRulesetId, selectedRuleset, autoMatchRuleset,
    rulesetSelectionProgress, appearanceType, addToCart,
  } = useBundleForm({ bundle })

  const picker = useBundleItemsForm({
    bundle,
    selectedItems: form.items,
    onItemsChange: (items) => updateForm({ items }),
  })
  const { rules, validation } = useBundleValidation({ bundle, form, ruleset: selectedRuleset })

  const [items, setItems] = useState<BundleItem[]>([])
  useEffect(() => {
    subblyApi.bundle.listItems(bundle.id, picker.filtersForm).then((res) => setItems(res.data))
  }, [bundle.id, picker.filtersForm])

  const atMax = !autoMatchRuleset && !!rules.itemsMax.expected && rules.itemsMax.delta >= 0
  const { current, max, nextIn } = rulesetSelectionProgress

  return (
    <>
      {!autoMatchRuleset && (
        <div role="radiogroup" aria-label="Box size">
          {rulesetOptions.map((size) => (
            <button key={size.id} aria-pressed={size.id === rulesetId} onClick={() => setRulesetId(size.id)}>
              {bundle.showRulesetName ? size.name : `${size.minQuantity} items`}
            </button>
          ))}
        </div>
      )}

      {!appearanceType.after_checkout && (
        <>
          {bundle.searchable && (
            <input
              placeholder="Search"
              value={picker.filtersForm.query}
              onChange={(e) => picker.updateFiltersForm({ query: e.target.value, page: 1 })}
            />
          )}
          {items.map((item) => {
            const qty = picker.getCurrentItemQuantity(item.id)
            const soldOut = item.stockCount === 0
            return (
              <div key={item.id}>
                <img src={item.product.parent?.images[0]?.url} alt={item.product.name} />
                <p>{item.product.name}</p>
                {picker.showItemPrice && <p>{formatAmount(calculateItemPrice(item.product.price))}</p>}
                {picker.showItemExtraPrice && item.extraPrice > 0 && <p>+{formatAmount(item.extraPrice)}</p>}
                <button disabled={qty === 0} onClick={() => picker.updateItemQuantity(item, qty - 1)}>-</button>
                <span>{qty}</span>
                <button disabled={atMax || soldOut} onClick={() => picker.updateItemQuantity(item, qty + 1)}>+</button>
              </div>
            )
          })}
          {max !== null && <progress value={current} max={max} />}
          {nextIn !== null && nextIn > 0 && <p>Add {nextIn} more to reach the next size.</p>}
        </>
      )}

      <BundlePlanPicker
        options={planOptions}
        value={form.productId}
        subtotal={itemsPrice}
        calculators={planPriceCalculatorMap}
        hidePrice={hidePlanPrice}
        onChange={(productId) => updateForm({ productId })}
      />

      <button disabled={!appearanceType.after_checkout && !!validation} onClick={() => addToCart()}>
        Add to cart
      </button>
    </>
  )
}
```

For a `two_step` bundle, show the size buttons first. Show the item list after the shopper picks a size.

## Grouped bundle (`selectionType: 'product'` or `'single_product'`)

```tsx
'use client'

import { useEffect, useState } from 'react'
import {
  subblyApi, useBundleForm, useBundleProductGroupedItemsForm, useBundleValidation,
  type Bundle, type BundleGroup,
} from '@subbly/react'

export function GroupedBundle({ bundle }: { bundle: Bundle }) {
  const [groups, setGroups] = useState<BundleGroup[]>([])
  const { form, updateForm, selectedRuleset, hideItemQuantity, addToCart } = useBundleForm({ bundle })
  const grouped = useBundleProductGroupedItemsForm({
    bundle,
    selectedItems: form.items,
    onItemsChange: (items) => updateForm({ items }),
  })
  const { validation } = useBundleValidation({ bundle, form, ruleset: selectedRuleset })

  useEffect(() => {
    subblyApi.bundle.listGroups(bundle.id, { perPage: 100 }).then((res) => {
      setGroups(res.data)
      if (bundle.selectionType === 'single_product') grouped.selectExplicitItems(res.data)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bundle.id])

  const outOfStock = groups.some((g) => !g.items.some((i) => i.product.stockCount !== 0))

  return (
    <>
      {groups.map((group) => {
        const selected = grouped.getSelectedItemForProduct(group.productId)
        return (
          <fieldset key={group.id}>
            <legend>{group.product.name}</legend>
            {group.items.map((item) => (
              <label key={item.id}>
                <input
                  type="radio"
                  name={`group-${group.id}`}
                  checked={selected?.item.id === item.id}
                  disabled={item.product.stockCount === 0}
                  onChange={() => grouped.selectItem(item)}
                />
                {item.product.name}
              </label>
            ))}
            {!hideItemQuantity && selected && (
              <input
                type="number"
                min={0}
                value={selected.quantity}
                onChange={(e) => grouped.updateItemQuantity(group.productId, Number(e.target.value))}
              />
            )}
          </fieldset>
        )
      })}
      <button disabled={!!validation || outOfStock} onClick={() => addToCart()}>Add to cart</button>
    </>
  )
}
```

Add the plan picker and the size selector as in the item list example when the bundle has several plans or sizes. Instead of computing `outOfStock` yourself, you can pass `groups` to `useBundleForm` and read `hasGroupOutOfStock`.

## Preferences

```tsx
const { preferenceOptions, preferences, updatePreferences, updateForm } = useBundleForm({ bundle })

const toggle = (attributeId: number, valueId: number) => {
  const current = preferences.find((p) => p.attributeId === attributeId)?.values ?? []
  const values = current.includes(valueId) ? current.filter((v) => v !== valueId) : [...current, valueId]
  const next = [...preferences.filter((p) => p.attributeId !== attributeId), { attributeId, values }]
  updatePreferences(next)
  updateForm({ preferences: next }) // addToCart reads form.preferences
}
```

Render one group per `preferenceOptions` entry (`title`) with a checkbox per `values` entry (`value`).

## Quote and price summary

`quote` returns the server price with tax and discount. Request it again when the plan, quantity, items or preferences change. Import `useState`, `useEffect` from `react` and `BundleQuote` from `@subbly/react`.

```tsx
const { form, rulesetId } = useBundleForm({ bundle })
const [quote, setQuote] = useState<BundleQuote | null>(null)

useEffect(() => {
  const timer = setTimeout(() => {
    subblyApi.bundle
      .quote(bundle.id, {
        productId: form.productId,
        quantity: form.quantity,
        items: form.items.map(({ item, quantity }) => ({ productId: item.productId, quantity })),
        preferences: form.preferences ?? [],
      })
      .then(setQuote)
      .catch(() => setQuote(null))
  }, 300) // wait until the shopper stops changing the selection

  return () => clearTimeout(timer)
}, [bundle.id, form])

const { subtotal, discount, pricePerItem } = useBundleReceipt({ bundle, form, rulesetId, quote })
```

Show `subtotal` as the box price and `discount` as the saving. `quote.taxAmount` and `quote.taxInclusive` give the tax details.

## Prebuilt registry block

Subbly publishes a `customize-bundle-section` shadcn/ui block. It renders fixed, item list and grouped bundles, with sizes, plans, preferences, a selection progress bar and a receipt.

1. Add the registry to `components.json`:

   ```json
   { "registries": { "@subbly": "https://registry.subbly.dev/r/{name}.json" } }
   ```

2. Install the block:

   ```bash
   npx shadcn@latest add @subbly/customize-bundle-section
   ```

3. Render it: `<CustomizeBundleSection bundle={bundle} groupItemsByProduct />`. Props: `bundle`, `groupItemsByProduct?` (show a `variant` bundle grouped by product), `allowMultipleItemsInGroup?`.

After the install:

- The project owns the files under `src/components/subbly/bundle/`. Change them to match the site design.
- The block loads items, groups and quotes with `@tanstack/react-query`. Wrap the app in a `QueryClientProvider`.
- The price formatter of the block needs `next-intl`. See `subbly-storefront-localization`.
- The preference picker of the block calls `updatePreferences` only. Add `updateForm({ preferences })` so the preferences reach the cart.
