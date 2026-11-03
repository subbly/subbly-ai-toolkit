---
name: subbly
description: "Start here for any Subbly task. Subbly is a subscription commerce platform for subscription boxes, memberships and one-time products. Use when the user mentions Subbly, their Subbly store, shop or admin, or asks about their products, bundles or boxes, plans, subscriptions, subscribers, customers, orders, invoices, coupons, inventory, surveys or webhooks. Also use when a developer builds a storefront with @subbly/react or the Subbly cart widget. Explains the store model, the words merchants use, money and safety rules, and which Subbly skill and tools to use."
---

# Subbly

Subbly runs subscription stores: subscription boxes, memberships, and one-time products. The `subbly` connector reads and changes the merchant's live store through the Subbly Private API. Each connector tool wraps one API call.

## Before you start

- **Connection.** The connector signs in with the merchant's Subbly account. If the tools are missing or a call returns `unauthorized`, ask the user to connect or reconnect Subbly in their app's connector settings. The connector is available on the Subbly X plan; point other merchants to https://support.subbly.co.
- **Live data.** Every change goes to the live store and real customers. There is no sandbox.
- **Read first.** Before a change, load the record with a `get_` or `list_` tool. Never guess IDs, field names or payload shapes; read the tool's input schema.

## Safety rules

1. Confirm every change with the user before you make it. Say what changes, on which record, in business words.
2. `archive_` and `delete_` tools cannot be undone. Get an explicit "yes" for each one. To hide a product, bundle or collection, use `unpublish_` instead; `publish_` brings it back.
3. Actions that move money or affect a subscriber need the same explicit "yes": customer balance changes, `cancel_`, `pause_`, `skip_`, plan switches, `ship_order`, invoice actions (`mark_invoice_as_paid`, `forgive_invoice`, `void_invoice`, `schedule_invoice_payment`).
4. For bulk work (many records), show the list of records and the change first, then run it in small batches and report each result.
5. Show customer personal data (emails, addresses, payment details) only when the task needs it.

## Money

All amounts are integers in minor units: `1999` means 19.99. Catalog prices (products, variants, plans, bundles) are in the shop's base currency, and the API takes no currency code for them. Invoices, orders, transactions and subscriptions have their own `currencyCode`; a store can sell in more than one currency, so never add amounts of different currencies. Show amounts to the user as normal prices, never as raw integers.

## Store model

| Area | What it is | Tools start with |
|---|---|---|
| Products | One-time products (with variants) and subscription products (with plans). The type is fixed at creation. Gift cards are one-time digital products. | `list_products`, `get_product`, `*_one_time_product`, `*_subscription_product`, `*_variant`, `*_plan` |
| Bundles | Products sold together: fixed boxes chosen by the merchant, or configurable boxes the customer builds. Bundles have items, plans and tiers. Only a bundle can offer one-time and subscription purchase together. | `*_bundle`, `*_bundle_item`, `*_bundle_plan`, `list_bundle_groups` |
| Collections | A named list of existing products, for grouping on the storefront. It sells nothing itself. | `*_collection`, `*_collection_items` |
| Metadata | Custom fields. A metafield is the definition; metadata is the values on a product, bundle or variant. | `*_metafield`, `set_*_metadata` |
| Subscriptions | A customer's recurring purchase: items, plan, address, payment method, discounts, pauses and skips. | `*_subscription`, `*_subscription_item*` |
| Customers | Shoppers, their addresses, notes, balance and saved payment methods. | `*_customer`, `*_address`, `*_customer_note`, `change_customer_balance`, `*_payment_method` |
| Orders | Shipments to fulfil. | `*_order`, `ship_order`, `batch_order_shipping_items` |
| Billing | Invoices and the transactions that pay them. | `*_invoice`, `*_transaction` |
| Coupons | Discount codes. | `*_coupon`, `apply_subscription_discount`, `remove_subscription_discount` |
| Inventory | Stock items and groups. | `*_inventory_item`, `*_inventory_group` |
| Funnels and surveys | Pre- and post-purchase offers, and subscriber surveys. | `*_funnel`, `*_survey` |
| Webhooks | Endpoints that receive store events, with their deliveries. | `*_webhook_*` |
| Reference data | Countries, tags, product options, cancellation reasons, pickup locations. | `list_countries`, `list_tags`, `list_options`, `list_cancellation_reasons`, `*_pickup_info` |

## Which skill to use

Read the skill for the task before you call a tool that changes data.

| Task | Skill |
|---|---|
| Products, gift cards, plans, variants, bundles and boxes, tiers, collections, custom fields, inventory | `subbly-catalog` |
| A subscriber's subscription: pause, skip, cancel, change plan, items, discounts, address, payment method; renewal and churn questions | `subbly-subscriptions` |
| Customers, addresses, store credit, payment methods, orders and shipping, invoices and failed payments | `subbly-customers-and-orders` |
| Coupons, promo codes and free gifts | `subbly-coupons` |
| Webhook endpoints, events and failed deliveries | `subbly-webhooks` |
| Reports and questions such as how many, how much, top, why: subscribers, churn, revenue, failed payments, orders to ship, funnels, surveys | `subbly-store-insights` |

Developer skills are for code that uses `@subbly/react` and `@subbly/api-client` (custom storefronts). Use them when the user writes or fixes storefront code, not to change the live store.

| Task | Skill |
|---|---|
| Set up the Storefront API client; API methods and responses | `subbly-storefront-api` |
| Product pages, plan and variant pickers, add-ons, gift cards | `subbly-storefront-products` |
| Bundle and build-a-box pages | `subbly-storefront-bundles` |
| Cart widget, add to cart, coupons, buy links, checkout | `subbly-cart-and-checkout` |
| Show or collect custom field values in the storefront | `subbly-storefront-metadata` |
| Subscription survey forms | `subbly-subscription-surveys` |
| Setup errors and fixes | `subbly-storefront-troubleshooting` |

For a quick look-up of one record, use the tools directly. For counts, totals and reports, use `subbly-store-insights`. Lists have pages of at most 100 records, and `pagination.total` gives the full count.

## Merchant words

Merchants use their own words. Map them to the Subbly concept, and use the merchant's words when you reply.

- **Bundle:** box, subscription box, kit, pack, crate, set.
- **Bundle items:** items, picks, meals, recipes, treats, samples, slots.
- **Tiers:** box sizes, small / medium / large, "6-item box".
- **Plan:** billing frequency, "every month", "3-month prepaid".
- **Gift card:** gift voucher, gift certificate, store credit.
- **Metadata:** custom fields, attributes, specs, personalization.

"Collection" is ambiguous. A merchant can mean a curated box (a bundle) or a product group (a Subbly collection). Ask when it is not clear.

## Talking to the user

Use business language. Say "ships on the 15th of each month", not `unitDay: 15`. Do not show JSON or field names unless the user asks for them.

## Reference

- Private API reference (fields and responses for every tool): https://docs.subbly.dev/api/private
- Developer docs: https://docs.subbly.dev
- Help center: https://support.subbly.co
