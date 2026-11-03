# Product types

All types come from `@subbly/react`. `ID` is a number. Dates are ISO strings. Amounts are integers in minor units.

## Enums

```ts
enum ProductType { oneTime = 'one_time', subscription = 'subscription' }
enum FrequencyUnit { day = 'day', week = 'week', month = 'month' }
```

## Parent products

```ts
type ParentProduct = ProductOneTime | ProductSubscription

type ProductBase = {
  id: ID
  name: string
  slug: string
  description: string | null
  deliveryInfo: string | null
  images: ProductImage[]
  metadata: Metafield[] | null  // custom fields, see subbly-storefront-metadata
  digital: boolean              // no shipping
  collectShippingAddress: boolean
  giftingEnabled: boolean       // the customer can buy it as a gift
  bundle: Bundle | null         // set when the product belongs to a bundle
  bundleId: ID | null
  bundleRulesetId: ID | null
  createdAt: string
}

type ProductOneTime = ProductBase & {
  type: ProductType.oneTime
  variants: ProductVariant[]    // at least one
  options: ProductOption[]      // option names and their values, e.g. Size: S, M, L
  giftCard: boolean
  giftCardExpiration: number | null
}

type ProductSubscription = ProductBase & {
  type: ProductType.subscription
  plans: ProductPlan[]          // at least one
  setupFee: number
  preOrderEndAt: string | null
  pricings: ProductPlan[]       // deprecated, use plans
}
```

## Children (the items that go into the cart)

```ts
type Product = ProductPlan | ProductVariant
type ProductUnknown = Product | ParentProduct

type ProductVariant = {
  id: ID
  name: string
  description: string | null
  price: number
  priceScheme: ProductPriceScheme | null
  stockCount: number | null      // null: stock not tracked
  options: ProductVariantOption[] // this variant's value for each option
  attributes: Metafield[]
  metadata: Metafield[] | null
  bundlePlanId: ID | null        // set when the variant is a one-time bundle plan
  parent: ProductOneTime         // present when expanded (default in subblyApi)
  createdAt: string
}

type ProductPlan = {
  id: number
  name: string
  pricingName: string | null    // plan label, used in display names
  description: string | null
  price: number                 // price per billing
  priceScheme: ProductPriceScheme | null
  setupFee: number | null
  frequencyCount: number        // bills every frequencyCount frequencyUnit
  frequencyUnit: FrequencyUnit
  commitmentBillingCount: number
  chargesLimit: number | null   // null: no limit
  chargeImmediately: boolean
  shipImmediately: boolean
  cutOffAt: string | null
  rebillingStartAt: string | null
  trialPrice: number | null
  trialLength: number | null
  trialLengthDays: number | null // same as trialLength, in survey responses
  preOrderEndAt: string | null
  shippings: ProductShipping[]
  stockCount: number | null
  survey: Survey | null         // see subbly-subscription-surveys
  metadata: Metafield[] | null
  bundlePlanId: ID | null       // set when the plan is a subscription bundle plan
  planHash: string | null
  parent: ProductSubscription   // present when expanded
  createdAt: string
}
```

To tell a plan from a variant, check the parent type, or check a plan-only field: `'frequencyUnit' in product`.

## Options, images, prices, shipping

```ts
type ProductOption = { id: ID; name: string; values: string[] }
type ProductVariantOption = { id: ID; name: string; value: string }

type ProductImage = { id: ID; url: string; order: number; createdAt: string; updatedAt: string }

type ProductPriceScheme = {
  id: ID
  type: 'volume_price' | string
  ranges: { id: ID; range: number; amount: number }[] // amount applies from `range` units up
}

type ProductShipping = {
  id: ID
  shippingAt: string | null
  addCount: number | null
  addUnit: FrequencyUnit
  createdAt: string
  updatedAt: string
}
```

## Request types

```ts
type ProductsListParams = {
  page?: number
  perPage?: number
  type?: ProductType            // use the enum, not a string literal
  tags?: string[]
  slugs?: string[]
  digital?: boolean
  giftCard?: boolean
  expand?: string[]             // replaces the default expand list
}

type ProductsResourceParams = { expand?: string[] }

type ProductRequestHeaders = Record<string, string> & { 'x-currency'?: string }

type ProductsListResponse = { data: ParentProduct[]; pagination: Pagination }
```

Expand values for parents: `variants`, `variants.parent`, `plans`, `plans.parent`, `metadata`. For children: `parent`, `metadata`.

## Hook types

```ts
type ProductForm = {
  productId: number | null      // selected plan or variant ID
  quantity: number | undefined
  metadata: MetadataObject[] | null | undefined
}

type ProductVariantCombination = {
  id: number
  inStock: boolean
  price: number
  [optionName: string]: string | boolean | number // lower-case option name to value
}
```
