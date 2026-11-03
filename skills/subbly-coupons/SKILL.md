---
name: subbly-coupons
description: "Create, change and retire Subbly coupons and discount codes: percent or amount off, first box free or discounted, free shipping, free gift products with an order, limits on who can use a code and how many times, expiry dates, codes for some products or collections only, and how long a discount lasts on a subscription. Use when the merchant mentions a coupon, promo code, discount code, voucher code, offer or free gift."
---

# Subbly coupons

Read the `subbly` skill first for the safety rules, money format and merchant words. To put a coupon on one existing subscription, use `apply_subscription_discount` (see the `subbly-subscriptions` skill).

A coupon has a code that customers type at checkout. It gives a **discount**, a **gift**, or both.

## Find coupons

`list_coupons` searches by name or code (`query`), IDs and `active`. Add `trashed: 1` to include archived coupons. Each coupon comes with its condition, discount, gift and rules.

## What to collect

1. **Name** (internal) and **code** (`couponCode`, what customers type).
2. **Discount** (`discount`): `percentOff` (0 to 100) or `amountOff` (minor units), not both. You **cannot change** the amount after creation. Confirm it.
   - `firstShipmentOnly: 1` discounts the first shipment only. Not with `amountOff`.
3. **Gift** (`gift`): products added to the cart, with their own `percentOff` or `amountOff` (`percentOff: 100` makes them free). The gift amount also cannot change later.
   - `addonDuration`: when the cart has a subscription, the gift ships `once` or with every shipment (`forever`).
   - `removeProductsAfterCouponDetached`: remove the gift when the coupon is removed.
4. **How long it lasts on a subscription** (`duration`): `once`, `forever`, or `multiple` with `durationInMonths`.
5. **Limits:** `maxRedemptions` (total uses), `limitOnePerCustomer`, `redeemBy` (expiry date, `YYYY-MM-DDTHH:MM:SS` in UTC, later than tomorrow).

A coupon needs a discount or a gift, or both.

## Where it applies

There are two different settings. Merchants often mix them up.

- **Condition** (`condition`): can the cart use the coupon at all?
  - `product` or `collection`: the cart has a listed product, or a product from a listed collection.
  - `cart_value` or `cart_quantity`: the cart value (minor units) or item count is between `min` and `max`. `operator` `any` counts all products, `only` counts the listed ones, `except` counts all but the listed ones.
  - Products in a condition are variant IDs.
- **Applies to** (`discount.appliesTo`): which cart lines get the discount after the condition passes.
  - `products` or `collections` with `only` or `except`, and `itemTypes` (for example `shipping`, `setup_fee`, `subscription`, `one_time`).
  - Each rule adds lines. Rules do not narrow each other. No rules means every line.
  - "These products only": send a product rule alone. To also discount shipping, add `itemTypes: ["shipping"]`.
  - "Free shipping": `percentOff: 100` with `itemTypes: ["shipping"]` only.
  - An `except` product or collection rule cannot go with another rule.

**Who can use it** (`rules`): customer emails, customer IDs, or customers with an active subscription to listed subscription products. With emails and customer IDs both set, a match on one of them is enough.

Conditions, applies-to rules, gifts and rules need a Subbly plan with coupon customization. If a call is refused for this reason, tell the merchant.

## Workflow

1. `list_coupons` with the code, to make sure the code is new.
2. Show the coupon in plain words and get a "yes". Example: "Code WELCOME20: 20% off the first box only, any product, one use per customer, ends 31 March."
3. `create_coupon`.
4. Give the code and the coupon ID.

## Change and retire

- `update_coupon` changes name, duration, limits, expiry, condition, `discount.appliesTo`, gift products and rules. It does not change discount or gift amounts. For a new amount, make a new coupon and archive the old one.
- Sending `appliesTo` replaces all its rules. Leave it out to keep them. `null` removes all.
- In `rules`, leave out a type to keep it unchanged.
- `archive_coupon`: customers can no longer use the code. It cannot be undone. Explicit "yes".
