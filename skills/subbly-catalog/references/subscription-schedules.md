# Subscription schedules

How billing and shipping dates work on a physical subscription plan, for `create_plan`, `update_plan`, `create_bundle_plan` and `update_bundle_plan`. Digital plans have no shipping schedule.

Shipments always come after billing. A plan can have more than one shipment in each billing cycle.

## Two billing types

The `rebillingDay*` fields set the type.

| Type | Merchant words | `rebillingDay*` | Trials |
|---|---|---|---|
| Independent cycles (adhoc) | "bills on the day they sign up" | not set | yes |
| Synchronized cycles (anchored) | "everyone is billed on the 1st" | set | no |

## Independent cycles (adhoc billing)

Each subscriber's billing repeats from their own signup date. `chargeImmediately` is always 1. Trial fields (`trialPrice`, `trialLengthDays`, `trialSingleOrder`) are available.

All entries in `shipmentSchedule` must use the same format. There are two formats.

### Shipping after billing (buffered)

- `addUnit`: day, week or month. It cannot be larger than `frequencyUnit`.
- `addCount`: how many units after billing. `-1` means one day before the next cycle.

Example: monthly coffee, ships 5 days after billing.

```
frequencyUnit: "month", frequencyCount: 1
shipmentSchedule: [{ addUnit: "day", addCount: 5 }]
```

Signup on Jan 10: billed Jan 10, ships Jan 15. Next bill Feb 10, ships Feb 15.

### Shipping on fixed days (anchored shipping)

- `unitDay`: the day to ship. 1 to 31 for month, 1 to 7 for week.
- `unitOffset`: which unit in the billing cycle, from 0 to `frequencyCount` - 1.

With this format you can set `cutOffDays` and `cutOffTime`. `cutOffDays` is the number of days before a shipment date that gives the merchant time to prepare. A shipment in the cut-off window moves to the next slot. Billing does not move. Subbly checks this at signup and at each renewal.

Example: monthly box, always ships on the 15th.

```
frequencyUnit: "month", frequencyCount: 1
shipmentSchedule: [{ unitDay: 15, unitOffset: 0 }]
cutOffDays: 5
```

Signup on Jan 8: ships Jan 15. Signup on Jan 12 (after the Jan 10 cut-off): ships Feb 15.

`anchorDate: "today"` gives all subscribers the same shipping periods, whatever their signup date. It needs `frequencyCount` > 1. Without it, shipping dates depend on each subscriber's billing date.

Example: billed every 3 months, ships on the 1st of each month.

```
frequencyUnit: "month", frequencyCount: 3, anchorDate: "today"
shipmentSchedule: [
  { unitDay: 1, unitOffset: 0 },
  { unitDay: 1, unitOffset: 1 },
  { unitDay: 1, unitOffset: 2 }
]
cutOffDays: 5
```

Example: billed yearly (anchor Jan 1), ships quarterly, each shipment moves on its own.

```
frequencyUnit: "month", frequencyCount: 12, anchorDate: "today"
shipmentSchedule: [
  { unitDay: 15, unitOffset: 2 },
  { unitDay: 15, unitOffset: 5 },
  { unitDay: 15, unitOffset: 8 },
  { unitDay: 15, unitOffset: 11 }
]
cutOffDays: 14
```

Shipments on Mar 15, Jun 15, Sep 15 and Dec 15. Signup on Jan 1: all 4 shipments. Signup on Jun 5 (after the Mar 1 and Jun 1 cut-offs): Sep 15 and Dec 15 this period. The Mar 15 and Jun 15 shipments move to the next period.

## Synchronized cycles (anchored billing)

Billing is on a fixed calendar day, such as the 1st of the month or every Monday. Use one `rebillingDay*` field:

- `rebillingDay`: daily frequency. It must be 1.
- `rebillingDayOfMonth`: monthly, 1 to 31. It must be the same day as `anchorDate` when that is set.
- `rebillingDayOfWeek`: weekly, 1 to 7 (ISO, 1 is Monday). It must be the same weekday as `anchorDate` when that is set.

`cutOffDays` and `cutOffTime` are required. The cut-off counts back from the first shipment in the cycle, and it applies to the first purchase only. After the cut-off, the full billing cycle moves to the next cycle. After signup, billing is always on the fixed day.

If a subscriber signs up after the billing day but before the cut-off, Subbly charges at once, whatever `chargeImmediately` says.

Shipping uses the fixed day format only (`unitDay`, `unitOffset`).

### Soft anchored: no `anchorDate`

Subscribers bill on the same day, but their cycles start at different times. Week and month only, no daily frequency.

Example: monthly, billed on the 1st, ships on the 5th.

```
frequencyUnit: "month", frequencyCount: 1
rebillingDayOfMonth: 1
shipmentSchedule: [{ unitDay: 5, unitOffset: 0 }]
cutOffDays: 3
```

The cut-off is Jan 2 (3 days before the Jan 5 shipment). Signup Dec 30: billed Jan 1, ships Jan 5. Signup Jan 2 (after the billing day, on the cut-off day): charged at once, ships Jan 5. Signup Jan 3 (after the cut-off): the cycle moves, billed Feb 1, ships Feb 5.

### Hard anchored: `anchorDate` set

All subscribers share the same billing periods. There are no partial cycles. It needs `frequencyCount` > 1. Daily frequency needs `frequencyCount` of 2 or more and an `anchorDate`.

Example: billed every 3 months, ships monthly, all subscribers together.

```
frequencyUnit: "month", frequencyCount: 3, anchorDate: "2026-01-01"
rebillingDayOfMonth: 1
shipmentSchedule: [
  { unitDay: 10, unitOffset: 0 },
  { unitDay: 10, unitOffset: 1 },
  { unitDay: 10, unitOffset: 2 }
]
cutOffDays: 5
```

The cycle is Jan 1 to Apr 1. The cut-off is Jan 5 (5 days before the first shipment, Jan 10). Signup Dec 20: billed Jan 1, ships Jan 10, Feb 10 and Mar 10. Signup Jan 3 (after the billing day, before the cut-off): charged at once, same shipments. Signup Jan 7 (after the cut-off): billed Apr 1, ships Apr 10, May 10 and Jun 10. All 3 shipments move together.

## Same or different rhythm

- **Same rhythm:** bill monthly, ship monthly. One entry in `shipmentSchedule`.
- **Prepaid:** bill less often than you ship. Example: bill every 3 months, ship each month, so 3 entries. The customer pays first for many shipments.

The number of entries in `shipmentSchedule` is the number of shipments in each billing cycle.

## Tell the user

Describe the schedule in plain words before you create the plan. Example: "Customers are billed on the 1st of every third month and get a box on the 10th of each month. Customers who sign up after the 5th start in the next cycle."
