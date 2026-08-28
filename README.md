# Checkoff

A password-free, realtime-synced checklist backed by Supabase. Everyone opening the app shares the same list and can add, rename, check, filter, annotate, and delete items from any device.

## Local development

```bash
npm install
npm run dev
```

The browser client uses a Supabase publishable key. Row-level security explicitly permits shared anonymous access, so anyone with the app URL can view and modify the list.

## Database

The app uses `public.checkoff_todo_items_v1` in the `bnaimitzvah` Supabase project. The matching SQL is stored in `supabase/migrations/` for reproducibility.

## Deployment

Pushes to `main` deploy automatically with GitHub Pages.
