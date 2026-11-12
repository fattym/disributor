# Learning Pack 3D Supermarket (React Three Fiber + Django)

A walkable 3D school-supplies store: third-person shopper with trolley, shelves of clickable books, NPC shoppers, a street outside,
a gamified HUD (XP, coins, quests), booklist shopping and an M-Pesa checkout.

## Frontend (runs offline in demo mode)
```
npm install
npm run dev        # http://localhost:5173
```
Controls: WASD/arrows move, drag to rotate, wheel to zoom, click a book to pick it up, click NPCs to chat, collect coins.
Mobile: on-screen joystick. Set `VITE_API_URL` (see `.env.example`) to use the Django API; unset = clearly-labelled demo checkout.
Note: 3D text (aisle signs) loads troika's default font from a CDN. For fully offline use, pass a local `font` prop to `<Text>`.

Structure: `src/world` (3D scene), `src/ui` (HTML/CSS overlays), `src/store/useShop.js` (zustand: cart, XP, panels, persisted),
`src/data` (catalogue + shelf layout), `src/api.js` (Django calls).

## Characters (Mixamo / Blender)
See `public/models/README.md`. Missing `.glb` files fall back to a procedural person, so the app always runs.
Note: Ready Player Me shut down on 31 Jan 2026, so use Mixamo or free CC0 packs (Quaternius, Kenney) instead.

## Backend (Django REST + PostgreSQL)
```
cd backend && python -m venv .venv && . .venv/bin/activate && pip install -r requirements.txt
django-admin startproject config . && python manage.py startapp shop   # then overwrite shop/ with the files here
# merge settings_snippet.py into config/settings.py, add path("api/", include("shop.urls")) to config/urls.py
python manage.py makemigrations shop && python manage.py migrate && python manage.py createsuperuser && python manage.py runserver
```
Load products, schools and booklists through the admin (or a fixture built from `src/data/catalogue.js`).

### M-Pesa flow
1. `POST /api/checkout/` re-prices the order from the database (client prices are ignored), creates a pending Order and sends an STK push.
2. The customer approves on their phone. Safaricom calls `/api/mpesa/callback/<secret-token>/`.
3. The callback is re-verified with an STK Query call and the amount is compared before the order is marked paid (idempotent).
4. The frontend polls `GET /api/orders/<uuid>/` (see `orderStatus` in `src/api.js`); never mark an order paid from the browser.

Before going live: HTTPS only, keep keys in environment variables, add Safaricom IP allow-listing at your proxy, and test in the Daraja sandbox first.

## Next steps
Use `InstancedMesh` for shelf items (fewer draw calls on phones), compress textures (KTX2), add LOD for far aisles,
baked lightmaps from Blender for photoreal lighting, and replace NPC click-tips with a real quest system.
