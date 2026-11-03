# Bundle hooks

All hooks come from `@subbly/react`. They are React hooks: call them in components that run in the browser. Each hook keeps its own state. When the `bundle` prop changes to another bundle, remount the component (for example with `key={bundle.id}`).

## useBundleForm

```ts
const bundleForm = useBundleForm({ bundle, groups }) // groups is optional
```

Pass `groups` (from `listGroups`) only when you need `hasGroupOutOfStock` and `showGroupProduct`.

Initial state:

- `form.productId` is the first bundle plan (variant or plan). The bundle must have at least one plan.
- `form.quantity` is the first value of `quantitySelectors`, or `1`.
- `form.items` and `form.preferences` are empty.
- `rulesetId` is the size that matches the empty selection (usually the smallest). The bundle must have at least one ruleset.

### Form state

| Return | Meaning |
|---|---|
| `form` | `BundleForm`: `{ productId, quantity, items, preferences }` |
| `setForm(form)` | Replace the form. |
| `updateForm(partial)` | Merge fields into the form. When `items` change and `autoMatchRuleset` is `true`, it also selects the matching size. |
| `addToCart(override?)` | Builds the cart payload from `form` and adds it. The override merges over the payload. Returns `Promise<SubblyCart \| null>`. |

### Plans and quantity

| Return | Meaning |
|---|---|
| `planOptions` | `BundlePlanProduct[]`: the variant or plan of each bundle plan. Select one with `updateForm({ productId })`. |
| `planPriceCalculatorMap` | `Map<planOrVariantId, (price) => number>`. Gives the plan price for a subtotal: `map.get(id)?.(itemsPrice) ?? itemsPrice`. |
| `hidePlanPrice` | `true` unless `priceType` is `total`. |
| `hidePlanBasePrice` | `true` when `priceType` is `total`. |

Change the box quantity with `updateForm({ quantity })`. Offer only values from `bundle.quantitySelectors`.

### Sizes (rulesets)

| Return | Meaning |
|---|---|
| `rulesetOptions` | Sizes sorted by `minQuantity` (or `minTotal`), smallest first. |
| `rulesetId`, `setRulesetId(id)` | The selected size. |
| `selectedRuleset` | The selected `BundleRuleset`, or `null`. |
| `autoMatchRuleset` | `true` when there is one size or `appearanceType` is `without_ruleset`. Then the size follows the selection. Hide the size selector. |
| `findMatchingRuleset(rulesets, value)` | The size for a quantity or total. |
| `rulesetSteps` | `{ prev, current, next }` sizes. |
| `rulesetSelectionProgress` | `{ current, max, nextIn }`. See below. |
| `rulesetPriceBreakdownMap` | `Map<rulesetId, RulesetPriceBreakdown>` for the selected plan. Empty when there is one size. |
| `rulesetStepsPriceBreakdown` | Breakdowns for `{ prev, current, next }`. Use `next` for "Add 2 more items to save 10%". |

`rulesetSelectionProgress`:

- `current` is the selected quantity (or the item total for `rulesetType: 'total'`).
- `max` is the target for the progress bar. `nextIn` is the amount still needed to reach it.
- Both are `null` when there is no next size. They are also `null` when the shopper picks the size by hand: several sizes and an `appearanceType` of `one_step` or `after_checkout`.

### Items and prices

| Return | Meaning |
|---|---|
| `selectedItemsQuantity` | Sum of the selected item quantities. |
| `selectedItemsPrice` | Sum of item `price * quantity`. |
| `itemsPrice` | `selectedItemsPrice` multiplied by `form.quantity`. |
| `calculateItemPrice(price, quantity?)` | The price of one item line after the plan price rules and discounts. Pass `item.product.price`. |
| `hideItemQuantity` | `true` for `single_product` bundles. |
| `itemsQuantityChangeDisabled` | `true` for `single_product` bundles. |
| `selectionType` | Flags: `{ variant, product, single_product }`. |
| `appearanceType` | Flags: `{ one_step, two_step, without_ruleset, after_checkout }`. |
| `showGroupProduct` | `true` when there are several groups, or one group with one item. Show the group product name then. |
| `hasGroupOutOfStock` | `true` when a group has no item in stock. Disable the button. |

### Preferences

| Return | Meaning |
|---|---|
| `preferenceOptions` | `bundle.preferences`. |
| `preferences`, `updatePreferences(list)` | Local state for a preference picker. |

`addToCart()` sends `form.preferences`, not `preferences`. Keep them in sync:

```ts
const onPreferencesChange = (list: BundlePayloadPreference[]) => {
  updatePreferences(list)
  updateForm({ preferences: list })
}
```

## useBundleItemsForm

For `selectionType: 'variant'`. The hook is controlled: the selection lives in `useBundleForm`.

```ts
const items = useBundleItemsForm({
  bundle,
  selectedItems: form.items,
  onItemsChange: (next) => updateForm({ items: next }),
  initialFilters: { perPage: 24 }, // optional
})
```

