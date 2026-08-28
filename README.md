# Checkoff

A private, realtime-synced checklist backed by Supabase. Each account gets its own list and can add, rename, check, filter, annotate, and delete items from any device.

## Local development

```bash
npm install
npm run dev
```

The browser client uses a Supabase publishable key. Database access is protected by row-level security, so users can only access their own rows.

## Database

The app uses `public.checkoff_todo_items_v1` in the `bnaimitzvah` Supabase project. The matching SQL is stored in `supabase/migrations/` for reproducibility.

## Deployment

Pushes to `main` deploy automatically with GitHub Pages.
