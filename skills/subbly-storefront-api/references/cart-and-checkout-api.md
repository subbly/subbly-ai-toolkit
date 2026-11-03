# Cart and checkout methods

Cart, checkout, funnels (upsell offers), payment intents (3-D Secure), wallet (saved payment methods) and pickup info.

Use these methods for a **headless** cart or checkout, where your code owns the cart. When the site uses the Subbly cart widget, change the cart through the widget (`useSubblyCart`, see the `subbly-cart-and-checkout` skill). The widget keeps its own copy of the cart, so a direct `cart.*` call does not show in the widget.

Notation: `?` marks an optional field. Every method accepts `headers` as the last argument.

## Cart

Cart methods return the full `SubblyCart`. The default expand for `create`, `load`, `update`, `addItem`, `updateItem`, `removeItem` and `attachCustomer` is:

`coupon`, `gift_card`, `items.product`, `items.product.parent`, `items.product.parent.pricings`, `items.product.parent.bundle`, `items.bundle.items.product`, `items.bundle.items.product.parent`, `items.metadata`, `shipping_method`, `shipping_address`, `payment_method`, `billing_address`, `metadata`.

You can also expand `shipping_carrier`. If you pass `expand`, it replaces this list.

Keep the cart ID in the `subbly_cart_id` cookie. The cart widget and the `@subbly/react` hooks read the same cookie, so all of them use one cart.

### `cart.create(payload?, params?, headers?)` returns `SubblyCart`

| Payload field | Type | Notes |
|---|---|---|
| `currencyCode?` | string | A currency that the shop has turned on. |
| `couponCode?` | string or null | Not allowed when the shop turns off coupons. |
| `giftCardCode?` | string or null | UUID. Not allowed when the shop turns off gift cards. |
| `referralId?` | number or null | Referral program ID. |

### `cart.load(cartId, params?, headers?)` returns `SubblyCart`

A cart with `status: 'completed'` or `status: 'expired'` is spent. Create a new cart in that case, and write the new ID to the cookie.

### `cart.addItem(cartId, payload, params?, headers?)` returns `SubblyCart`

| Payload field | Type | Notes |
|---|---|---|
| `productId` | number | Required. A **child** product ID: a plan ID or a variant ID. For a bundle, the bundle plan ID. Must be published. |
| `quantity?` | number | 1 or more. Maximum 1 for a subscription when the shop turns off the subscription quantity selector. |
| `options?` | `SubscriptionSurveyOption[]` or null | Survey answers for a subscription. See below. |
| `bundle?` | `{ items, preferences }` | Only for a configurable bundle. Send both keys. `items`: `{ productId, quantity }[]`. `preferences`: `{ attributeId, values: number[] }[]`. |
| `addon?` | boolean | Add a one-time product to the subscription in the cart. Allowed only when the cart has a subscription. Not for gift cards. |
| `addonDuration?` | `1` or null | `1`: first shipment only. `null`: every shipment. |
| `giftCard?` | `{ customerEmail, customerName, message }` or null | Only for a gift card product. `customerEmail` and `customerName` go together. `customerName` maximum 50 characters, `message` maximum 255. |
| `metadata?` | `MetadataObject[]` or null | Item metadata. See below. |

`SubscriptionSurveyOption` is `{ questionId: number, answers: [...] }`. Each answer is `{ id }` (select, multiple, plan), `{ id, quantity }` (quantity) or `{ content }` (text, email). See the `subbly-subscription-surveys` skill.

`MetadataObject` is `{ id: metafieldId, values: [...] }`. Each value is `{ id: presetValueId }` when the metafield has `preset: true`, or `{ value: 'text' }` when it does not. Do not send both. See the `subbly-storefront-metadata` skill.

### `cart.updateItem(cartId, cartItemId, payload, params?, headers?)` returns `SubblyCart`

Same fields as `addItem`, but without `productId` and `metadata`. `cartItemId` is the string `CartItem.id`.

### `cart.removeItem(cartId, cartItemId, params?, headers?)` returns `SubblyCart`

### `cart.update(cartId, payload, params?, headers?)` returns `SubblyCart`

Changes the cart details. Send only the fields you change. Send `null` to remove a coupon, gift card, gift info or other nullable value.

