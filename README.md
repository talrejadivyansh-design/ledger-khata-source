# Ledger Khata

A dealer ledger app modeled on the "Anand Electric, Ayodhya" paper ledger book: Date, Bill No., Debit, Credit, and running Balance per dealer (Signature and Claim columns are intentionally left out).

- **Add/search dealers** and record Debit/Credit entries; the running balance is calculated automatically by a database trigger.
- **Scan a ledger photo**: upload a photo of a paper ledger page, OCR reads it in the browser and proposes rows, which you review/edit before saving. Handwriting recognition isn't perfect, so this is a starting point, not an auto-save.
- **Login required**: each account only sees its own dealers/entries (Supabase Auth + Postgres row-level security).
- **Responsive + installable**: works as a normal website and can be installed to a phone's home screen (PWA), so it behaves like a mobile app without a separate native build.

## Stack

- **Backend**: Supabase (Postgres, Auth, row-level security). No separate server to run or deploy — the React app talks to Supabase directly.
- **Frontend** (`client/`): React + Vite + Tailwind, `@supabase/supabase-js`, `tesseract.js` (in-browser OCR), `vite-plugin-pwa`.

## Database

Project: `ledger-khata` (Supabase, `ap-south-1`).

- `dealers`, `entries` tables, both with RLS scoped to `auth.uid() = user_id`.
- `dealer_summary` view adds each dealer's current balance (`security_invoker`, so it still respects RLS).
- A trigger (`entries_after_change` → `recalc_dealer_balances`) recomputes the running balance for a dealer any time its entries change (insert/update/delete), the same way the paper ledger's Balance column works: `balance = previous balance + debit - credit`. Verified against this ledger's own 5 rows (16240 → 11240 → 22460 → 12460) — matches exactly.

## Running locally

```bash
cd client
npm install
npm run dev
```

Open http://localhost:5173, sign up with an email/password, and start adding dealers. Copy `client/.env.example` to `client/.env` and fill in your Supabase project URL + anon/publishable key if you're pointing at a different project (the current project's values are already in `client/.env`, which is gitignored since local env files shouldn't be committed even though these particular keys are safe to expose client-side).

On a phone, once the app is deployed to a public URL, open it there and use "Add to Home Screen" to install it.
