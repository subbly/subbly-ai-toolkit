---
name: subbly-storefront-bundles
description: "Write storefront code with @subbly/react that loads and sells Subbly bundles: fixed boxes and customizable boxes that the customer builds. Use when you build a bundle or box page, a build-your-own-box configurator, an item picker, a box size (ruleset) selector, a plan selector for a box, a selection progress bar, bundle preferences, item filters or search, or a price summary and quote. Covers the Bundle types, the subblyApi.bundle methods (list, byId, bySlug, listItems, listGroups, quote), the useBundleForm family of hooks, and how to add a bundle to the cart. For storefront code only. To read or change a live store (products, orders, subscribers), use the Subbly connector tools instead."
---

# Subbly storefront bundles

This skill helps you build bundle pages on a custom storefront with `@subbly/react`. A bundle sells several products as one item. Merchants and shoppers often call it a box, kit, pack or crate. For single products, see `subbly-storefront-products`.

## Before you start

- The project must have `@subbly/react` installed and `subblyApi` initialized. For setup and error handling, see the `subbly-storefront-api` skill.
- Import hooks, helpers and types from `@subbly/react`.
- In server code, import `subblyApi` from the module of your project that calls `subblyApi.initialize()`. The examples use `@/lib/subbly/api`.
- Every price is an integer in minor units. Format it with `useCurrencyFormatter().formatAmount(amount)`.
- For the cart and the widget, see `subbly-cart-and-checkout`.

## Bundle model

| Field | Values | Meaning |
|---|---|---|
| `configurable` | `false` | **Fixed bundle.** The merchant chose the items. The customer picks only a plan and a quantity. |
| | `true` | **Customizable bundle.** The customer picks the items within the rules. |
| `selectionType` | `variant` | Pick from a flat list of variants. Load them with `listItems`. |
| | `product` | Items are grouped by product. The customer can pick several variants per group. Load them with `listGroups`. |
| | `single_product` | Items are grouped by product. The customer picks one variant per group. Load them with `listGroups`. |
| `appearanceType` | `one_step` | Size, plan and items on one screen. |
| | `two_step` | First the size, then the items. |
| | `without_ruleset` | No size step. The size follows the selection. |
| | `after_checkout` | The customer picks the items after the purchase. Do not show the item picker. |
| `rulesets` | `BundleRuleset[]` | Box sizes. Each has `minQuantity`/`maxQuantity` or `minTotal`/`maxTotal`. |
| `rulesetType` | `quantity` or `total` | The rules count items, or the item price total. |
| `plans` | `BundlePlan[]` | Purchase options. Each wraps a one-time `variant` or a subscription `plan`. |
| `priceType` | `total` | The box has a fixed price per plan and size (`prices`). Item prices are hidden. |
| | `per_item` | Each item costs the plan price. Items can add an `extraPrice`. |
| | `null` | The box costs the sum of the item prices, less any discount. |
| `discountType` | `per_item`, `total`, `percentage`, `null` | How `discounts` apply, per plan, size and quantity. |
| `quantitySelectors` | `number[]` or `null` | Allowed box quantities, for example `[1, 2, 3]`. |
| `preferences` | `BundlePreference[]` | Attribute choices, for example "No nuts". |
| `filters` | `BundleFilter[]` | Attribute filters for the item picker. |

Only a bundle can offer one-time and subscription purchase together, because each bundle plan is a variant or a plan.

For every field, read `references/types.md`.

## Load bundles

The `subblyApi.bundle` methods add the expands that the hooks need.

| Method | Returns | Use it for |
|---|---|---|
| `list(params, headers?)` | `{ data: Bundle[], pagination }` | Bundle lists. Filters: `page`, `perPage`, `tags`, `slugs`, `ids`, `digital`, `configurable`. |
| `byId(id, params?, headers?)` | `Bundle` | A page keyed by ID |
| `bySlug(slug, params?, headers?)` | `Bundle` | A page keyed by slug. Throws an `Error` when not found. |
| `listItems(id, params?, headers?)` | `{ data: BundleItem[], pagination }` | Items of a `variant` bundle. Params: `page`, `perPage`, `query`, `filters`, `productIds`. |
| `listGroups(id, params?, headers?)` | `{ data: BundleGroup[], pagination }` | Groups of a `product` or `single_product` bundle |
| `quote(id, payload, params?, headers?)` | `BundleQuote` | The server price of a selection, with tax and discount |

