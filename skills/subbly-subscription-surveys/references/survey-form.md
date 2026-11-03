# Survey form

An unstyled `before_cart` survey form. It keeps one `SubscriptionSurveyOption` per question, preselects defaults, validates with `validateSurvey`, and adds the plan with its answers. Change the markup and styles to match the site.

## Form

```tsx
'use client'

import { useMemo, useState, type FormEvent } from 'react'
import { useCurrencyFormatter, useSubblyCart } from '@subbly/react'
import { validateSurvey } from '@subbly/kit'
import type { Survey, SubscriptionSurveyOption } from '@subbly/react'
import { SurveyQuestionField } from './survey-question-field'

type Answers = Record<number, SubscriptionSurveyOption>

const byPosition = <T extends { position: number }>(list: T[]) =>
  [...list].sort((a, b) => a.position - b.position)

const initialAnswers = (survey: Survey): Answers => {
  const answers: Answers = {}

  for (const question of survey.questions) {
    const preset = (question.answers as { id: number; default?: boolean; defaultQuantity?: number }[])
      .flatMap((answer) => {
        if (answer.defaultQuantity) return [{ id: answer.id, quantity: answer.defaultQuantity }]
        return answer.default ? [{ id: answer.id }] : []
      })

    if (preset.length > 0) {
      answers[question.id] = { questionId: question.id, answers: preset }
    }
  }

  return answers
}

export function SurveyForm ({ survey, planId }: { survey: Survey; planId: number }) {
  const { addToCart } = useSubblyCart()
  const { formatAmount } = useCurrencyFormatter()
  const [answers, setAnswers] = useState<Answers>(() => initialAnswers(survey))
  const [submitted, setSubmitted] = useState(false)

  const options = useMemo(
    () => Object.values(answers).filter((option) => option.answers.length > 0),
    [answers],
  )
  const result = validateSurvey(survey.questions, options)

  const setAnswer = (questionId: number, next: SubscriptionSurveyOption['answers']) =>
    setAnswers((prev) => ({ ...prev, [questionId]: { questionId, answers: next } }))

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setSubmitted(true)
    if (!result.valid) return

    await addToCart({ productId: planId, quantity: 1, options })
  }

  return (
    <form onSubmit={onSubmit}>
      <h2>{survey.title}</h2>

      {byPosition(survey.questions).map((question) => (
        <SurveyQuestionField
          key={question.id}
          question={question}
          value={answers[question.id]?.answers ?? []}
          onChange={(next) => setAnswer(question.id, next)}
          formatAmount={formatAmount}
          error={submitted ? result.errors[String(question.id)]?.code : undefined}
        />
      ))}

      <button type="submit">Add to cart</button>
    </form>
  )
}
```

`useCurrencyFormatter` uses `en-US` and `USD` by default. Call `setCurrency(locale, currencyCode)` with the cart currency. See the `subbly-storefront-localization` skill.

## Question renderer

```tsx
'use client'

import { SurveyQuestionType } from '@subbly/react'
import type { SubscriptionSurveyOption, SurveyQuestion } from '@subbly/react'

type AnswerList = SubscriptionSurveyOption['answers']

type Props = {
  question: SurveyQuestion
  value: AnswerList
  onChange: (next: AnswerList) => void
  formatAmount: (amount: number) => string
  error?: string
}

const ids = (value: AnswerList) => value.flatMap((a) => ('id' in a ? [a.id] : []))

export function SurveyQuestionField ({ question, value, onChange, formatAmount, error }: Props) {
  const price = (amount: number) => (amount > 0 ? ` (+${formatAmount(amount)})` : '')
  const header = (
    <>
      <legend>{question.title}{question.required ? ' *' : ''}</legend>
      {question.description && <p>{question.description}</p>}
      {error && <p role="alert">{errorText(error, question)}</p>}
    </>
  )

  switch (question.type) {
    case SurveyQuestionType.text:
    case SurveyQuestionType.email: {
      const text = value[0] && 'content' in value[0] ? value[0].content : ''
      return (
        <fieldset>
          {header}
          <input
            type={question.type === SurveyQuestionType.email ? 'email' : 'text'}
            value={text}
            placeholder={question.type === SurveyQuestionType.text ? question.customizations?.placeholder ?? '' : ''}
            onChange={(e) => onChange(e.target.value ? [{ content: e.target.value }] : [])}
          />
        </fieldset>
      )
    }

    case SurveyQuestionType.select:
      return (
        <fieldset>
          {header}
          {question.answers.map((answer) => (
            <label key={answer.id}>
              <input
                type="radio"
                name={`q-${question.id}`}
                checked={ids(value).includes(answer.id)}
                disabled={answer.stockCount === 0}
                onChange={() => onChange([{ id: answer.id }])}
              />
              {answer.content}{price(answer.price)}
            </label>
          ))}
        </fieldset>
      )

    case SurveyQuestionType.multiple: {
      const selected = ids(value)
      const atMax = question.maxCount !== null && selected.length >= question.maxCount
      return (
        <fieldset>
          {header}
          {question.answers.map((answer) => {
            const checked = selected.includes(answer.id)
            return (
              <label key={answer.id}>
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={answer.stockCount === 0 || (!checked && atMax)}
                  onChange={() =>
                    onChange(
                      (checked ? selected.filter((id) => id !== answer.id) : [...selected, answer.id])
                        .map((id) => ({ id })),
                    )
                  }
                />
                {answer.content}{price(answer.price)}
              </label>
            )
          })}
        </fieldset>
      )
    }

    case SurveyQuestionType.quantity: {
      const qty = (id: number) => {
        const found = value.find((a) => 'id' in a && a.id === id)
        return found && 'quantity' in found ? found.quantity : 0
      }
      const setQty = (id: number, quantity: number) => {
        const others = value.filter((a) => !('id' in a && a.id === id))
        onChange(quantity > 0 ? [...others, { id, quantity }] : others)
      }
      return (
        <fieldset>
          {header}
          {question.answers.map((answer) => (
            <label key={answer.id}>
              {answer.content}{price(answer.price)}
              <input
                type="number"
                min={0}
                max={answer.stockCount ?? undefined}
                value={qty(answer.id)}
                onChange={(e) => setQty(answer.id, Math.max(0, Number(e.target.value)))}
              />
            </label>
          ))}
        </fieldset>
      )
    }

    default:
      // `plan` and `offer` questions belong to subscription_box surveys. Let the widget run those.
      return null
  }
}

const errorText = (code: string, question: SurveyQuestion) => {
  const limits = 'minCount' in question ? question : null
  switch (code) {
    case 'required': return 'Please answer this question.'
    case 'invalid_email': return 'Enter a valid email address.'
    case 'min_count': return `Choose at least ${limits?.minCount}.`
    case 'max_count': return `Choose at most ${limits?.maxCount}.`
    case 'min_amount':
    case 'max_amount': return 'Your selection is outside the allowed price range.'
    default: return 'Check this answer.'
  }
}
```

## Notes

- `validateSurvey` returns `{ valid, issues, errors, error }`. `errors` has the first issue per question ID. Each issue has `params` with `count`, `amount`, `min`, `max` and `delta` for your own messages.
- To use the shop's own translated messages, see `renderResult` and `translateIssue` in `@subbly/kit`.
- For a multi-step survey, render one question per step and validate only the questions on that step (`validateSurvey([question], options)`).