| Payload field | Type | Notes |
|---|---|---|
| `customer?` | object or null | Guest data: `email`, `firstName`, `lastName` (maximum 50 each), `marketingConsent`, `tosConsent`, `externalId`. Not allowed when a customer is attached. |
| `shippingAddress?` | `AddressStorePayload` or null | Inline address. Necessary when an item has `collectShippingAddress: true` and you do not send `shippingAddressId`. |
| `billingAddress?` | `AddressStorePayload` or null | Not allowed together with `billingAddressId`. |
| `shippingAddressId?` | number or null | Saved address of the signed-in customer. |
| `billingAddressId?` | number or null | Saved address of the signed-in customer. |
| `pickupInfo?` | `PickupInfoStorePayload` or null | Pickup contact and point. |
| `shippingMethodId?` | number or null | From `getShippingMethods` or `getLocalPickups`. |
| `shippingCarrierId?` | string or null | Required for a dynamic shipping method. Not allowed for other methods. |
| `shippingCarrierService?` | string or null | Required for a dynamic shipping method. Not allowed for other methods. |
| `paymentMethodId?` | number or null | Saved payment method. Needs a signed-in customer. Must support the cart currency. |
| `currencyCode?` | string | ISO 4217 code that the shop has turned on. |
| `couponCode?` | string or null | Validated against the coupon rules. `null` removes it. |
| `giftCardCode?` | string or null | UUID. `null` removes it. |
| `giftInfo?` | object or null | Gift a subscription: `startsAt` (required, `YYYY-MM-DD`), `numberOfOrders?`, `message?` (maximum 255), `recipientEmail?` (required when the shop collects the recipient email). |
| `startsAt?` | string or null | Subscription start date. Pick it from `getStartDates`. |
| `referralId?` | number or null | Referral ID. |
| `onboardingTemplateId?` | number or null | An active subscription box survey ID. |
| `metadata?` | `MetadataObject[]` or null | Cart-level metadata. |
| `attribution?` | object or null | Key-value pairs (string, number or null). |

`AddressStorePayload` fields: `firstName`, `lastName` (maximum 50 each), `addressOne`, `addressTwo` (string or null), `city`, `zip` (3 to 16 characters), `countryId`, `phone?`, `companyName?`, `region?`, `regionId?`.

- `phone` is required unless the shop sets the phone number as optional (`shop.config.checkout.phoneNumberOptional`).
- When the country has regions (`Country.regions` is not empty), send `regionId` and do not send `region`. When it has no regions, send `region` and do not send `regionId`. If you send neither, the API tries to find the region from the zip code.

### `cart.getShippingMethods(cartId, params, headers?)` returns `ShippingMethodDelivery[]`

Lists the delivery methods for an address. `params` is required.

| Param | Type | Notes |
|---|---|---|
| `countryId` | number | Required. |
| `zip` | string | Required. |
| `regionId?` | number | Same region rules as the address. |
| `firstName?`, `lastName?`, `phone?`, `addressOne?`, `addressTwo?`, `city?` | string | Help carriers that quote by full address. |
| `expand?` | string[] | Also `method`, `carrier`. |

### `cart.getLocalPickups(cartId, headers?)` returns `ShippingMethodPickup[]`

Lists the local pickup methods.

### `cart.getStartDates(cartId, headers?)` returns `{ range, availableDates }`

Start dates for a subscription. Use it when the shop lets customers pick a start date and the cart has a subscription. The response has a fixed list (`availableDates: string[]`) or an open range (`range: [from, to]`). The other value is `null`.

### `cart.getGiftingDates(cartId, headers?)` returns `{ range, availableDates }`

Same shape. Start dates for a gifted subscription (`giftInfo.startsAt`).

### `cart.attachCustomer(cartId, params?, headers?)` returns `SubblyCart`

Attaches the signed-in customer to the cart. Needs the customer access token. The cart must be active. The call fails when a customer is already attached.

## Checkout

### `checkout.purchase(cartId, payload?, params?, headers?)` returns `CheckoutPurchaseResponse`

Charges the cart and creates the subscription, invoice and orders.

| Payload field | Type | Notes |
|---|---|---|
| `paymentMethodId?` | number | A saved payment method of the customer. Must support the cart currency. Not allowed together with `paymentIntentId`. |
| `paymentIntentId?` | string or null | Only for the retry after 3-D Secure. Not allowed together with `paymentMethodId`. |

Default expand: `subscription.product`, `subscription.product.parent`, `subscription.metadata`, `order.metadata`, `order.items.metadata`, `invoice.metadata`, `invoice.items.metadata`.

The order expands must start with `orders.` (plural), because `orders` is a list. The API ignores `order.metadata` and `order.items.metadata` from the default list. To get order metadata, pass the full list with `orders.metadata` and `orders.items.metadata`. Other paths: `subscription.customer`, `subscription.shipping_address`, `subscription.payment_method`, `orders.shipping_address`, `invoice.customer` and more (see the `PurchaseExpandProperty` type).

The response members depend on the cart. A one-time cart returns `invoice` and `orders` with `subscription: null`. A subscription that starts later returns only `subscription`, with `invoice: null` and `orders: null`. `orders` is `null` when there are none, never `[]`.

### 3-D Secure

