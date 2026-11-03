# Survey types

All types and enums are exported from `@subbly/react` (source: `@subbly/api-client`). `ID` is a number. Every question and answer also has `createdAt` and `updatedAt` strings; they are left out below.

## Enums

```ts
enum SurveyAppearanceType {
  beforeCart = 'before_cart',
  afterCheckout = 'after_checkout',
  subscriptionBox = 'subscription_box',
}

enum SurveyQuestionType {
  text = 'text',
  email = 'email',
  select = 'select',
  multiple = 'multiple',
  quantity = 'quantity',
  plan = 'plan',
  offer = 'offer',
}
```

Compare with the enum (`question.type === SurveyQuestionType.select`) so TypeScript narrows the question type.

## Survey

```ts
type Survey = {
  id: number
  title: string
  appearanceType: SurveyAppearanceType
  questions: SurveyQuestion[]
  multiplyPriceByShipmentNumber: boolean
  customizations: {
    progressType: 'steps' | 'dots' | 'bar' | 'hidden'
    styles: SurveyCustomizationStyles | null   // accentColor, fontColorPrimary, inputBackground, ...
  }
}
```

## Questions

Fields on every question:

```ts
{
  id: ID
  type: SurveyQuestionType
  title: string
  description: string | null
  position: number
  required: boolean
}
```

Fields per type:

| Type | `answers` | Extra fields | `customizations` |
|---|---|---|---|
| `text` | `never[]` | | `{ fieldType?: 'input' \| 'input-numeric' \| 'textarea' \| 'date' \| 'date_month_year' \| 'date_month'; placeholder?: string \| null }` |
| `email` | `never[]` | | `null` |
| `select` | `SurveyAnswerSelect[]` | | `{ fieldType?: 'card' \| 'tag' \| 'dropdown'; listAlign?: 'stretch' \| 'center' \| null }` |
| `multiple` | `SurveyAnswerMultiple[]` | `minCount`, `maxCount`, `minAmount`, `maxAmount` (all `number \| null`) | `{ fieldType?: 'card' \| 'tag'; listAlign? }` |
| `quantity` | `SurveyAnswerQuantity[]` | `minCount`, `maxCount`, `minAmount`, `maxAmount` | `null` |
| `plan` | `SurveyAnswerPlan[]` | | `{ fieldType?: 'total' \| 'delivery' \| 'names' \| 'no_price' \| 'comparable_period'; hideImagePlaceholder?: boolean; listAlign? }` |
| `offer` | `SurveyAnswerOffer[]` | | `{ customHtmlTemplate?: string \| null }` |

`minAmount` and `maxAmount` are in minor units.

## Answers

Fields on every answer:

```ts
{
  id: ID
  content: string | null       // the label
  description: string | null
  imageUrl: string | null
  position: number
  price: number                // extra charge in minor units, 0 when free
}
```

Fields per answer type:

| Type | Extra fields |
|---|---|
| `SurveyAnswerSelect` | `default: boolean`, `stockCount: number \| null`, `customizations: { alignContent: 'start' \| 'center' \| null } \| null` |
| `SurveyAnswerMultiple` | `default: boolean`, `stockCount: number \| null` |
| `SurveyAnswerQuantity` | `defaultQuantity: number`, `stockCount: number \| null` |
| `SurveyAnswerPlan` | `default: boolean`, `productId: number \| null`, `product: Product \| null`, `customizations: { highlightType: 'badge' \| 'banner'; highlightText: string \| null }` |
| `SurveyAnswerOffer` | `productId: number \| null`, `product: Product \| null`, `customizations: { originalPrice: number \| string; addonDuration: '1' \| '0' \| null }` |

`stockCount: null` means no stock limit. `0` means out of stock.

`product` on plan and offer answers is filled when the survey is loaded with the `questions.answers.product.parent` expand (the default of `subblyApi.surveys.load`).

## Answer payload

```ts
type SubscriptionSurveyOption = {
  questionId: ID
  answers: SubscriptionSurveyOptionAnswer[]
}

type SubscriptionSurveyOptionAnswer =
  | { content: string }                 // SurveyOptionAnswerText, SurveyOptionAnswerEmail
  | { id: ID }                          // Select, Multiple, Plan, Offer
  | { id: ID; quantity: number }        // SurveyOptionAnswerQuantity
```

Send it as `options` in `addToCart`, or as `preferences` in `subblyApi.subscriptions.updatePreferences(subscriptionId, { preferences, updateOrders? })`.

## Saved answers

On a cart item, `item.options` is a `SubscriptionSurvey | null`. Its `data` field is the `SubscriptionSurveyOption[]` that was sent. The answers are IDs, so you need the `Survey` to show labels.
