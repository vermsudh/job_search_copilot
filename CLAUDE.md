# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

> Heed the warning above: this is **Next.js 16** (App Router, Turbopack, React 19). Conventions differ from older Next — e.g. the `middleware` file convention is renamed to `proxy` (`src/proxy.ts` exporting `proxy`), and `cookies()` is async.

## Commands

```bash
npm run dev     # dev server on :3000
npm run build   # production build (also the type-check gate — run before declaring done)
npm run lint    # ESLint
```

There is no test suite configured. The "build passes" check is `npm run build` (it runs TypeScript).

To run/preview locally you need a real Supabase project and `.env.local` — see `docs/SETUP.md`. Without env vars, every route redirects to `/login` and Supabase calls fail.

## What this app is

A personal job-application tracker: a Kanban pipeline (Wishlist → Applied → Interviewing → Offer → Rejected) of draggable job cards. Opening a card runs a Gemini "Generate Kit" action producing a tailored cover letter, rewritten resume bullets, five interview questions, and a one-page company brief, tailored using a stored resume. Single-user-per-account, **email/password auth** (not magic-link).

## Architecture

**Stack:** Next.js 16 App Router + TypeScript, Tailwind v4, Supabase (Postgres + Auth + RLS) via `@supabase/ssr`, Gemini (`@google/generative-ai`) called only from server route handlers, `@dnd-kit` for the board.

**Design system (Linear, dark-default + light toggle).** All color/theme lives in `src/app/globals.css`: design tokens are CSS variables under `:root` (dark, the default) and `[data-theme="light"]` (light override), then mapped to Tailwind utilities via `@theme inline` (e.g. `bg-canvas`, `text-ink`, `border-hairline`, `bg-primary`). Because the mapping is `inline`, swapping the `data-theme` attribute at runtime re-skins every utility. To add or change a color you must edit **both** the dark and light blocks. The toggle (`ThemeToggle.tsx`) sets `data-theme` on `<html>` and persists to `localStorage`; an inline script in `layout.tsx` applies the stored theme before paint to avoid a flash. Lavender `--primary` is used scarcely (CTA/brand/focus) by convention.

**Auth & session.** Three Supabase clients for three contexts — keep them straight:
- `src/lib/supabase/client.ts` — browser client, used in client components for reads/mutations.
- `src/lib/supabase/server.ts` — server client (async; reads cookies), used in Server Components and route handlers.
- `src/lib/supabase/middleware.ts` (`updateSession`) — used by `src/proxy.ts`, which runs on every request, refreshes the token, and redirects unauthenticated users to `/login` (and signed-in users away from `/login`).

**Login is email/password**: `/login` calls `supabase.auth.signInWithPassword({ email, password })`. New accounts are created via the Supabase Dashboard (Authentication → Users → Add user). There is no self-serve sign-up UI — this is a single-user personal tool.

**Data model & security.** Schema is `supabase/migrations/0001_init.sql` — **run it manually in the Supabase SQL editor**; it is not auto-applied. Two tables (`profiles`, `jobs`) with a `job_status` enum, `updated_at` triggers, an `on_auth_user_created` trigger that auto-creates a profile row on new signups, and RLS policies scoping every row to `auth.uid()`. Security rests on RLS, which is why the anon key is safe in the browser. The TypeScript shapes in `src/lib/types.ts` mirror these tables — keep them in sync with the migration.

**Important — after running the migration, backfill existing users** (the trigger only fires on new inserts):
```sql
insert into public.profiles (user_id)
select id from auth.users
on conflict (user_id) do nothing;
```

**Board & persistence.** `src/components/board/` (`Board`, `Column`, `JobCard`). Jobs are grouped by `status` into columns. Drag-and-drop uses the standard dnd-kit cross-container pattern: `findContainer` resolves a drop target to a column (droppable id = status) or a card; `onDragOver` moves between columns in state; `onDragEnd` reindexes the affected columns (`sort_order = index`) and persists via `persistOrder` in `src/lib/jobs.ts`. All job CRUD goes through `src/lib/jobs.ts` (browser client, RLS-protected). The home page (`src/app/page.tsx`) server-fetches jobs and hands them to the client `<Board>` as `initialJobs`.

**Settings / profile.** `/settings` lets the user save their full name and paste resume text (plain text, not PDF). The resume is stored in `profiles.resume_text` via `src/lib/profile.ts` (upsert, browser client). It is used by `/api/generate-kit` to personalise every kit — save it before generating kits.

**Gemini (server-only).** The API key is `GEMINI_API_KEY`, read only in route handlers — never `NEXT_PUBLIC_`, never shipped to the browser. Two handlers:
- `/api/generate-kit` — POST `{ jobId }`: validates session, re-reads job + profile server-side, calls `gemini-2.0-flash` with a structured JSON schema, saves `KitData` to `jobs.kit`, returns it.
- `/api/parse-job` — POST `{ text }`: validates session, asks Gemini to extract `{ title, company }` from a pasted JD.

Both return 401 for unauthenticated requests. Generated kits are stored inline on the job row (`jobs.kit` jsonb).

## Project conventions

- **Build log is a deliverable.** `docs/BUILD_LOG.md` records each build step (what, approach/commands, files, verification) and must be updated as the app is built out.
- **Do NOT send localhost links to the user.** The user accesses the dashboard directly in their own browser. Never say "open http://localhost:3000" or similar.
- **Env vars:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (browser-safe), `GEMINI_API_KEY` (server only). See `.env.local.example`.
- Path alias `@/*` → `src/*`.
- Always run `npm run build` before declaring a step done.
