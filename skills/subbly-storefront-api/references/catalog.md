# Catalog methods

Products, bundles, metafields, surveys, shop, countries, leads and stock alerts. These methods need no customer token. You can call them on the server.

Notation: `?` marks an optional field. "Default expand" is the list that `subblyApi` sends when you do not pass `expand`. If you pass `expand`, it replaces the default list.

All methods on this page that accept `headers` read `x-currency` to price the response in another shop currency.

## Product

Subbly has parent products and child products:

- A **parent product** (`ParentProduct`) is a one-time product (`type: 'one_time'`, with `variants`) or a subscription product (`type: 'subscription'`, with `plans`).
- A **child product** (`Product`) is a variant (`ProductVariant`) or a plan (`ProductPlan`). You add child products to the cart.

### `product.list(params?, headers?)` returns `ProductsListResponse`

Default expand: `variants`, `plans`, `metadata`.

| Param | Type | Notes |
|---|---|---|
| `page?` | number | From 1. |
| `perPage?` | number | 1 to 100. |
| `type?` | `'one_time'` or `'subscription'` | Filter by product type. |
| `slugs?` | string[] | Filter by slug. |
| `tags?` | string[] | Filter by tag slug. Values must be distinct. |
| `digital?` | boolean | Digital products only, or physical only. |
| `giftCard?` | boolean | Gift card products only, or none. |
| `expand?` | string[] | Also `variants.parent`, `plans.parent`. |

The API also accepts `ids` (number[]) and `sort` (`{ field: 'id' or 'name', direction: 'asc' or 'desc' }`). The TypeScript type does not declare them yet.

### `product.byId(productId, params?, headers?)` returns `ParentProduct`

Loads one parent product. Default expand: `variants`, `plans`, `metadata`.

### `product.bySlug(slug, params?, headers?)` returns `ParentProduct`

Runs `list` with `slugs: [slug]` and returns the first result. Default expand: `variants`, `plans`, `metadata`. Throws `Error('Product with slug <slug> not found.')` when nothing matches.

### `product.variantById(variantId, params?, headers?)` returns `Product`

Loads one variant. Default expand: `parent`, `metadata`.

### `product.planById(planId, params?, headers?)` returns `Product`

Loads one subscription plan. Default expand: `parent`, `metadata`. The value is a `ProductPlan`.

A child ID is not a parent ID. `product.byId` with a plan or variant ID fails, and `variantById` with a parent ID fails.

## Bundle

A bundle groups products. Its `plans` are the bundle sizes and billing options that the customer buys. A configurable bundle (`configurable: true`) lets the customer pick items. For bundle rules and hooks, see the `subbly-storefront-bundles` skill.

Default expand for `list`, `byId` and `bySlug`: `metadata`, `filters`, `preferences`, `plans.variant.parent`, `plans.plan.parent`, `rulesets`.

### `bundle.list(params, headers?)` returns `BundleListResponse`

`params` is required. Pass `{}` for no filter.

| Param | Type | Notes |
|---|---|---|
| `page?` | number | From 1. |
| `perPage?` | number | Items per page. |
| `ids?` | number[] | Filter by bundle ID. |
| `slugs?` | string[] | Filter by slug. |
| `tags?` | string[] | Filter by tag slug. |
| `digital?` | boolean | Digital bundles only, or physical only. |
| `configurable?` | boolean | Configurable bundles only, or fixed only. |
| `expand?` | string[] | Relations to include. |

### `bundle.byId(bundleId, params?, headers?)` returns `Bundle`

### `bundle.bySlug(slug, params?, headers?)` returns `Bundle`

Throws `Error('Bundle with slug <slug> not found.')` when nothing matches.

### `bundle.listItems(bundleId, params?, headers?)` returns `BundleItemsResponse`

Lists the products that a customer can pick. Default expand: `variant.parent`, `variant.metadata`, `product.parent`.

| Param | Type | Notes |
|---|---|---|
| `page?`, `perPage?` | number | Pagination. |
| `filters?` | `{ attributeId: number, values: number[] }[]` | Filter by metafield values. Only metafields with `dataType: 'single_line_string'` and `preset: true` can filter. |
| `productIds?` | number[] | Filter by variant ID. |
| `query?` | string | Search text. |
| `expand?` | string[] | Relations to include. |

