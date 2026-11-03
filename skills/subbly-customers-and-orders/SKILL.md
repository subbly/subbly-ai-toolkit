---
name: subbly-customers-and-orders
description: "Look up and manage Subbly customers, orders and billing: find a customer, edit their details, tags, consent, notes, saved addresses, pickup contacts and payment methods, give or remove store credit, erase a customer (GDPR); find, ship, cancel, reschedule or archive orders and change their shipping items; check invoices, failed payments and charges, retry a payment, mark an invoice as paid, void or forgive it. Use when the merchant asks about a shopper, a shipment, fulfillment, a failed or past-due payment, a refund question or a charge."
---

# Subbly customers, orders and billing

Read the `subbly` skill first for the safety rules, money format and merchant words. For a customer's subscriptions, use the `subbly-subscriptions` skill.

Show personal data (email, address, phone, payment details) only when the task needs it. Do not put it in summaries the user did not ask for.

## Customers

### Find a customer

- `list_customers` filters by customer `ids` or exact `emails` (up to 100 each). There is no name search. If the user gives only a name, ask for the email, or find the customer through an order or subscription.
- `get_customer` returns the customer with metadata, payment methods and subscriptions. Use `expand` for addresses and notes.

### Change a customer

| The merchant wants to | Tool | Notes |
|---|---|---|
| Add a customer | `create_customer` | Email and name. The email must be new in this shop. |
| Change tags, default payment method or custom fields | `update_customer` | Only the fields you send change. `metadata` replaces all custom field values: send the full list. |
| Record marketing or terms consent | `update_customer` | Consent can be given, not taken back, through the API. |
| Add, edit or delete a note | `create_customer_note`, `update_customer_note`, `delete_customer_note` | Notes are internal. |
| Give or remove store credit | `change_customer_balance` | `amount` in minor units. Positive adds credit, negative removes it. A debit cannot be more than the balance. Each call adds to the balance again, so call it once. Explicit "yes". |
| Erase a customer (GDPR) | `delete_customer` | Permanent. The shop must have GDPR turned on. Explicit "yes", and repeat the customer's email in the question. |

### Addresses and pickup contacts

- `create_address` saves a delivery address for a customer. Read the current addresses with `get_customer` and expand addresses. Get `countryId` from `list_countries`.
- `update_address` changes the text of an address. Send every field. Every subscription and order that uses the address gets the change. To move one subscription to another address, use `update_subscription_address`.
- `delete_address` is possible only when no active subscription or open shipment uses it.
- Pickup contacts: `list_pickup_info` (needs `customerId`), `create_pickup_info`, `update_pickup_info`, `delete_pickup_info`. The pickup point of a contact does not change after creation.

### Payment methods

- `get_payment_method` shows the type (card, PayPal, SEPA and others) and its details. Show the brand and last 4 digits only.
- `delete_payment_method` removes it at the payment gateway too. The customer can add a new one at checkout or in the customer portal. Explicit "yes". Check first that no active subscription bills this payment method; if one does, move it with `update_subscription_payment_method`.

## Orders

An order is a shipment to fulfil. A subscription makes an order for each shipment.

### Find orders

`list_orders` filters by customer, subscription, product, `statuses`, `fulfillmentStatuses`, tag IDs, `archived`, and `createdAt` or `dueDate` ranges (`YYYY-MM-DDTHH:MM:SS`, UTC). Pages hold at most 100.

Order statuses:

| Status | Meaning |
|---|---|
| `awaiting_delivery` | Ready to ship. |
| `future_shipment` | Planned for a later due date. |
| `shipped` | Sent. |
| `cancelled` | Cancelled. |
| `payment_failed` | The charge for it failed. |
| `returned`, `dispute` | Returned, or in a payment dispute. |

Fulfillment status is `unfulfilled`, `partially_fulfilled` or `fulfilled`.

### Change orders

| The merchant wants to | Tool | Notes |
|---|---|---|
| Change due date, gift details, tags, custom fields | `update_order` | `metadata` replaces all values. |
| Mark as shipped | `ship_order` | From `awaiting_delivery` or `future_shipment`. Sends the customer the "order shipped" email. Call it once for each order. |
| Ship later | `mark_order_as_future_shipment` (`dueDate`) | From `awaiting_delivery`. Removes the shipping items and returns them to stock. |
| Move back to ready to ship | `mark_order_as_pending` | From `shipped` or `future_shipment`. From `future_shipment`, Subbly makes the shipping items again from the product and survey setup, so manual changes are lost. |
| Change what goes in the box | `batch_order_shipping_items` | Adds, changes and removes shipping items in one call and updates stock. Not for shipped orders. |
| Cancel | `cancel_order` | Not for shipped or cancelled orders. Returns items to stock and sends the "order cancelled" email. It does not refund. Explicit "yes". |
| Hide from the order list | `archive_order` | Cannot be undone. Explicit "yes". |

`ship_order` and `cancel_order` send emails to the customer. Say so in the question to the user.

For bulk shipping, show the list of orders first. Then ship in small batches and report each result.

## Billing: invoices and transactions

An invoice is a bill. A transaction is one attempt to charge it.

Invoice statuses: `pending`, `open`, `processing`, `paid`, `past_due` (a charge failed), `voided`.

- `list_invoices` filters by customer, subscription, `statuses` and `createdAt`. It sorts by `id` or `created_at`.
- `get_invoice` shows items, discounts, addresses, shipping method and payment method.
- `list_transactions` and `get_transaction` show charges with status `success` or `failed`. A failed charge has the last payment error. Use it to explain why a payment failed.

### Invoice actions

All of these are for `open` or `past_due` invoices. Each one needs an explicit "yes".

| The merchant wants to | Tool | Effect |
|---|---|---|
| Try the charge again at a time | `schedule_invoice_payment` (`nextAttemptAt`) | Sets the next payment attempt. The card is charged then. |
| Record a payment made outside Subbly | `mark_invoice_as_paid` | Marks it paid without a charge, and updates the subscription's payment state. |
| Cancel the invoice | `void_invoice` | Status `voided`. Stops the pending payment attempt. The subscription does not change. |
| Write off the debt | `forgive_invoice` | Voids the invoice and clears the subscription's past-due state. The invoice must belong to a subscription. |

The connector cannot make refunds. For a refund, send the merchant to the Subbly admin.

### Failed payment checklist

1. `list_invoices` with `statuses: ["past_due"]`, or for one customer.
2. `list_transactions` for the invoice. Read the last payment error.
3. Tell the merchant the cause in plain words (for example, "card expired", "insufficient funds").
4. Suggest the next step: ask the customer to update their card in the customer portal, then `schedule_invoice_payment`. Or `mark_invoice_as_paid` if they paid in another way.
