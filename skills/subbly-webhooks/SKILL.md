---
name: subbly-webhooks
description: "Set up and debug Subbly webhooks: create an endpoint that receives store events (new subscription, renewal, order, payment, customer changes), choose event types, pause or delete an endpoint, rotate the signing secret, send a test ping, find failed deliveries, explain why a receiver fails, and resend or retry deliveries. Use when the user mentions webhooks, event notifications, an integration that stopped getting events, Zapier or Make hooks, or a signing secret."
---

# Subbly webhooks

Read the `subbly` skill first for the safety rules.

A webhook **endpoint** is a URL that receives store **events**. Each event to each endpoint is a **delivery**. A delivery has one or more **attempts**.

Most webhook tools that change something also send real HTTP requests to the endpoint URL. Tell the user before you call them.

## Set up an endpoint

1. `list_webhook_event_types` to find the exact event names. Filter by subject type, a pattern, or a text search. Do not guess names.
2. Collect: the HTTPS `url`, the events (`enabledEvents`), an optional `description`, and an `alertEmail` for failure alerts.
3. `get_webhook_stats` shows the endpoint limit. Check it before you create one.
4. Get a "yes". `create_webhook_endpoint` **sends a test ping to the URL now**.
5. The response holds the signing `secret`. It is shown **only once**. Give it to the user and tell them to store it safely, for example in their receiver's secret settings. Do not put it in any other place.

The receiver uses the secret to check the signature of each delivery. Subbly signs deliveries with the [Standard Webhooks](https://www.standardwebhooks.com) scheme. Each event's `data` in `list_webhook_events` has the keys exactly as the receiver gets them; use it to show a developer a real sample. An event's `entity` names the record inside the subject that the event is about, for example the item of a `subscription.item.*` event or the discount of a `subscription.discount.*` event (`type` and `id`). It is null when the event names no such record. New `type` values can appear, so tell developers not to reject unknown ones.

## Change an endpoint

`update_webhook_endpoint` changes only the fields you send.

- **Events:** send `enabledEvents` to replace the list, or `addEvents` and `removeEvents` to edit it. Not both.
- **Pause:** `status: "disabled"`. Pending deliveries are skipped. This is the safe choice instead of delete.
- **Resume:** `status: "enabled"`. With `resendSince`, Subbly also sends again the deliveries since that time, **as real requests now**. `meta.resentDeliveries` gives the count. Ask the user for the time, and tell them the receiver gets those events again.
- **Delete:** `delete_webhook_endpoint` cannot be undone. Pending deliveries are skipped. Past events and deliveries stay in the lists, and `list_webhook_deliveries` still filters by the deleted endpoint's ID. A deleted endpoint's deliveries cannot be retried. Explicit "yes".

## Rotate the secret

`rotate_webhook_endpoint_secret` makes a new secret. The response shows it once; give it to the user.

- By default the old secret works for 24 hours (`gracePeriodSeconds`). During that time each delivery has two signatures. The user updates the receiver in that time.
- `gracePeriodSeconds: 0` stops the old secret at once, and the receiver rejects deliveries until it has the new secret. Use 0 only when the secret leaked. Explicit "yes".

## Debug a receiver

1. `get_webhook_stats`: deliveries and successes in the last 24 hours, scheduled deliveries, and failing endpoints.
2. `get_webhook_endpoint`: status, the reason it is disabled (`manual`, `failing`, `gone`, `blocked`, `plan`), failing since, failures in a row, last success and last failure.
3. `list_webhook_deliveries` with `endpointId` and `status: "failed"`. Delivery statuses: `scheduled`, `queued`, `in_flight`, `succeeded`, `failed`, `skipped`.
4. `get_webhook_delivery`: each attempt has the HTTP status code, error, response body and headers, and duration. Explain the cause in plain words:
   - 401 or 403: the receiver rejects the signature or needs other auth. Check the secret.
   - 404 or 410: wrong URL, or the receiver is gone.
   - 5xx or timeout: the receiver has an error or is too slow.
   - Failure reason `exhausted`: all retries failed. `endpoint_disabled`: the endpoint was off.
5. `list_webhook_events` with `delivered: 0` finds events with a delivery that did not succeed. `get_webhook_event` shows all deliveries of one event.

## Test and retry

- `ping_webhook_endpoint` sends a real test event now. Use it after the user fixes the receiver.
- `retry_webhook_delivery` sends one delivery again now. The delivery must be finished (succeeded, failed or skipped), and the endpoint must be enabled and not deleted. When the endpoint was disabled and missed many events, enable it with `update_webhook_endpoint`, `status: "enabled"` and `resendSince`, instead of many retries.

The receiver can get the same event more than once. Tell developers to make the receiver safe for repeats, by the event ID.
