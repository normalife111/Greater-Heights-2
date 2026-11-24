# SAVORA — Afro-Continental Bistro

Website and (in later phases) reservation and restaurant management platform for SAVORA.
Built with React + Vite. Supabase (PostgreSQL, Auth, Storage, Edge Functions) is the planned backend.

## Status: Phase 1 of 7 complete — brand system and public website

| Phase | Scope | Status |
|---|---|---|
| 1 | Brand system, public pages | ✅ Done |
| 2 | Supabase schema, migrations, RLS, roles | Not started — needs a Supabase project |
| 3 | Customer accounts | Not started |
| 4 | Reservation engine (server-side capacity checks) | Not started |
| 5 | Admin dashboard | Not started |
| 6 | Payments (Paystack/Flutterwave), email, notifications | Not started — needs provider accounts |
| 7 | QA and deployment | Not started |

## Run locally

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build in dist/
```

Copy `.env.example` to `.env.local` once a Supabase project exists. Never commit `.env*` files.

## What works now

- Pages: Home, Our Story, Menu, Reservations, Gallery, Events, Contact, 404.
- Menu: category filters, search, empty state, "unavailable" state, dish detail dialog.
- Gallery: category filters and a keyboard-accessible lightbox (← / → / Esc).
- Forms (reservation, event enquiry, contact, newsletter): full validation, accessible errors,
  loading states, spam honeypot.
- Responsive header with mobile menu; skip link; visible focus states; reduced-motion support.

## Honest limitations (by design until later phases)

- **No form saves anything yet.** Without a backend, every form says clearly that nothing was
  saved and asks the guest to call or email. No fake confirmations.
- **All content is sample or placeholder.** Address, phone, email, hours, social links, menu
  items, prices, chef profiles, testimonials and history are labelled on the page as
  placeholders. Replace them with verified information before launch (Phase 2 moves them into
  the database and Phase 5 makes them editable in the admin).
- **No photography.** Each image frame says which shot is needed. Reference B was used only
  for art direction; its pictures contain another brand's logo and must not be used.
- Booking times shown are only a guide from opening hours. The server will be the authority on
  availability (Phase 4).
- No customer sign-in link in the header yet; it is added with accounts in Phase 3.

## Project structure

```
public/brand/          Original logo, favicon
src/assets/            Logo badge (cropped from the supplied logo, not redrawn)
src/styles/tokens.css  Design tokens: colour, type, spacing
src/styles/global.css  Components and layout
src/data/sample.js     Labelled sample/setup data (future seed source only)
src/services/          The only data access layer; swaps to Supabase in Phase 2
src/components/        Header, Footer, Dish card/dialog, form fields, placeholders
src/pages/             One file per route
```

## What the owner needs to supply

1. Verified address, phone, email, opening hours, social links.
2. Real menu: categories, dishes, descriptions, prices (NGN), allergens.
3. Approved photography (hero dish, dining room, dishes, team portraits).
4. Story, chef names and bios, testimonials (with consent).
5. Booking policies: max party size, notice, cancellation, deposits.
6. A Supabase project (URL + anon key), and later Paystack/Flutterwave and Resend accounts.

## Deployment

Static build (`dist/`). `public/_redirects` (Netlify) and `vercel.json` (Vercel) send all
routes to `index.html` so deep links like `/menu` work.
