---
name: subbly-subscription-surveys
description: "Write storefront code with @subbly/react that renders Subbly subscription surveys and sends the answers with the cart item. Use when a developer builds a preference quiz, box survey, onboarding questions, taste or size profile, or a subscription box flow where the customer answers questions before or after checkout. Covers survey types (before_cart, after_checkout, subscription_box), question and answer types, the answer payload for addToCart, validation of min and max limits, and an example survey form. For storefront code only. To read or change a live store (products, orders, subscribers), use the Subbly connector tools instead."
---

# Subscription surveys

A survey asks the customer questions about a subscription, for example taste, size or dietary needs. The merchant builds the survey in the Subbly admin and links it to a subscription product. Use this skill to render the survey in custom storefront code and to send the answers.

## Before you start

- Set up the API client first. See the `subbly-storefront-api` skill.
- Import `subblyApi`, hooks, types and the enums `SurveyQuestionType` and `SurveyAppearanceType` from `@subbly/react`.
- Add items to the cart with `useSubblyCart().addToCart`. See the `subbly-cart-and-checkout` skill.
- Prices are in minor units: `1999` means 19.99. Format them with `useCurrencyFormatter().formatAmount`.

## Survey types

`survey.appearanceType` tells you when the customer answers.

| Value | Enum | When | Question types |
|---|---|---|---|
| `before_cart` | `SurveyAppearanceType.beforeCart` | Before the plan goes into the cart. Answers go with the cart item. | text, select, multiple, quantity |
| `after_checkout` | `SurveyAppearanceType.afterCheckout` | After the purchase. The cart item needs no answers. | text, select, multiple, quantity |
| `subscription_box` | `SurveyAppearanceType.subscriptionBox` | A standalone flow. The answers choose the plan and offers. | also email, plan, offer |

## Get the survey

- A subscription plan has `plan.survey: Survey | null`. Load the product with `subblyApi.product.bySlug` or the plan with `subblyApi.product.planById`.
- To load a survey by ID, call `subblyApi.surveys.load(surveyId, params?, headers?)`. It expands `questions.answers.product.parent` by default, so plan and offer answers include their product.
- To price answers in another currency, pass `{ 'x-currency': 'EUR' }` as `headers`.
- Sort questions and answers by `position` before you render them.

## Answer payload

Send answers as `SubscriptionSurveyOption[]`: one entry per answered question.

```ts
type SubscriptionSurveyOption = {
  questionId: number
  answers: SubscriptionSurveyOptionAnswer[]
}
```

| Question type | One answer | Notes |
|---|---|---|
| `text`, `email` | `{ content: 'No nuts' }` | One answer. |
| `select` | `{ id: answerId }` | One answer. |
| `multiple` | `{ id: answerId }` | One entry per chosen answer. |
| `quantity` | `{ id: answerId, quantity: 2 }` | One entry per answer with a quantity above 0. |
| `plan`, `offer` | `{ id: answerId }` | `subscription_box` only. |

Use the **answer** ID (`question.answers[n].id`), not the product ID.

## Add a plan with answers (before_cart)

```tsx
'use client'

import { useSubblyCart } from '@subbly/react'
import type { SubscriptionSurveyOption } from '@subbly/react'

export function useAddPlanWithAnswers () {
  const { addToCart } = useSubblyCart()

  return (planId: number, options: SubscriptionSurveyOption[]) =>
    addToCart({ productId: planId, quantity: 1, options })
}
```

- `productId` is the plan ID.
- Bundle plans take `options` the same way.
- If a plan has a `before_cart` survey and you leave out `options`, the cart widget shows its own survey step. On a page without the widget, `addToCart` throws because the item is not complete. Send `options` when you render the survey yourself.
- To change answers on an item that is already in the cart, call `getWidget()?.updateItem(cartItemId, { options })`.

## After checkout (after_checkout)

The cart item needs no answers. The hosted widget asks the questions after the purchase. In a custom flow, save the answers on the new subscription for the signed-in customer:

```ts
await subblyApi.subscriptions.updatePreferences(subscriptionId, { preferences: options })
```

This call needs a customer access token. See the auth section of the `subbly-storefront-api` skill.

## Subscription box (subscription_box)

The cart widget runs this flow. Start it with:

```ts
const { addToCart } = useSubblyCart()
await addToCart({ surveyId: survey.id })
```

The widget must be on the page. Without it, `addToCart({ surveyId })` throws. A fully custom subscription box flow must map the `plan` answer to `answer.productId` (the plan to add) and handle `offer` answers as extra items. Build it only when the user asks for it.

## Validation

Check the answers before you call `addToCart`. The rules:

- `required: true`: the question needs an answer. The validator below skips `plan` questions, because the customer always chooses a plan.
- `multiple` and `quantity` questions can have `minCount` and `maxCount`. They count units: a quantity answer counts its `quantity`.
- They can also have `minAmount` and `maxAmount`. These are money limits in minor units over the prices of the chosen answers.
- `email` answers must be a valid email.
- An answer with `stockCount === 0` is out of stock. Disable it.

`@subbly/kit` (a dependency of `@subbly/react`) has a validator that applies these rules:

```ts
import { validateSurvey } from '@subbly/kit'

const result = validateSurvey(survey.questions, options)
if (!result.valid) {
  // result.errors is keyed by question ID (as a string). Each issue has a `code`:
  // 'required' | 'invalid_email' | 'min_count' | 'max_count' | 'min_amount' | 'max_amount'
  // and `params` with count, amount, min, max and delta.
}
```

Install `@subbly/kit` as a direct dependency if you import from it.

## Price of answers

- `answer.price` is the extra charge for that answer. `0` means free.
- For `quantity` questions, the charge is `price * quantity`.
- When `survey.multiplyPriceByShipmentNumber` is `true`, the answer price applies per shipment, so a plan that bills for several shipments costs more. Show the price as "per shipment".
- The cart calculates the final price. After `addToCart`, show totals from the cart, not your own sum.

## Rules

1. Do not hard-code question or answer IDs. Read them from the survey.
2. Preselect answers where `answer.default` is `true` (`select`, `multiple`, `plan`). For `quantity`, start at `answer.defaultQuantity`.
3. Leave out questions with no answer. Do not send an entry with empty `answers`.
4. The widget renders surveys with the merchant's styles from `survey.customizations` and `question.customizations` (for example `fieldType: 'card' | 'tag' | 'dropdown'`). Use them as hints for your own UI.

## References

| Reference | Read it when |
|---|---|
| `references/types.md` | You need the exact `Survey`, question, answer and customization types. |
| `references/survey-form.md` | You build the survey UI: a complete form with a renderer for each question type, default answers and validation. |

Storefront API reference: https://docs.subbly.dev/api/storefront
