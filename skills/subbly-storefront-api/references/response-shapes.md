# Response shapes

The main fields of the objects that the Storefront API returns. All types come from `@subbly/react` (re-exported from `@subbly/api-client`). Import them with `import type`. This page lists the fields you usually render. For every field, read the type declaration in `node_modules/@subbly/api-client`.

Rules for every shape:

- Amounts are integers in minor units (`1999` is 19.99).
- Dates are strings.
- A relation that you did not expand is `null` (or `[]` for some lists).

## Pagination and errors

```ts
type Pagination = { currentPage: number; lastPage: number; from: number; to: number; total: number }
type ListResponse<T> = { data: T[]; pagination: Pagination }

type SubblyError = { code: string; message: string; paymentIntentId?: string } // plus non-enumerable status, statusText
```

## Products and bundles

These types have their own skills. Read those skills for the full field lists.

- `ParentProduct` = `ProductSubscription | ProductOneTime`. Common fields: `id`, `type`, `name`, `slug`, `description`, `images`, `digital`, `collectShippingAddress`, `giftingEnabled`, `metadata`, `bundle`. One-time: `variants`, `options`, `giftCard`. Subscription: `plans`, `setupFee`, `preOrderEndAt`. `pricings` is a deprecated copy of `plans`. See the `subbly-storefront-products` skill.
- `ProductPlan`: `id`, `name`, `price`, `frequencyCount`, `frequencyUnit` (`day`, `week`, `month`), `trialPrice`, `trialLength`, `setupFee`, `commitmentBillingCount`, `chargesLimit`, `survey`, `stockCount`, `parent`.
- `ProductVariant`: `id`, `name`, `price`, `options` (`{ id, name, value }[]`), `stockCount`, `parent`.
- `Bundle`: `id`, `name`, `slug`, `configurable`, `selectionType`, `appearanceType`, `plans` (`BundlePlan[]`, each with `plan` or `variant`), `rulesets`, `prices`, `filters`, `preferences`, `metadata`. `BundleQuote`: `price`, `subTotal`, `discount`, `taxAmount`, `total`, `items`. See the `subbly-storefront-bundles` skill.
- `Metafield`: see the `subbly-storefront-metadata` skill. `Survey`: see the `subbly-subscription-surveys` skill.

## SubblyCart

| Field | Notes |
|---|---|
| `id` | String (UUID). Keep it in the `subbly_cart_id` cookie. |
| `status` | `initialized`, `abandoned`, `expired`, `completed`, `restored`. |
| `currencyCode`, `baseCurrencyCode` | The cart currency and the shop base currency. |
| `items` | `CartItem[]`. |
| `summaryItems` | `CartSummaryItem[]`: one price line for each item, setup fee, survey extra, shipping and tax. Each line has `type`, `itemId`, `price`, `quantity`, `subTotal`, `discount`, `discounts`, `taxAmount`, `total`, `chargeNow` and, for a subscription, `subscription.firstPaymentAt`, `nextPaymentAt`, `firstShipmentAt`. |
| `subTotal`, `discountTotal`, `taxTotal`, `customsFee`, `adjustment`, `total` | Cart totals. |
| `totals?` | `{ now, future }`. `now` is the charge today (`amountDue`, `grossTotal`, `netTotal`, `discountTotal`, `taxTotal` and more). `future` is the next renewal. |
| `breakdown?` | Totals split by products, setup fee, surveys, shipping and discounts, each `now` and `future`. |
| `requirements?` | What checkout still needs: `shippingAddress`, `shippingMethod`, `billingAddress`, `paymentMethod` (booleans) and `skipPayment: { allowed, reason }`. |
| `discounts` | `CartDiscount[]`: `{ type, description, total, chargeNow }`. `type` is `coupon`, `coupon_gift_offer`, `offer`, `referral`, `balance`, `gift_card` or `bundle`. |
| `coupon`, `couponCode` | Applied coupon (expand `coupon`): `name`, `amountOff`, `percentOff`, `duration`. |
| `giftCard`, `giftCardCode` | Applied gift card (expand `gift_card`): `code`, `amount`, `balance`, `status`. |
| `giftInfo` | `{ startsAt, numberOfOrders, message, recipientEmail }`. |
| `customer`, `customerId`, `attached` | Guest data, or the attached customer. |
| `shippingAddress`, `billingAddress`, `shippingMethod`, `paymentMethod` | Expanded relations, with their `*Id` fields. `shippingAddress` is a `CustomerAddress` or a `CustomerPickupInfo`. |
| `startsAt` | Chosen subscription start date. |
| `metadata` | Cart-level metadata (`Metafield[]`). |

## CartItem

`CartItem` = `CartItemOneTime | CartItemSubscription`. Fields: `id` (string), `type` (`one_time` or `subscription`), `productId` (variant or plan ID), `product` (the `ProductVariant` or `ProductPlan`, with `parent` when expanded), `productName`, `description`, `quantity`, `status` (`active`, `unavailable`, `out_of_stock`), `addon`, `addonDuration`, `amountOff`, `percentOff`, `giftCard` (recipient), `bundle` (`{ items, preferences }`), `options` (survey answers), `metadata`, `origin` (`pre_purchase`, `mid_purchase`, `post_purchase`, `coupon` or `null`).

## CheckoutPurchaseResponse

`{ invoice: Invoice | null, subscription: Subscription | null, orders: Order[] | null }`. See `cart-and-checkout-api.md` for when each member is `null`. `postPurchaseAccept` returns the same shape.

## FunnelStep

