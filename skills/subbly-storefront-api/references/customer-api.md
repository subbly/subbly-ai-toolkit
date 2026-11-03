# Customer methods

Sign-in and registration, the customer profile, subscriptions, addresses, and the raw-client methods for a customer account area.

Every method on this page, except `auth.*`, needs the customer access token. Notation: `?` marks an optional field.

## Access token

`auth.login`, `auth.register`, `auth.otpLogin` and `auth.social` return `AuthResourceLoginResponse`: `{ accessToken, expiresIn }`. The client does not keep the token. Apply it yourself:

```ts
import { subblyApi } from '@subbly/react'

const { accessToken } = await subblyApi.auth.login({ email, password })

// Browser: every later call on the shared client sends the token.
subblyApi.client.setAuth(accessToken)
```

- In the browser, also save the token in the `subbly_access_token` cookie (path `/`). The cart widget reads this cookie, so the customer is signed in there too.
- To sign out, call `subblyApi.client.setAuth('')` and clear the cookie. There is no sign-out endpoint.
- On the server, do not call `setAuth`. The client is shared by all requests. Pass the header on each call instead: `subblyApi.customers.me({ Authorization: 'Bearer ' + accessToken })`. The `auth.*` wrappers on `subblyApi` take no `headers` argument. They do not need one.
- An expired or missing token gives `code: 'unauthenticated'`.

## Auth

| Method | Payload | Returns |
|---|---|---|
| `auth.registered(payload)` | `{ email }` | `{ registered: boolean }`. Use it to pick sign-in or registration. |
| `auth.login(payload)` | `{ email, password }` | `AuthResourceLoginResponse` |
| `auth.register(payload)` | `{ email, firstName, lastName, password? }` | `AuthResourceLoginResponse`. `password` is optional when the shop allows registration without a password (`shop.config.checkout.registerWithoutPassword`). An existing email gives `user_email_is_not_unique`. |
| `auth.otp(payload)` | `{ email }` | `void`. Subbly emails a one-time code. |
| `auth.otpLogin(payload)` | `{ email, token }` | `AuthResourceLoginResponse`. `token` is the code from the email. |
| `auth.social(payload)` | `{ token, provider }` | `AuthResourceLoginResponse`. `provider` is `'google'` or `'facebook'`. `token` is the token from the provider SDK. Read the app IDs from `shop.apps` (`google_login`, `facebook_login`). |

After sign-in during checkout, call `cart.attachCustomer(cartId)` to attach the customer to the cart.

## Customers

### `customers.me(headers?)` returns `SubblyCustomer`

### `customers.update(payload, headers?)` returns `SubblyCustomer`

A partial update. Send only the fields you change.

| Payload field | Type | Notes |
|---|---|---|
| `firstName?` | string | Maximum 50 characters. |
| `lastName?` | string | Maximum 50 characters. |
| `externalId?` | string or null | Your own ID for the customer. |
| `marketingConsent?` | boolean | One-way. Not allowed when the customer already gave consent, so the customer cannot withdraw it here. Do not show it as a toggle. |
| `tosConsent?` | boolean | One-way. Not allowed when `tosConsentAt` is set. |

There is no email change on the Storefront API.

### `customers.referral(headers?)` returns `{ referralLink: string | null }`

`referralLink` is `null` when the shop turns off referrals. Then hide the referral section.

## Subscriptions

Default expand for `list` and `load`: `discounts.coupon`, `product.parent.bundle.plans.pricing`, `bundle.items.product.parent`, `metadata`, `addons`, `cancellations`. `update` uses the same list without `cancellations`.

Other expand paths: `product`, `product.parent`, `items.product`, `items.product.parent`, `items.bundle.items.product`, `discounts`, `customer`, `shipping_address`, `shipping_method`, `billing_address`, `payment_method`. The API ignores an unknown path without an error, so check the spelling.

### `subscriptions.list(params, headers?)` returns `SubscriptionsListResponse`

| Param | Type | Notes |
|---|---|---|
| `page?` | number | From 1. |
| `perPage?` | number | 1 to 100. |
| `statuses?` | string[] | `active`, `trial`, `pre_order`, `gift_waiting_to_start`, `cancelled`, `switched`, `expired`. |
| `expand?` | string[] | Replaces the default list. |

### `subscriptions.load(subscriptionId, params?, headers?)` returns `Subscription`

### `subscriptions.update(subscriptionId, payload, params?, headers?)` returns `Subscription`

| Payload field | Type | Notes |
|---|---|---|
| `quantity` | number | Required in the type. 1 or more. Maximum 1 when the shop turns off the subscription quantity selector. |
| `metadata?` | `MetadataObject[]` or null | Same shape as cart item metadata. |

### `subscriptions.updatePreferences(subscriptionId, payload, headers?)` returns `Subscription`

Changes the survey answers.

| Payload field | Type | Notes |
|---|---|---|
| `preferences` | `SubscriptionSurveyOption[]` or null | Required. Validated against the active survey of the product. |
| `updateOrders?` | boolean | Also update the pending orders. |

### `subscriptions.updateBundle(subscriptionId, payload, headers?)` returns `Subscription`

Changes the bundle plan or the picked bundle items.

