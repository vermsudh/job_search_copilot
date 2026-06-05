# Setup

## 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) → **New project**. Pick a name, a strong DB password, and a region close to you. Free tier is fine.
2. Wait for it to provision (~2 min).

## 2. Run the schema

1. In the Supabase dashboard → **SQL Editor** → **New query**.
2. Paste the entire contents of [`supabase/migrations/0001_init.sql`](../supabase/migrations/0001_init.sql) and click **Run**.
3. This creates the `profiles` and `jobs` tables, the status enum, triggers, and RLS policies.

## 3. Configure auth (magic link)

1. **Authentication → Providers → Email**: make sure **Email** is enabled. (Magic links work with the default email provider.)
2. **Authentication → URL Configuration**:
   - **Site URL**: `http://localhost:3000`
   - **Redirect URLs**: add `http://localhost:3000/auth/callback` (and later your Vercel URL + `/auth/callback`).

## 4. Add environment variables

1. Copy the example file:
   ```bash
   cp .env.local.example .env.local
   ```
2. In Supabase → **Project Settings → API**, copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Add your **Gemini API key** (from [aistudio.google.com](https://aistudio.google.com/app/apikey)) → `GEMINI_API_KEY`.

## 5. Run

```bash
npm run dev
```

Open `http://localhost:3000`, enter your email, click the magic link in your inbox, and you're in.

> The Gemini key is only read server-side (in the API route handlers) and is never shipped to the browser.
