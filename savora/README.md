# SAVORA — Afro-Continental Bistro

Website and (in later phases) reservation and restaurant management platform for SAVORA.
Built with React + Vite. Supabase (PostgreSQL, Auth, Storage, Edge Functions) is the planned backend.

## Status: Phases 1–2 of 7 complete

| Phase | Scope | Status |
|---|---|---|
| 1 | Brand system, public pages | ✅ Done |
| 2 | Supabase schema, migrations, RLS, roles | ✅ Done — tested on local PostgreSQL; not yet applied to a live Supabase project |
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

## Database (Phase 2)

All schema lives in `supabase/migrations/` as versioned SQL, in order:

| File | Contents |
|---|---|
| `0100_foundation` | Extensions, enums, `updated_at` trigger, booking-reference generator |
| `0200_people_and_roles` | `profiles` (auto-created on sign-up), `roles`, `permissions`, `role_permissions`, `staff_members`, `customer_notes`, `has_permission()` |
| `0300_restaurant_config` | `restaurant_settings` (public profile + booking policy), `restaurant_private_settings`, `opening_hours`, `service_periods`, `closures`, `dining_areas`, `restaurant_tables` |
| `0400_reservations` | `reservations`, `reservation_notes`, `waitlist_entries` |
| `0500_content` | `menu_categories`, `menu_items`, `gallery_images`, `content_sections`, `chef_profiles`, `testimonials` |
| `0600_enquiries_payments_ops` | `event_enquiries`, `contact_messages`, `newsletter_subscribers`, `payments`, `payment_webhook_events`, `notifications`, `email_log`, `activity_logs` + audit triggers |
| `0700_row_level_security` | RLS on every table and all access policies |
| `0800_storage` | `menu`, `gallery`, `content` buckets and upload policies |

**How overbooking is prevented.** Each active booking holds one table for its time window. A
PostgreSQL exclusion constraint (`reservations_no_table_overlap`) makes two overlapping active
bookings on the same table impossible, even when both arrive at the same instant. A trigger rejects
parties bigger than the table. The concurrency test proves this with two simultaneous sessions.

**Roles.** Super Admin, Manager, Reservation Staff and Content Manager, each a set of granular
permissions (e.g. `reservations.manage`, `menu.manage`). Policies check permissions, never role
names. Managers can change booking policy but not the restaurant's identity/contact details, staff
or deposit/email settings.

**Public forms** (bookings, enquiries, contact, newsletter) have no insert policy for browsers. They
will be written by Edge Functions with the service role after validation and rate limiting.

**Audit log.** Staff changes to bookings, menu, settings, staff and more are logged with who, what
table/row, which columns changed and when. Values are not copied, so no personal data ends up in logs.

### Set up Supabase

1. Create a project at supabase.com (region close to Nigeria, e.g. EU West / Frankfurt).
2. Install the Supabase CLI, then from `savora/`:
   ```bash
   supabase link --project-ref <your-project-ref>
   supabase db push            # applies every migration in order
   ```
   Or paste each migration file into the SQL editor, in filename order.
3. Development/staging only: run `supabase/seed/demo.sql` to load the labelled sample data.
   Never load it into production.
4. Set Authentication → URL configuration to the site URL, and enable email confirmations.
5. Sign up on the site with the owner's email, then run `supabase/seed/make_super_admin.sql`
   (with the email filled in) to make that account Super Admin.
6. Copy the project URL and **anon** key into `.env.local`. The site switches from sample data to
   the database automatically. The service-role key must never go in the frontend.

### Run the database tests locally

Needs PostgreSQL 16 with `btree_gist`. Tests use small stand-ins for Supabase's `auth` and
`storage` schemas (`supabase/tests/supabase_stubs.sql`), so never run them against a real project.

```bash
npm run test:db        # set PGHOST/PGPORT for your server
```

Covers: what visitors, customers and each staff role can and can't read or change; privilege
escalation; audit logging; double-booking (including two simultaneous requests); oversize parties;
unverified payments; duplicate newsletter sign-ups; RLS enabled everywhere; and the frontend
mappers against real rows.

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
  placeholders. With Supabase connected they come from the database; Phase 5 makes them
  editable in the admin.
- **Photography.** The home hero uses the SAVORA image supplied by the owner (cropped to remove
  its baked-in text). Every other frame says which shot is needed. Reference B from the brief was
  used only for art direction; its pictures show another brand's logo and must not be used.
- **Not yet run against a live Supabase project.** The migrations and policies are tested on
  local PostgreSQL with stand-ins for Supabase's auth and storage. The first `supabase db push`
  is the real check.
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
src/services/          The only data access layer (Supabase when configured, samples otherwise)
supabase/migrations/   Versioned SQL schema, RLS and storage
supabase/seed/         Labelled demo data (generated) and the first-admin script
supabase/tests/        Database security, concurrency and mapper tests
scripts/               Demo-seed generator
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
