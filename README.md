# Velure Coffee

React + Vite storefront for Velure Coffee.

## Scripts

- `npm run dev` starts the local app.
- `npm run build` creates the production build in `dist/`.
- `npm run preview` serves the production build locally.
- `npm run lint` runs ESLint.

## Forms API

The project includes a built-in forms endpoint at `/api/forms`:

- `api/forms.js` validates `contact` and `newsletter` submissions.
- It applies a basic per-IP rate limit.
- It supports honeypot fields to reduce bot spam.
- It can enforce an origin allowlist.
- It can enforce a shared challenge token.
- If `FORMS_WEBHOOK_URL` is set in your server environment, validated submissions are forwarded there.
- If `FORMS_WEBHOOK_SECRET` is set, webhook payloads are signed.

Frontend form requests use `VITE_FORMS_ENDPOINT`, defaulting to `/api/forms`.

## Checkout API

The project also includes `/api/checkout`:

- Recalculates totals server-side from trusted product IDs and quantities.
- Returns a checkout URL to open in PayPal.
- Supports origin allowlisting with `CHECKOUT_ALLOWED_ORIGINS` (or `FORMS_ALLOWED_ORIGINS` fallback).
- Uses `PAYPAL_CHECKOUT_EMAIL` (or `PAYPAL_EMAIL`) from server environment.

## Environment Variables

Copy `.env.example` to `.env.local` for local overrides:

- `VITE_FORMS_ENDPOINT` (frontend): endpoint for form submissions.
- `VITE_FORMS_CHALLENGE_TOKEN` (frontend): optional token sent with form requests.
- `FORMS_WEBHOOK_URL` (server): optional webhook target for validated submissions.
- `FORMS_ALLOWED_ORIGINS` (server): comma-separated allowed origins for `/api/forms`.
- `FORMS_CHALLENGE_TOKEN` (server): optional token required on incoming form requests.
- `FORMS_WEBHOOK_SECRET` (server): optional HMAC secret for signed webhook forwarding.
- `PAYPAL_CHECKOUT_EMAIL` (server): PayPal recipient email for checkout URL generation.
- `CHECKOUT_ALLOWED_ORIGINS` (server): optional allowlist for `/api/checkout`.

## Webhook Signature

When `FORMS_WEBHOOK_SECRET` is configured, forwarded webhook requests include:

- `X-Velure-Timestamp`
- `X-Velure-Signature` (hex HMAC-SHA256 of the raw JSON body)

Verify the signature in your webhook consumer using the same secret before processing.
