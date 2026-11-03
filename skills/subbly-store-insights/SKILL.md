---
name: subbly-store-insights
description: "Answer business questions about a Subbly store from live data, without changing anything: how many active subscribers, new signups, cancellations and why customers cancel, revenue and paid invoices for a period, failed payments, orders to ship this week, best-selling products and bundles, renewals coming up, coupon use, upsell funnels and survey questions. Use when the merchant asks how many, how much, which, top, trend, report, summary, or wants a dashboard-style overview of their store."
---

# Subbly store insights

Read the `subbly` skill first for the money format and merchant words.

This skill uses only `list_` and `get_` tools. They change nothing, so you do not need to ask before you call them. To act on a result (for example, retry a failed payment), use the skill for that task and follow its confirmation rules.

## Rules for every report

1. **Say what you counted.** Give the filters, the date range and the time zone. Dates in filters use `YYYY-MM-DDTHH:MM:SS` in UTC, with no time zone suffix. Tell the user that the range is in UTC.
2. **Count with one call when you can.** Each list returns `pagination` with `total`, `currentPage` and `lastPage`. For a plain count with filters, call the list once with `perPage: 1` and read `pagination.total`.
3. **Read all pages for breakdowns.** When you must look inside the records (group, sum, or filter on a field that has no filter), use `perPage: 100` and read pages until `currentPage` is `lastPage`. If you stop early, say how many pages you read and that the result is partial.
4. **Ask before a very large read.** If `lastPage` is large (for example, more than 20), tell the user the size and offer a narrower range first.
5. **Group money by currency.** Invoice, order and transaction amounts are in the record's own `currencyCode`, in minor units. A store can sell in more than one currency. Add amounts only inside one currency, and show one total for each currency. Do not convert between currencies.
6. **Leave out test data.** Orders have a `test` flag. Leave test orders out of totals, and say how many you left out.
7. **Show the result, not the data.** Give a short answer first, then a small table. Do not show raw JSON or long ID lists unless the user asks.
8. **Do not guess.** If no tool gives a number (for example, site visits or ad spend), say so.

## Common questions

| Question | How to answer |
|---|---|
| How many active subscribers? | `list_subscriptions` with `statuses: ["active", "trial"]`: `pagination.total` is the count. For a breakdown, read all pages and count separately the ones that are paused (`paused`), skipping (`skippingUntil`) or past due (`pastDue`). One customer can have many subscriptions; if the user asks for subscribers, count unique `customerId` values too. |
| New subscriptions in a period | `list_subscriptions` with a `createdAt` range. Group by product or plan from the items if the user asks. |
| Cancellations and why | `list_subscriptions` with `statuses: ["cancelled"]`. Use `cancelledAt` for the period. Each subscription's `cancellations` has the `reason` and the customer's `extraFeedback`. `list_cancellation_reasons` lists all reasons the shop offers. Show the count for each reason, and some comments without names. |
| Subscriptions set to cancel | Active subscriptions with `cancelAtPeriodEnd` or a pending cancellation. |
| Renewals in the next N days | No filter for the renewal date. Page through `active` and `trial` subscriptions and keep those with `nextPaymentDate` in the range. Leave out paused and skipping ones, and say so. |
| Revenue for a period | `list_invoices` with `statuses: ["paid"]` and a `createdAt` range a little wider than the period. Keep invoices with `paidAt` inside the period. Add `total` for each currency. Say that it is billed revenue before refunds, and that one-time checkout orders without an invoice can be missing; check orders for those if the user needs them. |
| Refunds | Orders have `refunded` and `refundedAmount`. The connector cannot see refunds in other places. |
| Failed or past-due payments | `list_invoices` with `statuses: ["past_due"]`. For the cause, `list_transactions` with the `invoiceId` and `status: "failed"`, and read `lastPaymentError`. Group by cause in plain words. |
| Orders to ship | `list_orders` with `statuses: ["awaiting_delivery"]` and a `dueDate` range. Count by product. Leave out archived orders (the default). |
| Best-selling products or bundles | `list_orders` with a `createdAt` range. Count order items by product, and give the top 10 by quantity and by `total` for each currency. Get product names with `list_products` or `list_bundles` by `ids`. |
| Subscribers of one product or plan | `list_subscriptions` with `planIds` or `bundleIds` (not both). Get the plan IDs from `get_product`. |
| One customer's history | `get_customer`, then `list_subscriptions`, `list_orders` and `list_invoices` with `customerId`. |
| Coupon use | `list_coupons` shows each coupon's settings. To count use in a period, read paid invoices for the period and count `discounts` entries with the coupon's `couponId`. Each subscription's `discounts` shows the coupons it has now. |
| Stock | `list_inventory_items`. See `references/inventory.md` in the `subbly-catalog` skill. |
| Webhook health | `get_webhook_stats`. See the `subbly-webhooks` skill. |

## Funnels and surveys

The connector can read these. It cannot change them. The merchant edits them in the Subbly admin.

- **Upsell funnels:** `list_funnels` (all funnels, with a name search) and `get_funnel` (one funnel and its steps). Use them to tell the merchant which offers customers see before, during or after checkout, and whether each funnel is published.
- **Surveys:** `list_surveys` and `get_survey` show the questions and answer choices. Subscribers' answers are in each subscription's `preferences`: for each question (`questionId`), the chosen `answers` with `content` and `quantity`. To count answers (for example, "how many chose decaf"), page through the subscriptions of the plans that use the survey, and match question and answer IDs to `get_survey`.

## Output example

> **Active subscriptions: 1,284** (1,201 customers). 46 are paused, 12 are skipping a renewal, 9 are past due.
>
> | Product | Active |
> |---|---|
> | Coffee Club, monthly | 812 |
> | Coffee Club, 3 months prepaid | 301 |
> | Tea Box | 171 |
>
> Subscriptions with status active or trial, read on 2 Nov 2026 (13 pages).
