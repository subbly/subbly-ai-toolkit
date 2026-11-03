# Metadata types

All types are exported from `@subbly/react` (source: `@subbly/api-client`). `ID` is a number.

## Metafield

The definition of a custom field, with its values.

```ts
type Metafield = {
  id: ID
  name: string                 // label set by the merchant, can change
  slug: string                 // stable key, use it in code
  description: string | null
  dataType: MetafieldType
  preset: boolean              // true: customer picks from `values`
  multiple: boolean            // true: more than one value allowed
  unit: string | null          // for example 'kg' or 'ml'
  values: MetafieldValue[]     // preset options, or the saved values on an entity
  variant: boolean             // true: built from variant options
  editable: boolean
  saveBehavior: 'customer' | 'subscription'
  accessLevel?: 'private' | 'storefront'  // not sent by the Storefront API
  metadataId?: ID                         // never sent on a read
}
```

The Storefront API returns only storefront metafields, so you do not need to filter on `accessLevel`.

## MetafieldValue

```ts
type MetafieldValue = {
  id: ID                       // use this ID in a preset payload
  value: string | null         // always a string, also for numbers and dates
  valueId: ID
  metadata: { imageUrl: string | null; color: string | null } | null
}
```

`metadata` is set only on product attribute values. It is `null` on cart, order, invoice and subscription metafields.

## MetadataObject (payload)

What you send in `addToCart({ metadata })` and `updateCart({ metadata })`.

```ts
type MetadataObject = {
  id: Metafield['id']
  values: ({ id: MetafieldValue['id'] } | { value: string })[]
}
```

- Preset field: `{ id }` for each chosen value.
- Free-form field: `{ value }` with the text.

## MetafieldListParams

```ts
type MetafieldListParams = {
  ids?: number[]
  slugs?: string[]
  page?: number
  perPage?: number
  preset?: boolean
  expand?: string[]
}
```

`subblyApi.metafield.list` returns `{ data: Metafield[], pagination: Pagination }`.

## Data types and inputs

| `dataType` | Input to use |
|---|---|
| `single_line_string` | text input |
| `multi_line_text` | textarea |
| `rich_text` | textarea, or a rich text editor |
| `integer` | number input, `step="1"` |
| `decimal` | number input, `step="any"` |
| `volume`, `weight` | number input, with `unit` shown next to it (do not put the unit in the value) |
| `money` | number input |
| `date` | `<input type="date">` |
| `time` | `<input type="time">` |
| `datetime` | `<input type="datetime-local">` |
| `boolean` | checkbox |
| `color` | `<input type="color">` |
| `rating` | star or number input |
| `url` | `<input type="url">` |
| `json` | do not collect from customers |

Send every free-form value as a string: `String(input.value)`.

When `preset` is `true`, the data type does not decide the input. Use a select (single) or checkboxes (multiple), or swatches and image tiles when `values[].metadata` has `color` or `imageUrl`.
