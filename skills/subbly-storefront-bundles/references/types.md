# Bundle types

All types come from `@subbly/react`. `ID` is a number. Amounts are integers in minor units. For `ProductVariant`, `ProductPlan`, `ProductOneTime` and `ProductImage`, see `subbly-storefront-products`.

## Bundle

```ts
type Bundle = {
  id: ID
  name: string
  slug: string
  description: string | null
  deliveryInfo: string | null
  images: ProductImage[]
  metadata: Metafield[] | null
  digital: boolean

  configurable: boolean                  // false: fixed items, true: customer builds the box
  selectionType: 'variant' | 'product' | 'single_product'
  appearanceType: 'one_step' | 'two_step' | 'without_ruleset' | 'after_checkout'
  hiddenItems: boolean
  searchable: boolean                    // the merchant allows item search

  plans: BundlePlan[]                    // purchase options
  rulesets: BundleRuleset[]              // box sizes
  rulesetType: 'quantity' | 'total'
  showRulesetName: boolean
  quantitySelectors: number[] | null     // allowed box quantities

  priceType: 'per_item' | 'total' | null
  prices: BundlePrice[]                  // used when priceType is 'total' or 'per_item'
  discountType: 'per_item' | 'total' | 'percentage' | null
  discounts: BundleDiscount[]

  preferences: BundlePreference[]
  filters: BundleFilter[]
  createdAt: string
  updatedAt: string
}
```

## Plans, sizes, prices and discounts

```ts
type BundlePlan = {
  id: ID                         // the bundle plan ID (matches price.planId and discount.planId)
  variant: ProductVariant | null // set for a one-time purchase option
  plan: ProductPlan | null       // set for a subscription purchase option
  prices: BundlePrice[]
  discounts: BundleDiscount[]
  pricing: ProductPlan | null    // deprecated, use plan
  createdAt: string
  updatedAt: string
}

type BundleRuleset = {
  id: ID
  name: string
  minQuantity: number
  maxQuantity: number            // 0: no maximum
  minTotal: number
  maxTotal: number               // 0: no maximum
  products: ParentProduct[]
  ctaText: string | null
  createdAt: string
  updatedAt: string
}

type BundlePrice = {
  id: ID
  planId: ID                     // BundlePlan id
  rulesetId: ID
  ranges: { range: number; amount: number | null }[] // amount applies from `range` box quantity up
  createdAt: string
}

type BundleDiscount = {
  id: ID
  planId: ID
  rulesetId: ID
  ranges: { range: number; amountOff: number | null; percentOff: number | null }[]
  createdAt: string
  updatedAt: string
}
```

Two IDs exist for each purchase option:

- `BundlePlan.id` links prices and discounts. The plan or variant carries it back as `bundlePlanId`.
- `(bundlePlan.variant || bundlePlan.plan).id` is the ID that goes into `form.productId` and the cart.

## Items and groups

```ts
type BundleItem = {
  id: ID                         // bundle item ID (use it for selection checks)
  productId: ID                  // the variant ID (send it in the cart payload)
  product: ProductVariant        // with product.parent when expanded (default)
  quantity: number
  extraPrice: number             // surcharge, shown when priceType is 'per_item'
  position: number
  stockCount: number | null
  settings: { id: ID; rulesetId: ID; maxQuantity: number; createdAt: string; updatedAt: string }[]
  createdAt: string
  updatedAt: string
}

type BundleGroup = {
  id: ID
  productId: ID                  // the parent one-time product
  product: ProductOneTime
  items: BundleItem[]            // its variants in this bundle
  minQuantity: number
  maxQuantity: number
  createdAt: string
  updatedAt: string
}
```

## Preferences and filters

```ts
type AttributeValue = { id: ID; value: string }

type BundlePreference = { id: ID; title: string; attributeId: ID; values: AttributeValue[]; createdAt: string; updatedAt: string }
type BundleFilter = { id: ID; name: string; attributeId: ID; values: AttributeValue[]; createdAt: string; updatedAt: string }

// What you send
type BundlePayloadPreference = { attributeId: ID; values: ID[] } // values: AttributeValue ids
type BundleItemsParamFilter = { attributeId: ID; values: ID[] }
```

## Quote

```ts
type BundleQuotePayload = {
  productId: ID                  // selected plan or variant ID
  quantity: number
  items: { productId: ID; quantity: number }[]
  preferences: BundlePayloadPreference[]
}

type BundleQuote = {
  productId: ID
  product: Product
  quantity: number
  price: number
  subTotal: number
  discount: number
  taxAmount: number
  taxRate: number
  taxInclusive: number
  total: number
  items: {
    productId: ID; product: ProductVariant; quantity: number; price: number
    subTotal: number; total: number; discount: boolean
    taxAmount: number; taxRate: number; taxInclusive: boolean
  }[]
}
```

## Request types

```ts
type BundleListParams = {
  page?: number; perPage?: number
  tags?: string[]; slugs?: string[]; ids?: ID[]
  digital?: boolean; configurable?: boolean
  expand?: string[]              // replaces the default expand list
}

type BundleItemsParams = {
  page?: number; perPage?: number
  query?: string                 // search text
  filters?: BundleItemsParamFilter[]
  productIds?: ID[]
  expand?: string[]
}

type BundleGroupsParams = { page?: number; perPage?: number; expand?: string[] }
```

Default expands in `subblyApi.bundle`:

- `byId`, `bySlug`, `list`: `metadata`, `filters`, `preferences`, `plans.variant.parent`, `plans.plan.parent`, `rulesets`.
- `listItems`: `variant.parent`, `variant.metadata`, `product.parent`.
- `listGroups`: `product`, `items.product.parent`.
- `quote`: `items.product.parent`.

## Hook types

```ts
type SelectedBundleItem = { item: BundleItem; quantity: number }
type BundlePlanProduct = ProductVariant | ProductPlan

type BundleForm = {
  productId: number              // selected plan or variant ID
  quantity: number               // box quantity
  items: SelectedBundleItem[]
  preferences?: BundlePayloadPreference[]
}

type BundleGroupForm = {
  productId: number
  quantity: number
  items: Record<number, SelectedBundleItem> // key: group ID
  preferences?: BundlePayloadPreference[]
}

type BundleValidationRule = {
  key: 'itemMinQuantity' | 'itemMaxQuantity' | 'itemsMinTotal' | 'itemsMaxTotal' | string
  current: number
  expected: number
  delta: number                  // how far off: items to add (min) or remove (max)
  invalid: boolean
}

type BundleSelectionProgress = { current: number; max: number | null; nextIn: number | null }

type RulesetSteps = { prev: BundleRuleset | null; current: BundleRuleset; next: BundleRuleset | null }

type RulesetPriceBreakdown = {
  discountType: Bundle['discountType']
  priceType: Bundle['priceType']
  price: number | null
  amountOff: number | null
  percentOff: number | null
}

type PlanPriceCalculatorMap = Map<number, (price: number) => number> // key: plan or variant ID
```