| Return | Meaning |
|---|---|
| `filtersForm` | `{ page, perPage, filters, productIds, query }`. Defaults: page 1, 10 per page. Pass it as the params of `subblyApi.bundle.listItems`. |
| `updateFiltersForm(partial)`, `setFiltersForm(form)` | Change the search text, attribute filters or page. Reload the items after a change. |
| `checkItemSelected(bundleItemId)` | `true` when the item is in the selection. |
| `getCurrentItemQuantity(bundleItemId)` | The selected quantity, or `0`. |
| `updateItemQuantity(bundleItem, quantity)` | Add, change or remove (quantity `0`) an item. |
| `showItemPrice` | `true` when `priceType` is `null`. Show `item.product.price`. |
| `showItemExtraPrice` | `true` when `priceType` is `per_item`. Show `item.extraPrice`. |

The hook does not check limits. To stop adds at the maximum, use `useBundleValidation`. Disable "add" when `autoMatchRuleset` is `false`, `rules.itemsMax.expected` is not `0` and `rules.itemsMax.delta >= 0`. Also respect `item.stockCount`.

## useBundleProductGroupedItemsForm

For `selectionType: 'product'` and `'single_product'`. Also controlled.

```ts
const grouped = useBundleProductGroupedItemsForm({
  bundle,
  selectedItems: form.items,
  onItemsChange: (next) => updateForm({ items: next }),
  allowMultipleItemsInGroup: false, // optional
})
```

| Return | Meaning |
|---|---|
| `selectItem(bundleItem)` | Selects the item. By default it replaces the other selected variant of the same product. With `allowMultipleItemsInGroup`, selecting an item again adds 1 to its quantity. |
| `updateItemQuantity(parentProductId, quantity)` | Changes the quantity of the selected variant of that product. `0` removes it. The argument is the parent product ID, not the bundle item ID. |
| `getSelectedItemForProduct(parentProductId)` | The selected item of that product, or `null`. |
| `checkProductSelected(parentProductId)` | `true` when a variant of that product is selected. |
| `checkItemSelected(bundleItemId)`, `getCurrentItemQuantity(bundleItemId)` | As in `useBundleItemsForm`. |
| `autoSelectGroupItems(groups)` | Selects the first in-stock item of each group. |
| `selectExplicitItems(groups)` | Selects the item of each group that has only one item. Call it after the groups load for `single_product` bundles. |
| `showItemPrice`, `showItemExtraPrice` | As in `useBundleItemsForm`. |

## useBundleGroupForm

A separate form for grouped bundles with exactly one item per group. It does not use rulesets, validation or preferences. Prefer `useBundleForm` with `useBundleProductGroupedItemsForm` for new code.

```ts
const { form, plans, itemsPrice, selectPlan, selectItem, getSelectedItem, addToCart } =
  useBundleGroupForm({ bundle, groups })
```

- The initial form selects the first in-stock item of each group.
- `selectItem(group, { item, quantity })` sets the item of a group. `getSelectedItem(groupId)` reads it.
- `selectPlan(planOrVariantId)` changes the plan.
- `addToCart()` throws when a group has no item.
- It throws on first render when `bundle` or `groups` is missing. It reads `bundle.rulesets[0]`.
- `subtotal` is a deprecated alias of `itemsPrice`.

## useBundleValidation

```ts
const { rules, validation } = useBundleValidation({ bundle, form, ruleset: selectedRuleset })
```

- `rules.itemsMin` and `rules.itemsMax` are `BundleValidationRule` objects.
- `validation` is the first rule with `invalid: true`, or `null`.
- The minimum is `minQuantity` (or `minTotal`), at least `1`. A maximum of `0` means no maximum.
- For `itemsMin`, `delta` is the amount to add. For `itemsMax`, `delta` is the amount to remove.

Message example: `Add ${validation.delta} more items` when `validation.key === 'itemMinQuantity'`.

## useBundleReceipt

```ts
const receipt = useBundleReceipt({ bundle, form, rulesetId, quote })
```

| Return | Meaning |
|---|---|
| `subtotal` | `quote.total` when you pass a quote. Without a quote: the fixed box price for `priceType: 'total'`, else `null`. |
| `discount` | `quote.discount` (or `0`) when the bundle has a `discountType`, else `null`. |
| `discountType` | `bundle.discountType`. |
| `discountRange` | The matching discount range for the plan, size and quantity, or `null`. |
| `pricePerItem` | The plan price per item for `priceType: 'per_item'`, else `null`. |

## useBundleRuleset and useBundlePrice

`useBundleForm` calls both. Use them only if you build your own form state.

- `useBundleRuleset({ bundle, form })` returns the size fields listed under useBundleForm, plus `rulesetType` (`{ quantity, total }`), `selectedItemsPrice` and `selectedItemsQuantity`.
- `useBundlePrice({ bundle, form, sizeId })` returns `itemsPrice` and `planPriceCalculatorMap`.

## findSelectableBundlePlanId

```ts
const planId = findSelectableBundlePlanId(bundle.plans) // plan or variant ID, or null
```
