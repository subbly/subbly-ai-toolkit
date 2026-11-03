---
name: subbly-catalog
description: "Create and change what a Subbly store sells: one-time products, gift cards, subscription products, variants, plans, prices, fixed and build-your-own bundles (subscription boxes, kits, curated or customer-picked boxes), box sizes and tiers, collections, custom fields (metafields and metadata), inventory and stock. Use when the merchant wants to add, edit, price, publish, hide or retire a product, box, plan or collection, or asks which product type fits their offer."
---

# Subbly catalog

Read the `subbly` skill first for the safety rules, money format and merchant words.

This skill helps you pick the correct product type, collect the facts you need, and call the catalog tools in the correct order. Field limits and payload shapes are in each tool's input schema. Read the schema before each call. Do not guess.

## Product types

There are two product types. You set the type when you create the product. You cannot change it later.

- **One-time product** (`create_one_time_product`): one purchase. Prices are on **variants**. A one-time product needs at least one variant to sell, even when there is only one option. Use a "default" variant with a price and no option names. A variant has up to 3 options (for example Size: Small, Color: Blue). When all variants are archived, Subbly creates a default variant with no options, so a published product stays buyable.
- **Gift card**: a one-time digital product with `giftCard.enabled: 1`. Each variant is one voucher value (for example 25.00, 50.00, 100.00). The variant price is the voucher amount. `giftCard.expiration` is 1 to 36 months. Without it, the voucher does not expire.
- **Subscription product** (`create_subscription_product`): recurring billing. Prices are on **plans** (`create_plan`). Each plan has a billing frequency (`frequencyUnit` day, week or month, and `frequencyCount`) and a price for each cycle. A subscription product needs at least one plan.

Physical or digital (`digital: 0` or `1`) is also fixed at creation. Physical products collect a shipping address. A digital subscription is a membership: it has no shipping schedule, and billing starts from the signup date.

## Bundles

A bundle sells many items together (`create_bundle`). Only a bundle can offer one-time and subscription purchase of the same offer.

- **Fixed bundle** (`configurable: 0`): the merchant picks the contents. The customer cannot pick items. Price is one total price.
- **Configurable bundle** (`configurable: 1`): the customer builds the box. It can have tiers (box sizes), preferences, filters, and price or discount rules. `selectionType` sets how the customer picks:
  - `product`: pick variants, grouped by product. This is the most common setup.
  - `variant`: pick from a flat list of variants.
  - `single_product`: pick one variant from each product in a fixed set. Example: a toothbrush (red or yellow) and a toothpaste (mint or cola). It can also wrap one product that has up to 3 option groups.

Read `references/bundles.md` before you create or change a bundle.

## Choose the type

If the merchant says gift card, gift voucher, gift certificate or store credit, it is a **gift card**. Read `references/products.md`.

Otherwise, ask about these signals in business words. Do not apply the table until you know them.

1. **Billing:** does the customer pay once, on a schedule, or can they choose?
2. **Curation:** who decides the contents? The merchant (one item, or many items), the customer picks from a fixed set, or the customer builds the box.
3. **Options:** only for "merchant, one item". Does the customer pick options such as size or flavor? If yes, and the result is a single product bundle, ask: are the options parts of the same item (one product with up to 3 option groups), or separate items (one product for each item)?

| Billing | Curation | Options | Result |
|---|---|---|---|
| one-time | merchant, one item | any | One-time product |
| one-time | merchant, many items | - | Fixed bundle |
| one-time | customer picks from a fixed set | - | Single product bundle |
| one-time | customer builds the box | - | Configurable bundle |
| subscription | merchant, one item | no | Subscription product |
| subscription | merchant, one item | yes | Single product bundle |
| subscription | merchant, many items | - | Fixed bundle |
| subscription | customer picks from a fixed set | - | Single product bundle |
| subscription | customer builds the box | - | Configurable bundle |
| both | merchant, one item | - | Single product bundle |
| both | merchant, many items | - | Fixed bundle |
| both | customer picks from a fixed set | - | Single product bundle |
| both | customer builds the box | - | Configurable bundle |

"Both" is always a bundle, because a product has one fixed type. Options change the result in one case only: a subscription for one item with options becomes a single product bundle, because the bundle lets the customer pick a variant.

## Workflow

1. **Read the store.** Use `list_products`, `list_bundles` or `list_collections` to find what exists. Do not make a duplicate. Use `list_metafields`, `list_options` and `list_tags` to reuse existing names.
2. **Collect the facts.** Use the "What to collect" list in the reference for the type.
3. **Show the plan.** Before the first write, show the user a short summary in business words: name, type, prices as normal amounts, billing and shipping schedule. Get a "yes".
4. **Create in order.** Products and bundles start unpublished (drafts).
   - One-time product: product, then variants (`create_variant` or `batch_variants`).
   - Subscription product: product, then plans (`create_plan`).
   - Bundle: bundle, then items (`batch_bundle_items`), then tiers and price settings (`update_bundle`), then plans (`create_bundle_plan`).
5. **Publish only when the user asks.** `publish_*` makes it visible and buyable. Publishing a bundle also publishes all its plans that are not archived.
6. **Report.** Give the names and IDs you created and what is still a draft.

## Change, hide, retire

- Load the record first with `get_product`, `get_bundle`, `get_variant`, `get_plan` or `get_collection`. Change only the fields the user asked for.
- **Hide:** `unpublish_*` hides a product, bundle or collection. `publish_*` shows it again. This is the safe choice.
- **Retire:** `archive_*` cannot be undone. There is no unarchive. Get an explicit "yes" for each record. Archiving a bundle is blocked while it has active subscriptions. `batch_variants` can archive variants: confirm each ID in its `archive` list.
- `set_*_metadata` replaces the custom field values on the record. Read the current values first and send the full list.
- `id` on `update_variant`, `archive_variant`, `update_plan` and `archive_plan` is the variant or plan ID, not the product ID.

## Prices

All prices are integers in the shop's base currency, in minor units: `2000` is 20.00. Confirm each amount with the user, because `20` and `2000` are easy to mix up. If a brief shows another currency, keep the amounts, use the shop's base currency, and tell the user in one line. Exchange rates and extra currencies are merchant settings in Subbly Admin.

## Plan switching

`changeProductCollectionId` on a subscription product or a bundle lets subscribers switch to any product in that collection. You can set it on update only. The collection must not be archived, and its type must be `subscription` or not set. A configurable bundle is never a valid switch target.

## References

Read the reference before you create or change that kind of record. Paths are relative to this skill.

| Topic | Reference |
|---|---|
| One-time products, gift cards, subscription products, variants, plans | `references/products.md` |
| Fixed, configurable and single product bundles: items, tiers, prices, plans | `references/bundles.md` |
| Billing and shipping schedules for physical subscription plans | `references/subscription-schedules.md` |
| Collections and custom fields (metafields and metadata) | `references/collections-and-metadata.md` |
| Inventory items, groups and stock | `references/inventory.md` |
