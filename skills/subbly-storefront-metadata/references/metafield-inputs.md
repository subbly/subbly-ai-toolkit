# Metafield inputs

Unstyled starting points. Change the markup and styles to match the site. Every component reports the `values` array of a `MetadataObject`, so the parent only stores `{ id, values }` per metafield.

## One input for every metafield

```tsx
'use client'

import type { Metafield, MetadataObject } from '@subbly/react'

type Values = MetadataObject['values']

type Props = {
  metafield: Metafield
  values: Values
  onChange: (values: Values) => void
}

const inputType: Partial<Record<Metafield['dataType'], string>> = {
  integer: 'number',
  decimal: 'number',
  volume: 'number',
  weight: 'number',
  money: 'number',
  date: 'date',
  time: 'time',
  datetime: 'datetime-local',
  color: 'color',
  url: 'url',
}

export function MetafieldInput ({ metafield, values, onChange }: Props) {
  const label = (
    <label htmlFor={`mf-${metafield.id}`}>
      {metafield.name}
      {metafield.unit ? ` (${metafield.unit})` : ''}
    </label>
  )

  if (metafield.preset) {
    return (
      <fieldset>
        <legend>{metafield.name}</legend>
        <PresetInput metafield={metafield} values={values} onChange={onChange} />
      </fieldset>
    )
  }

  const text = values[0] && 'value' in values[0] ? values[0].value : ''
  const set = (next: string) => onChange(next ? [{ value: next }] : [])

  if (metafield.dataType === 'boolean') {
    return (
      <label>
        <input
          type="checkbox"
          checked={text === 'true'}
          onChange={(e) => set(e.target.checked ? 'true' : '')}
        />
        {metafield.name}
      </label>
    )
  }

  if (metafield.dataType === 'multi_line_text' || metafield.dataType === 'rich_text') {
    return (
      <div>
        {label}
        <textarea id={`mf-${metafield.id}`} rows={4} value={text} onChange={(e) => set(e.target.value)} />
        {metafield.description && <p>{metafield.description}</p>}
      </div>
    )
  }

  return (
    <div>
      {label}
      <input
        id={`mf-${metafield.id}`}
        type={inputType[metafield.dataType] ?? 'text'}
        step={metafield.dataType === 'integer' ? 1 : 'any'}
        value={text}
        onChange={(e) => set(e.target.value)}
      />
      {metafield.description && <p>{metafield.description}</p>}
    </div>
  )
}
```

Check the boolean format with the merchant before you rely on it. The API stores the value as a string.

## Preset values: select, checkboxes, swatches, images

```tsx
function PresetInput ({ metafield, values, onChange }: Props) {
  const selected = values.flatMap((v) => ('id' in v ? [v.id] : []))
  const hasSwatch = metafield.values.some((v) => v.metadata?.color || v.metadata?.imageUrl)

  const toggle = (id: number) => {
    if (!metafield.multiple) return onChange([{ id }])
    const next = selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id]
    onChange(next.map((s) => ({ id: s })))
  }

  if (!metafield.multiple && !hasSwatch) {
    return (
      <select
        value={selected[0] ?? ''}
        onChange={(e) => onChange(e.target.value ? [{ id: Number(e.target.value) }] : [])}
      >
        <option value="">Choose {metafield.name}</option>
        {metafield.values.map((v) => (
          <option key={v.id} value={v.id}>{v.value}</option>
        ))}
      </select>
    )
  }

  return (
    <div role={metafield.multiple ? 'group' : 'radiogroup'}>
      {metafield.values.map((v) => (
        <button
          key={v.id}
          type="button"
          aria-pressed={selected.includes(v.id)}
          title={v.value ?? ''}
          onClick={() => toggle(v.id)}
        >
          {v.metadata?.imageUrl ? (
            <img src={v.metadata.imageUrl} alt={v.value ?? ''} width={48} height={48} />
          ) : v.metadata?.color ? (
            <span style={{ background: v.metadata.color, display: 'inline-block', width: 24, height: 24 }} />
          ) : (
            v.value
          )}
        </button>
      ))}
    </div>
  )
}
```

## Full example: product form with personalization

The example loads metafields by slug, keeps the values per metafield, and sends them with the cart item. Use the product hooks from the `subbly-storefront-products` skill for variant selection in a real page.

```tsx
'use client'

import { useEffect, useState } from 'react'
import { subblyApi, useSubblyCart } from '@subbly/react'
import type { Metafield, MetadataObject, ProductOneTime } from '@subbly/react'

const SLUGS = ['engraving', 'gift-message']

export function PersonalizedProduct ({ product }: { product: ProductOneTime }) {
  const { addToCart } = useSubblyCart()
  const [fields, setFields] = useState<Metafield[]>([])
  const [entries, setEntries] = useState<Record<number, MetadataObject>>({})
  const [variantId, setVariantId] = useState(product.variants[0].id)

  useEffect(() => {
    subblyApi.metafield.list({ slugs: SLUGS }).then((res) => setFields(res.data))
  }, [])

  const setValues = (metafield: Metafield, values: MetadataObject['values']) =>
    setEntries((prev) => ({ ...prev, [metafield.id]: { id: metafield.id, values } }))

  const onAdd = () =>
    addToCart({
      productId: variantId,
      quantity: 1,
      metadata: Object.values(entries).filter((entry) => entry.values.length > 0),
    })

  return (
    <form onSubmit={(e) => { e.preventDefault(); onAdd() }}>
      <select value={variantId} onChange={(e) => setVariantId(Number(e.target.value))}>
        {product.variants.map((v) => (
          <option key={v.id} value={v.id}>{v.name}</option>
        ))}
      </select>

      {fields.map((metafield) => (
        <MetafieldInput
          key={metafield.id}
          metafield={metafield}
          values={entries[metafield.id]?.values ?? []}
          onChange={(values) => setValues(metafield, values)}
        />
      ))}

      <button type="submit">Add to cart</button>
    </form>
  )
}
```

For an order-wide field (for example delivery notes), render the same `MetafieldInput` near the cart and send the entries with `updateCart({ metadata })`.

## Show saved metadata in a cart

The `subblyApi.cart` methods expand `items.metadata` and `metadata` by default. The widget cart from `getCart()` has the same fields.

```tsx
'use client'

import { useEffect, useState } from 'react'
import { formatMetafieldList, useSubblyCart, type SubblyCart } from '@subbly/react'

export function CartItemDetails () {
  const { getWidget } = useSubblyCart()
  const [cart, setCart] = useState<SubblyCart | null>(null)

  // Read the widget in an effect: getCart() and getWidget() throw during server render.
  useEffect(() => {
    const onUpdate = (_err: unknown, next?: SubblyCart) => next && setCart(next)
    const attach = () => {
      const widget = getWidget()
      if (!widget) return
      setCart(widget.cart)
      widget.events.on('CART_UPDATED', onUpdate)
    }

    if (getWidget()) attach()
    else window.addEventListener('subbly-cart-initialized', attach, { once: true })

    return () => {
      window.removeEventListener('subbly-cart-initialized', attach)
      getWidget()?.events.off('CART_UPDATED', onUpdate)
    }
  }, [getWidget])

  return (
    <ul>
      {cart?.items.map((item) => (
        <li key={item.id}>
          {item.productName}
          {formatMetafieldList(item.metadata).map((line) => (
            <small key={line.id}> {line.oneLine}</small>
          ))}
        </li>
      ))}
    </ul>
  )
}
```

The effect reads the widget cart when the widget is ready, and again on each `CART_UPDATED`. For the widget events, see the `subbly-cart-and-checkout` skill.
