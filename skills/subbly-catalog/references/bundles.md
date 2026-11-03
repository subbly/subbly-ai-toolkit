# Bundles

The facts to collect and the rules for fixed, configurable and single product bundles. `SKILL.md` explains the bundle types and `selectionType`.

## What to collect

### For all bundles

- **Slug:** letters, numbers, hyphens and underscores. At most 70 characters. Unique in the store.
- **Mode:** fixed (`configurable: 0`) or configurable (`configurable: 1`).
- **Physical or digital** (`digital: 0` or `1`). A physical bundle must keep `collectShippingAddress: 1`. A digital bundle can collect a shipping address if the merchant wants it.
- **At least one item:** a one-time product variant.
- **Optional:**
  - Name (the default is "Bundle #" and a number), description, delivery information, tags, up to 5 images.
  - `pauseEnabled`: on by default. Some Subbly plans do not let the merchant turn it off.
  - Gifting: not available for digital bundles.
  - `preOrderEndAt` (YYYY-MM-DD): when it is set, no plan can have trial fields, and the reverse.

### For configurable bundles

- Selection: `product`, `variant` or `single_product`.
- Tier type (`rulesetType`): `quantity` (by item count, the usual choice) or `total` (by cart amount). Not for `single_product`.
- Price mode: `priceType` or `discountType`. See "Price mode".
- Tiers (box sizes): ranges, and optional names and button text.
- Optional preferences and filters. Each one needs a preset `single_line_string` metafield. Create the metafield first (see `collections-and-metadata.md`). A bundle has at most one active filter.

## Order of work

1. `create_bundle`. It starts as a draft.
2. Add items: `batch_bundle_items` (up to 200 in one call) or `create_bundle_item`.
3. Set tiers, price mode, preferences and filters with `update_bundle`.
4. Add plans with `create_bundle_plan`.
5. `publish_bundle` when the user asks. It needs at least one item and one active plan. It also publishes all plans that are not archived.

## Price mode

`priceType` and `discountType` control the price. Both can be null. Then plans cannot have `prices` or `discounts`, and items keep their own variant prices.

- Fixed bundle: `priceType` is always `total`.
- Configurable with `product` or `variant`: set `priceType` or `discountType`, not both.
- Configurable with `single_product`: only `discountType`.

`priceType`:

- `per_item`: the same price for each item. An item's `extraPrice` adds to its price.
- `total`: one price for the whole box.

`discountType`: `per_item` (a fixed amount off each item), `total` (a fixed amount off the box) or `percentage`.

## Layout and quantity

- `appearanceType`: `one_step` (all in one view), `two_step` (choose the box first, then the items) or `without_ruleset` (like `one_step`, and the item count sets the tier).
- `quantitySelectors`: for example `[1, 2, 3]`. The customer picks how many boxes. Configurable bundles only.

## Fields that go together on update

- When you send `discountType`, also send `priceType` (null if it does not apply).
- When you send `rulesetType`, also send `priceType` (null if it does not apply).
- Do not send `rulesets` in the same call as `rulesetType`.

## Changes that reset data

Tell the user before you make these changes:

- `priceType` from null to a value: Subbly creates a price of 0 for each tier and plan. Set the real prices after.
- `priceType` to null: all bundle prices are archived.
- `priceType` from one value to another: prices are archived and created again with defaults.
- `discountType`: the same pattern. Only a change between `percentage` and the other types archives and creates again.
- `rulesetType`: tiers reset to the defaults of the new type, and all bundle prices and discounts are archived.

Some changes are blocked while the bundle has active subscriptions: tier type, plan price or discount changes, and archiving.

## Items

- Each item points at one one-time variant. The variant must not be archived, must not be a gift card, and must not be in the bundle already.
- Item fields: `quantity`, `extraPrice`, `settings` and `position`.
- `settings` (a maximum quantity for each tier) is for configurable bundles with `product` or `variant` selection only.
- You cannot delete an item if the bundle then has fewer items than it needs.

## Tiers (box sizes)

A tier is a rule: it sets how many items the customer must pick. It does not pick items. Example: a "6-item box" tier means the customer adds 6 items.

- `quantity` tiers: `min` and `max` item count. `max: null` means no limit, on the last tier only. Tiers must not overlap.
- `total` tiers: start at `min: 0`, end with `max: null`, with no gaps.
- At least one active tier must stay.
- Responses show `minQuantity` and `maxQuantity`, or `minTotal` and `maxTotal`.

## Plans

- `type` is `one_time` or `subscription`. A bundle has at most one active one-time plan.
- `type`, `frequencyUnit` and `frequencyCount` do not change after creation.
- You cannot archive the last active plan, or a plan with active subscriptions.
- A subscription plan needs `frequencyUnit` and `frequencyCount`. A physical bundle also needs `shippings`, and a digital bundle must not have them. For billing types, cut-off and examples, read `subscription-schedules.md`.
- Optional subscription fields: `chargeImmediately`, `shipImmediately`, `bufferDays`, trial fields, `commitmentBillingCount`, `chargesLimit`, `surveyId`.

### Prices and discounts on a plan

The price mode sets what the plan takes:

- Fixed bundle, or configurable with `priceType`: `prices`, with `amount` in minor units.
- Configurable with `discountType` only: `discounts`, with `amountOff` in minor units or `percentOff` (0 to 100).
- Configurable with both null: neither.

It is a table. There is one row for each active tier (`rulesetId`). A fixed bundle has one default tier. Each row has `ranges`: the box count (`quantity`) at which the price starts.

- Ranges start at `quantity: 1`.
- Each quantity is used once in a row.
- All rows use the same quantities.

Example: two tiers, a lower price from 3 boxes.

```json
"prices": [
  { "rulesetId": 10, "ranges": [{ "quantity": 1, "amount": 1000 }, { "quantity": 3, "amount": 900 }] },
  { "rulesetId": 11, "ranges": [{ "quantity": 1, "amount": 800 }, { "quantity": 3, "amount": 700 }] }
]
```

Tier 10: 10.00 for each item for 1 or 2 boxes, 9.00 from 3 boxes. Tier 11: 8.00, then 7.00.

Example: a fixed bundle at 29.99.

```json
"prices": [{ "rulesetId": 5, "ranges": [{ "quantity": 1, "amount": 2999 }] }]
```

Example: 5% off, and 10% off from 3 boxes.

```json
"discounts": [{ "rulesetId": 10, "ranges": [{ "quantity": 1, "percentOff": 5 }, { "quantity": 3, "percentOff": 10 }] }]
```

Get the tier IDs from `get_bundle` before you build the table.
