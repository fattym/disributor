# Learning Pack 3D Supermarket

A working end-to-end e-commerce prototype: a client-rendered React Three Fiber 3D
supermarket, a real Django product catalogue, school-specific booklists, a
persistent shopping cart, checkout and M-Pesa payments.

## Repository layout

```
my-django-project/
├── backend/                 # Django REST API (Django + DRF + PostgreSQL)
│   ├── shop/                # catalogue (Product, ProductVariant, Order, Payment) + M-Pesa
│   ├── storefront/          # 3D shelf sections + product-to-model mappings
│   ├── carts/               # persistent per-user cart (server-authoritative)
│   ├── booklists/           # schools, grades, academic years, booklists
│   ├── core/                # settings, URL routing, versioned API
│   └── manage.py
└── distributor/             # Next.js 16 / React 19 / TypeScript frontend
    ├── app/
    │   ├── supermarket/     # 3D supermarket route (school/grade selectors + 3D/2D toggle)
    │   ├── cart/            # checkout: cart -> delivery -> M-Pesa -> confirm
    │   ├── shop/            # 2D catalogue browse
    │   └── orders/          # order history
    ├── components/supermarket/   # 3D scene, shelves, character, trolley, mobile controls
    └── lib/                 # cart, API client, storefront types, 3D state store
```

## Environment variables

Frontend (distributor/.env.local):

```
NEXT_PUBLIC_API_URL=http://localhost:8000/api
DJANGO_API_URL=http://localhost:8000/api
NODE_ENV=development
```

Backend (backend/.env). The key ones for this prototype:

```
DJANGO_SETTINGS_MODULE=core.settings
SECRET_KEY=django-insecure-CHANGE-THIS
DATABASE_URL=postgres://school_user:school_pass@localhost:5432/school_mgmt
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:3000
CHAMAGO_API_KEY=          # leave empty -> sandbox M-Pesa mode (see below)
CHAMAGO_API_URL=https://api.chamago.co.ke
MPESA_ENVIRONMENT=sandbox
```

Leave `CHAMAGO_API_KEY` empty for local development. The `shop` app's
`ChamaGoIntegrator` then runs in **sandbox mode**: `pay_mpesa` returns a mock
`checkout_request_id` (`SANDBOX-…`) and `confirm-payment` marks the order paid.
Set `CHAMAGO_API_KEY` to a live aggregator key for production.

## Starting the application

```bash
# Backend (Django) — port 8000
cd backend
venv/bin/python manage.py migrate
venv/bin/python manage.py runserver 127.0.0.1:8000

# Frontend (Next.js) — port 3000
cd distributor
npm run dev
```

Open http://localhost:3000/supermarket. Select a school and grade, then choose a
booklist and click **Complete This Pack**. Switch to **2D Grid** at any time.
The persistent cart overlay links to `/cart` for checkout.

## Seed data

Run the migrations — the catalogue, shelf sections, model mappings, sample
school/grade/booklist and 18 shelf products are created by the app's seed
migrations (see `backend/shop/`, `storefront/`, `booklists/`).

## M-Pesa flow (sandbox)

1. Parent places an order → `POST /api/shop/orders/` (`{learner, items:[{variant|product, quantity}]}`).
2. `POST /api/shop/orders/{id}/pay_mpesa/` with `{phone}` → sandbox STK push,
   `checkout_request_id` returned, `Payment` created with status `initiated`.
3. `POST /api/shop/orders/{id}/confirm-payment/` with `{mpesa_receipt_number}`
   → order status `pending_payment` → `paid`, payment confirmed.
4. Fulfilment: `confirm_delivery` → `delivered`; an admin releases escrow funds.

The order lifecycle is `pending_payment → paid → ready_for_pickup → picked_up →
delivered`. Escrow funds are `HELD` until delivery is confirmed and an admin
releases them.

## Admin

Django admin is registered for catalogue, storefront, carts, booklists and orders
at http://localhost:8000/admin/.

## Tests

```bash
cd backend
venv/bin/python manage.py test shop storefront carts booklists
```

15 tests pass, including `test_mpesa_sandbox_stk_and_confirm` which exercises the
full sandbox M-Pesa order → STK push → confirm → paid lifecycle.

## Known limitations / blockers

- The 3D scene is verified to compile, mount and render without runtime errors
  (dev server logs are clean; `next build` succeeds). Visual verification of the
  WebGL canvas requires a browser.
- Live M-Pesa requires `CHAMAGO_API_KEY` (and production `MPESA_*` credentials);
  sandbox mode is used until then.
- Payment callbacks are handled by the `confirm-payment` endpoint (idempotent);
  real Daraja callbacks would route through the existing `webhooks/chama/` hook.