1. `checkout.purchase` rejects with `code: 'payment_requires_action'` and a `paymentIntentId`.
2. Call `paymentIntents.getPaymentIntent(paymentIntentId)`. The response `token` is the client secret for the gateway.
3. Run the gateway step. For Stripe, call `stripe.confirmCardPayment(token)`.
4. Call `paymentIntents.confirm(paymentIntentId, externalPaymentId)` with the gateway payment ID (for Stripe, `paymentIntent.id`).
5. Call `checkout.purchase(cartId, { paymentIntentId })` again.

`PaymentIntentResponse` fields: `id`, `paymentMethodId`, `invoiceId`, `status`, `token`, `amount`, `currencyCode`, `createdAt`, `updatedAt`.

## Funnels (upsell offers)

A funnel shows offers at three stages: before purchase (`prePurchase*`), during checkout (`midPurchase*`) and after purchase (`postPurchase*`). Each stage has the same steps:

1. `checkout.<stage>Fetch(cartId, params?, headers?)` returns `{ step: FunnelStep | null }`. `null` means no offer. Pass `expand: ['parent']` to load the parent product of each offered variant or plan.
2. Show `step.offer`: `type` (`single`, `multiple`, `one_click`), `products`, `amountOff`, `percentOff`.
3. Accept or reject the step. Then fetch again for the next step.

| Method | Payload | Returns |
|---|---|---|
| `prePurchaseAccept(cartId, funnelStepId, payload, params?, headers?)` | `{ offers: FunnelOfferPayload[] }` | `SubblyCart` |
| `midPurchaseAccept(cartId, funnelStepId, payload, params?, headers?)` | `{ offers: FunnelOfferPayload[] }` | `SubblyCart` |
| `postPurchaseAccept(cartId, funnelStepId, payload, params?, headers?)` | `{ offers, shippingAddressId?, shippingMethodId?, paymentIntentId? }` | `CheckoutPurchaseResponse` |
| `prePurchaseReject`, `midPurchaseReject`, `postPurchaseReject` `(cartId, funnelStepId, headers?)` | none | `void` |
| `prePurchaseRefresh(cartId, headers?)` | none | untyped |

- `FunnelOfferPayload` is `{ productId, options? }`. `productId` must be one of the products of the step. `options` are survey answers (same shape as in `cart.addItem`). The step type sets the maximum number of offers.
- A post-purchase accept charges the customer again. `shippingAddressId` and `shippingMethodId` fall back to the values of the cart. `paymentIntentId` is for the 3-D Secure retry.
- `params` on the accept methods is a cart expand list.

## Wallet (payment methods)

These methods need the customer access token.

| Method | Payload | Returns |
|---|---|---|
| `wallet.setup(payload, headers?)` | `{ gatewayId }` | `{ token }`: the client token or client secret for the gateway SDK. |
| `wallet.setupIntent(payload, headers?)` | `{ gatewayId, redirectUrl }` | `{ id, redirectUrl, expiresAt, subblyUrl }`, for redirect payment methods. |
| `wallet.store(payload, headers?)` | `{ gatewayId, token }` | `PaymentMethod`. `token` is the gateway result (for Stripe, the SetupIntent ID). |
| `wallet.list(currencyCode, headers?)` | currency code string | `PaymentMethod[]` that support this currency. |

Card flow for Stripe: `wallet.setup({ gatewayId })`, then `stripe.confirmSetup` with the returned `token` as `clientSecret`, then `wallet.store({ gatewayId, token: setupIntent.id })`. Then send the `PaymentMethod.id` as `paymentMethodId` in `cart.update` or `checkout.purchase`.

Read the gateways from `shop.load()`: `currencies[].gateways` has `id`, `name` (`stripe`, `braintree`, `paypal`, `authorize_net`), `type` and `connectable` (the public keys for the gateway SDK).

## Pickup info

These methods need the customer access token.

### `pickupInfo.store(payload, headers?)` returns `CustomerPickupInfo`

| Payload field | Type | Notes |
|---|---|---|
| `firstName` | string | Required. |
| `lastName` | string | Required. |
| `phone` | string | Required. |
| `pickupPointType?` | `'mondial_relay'` | External pickup point. Send it together with `pickupPointId`. |
| `pickupPointId?` | string | Format `XX-123456` (two capital letters, a hyphen, digits). Send it together with `pickupPointType`. |

### `pickupInfo.list(params, headers?)` returns `CustomerPickupInfo[]`

`params`: `{ shippingMethodId? }`. Pass `{}` for all records.

On the raw client, `subblyApi.client.pickupInfo.update(id, { firstName, lastName, phone? })` changes the contact only. To change the pickup point, store a new record and delete the old one with `pickupInfo.delete(id)`.
