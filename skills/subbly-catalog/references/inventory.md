# Inventory

Inventory items are the stock that the merchant ships. Groups organize them. Subbly changes the stock count when orders get shipping items, and when an order is cancelled the quantities go back to stock.

## Items

- `list_inventory_items` filters by group, active status, or a name or SKU search. It shows stock counts and tags.
- `create_inventory_item` needs a SKU that is unique in the shop.
- `update_inventory_item` changes the stock count, group and tags. When the user asks to "add 20 units", read the current count first and send the new total. Tell the user the old and new count.
- `archive_inventory_item` cannot be undone. The item can no longer be linked to products or shipping items. Get an explicit "yes".

## Groups

- `list_inventory_groups` and `get_inventory_group` show stock totals for each group.
- `create_inventory_group` and `update_inventory_group` set the name, brand name and description.

## Stock reports

For "what is low on stock", page through `list_inventory_items` (at most 100 for each page) and sort by the stock count. Show the item name, SKU and count. Ask the user for the limit they use for "low".
