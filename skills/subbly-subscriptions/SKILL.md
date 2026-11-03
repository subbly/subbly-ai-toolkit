---
name: subbly-subscriptions
description: "Find and manage Subbly subscriptions and subscribers: pause, skip a month, resume, cancel, undo a cancellation, reactivate, change plan or billing frequency, swap box contents or size, add or remove items and add-ons, change the next billing date, quantity, shipping address or payment method, apply or remove a discount, and create a subscription for a customer. Also renewal and churn questions, such as who renews this week or why someone cancelled. Use when the merchant talks about a subscriber, member, recurring order or renewal."
---

# Subbly subscriptions

Read the `subbly` skill first for the safety rules, money format and merchant words.

A subscription is a customer's recurring purchase. It has one or more **items**. A subscription item renews on a plan. A one-time item ships with the next renewal only. The subscription also has a shipping address and method, a payment method, discounts, and survey preferences.

## Find the subscription

- **By customer:** `list_customers` searches by customer ID or exact email only, not by name. If the user gives only a name, ask for the email. Then call `list_subscriptions` with `customerId`.
- **By product or plan:** `list_subscriptions` with `planIds` or `bundleIds` (not both).
- **By status:** `statuses` takes `active`, `trial`, `pre_order`, `gift_waiting_to_start`, `cancelled`, `switched` or `expired`.
- **By signup date:** `createdAt` range, in `YYYY-MM-DDTHH:MM:SS` format (UTC, no time zone suffix).
- Lists have pages of at most 100 (`perPage`). Read all pages before you give a total.

A subscription with status `active` can also be paused (`paused`), skipping (`skippingUntil`), past due (`pastDue`), or set to cancel at period end (`cancelAtPeriodEnd`). Check these flags, not the status only. When a customer has more than one subscription, show the list and ask which one.

### Renewal and churn questions

- **Renews in the next N days:** there is no filter for the renewal date. Page through `active` and `trial` subscriptions and keep those with `nextPaymentDate` in the range. Leave out paused and skipping ones, and say so.
- **Why customers cancel:** `list_cancellation_reasons` gives the reasons. Each cancelled subscription has its `cancellations` inline.
- For a large store, tell the user how many pages you read.

## Actions

Load the subscription with `get_subscription` before each change. Tell the user what changes and when it takes effect. Every action below needs a "yes". Cancel, plan switches, discounts and date changes that affect billing need an explicit "yes".

| The merchant wants to | Tool | Notes |
|---|---|---|
| Stop renewals for a while, no end date | `pause_subscription` | Not when it is already paused, skipping, past due or set to cancel at period end. |
| Skip renewals until a date | `skip_subscription` (`skipUntil`) | Not when it is paused, past due or already skipping. |
| End a pause or skip | `resume_subscription` (`nextPaymentDate`) | Ask for the next billing date. |
| Change the next billing date | `update_subscription` (`nextPaymentDate`) | The subscription must be active. |
| Cancel | `cancel_subscription` | See "Cancel". |
| Undo a cancellation that has not happened yet | `undo_subscription_cancellation` | |
| Restart a cancelled or expired subscription | `reactivate_subscription` (`renewalDate`) | Ask for the first renewal date. It bills on that date. |
| Change quantity, gift details, auto billing, tags | `update_subscription` | Only the fields you send change. |
| Add an item or add-on | `create_subscription_item` | `subscription` type: a plan on the same billing cycle. `one_time` type: a variant. Billed at the next renewal, not now. |
| Change an item's quantity or custom fields | `update_subscription_item` | Quantity of an item that a coupon added does not change. |
| Remove an item | `delete_subscription_item` | Not the last item. To remove the last item, cancel instead. |
| Change survey answers (preferences) | `update_subscription_item_preferences` | `updateOrders` also changes open orders. |
| Change a one-time item's variant (size, flavor) | `change_subscription_item_variant` | |
| Ship to another saved address or pickup point | `update_subscription_address` | Needs an address ID and a shipping method ID. To fix the text of the address, use `update_address`; that changes every subscription and order that uses it. |
| Bill another saved card | `update_subscription_payment_method` | The payment method must belong to the customer and support the currency. |
| Add a discount | `apply_subscription_discount` | See "Discounts". |
| Remove a discount | `remove_subscription_discount` | Use the discount ID from the subscription's `discounts`, not the coupon ID. |

### Change the plan or billing frequency

There are three tools. Pick by what must stay the same.

- `change_subscription_item_plan`: moves **one** item to another plan and keeps the same subscription ID. For a configurable bundle, send the new box contents. The billing cycle can change only when the subscription has one subscription item.
- `change_subscription_plans`: moves **many** items in one call and keeps the same ID. Use it to change the billing cycle of a subscription with many items, because all items must end on one cycle.
- `switch_subscription_plan`: **ends** this subscription with status `switched` and makes a **new** subscription with a new ID. Only the main item moves. Other subscription items are dropped. One-time items, discounts and tags carry over. Use the new ID after the switch.

With the first two tools, an item's preferences are cleared unless the new plan has the same survey. Bundle contents are cleared when the bundle changes. Tell the user before you do it.

### Cancel

1. Ask when: **now** (`immediate`, the default), at the **end of the billing period** (`end_of_period`), or at the **end of the commitment** (`end_of_commitment`). Never send the call without a type that the user chose.
2. Ask for the reason. Get the `reasonId` from `list_cancellation_reasons`. `extraFeedback` takes the customer's words.
3. If the customer did not choose to cancel (for example, the card failed again and again), set `involuntaryChurn`.
4. Offer the other choices first if the user is not sure: pause, skip, or a discount.

A scheduled cancellation can be undone with `undo_subscription_cancellation` until it takes effect.

### Discounts

`apply_subscription_discount` takes one of these:

- A coupon: `couponId`. Get it from `list_coupons` (see the `subbly-coupons` skill).
- A custom discount: `type: discount`, `percentOff` or `amountOff` (minor units), and `duration` (`once` or `forever`).

A subscription has at most one discount of each type. To change it, remove the current one first.

## Create a subscription

`create_subscription` starts an active subscription for a customer. Use it for phone orders or migrations.

1. Get the customer with `get_customer` and expand the payment methods and addresses.
2. Collect: `currencyCode`, `paymentMethodId` (the customer's, and it must support the currency), `items` (each with a `planId` or a one-time `variantId`, and a quantity).
3. Physical products: `shippingAddressId` and `shippingMethodId`.
4. Optional: `startsAt` (when billing starts; without it, billing starts at the next renewal run), `discounts`, `gift`, `metadata`.
5. The call charges nothing now. Coupons and gift cards in `discounts` are used at once.

## After a change

Give the user the result in business words. Example: "Jane's coffee subscription is paused. It does not renew until you resume it." Include the new next billing date when it changed.