- `list` requires a params object. Pass `{}` when you need no filter.
- If you pass `expand`, it replaces the default list. Keep the defaults unless you know the hooks do not need them.
- Item lists are paged. The default page size in `useBundleItemsForm` is 10. Load more pages, or set `perPage`.

## Hooks

| Hook | Use it for |
|---|---|
| `useBundleForm({ bundle, groups? })` | The main state: plan, quantity, items, size, preferences, prices and `addToCart()`. Use it for every bundle. |
| `useBundleItemsForm({ bundle, selectedItems, onItemsChange })` | The item picker for `variant` bundles: filters, search, page, quantity per item. |
| `useBundleProductGroupedItemsForm({ bundle, selectedItems, onItemsChange })` | The item picker for `product` and `single_product` bundles. |
| `useBundleGroupForm({ bundle, groups })` | A self-contained form with one item per group and its own `addToCart()`. |
| `useBundleValidation({ bundle, form, ruleset })` | The first broken rule (too few or too many items), or `null`. |
| `useBundleReceipt({ bundle, form, rulesetId, quote })` | The price summary: `subtotal`, `discount`, `pricePerItem`. |
| `useBundleRuleset`, `useBundlePrice` | Lower-level parts of `useBundleForm`. You seldom need them. |

The helper `findSelectableBundlePlanId(bundle.plans)` returns the first plan or variant ID, or `null`.

For props, return values and behaviour, read `references/hooks.md`.

## Build a bundle page

1. Load the bundle on the server with `bySlug` or `byId`. Pass it to a client component.
2. Pick the mode:
   - `configurable === false`: fixed bundle. Show the plan picker, the quantity and the button.
   - `selectionType === 'variant'`: load items with `listItems`. Use `useBundleItemsForm`.
   - `selectionType === 'product'` or `'single_product'`: load groups with `listGroups`. Use `useBundleProductGroupedItemsForm`.
3. Call `useBundleForm({ bundle })`. Connect the item picker to it: `selectedItems={form.items}` and `onItemsChange={(items) => updateForm({ items })}`.
4. Show a size selector only when `autoMatchRuleset` is `false`.
5. Validate with `useBundleValidation`. Disable the button while `validation` is not `null`. Skip this for `after_checkout` bundles.
6. Optional: call `quote` and pass the result to `useBundleReceipt` for an exact summary.
7. Call `addToCart()` from `useBundleForm`.

For full examples of each mode, read `references/bundle-page.md`.

## Add a bundle to the cart

`useBundleForm().addToCart()` builds this payload:

```ts
{
  productId: form.productId,        // the ID of the selected bundle plan (variant or plan)
  quantity: form.quantity,
  bundle: {                         // only for configurable bundles
    items: [{ productId: bundleItem.productId, quantity: 2 }],
    preferences: form.preferences,  // [{ attributeId, values: [valueId] }]
  },
}
```

Shortcut: when the hosted cart widget is on the page, `useSubblyCart().addToCart({ bundleId: bundle.id })` opens the bundle configurator of the widget. Without the widget, this call throws.

## Common mistakes

- **Preferences are not sent.** `updatePreferences()` stores local state only. `addToCart()` reads `form.preferences`. Call `updateForm({ preferences })` as well, or use only `updateForm`.
- Sending the bundle ID as `productId`. Send the ID of the selected plan or variant (`form.productId`).
- Using `listItems` for a grouped bundle, or `listGroups` for a `variant` bundle.
- Reading `quote(...).data`. `quote` returns the `BundleQuote` object directly.
- Rendering a gallery above a customizable `variant` or `product` bundle. The items carry their own images. Show the bundle gallery for fixed bundles and `single_product` bundles.
- Calling the hooks with a bundle that has no plans or no rulesets. `useBundleForm` and `useBundleGroupForm` read the first plan and the first ruleset, and fail without them.
- Showing item prices when `priceType` is `total` or `per_item`. Use `showItemPrice` and `showItemExtraPrice` from the item hooks.

## Prebuilt components

Subbly publishes a `customize-bundle-section` shadcn/ui block in a public registry. It renders every bundle mode. For install steps and caveats, read `references/bundle-page.md`.

## References

| Reference | Read it when |
|---|---|
| `references/types.md` | You need a field of a bundle, plan, ruleset, item, group, preference, filter, quote or form. |
| `references/hooks.md` | You use any `useBundle*` hook and need its props, return values or behaviour. |
| `references/bundle-page.md` | You build a bundle page (fixed, flat item list or grouped), a quote summary, or install the prebuilt block. |