### `bundle.listGroups(bundleId, params?, headers?)` returns `BundleGroupsResponse`

Lists the items grouped by parent product (for `selectionType` `product` and `single_product`). Default expand: `product`, `items.product.parent`. Params: `page?`, `perPage?`, `expand?`.

### `bundle.quote(bundleId, payload, params?, headers?)` returns `BundleQuote`

Calculates the price of one configuration of a configurable bundle. Default expand: `items.product.parent`. For a fixed bundle, read the price from the bundle plan instead: the API does not allow `items` or `preferences` for a fixed bundle.

| Payload field | Type | Notes |
|---|---|---|
| `productId` | number | Required. A published bundle plan ID of this bundle. |
| `quantity` | number | Required in the type. 1 or more. Maximum 1 for a subscription plan when the shop turns off the subscription quantity selector. |
| `items` | `{ productId: number, quantity: number }[]` | Required in the type. The selected items, each with quantity 1 or more. |
| `preferences` | `{ attributeId: number, values: number[] }[]` | Required in the type. The selected preference values. Send `[]` for none. |

## Metafield

A metafield is a custom field definition. Its values arrive as `metadata` on products, variants, plans, bundles, cart items and the cart. For display and input forms, see the `subbly-storefront-metadata` skill.

### `metafield.list(params?, headers?)` returns `MetafieldListResponse`

| Param | Type | Notes |
|---|---|---|
| `ids?` | number[] | Values must be distinct. |
| `slugs?` | string[] | Values must be distinct. |
| `page?` | number | From 1. |
| `perPage?` | number | 1 to 100. |
| `preset?` | boolean | Only metafields with preset values, or only free-form. |
| `expand?` | string[] | Relations to include. |

The API also accepts `variant` (boolean) and `sort` (`field: 'id' or 'name'`). The TypeScript type does not declare them yet.

### `metafield.byId(id, params?, headers?)` returns `Metafield`

### `metafield.bySlug(slug, params?, headers?)` returns `Metafield`

Both run `list` with `perPage: 1`. They throw `Error('Metafield with id <id> not found.')` or `Error('Metafield with slug <slug> not found.')` when nothing matches.

## Surveys

### `surveys.load(surveyId, params?, headers?)` returns `Survey`

Loads a survey with its questions and answers. Default expand: `questions.answers.product.parent`. A subscription plan has its survey in `plan.survey`. For survey types and answer payloads, see the `subbly-subscription-surveys` skill.

## Shop

### `shop.load(headers?)` returns `SubblyShop`

Loads the shop configuration: currencies, languages, payment gateways, settings, countries for shipping, branding and cart widget settings. Call it one time per page. In React, `<SubblyProvider>` loads it for you, and `useShop()` reads it. See `response-shapes.md` for the fields.

## Countries

### `countries.list(headers?)` returns `Country[]`

Lists all countries with their regions. Use `shop.shippingCountries` instead when you need only the countries that the shop ships to.

## Lead

### `lead.subscribe(payload, headers?)` returns `LeadSubscribeResponse`

Saves an email as a lead in Subbly.

| Payload field | Type | Notes |
|---|---|---|
| `email` | string | Required. Valid email, maximum 255 characters. Must not be a lead already. |
| `firstName?` | string or null | Maximum 255 characters. |
| `lastName?` | string or null | Maximum 255 characters. |
| `metadata?` | object | Key-value pairs. Maximum 50 entries. |

Response: `id`, `email`, `firstName`, `lastName`, `ipAddress`, `userAgent`. For a complete newsletter form, see the `subbly-lead-capture` skill.

## Stock

### `stock.subscribe(payload, headers?)` returns `StockSubscriptionResponse`

Asks Subbly to email the customer when a product or a survey answer is in stock again.

| Payload field | Type | Notes |
|---|---|---|
| `email` | string | Required. Valid email. |
| `productId` | number | Required by the API. Must not belong to a configurable bundle. |
| `quantity` | number | Required by the API. 1 or more. |
| `answerId?` | number | A survey answer ID, for an out-of-stock answer. |

The TypeScript type marks `productId` and `quantity` as optional. Send them.

Response: `id`, `shopId`, `productId`, `email`, `quantity`, `entityId`, `entityType` (`'product'` or `'survey_answer'`), `inStockAt`, `createdAt`, `updatedAt`.
