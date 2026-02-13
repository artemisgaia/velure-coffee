# Velure Coffee

React + Vite storefront for Velure Coffee.

## Account Auth

The project includes account sign-up and sign-in in `src/App.jsx` using Supabase Auth (email/password).

Required frontend environment variables:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

When these are missing, account actions return a clear setup error.

## Scripts

- `npm run dev` starts the local app.
- `npm run build` creates the production build in `dist/`.
- `npm run preview` serves the production build locally.
- `npm run lint` runs ESLint.

## Static Checkout (Premium Flow)

The project now includes a dedicated static checkout page with mobile-first UX:

- `checkout.html`
- `styles/main.css`
- `scripts/checkout.js`

This checkout uses Stripe Payment Element and Vercel serverless APIs:

- `GET /api/stripe-config`
- `POST /api/create-payment-intent`

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
- Supports optional rewards redemptions via `rewardId` (`five_off`, `free_shipping`).
- Accepts optional `customerName` and `customerEmail` to prefill customer data.
- Supports `uiMode`:
  - `embedded`: returns `clientSecret` and `checkoutSessionId` for in-page embedded Stripe Checkout.
  - `hosted` (fallback): returns `checkoutUrl` for hosted redirect.
- Embedded checkout is configured to collect billing address, shipping address, phone, and country directly in Stripe UI.
- Returns computed pricing breakdown (`subtotal`, `shipping`, `rewardDiscount`, `total`) and `earnablePoints`.
- Supports origin allowlisting with `CHECKOUT_ALLOWED_ORIGINS` (or `FORMS_ALLOWED_ORIGINS` fallback).
- Uses `STRIPE_SECRET_KEY` from server environment.

For the static checkout page, use these APIs instead:

- `GET /api/stripe-config`: returns publishable key presence and checkout shipping/tax config.
- `POST /api/create-payment-intent`: validates cart + shipping inputs, enforces shipping constraints, computes package-weight shipping by country zone, and creates/updates Stripe PaymentIntent metadata.

## Rewards Sync API

The project includes `/api/rewards` for cross-device rewards sync tied to authenticated users:

- Verifies Supabase user access tokens from `Authorization: Bearer <token>`.
- `GET /api/rewards`: returns stored rewards profile for the signed-in user.
- `PUT /api/rewards`: saves sanitized rewards profile for the signed-in user.
- Uses Supabase PostgREST with service-role credentials on the server.

Create the required table/policies in Supabase using:

- `supabase/rewards_profiles.sql`

## Environment Variables

Copy `.env.example` to `.env.local` for local overrides:

- `VITE_FORMS_ENDPOINT` (frontend): endpoint for form submissions.
- `VITE_FORMS_CHALLENGE_TOKEN` (frontend): optional token sent with form requests.
- `VITE_STRIPE_PUBLISHABLE_KEY` (frontend): Stripe publishable key used to render embedded checkout.
- `STRIPE_PUBLISHABLE_KEY` (server): Stripe publishable key returned by `/api/stripe-config` for static checkout.
- `FORMS_WEBHOOK_URL` (server): optional webhook target for validated submissions.
- `FORMS_ALLOWED_ORIGINS` (server): comma-separated allowed origins for `/api/forms`.
- `FORMS_CHALLENGE_TOKEN` (server): optional token required on incoming form requests.
- `FORMS_WEBHOOK_SECRET` (server): optional HMAC secret for signed webhook forwarding.
- `STRIPE_SECRET_KEY` (server): Stripe secret key for creating checkout sessions.
- `CHECKOUT_ALLOWED_ORIGINS` (server): optional allowlist for `/api/checkout`.
- `CHECKOUT_SHIPPING_COUNTRIES` (server): optional comma-separated ISO country codes for shipping address collection (defaults to the built-in shipping matrix).
- `CHECKOUT_TAX_RATE_US` (server): optional tax rate decimal for US (example `0.0825`).
- `CHECKOUT_TAX_RATE_DEFAULT` (server): optional fallback tax rate decimal.
- `PUBLIC_SITE_URL` (server): optional canonical site origin used for Stripe success/cancel URLs.
- `VITE_SUPABASE_URL` (frontend): Supabase project URL for auth.
- `VITE_SUPABASE_ANON_KEY` (frontend): Supabase anon public key for auth requests.
- `VITE_REWARDS_ENDPOINT` (frontend): optional rewards sync endpoint override (default `/api/rewards`).
- `SUPABASE_URL` (server): Supabase URL for rewards sync API.
- `SUPABASE_ANON_KEY` (server): Supabase anon key used for token verification in rewards API.
- `SUPABASE_SERVICE_ROLE_KEY` (server): Supabase service-role key used by rewards sync API.
- `REWARDS_ALLOWED_ORIGINS` (server): optional allowlist for `/api/rewards`.

## Webhook Signature

When `FORMS_WEBHOOK_SECRET` is configured, forwarded webhook requests include:

- `X-Velure-Timestamp`
- `X-Velure-Signature` (hex HMAC-SHA256 of the raw JSON body)

Verify the signature in your webhook consumer using the same secret before processing.
