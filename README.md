# QRPay Armenia — MVP scaffold

QR-code bill payment for restaurants/cafes/bars/pubs. Customers scan a table QR,
select items (or split evenly), add a tip, and pay with Idram or a Visa/Mastercard
— no app install. Business owners manage tables, bills, menu, and (optionally)
in-app ordering from `/admin`. Platform revenue is a per-transaction fee
(`Business.feePercent`, defaults to 2%), snapshotted onto every `Payment`.

## Stack

- Next.js 16 (App Router, Server Actions), React 19, Tailwind v4
- Prisma 7 + SQLite for local dev (driver-adapter based — see `src/lib/db.ts`)
- Cookie-based JWT sessions for merchant auth (`jose` + `bcryptjs`)
- `qrcode` for generating table QR PNGs

## Getting started

```bash
npm install
npx prisma migrate deploy   # creates dev.db from prisma/migrations
npx tsx prisma/seed.ts      # demo business "Cascade Cafe" + 3 tables + an open bill
npm run dev
```

Demo merchant login: `demo@qrpay.am` / `password123` at `/admin/login`.
The seed script prints Table 1's QR token — visit `/pay/<token>` to see the
customer payment flow for its open bill.

## How payments work right now

`PAYMENTS_MODE=mock` (the `.env` default) uses `src/lib/payments/mock.ts`,
which marks every payment as succeeded immediately — no real money moves.
This lets you build/test the whole item-split + tip + bill-closing flow
without Idram credentials.

`src/lib/payments/idram.ts` and `src/app/api/webhooks/idram/route.ts` are a
**scaffold, not a verified integration**. They mirror Idram's historically
documented redirect-based `EDP_*` checkout flow (the same hosted page lets a
customer pay from their Idram wallet or a bound Visa/Mastercard, which is why
one integration covers both payment methods this app offers). But exact field
names, the checksum algorithm, and the webhook payload are not something I
could verify without your actual merchant credentials — Idram issues an
integration guide when you sign the merchant agreement. **Before setting
`PAYMENTS_MODE=idram`, get that document and update both files to match it.**
Both files have inline comments marking exactly what to check.

## Data model (`prisma/schema.prisma`)

- `Business` — a HoReCa venue (the merchant account), `feePercent`,
  `orderingEnabled` toggle, future `idramMerchantId` for payouts.
- `Table` — one per physical table, holds the stable `qrToken` printed on
  its QR. Which bill it resolves to changes as bills open/close.
- `Bill` / `BillItem` — opened by staff, holds line items customers pay
  against. `BillItem.quantityPaid` is a best-effort display hint for the
  "pay specific items" UI; the source of truth for whether a bill is fully
  paid is the sum of successful payments (see `src/lib/billing.ts`), so an
  evenly-split payment (which doesn't map to specific items) still closes
  the bill correctly.
- `Payment` / `PaymentItemShare` — one customer payment, optionally tied to
  specific bill items, with `tipAmountAmd` and a snapshotted
  `platformFeeAmd`.
- `Order` / `OrderItem` — the optional "order after scan" flow, gated by
  `Business.orderingEnabled`.

## What's not built yet

- Real Idram integration (see above) and a payouts/reconciliation view for
  `platformFeeAmd`.
- POS integration — bills are entered manually by staff (chosen for the
  MVP scope).
- Multi-staff accounts per business (currently one login per business).
- Production datasource — swap `prisma/schema.prisma`'s `provider` to
  `postgresql`, point `DATABASE_URL` at a real Postgres instance, and swap
  `src/lib/db.ts`'s adapter to `@prisma/adapter-pg`.
- Automated tests.