`{ id, type, title, description, initial, addon, addonDuration, offer, externalUrl? }`. `type` is `funnel_pre_purchase`, `funnel_mid_purchase`, `funnel_post_purchase` or `funnel_post_purchase_complete`. `offer` is `{ type: 'single' | 'multiple' | 'one_click', products: Product[], amountOff, percentOff }`.

## SubblyShop

| Field | Notes |
|---|---|
| `name`, `slug`, `url`, `checkoutUrl`, `supportEmail`, `supportUrl`, `termsAndConditions` | Shop details. |
| `livemode` | `false` for a test shop. |
| `country` | `{ id, name, code, currencyCode }`: the shop country. |
| `currencies` | `ShopCurrency[]`: `{ abbreviation, name, symbol, html, gateways }`. `abbreviation` is the code for `x-currency` and `currencyCode`. |
| `languages` | `ShopLanguage[]`: `{ code, name, primary, published, currencyPosition, dictionary }`. `dictionary` is the shop text for each key. Some keys can be missing, so use a fallback. |
| `shippingCountries` | `Country[]` that the shop ships to. |
| `config` | Shop settings in groups: `checkout` (`phoneNumberOptional`, `registerWithoutPassword`, `collectBillingAddress`, `tosConsentRequired`, `marketingConsentRequired`, ...), `discounts`, `payments`, `tax`, `shipping`, `products`, `subscriptions` (`quantitySelector`, `addons`, `startDateEnabled`, ...), `gifting`, `customerPortal`, `tracking`, `localization`, `business`. |
| `settings` | Deprecated. Frozen at its current keys. Read `config` for new code. |
| `limits` | Plan features: `checkoutWidget`, `configurableBundles`, `embedCheckout`, `onboardingTemplates`, `outOfStock`, `whiteLabeling`. |
| `cartSettings` | Cart widget appearance and behavior. See the `subbly-cart-and-checkout` skill. |
| `branding` | `{ brandColour, favicon, logoSquare }`. |
| `referralSettings` | `{ enabled, refereeDiscount, referralDiscount }` or `null`. |
| `apps` | Connected apps: `{ type, properties }`. `type` is `ga`, `google_tag`, `facebook_pixel`, `tiktok_pixel`, `zendesk`, `intercom`, `facebook_login`, `google_login`, `cart_stack`, `bablic` or `manychat`. |
| `localPickupOnly` | The shop ships by local pickup only. |

`ShopGateway`: `{ id, name, type, connectable }`. `name` is `stripe`, `braintree`, `paypal` or `authorize_net`. `connectable` holds the public keys for the gateway SDK (for Stripe, `publishableKey`).

## Customer data

- `SubblyCustomer`: `id`, `userId`, `email`, `firstName`, `lastName`, `externalId`, `marketingConsent` (boolean or null), `tosConsentAt`, `activeSubscriptionsCount`, `createdAt`.
- `CustomerAddress`: `id`, `firstName`, `lastName`, `companyName`, `phone`, `addressOne`, `addressTwo`, `city`, `zip`, `region`, `regionId`, `country` (name), `countryId`.
- `CustomerPickupInfo`: `id`, `firstName`, `lastName`, `phone`, `pickupPoint` (external point or `null`).
- `PaymentMethod`: `id`, `type` (`card`, `paypal`, `us_bank_account`, `sepa_debit`, `ideal`, `bancontact`, `sofort`, `cashapp`, `link`, `acss_debit`), `identifier`, `createdAt`, and one detail object for the type. For a card: `card: { brand, lastFour, expiryMonth, expiryYear }`.

## Subscription

| Field | Notes |
|---|---|
| `id`, `status` | `status`: `active`, `trial`, `pre_order`, `gift_waiting_to_start`, `cancelled`, `switched`, `expired`. |
| `active`, `paused`, `pastDue`, `unpaid` | State flags. |
| `items`, `addons` | `SubscriptionItem[]`: the plans and the one-time add-ons. |
| `product`, `productId`, `quantity` | The plan of a single-plan subscription. |
| `bundle` | Picked bundle items, for a bundle subscription. |
| `nextPaymentDate`, `nextShipmentAt`, `lastPaymentAt`, `startsAt` | Dates. |
| `skippingUntil`, `pausedAt`, `cancelledAt`, `cancelAtPeriodEnd`, `cancelAtEndOfCommitment`, `cancellationRequested` | Skip, pause and cancellation state. |
| `actions` | `{ cancel, pause, resume, skip, ... }`, each `{ allowed }`. See `customer-api.md`. |
| `discounts`, `gift`, `metadata`, `currencyCode` | Other data. |
| `shippingAddress`, `shippingMethod`, `billingAddress`, `paymentMethod` | Present only when expanded. |

## Shipping and countries

- `ShippingMethodDelivery` = `ShippingMethodShippingOption | ShippingMethodLocalDelivery`. Fields: `id`, `type` (`shipping_option` or `local_delivery`), `shippingFee`, `futureShippingFee`, `method` (`{ name, duration, ... }`), `prohibitedProducts` (product IDs that this method cannot ship). A shipping option also has `carrier`, `carrierId`, `service`, `customsFee`.
- `ShippingMethodPickup`: `id`, `type: 'local_pickup'`, `shippingFee`, `futureShippingFee`, `method` (the pickup point: `name`, `addressOne`, `city`, `zip`, `country`, `workingHours`, `comment`, `phone`), `prohibitedProducts`.
- `Country`: `id`, `name`, `code`, `codeIso3`, `regionTitle`, `regions` (`{ id, name, code }[]`), `scaRequired`.
