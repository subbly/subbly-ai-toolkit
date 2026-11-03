# Products, variants and plans

The facts to collect and the rules for one-time products, gift cards and subscription products. `SKILL.md` explains the types.

## What to collect

### For all products

- **Name:** the storefront name. At most 255 characters.
- **Slug:** the URL name. Letters, numbers, hyphens and underscores. At most 80 characters. It must be unique in the store. Suggest one from the name.
- **Physical or digital:** `digital: 0` collects a shipping address, `digital: 1` does not. You cannot change it later. Gift cards are always digital.
- **Optional:** description (HTML or plain text), up to 5 image URLs, tags.

### One-time product

- At least one variant with a price in minor units.
- Variant options: up to 3 name and value pairs for each variant.
- Gifting: can a customer buy it for another person?

### Gift card

- `giftCard.enabled: 1`.
- Denominations: one variant for each voucher value. At least one.
- Expiration: 1 to 36 months, or no expiration.

### Subscription product

For each plan:

- **Billing frequency:** `frequencyUnit` (day, week, month) and `frequencyCount`. Example: every 3 months is `month` and `3`. You cannot change these after creation.
- **Price** for each billing cycle, in minor units.
- **Physical plans only:** the shipping schedule (`shipmentSchedule`, required) and the billing type. Read `subscription-schedules.md`.
- **Optional:**
  - `setupFee`: a one-time fee on the first order.
  - `trialPrice` and `trialLengthDays`: not available with synchronized (anchored) billing.
  - `commitmentBillingCount`: the minimum number of billing cycles before the subscriber can cancel.
  - `chargesLimit`: the maximum number of billing cycles. After that, the subscription expires.
  - `pauseEnabled`: on by default. Ask only if the merchant wants to turn pausing off.
  - `surveyId`: a survey for subscriber preferences (`list_surveys`).

A digital subscription plan cannot use `shipmentSchedule`, `anchorDate`, the `rebillingDay*` fields, `cutOffDays`, `cutOffTime`, `chargeImmediately` or `trialSingleOrder`.

## Variants

- `create_variant` adds one variant. `batch_variants` creates, updates and archives many variants of one product in one call.
- `update_variant` changes one variant. Its `id` is the variant ID.
- `archive_variant` cannot be undone. When the last variant is archived, Subbly makes a default variant with no options.

## Plans

- `create_plan` adds a plan to a subscription product.
- `update_plan` changes price, schedule and trial settings. `frequencyUnit` and `frequencyCount` do not change.
- `archive_plan` cannot be undone. The plan is no longer sold. Before you archive, use `list_subscriptions` with `planIds` to show the user how many subscriptions use the plan.

## Rules when you create

- Products start as drafts. Publish only when the user asks.
- A slug that is already used makes the call fail. Suggest another slug.
- Do not send a field that the tool schema does not list.