| Payload field | Type | Notes |
|---|---|---|
| `productId` | number or null | Bundle plan ID. Must be a published subscription plan. |
| `quantity?` | number | 1 or more. |
| `bundle?` | `{ items, preferences }` | Required by the API. `items`: `{ productId, quantity }[]` or null. `preferences`: `{ attributeId, values: number[] }[]` or null. |

## Addresses

| Method | Payload | Returns |
|---|---|---|
| `addresses.list(headers?)` | none | `CustomerAddress[]` |
| `addresses.store(payload, headers?)` | `AddressStorePayload` | `CustomerAddress` |

`AddressStorePayload`: `firstName`, `lastName` (maximum 50 each), `addressOne`, `addressTwo` (string or null), `city`, `zip` (3 to 16 characters), `countryId`, `phone?`, `companyName?`, `region?`, `regionId?`. The phone and region rules are the same as for a cart address (see `cart-and-checkout-api.md`). Get `countryId` and the regions from `shop.shippingCountries` or `countries.list()`.

## Raw-client methods

`subblyApi` does not wrap these methods. Call them on `subblyApi.client`. They send no default expand.

### Subscription actions

Each `Subscription` has `actions`: one `{ allowed: boolean }` for each action (`cancel`, `setToCancel`, `undoCancellation`, `undoSetToCancel`, `cancellationRequest`, `undoCancellationRequest`, `pause`, `resume`, `skip`, `prolongSkipping`, `reactivate`, `updateAddress`, `updatePaymentMethod`, `addOneTimeItem`, `addSubscriptionItem`). Show a button only when the action is allowed. A refused call rejects with a coded 400, or with 404 when the subscription does not belong to the customer.

| Method on `client.subscriptions` | Payload | Notes |
|---|---|---|
| `cancel(id, payload?)` | `{ type?: 'end_of_period', reasonId?, extraFeedback? }` | Without `type`, cancels now, or at the end of the commitment for a committed subscription. |
| `undoCancellation(id)` | none | Reverses an `end_of_period` cancellation. |
| `undoSetToCancel(id)` | none | Reverses an end-of-commitment cancellation. |
| `requestCancellation(id)`, `undoCancellationRequest(id)` | none | For shops that review cancellations. |
| `pause(id)` | none | Pauses with no end date. |
| `resume(id, payload?)` | `{ nextPaymentDate? }` | Ends a pause or a skip. Pick the date from `resumeDates(id)`. |
| `skip(id, payload)` | `{ skipUntil }` | Pick the date from `skippingDates(id)`. |
| `prolongSkipping(id, payload)` | `{ skipUntil }` | One time per skip. |
| `reactivate(id, payload?)` | `{ renewalDate? }` | Restarts a `cancelled` or `expired` subscription. |
| `updateAddress(id, payload)` | `{ shippingAddressId?, shippingMethodId?, shippingCarrierId?, shippingCarrierService?, updateOrdersAddress?: 1 or 0 }` | Changes address and shipping together. |
| `updatePaymentMethod(id, payload)` | `{ paymentMethodId, currencyCode }` | Uses another saved payment method. |
| `billingDates(id)`, `skippingDates(id)`, `resumeDates(id)` | none | Return `{ availableDates, range: { min, max } }`. |
| `getShippingMethods(id, params?)`, `getLocalPickups(id, params?)` | `{ addressId?, expand? }` | Shipping options for the subscription. |
| `storeItem`, `loadItem`, `updateItem`, `destroyItem`, `updateItemBundle`, `updateItemPreferences` | see the types | Items of a multi-item subscription. `destroyItem` returns the subscription and fails for the last item. |

Action responses do not include expands. Load the subscription again after an action. The API allows one action at a time for each subscription, so do not send actions in parallel.

### Orders, invoices, cancellation reasons

| Method | Params | Returns |
|---|---|---|
| `client.orders.list(params?)` | `page`, `perPage`, `expand` and filters (see `OrdersListParams`) | `{ data: Order[], pagination }` |
| `client.orders.load(orderId, params?)` | `expand` | `Order` |
| `client.invoices.list(params?)` | `page`, `perPage`, `statuses`, `subscriptionId`, `createdAt: { gte?, lte? }`, `startDate`, `endDate`, `expand` | `{ data: Invoice[], pagination }` |
| `client.invoices.load(invoiceId, params?)` | `expand` | `Invoice` |
| `client.cancellations.reasons(params?)` | `page`, `perPage` | `{ data: CancellationReason[], pagination }` |

### Addresses, wallet and pickup info

| Method | Notes |
|---|---|
| `client.addresses.update(addressId, payload)` | Replaces the address. Send the full `AddressStorePayload`. |
| `client.addresses.delete(addressId)` | Deletes a saved address. |
| `client.wallet.setDefault(paymentMethodId)` | Sets the default method. It does not change existing subscriptions: use `subscriptions.updatePaymentMethod` for them. |
| `client.wallet.delete(paymentMethodId)` | Refused with 403 for the last method of a customer with active subscriptions. Handle the rejection. |
| `client.pickupInfo.update(id, payload)`, `client.pickupInfo.delete(id)` | See `cart-and-checkout-api.md`. |
