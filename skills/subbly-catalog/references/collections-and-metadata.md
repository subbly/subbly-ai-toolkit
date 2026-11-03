# Collections and custom fields

## Collections

A collection groups products that already exist and sell on their own. It sells nothing. It does not change the products in it. Merchants use collections to group products on the storefront and to set which products a subscriber can switch to.

- A collection holds items that a customer can buy, not products. Each item is a **variant ID** (for a one-time product) or a **plan ID** (for a subscription product). Ask for the products, then get the variant or plan IDs with `get_product`.
- `create_collection` can add the first items. You set `type` at creation only. Use `type: subscription` for a collection that subscribers switch between (see "Plan switching" in `SKILL.md`).
- `update_collection` changes the name and slug only.
- `batch_collection_items` creates, updates and deletes items in one call. Its `id` is the collection ID. A deleted item is gone, but its variant or plan does not change. Confirm the delete list first.
- `list_collection_items` shows the contents, grouped by product. `get_collection` does not show the items.
- `publish_collection` and `unpublish_collection` show and hide it. `archive_collection` cannot be undone.

## Custom fields: metafields and metadata

A **metafield** is the definition of a custom field: name, data type, and allowed values. **Metadata** is the values on one record. Merchants say custom fields, attributes, specs or personalization.

### Uses

- **Product facts with no standard field:** material, origin, roast level, care, allergens. Use `accessLevel: storefront`, so the site and checkout can show them.
- **Customer input:** engraving text, delivery notes, a flavor choice. The storefront saves it on the cart item at checkout.
- **Bundle preferences and filters:** they need a preset `single_line_string` metafield, not free text. Create it before you set up the bundle.
- **Internal notes:** supplier code, warehouse bin. Use `accessLevel: private`. Private values show only in the admin and the private API.

### Create a metafield

1. Use `list_metafields` to find a field that already exists. Use it if it fits.
2. `create_metafield` needs a name, `accessLevel` and `dataType`.
   - Data types: `single_line_string`, `multi_line_text`, `rich_text`, `integer`, `decimal`, `datetime`, `date`, `time`, `volume`, `weight`, `boolean`, `color`, `rating`, `url`, `money`, `json`.
   - `preset: 1` limits the field to a list of `values`. Not available for `multi_line_text`, `rich_text`, `boolean`, `url` and `json`.
   - `multiple: 1` lets one record hold many values. Not available for every type; the schema lists them.
   - `volume` and `weight` need a `unit`, for example kg.
3. `update_metafield` finds the field by slug. It can add, change or remove preset values. The data type does not change.

### Set values on a record

- Products and bundles: `set_one_time_product_metadata`, `set_subscription_product_metadata`, `set_bundle_metadata`. A name that matches no metafield creates a new metafield, so check `list_metafields` first.
- Customers, subscriptions, subscription items and orders: the `metadata` field of `update_customer`, `update_subscription`, `update_subscription_item` and `update_order`.

All of these **replace** the full list of values on the record, storefront and private. A field that you do not send is removed. An empty list removes all. Load the record, add the change to its current values, and send the full list.
