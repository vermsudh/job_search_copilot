# Build Log — Job Search Copilot

A step-by-step record of how this app was assembled. Each entry: what was built, the approach/commands used, files touched, and how it was verified.

---

## Step 1 — Scaffold Next.js + Linear design system + theme toggle

**What was built**
- Next.js 16 (App Router) project with TypeScript, Tailwind CSS v4, ESLint, `src/` dir, `@/*` import alias.
- Project dependencies: `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`, `@supabase/supabase-js`, `@supabase/ssr`, `@google/generative-ai`.
- Linear design system encoded as CSS variables (dark default + light override) and exposed to Tailwind via `@theme inline` — utilities like `bg-canvas`, `text-ink`, `border-hairline`, `bg-primary` are theme-reactive.
- Fonts: Inter (sans) + JetBrains Mono (mono) via `next/font/google`.
- Dark/light **theme toggle** with no flash-of-wrong-theme (inline script in `<head>` reads `localStorage` before paint; toggle sets `data-theme="light"` on `<html>`).
- Placeholder home page demonstrating the tokens (nav, columns, cards).

**Approach / commands**
```bash
npx create-next-app@latest . --ts --tailwind --app --eslint --src-dir --import-alias "@/*" --no-turbopack --use-npm --yes
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities @supabase/supabase-js @supabase/ssr @google/generative-ai
```
- Tailwind v4 has no JS config file; design tokens live in `globals.css` under `:root` (dark) and `[data-theme="light"]`, mapped through `@theme inline` so runtime variable swaps re-skin every utility.
- Dark is the default render (matches `:root`), so dark users never flash; the pre-paint script only flips light users.

**Files touched**
- `src/app/layout.tsx` — fonts, no-flash theme script, base body classes.
- `src/app/globals.css` — full Linear token set (dark + light), focus ring, scrollbars.
- `src/components/ThemeToggle.tsx` — client toggle (sun/moon), persists to `localStorage`.
- `src/app/page.tsx` — placeholder design-system showcase (temporary; replaced by board/auth later).
- `.claude/launch.json` — dev server config for preview.

**Verification**
- `npm run build` → compiled successfully, types pass, static pages generated.
- Preview server + screenshots: dark theme shows canvas `#010102`, surface ladder, hairline borders, lavender CTA. Clicking the toggle re-skins to the light palette (off-white canvas, white surfaces) with the accent retained. Reload keeps the chosen theme (localStorage + pre-paint script).

---

## Step 2 — Supabase schema, RLS, and magic-link auth

**What was built**
- SQL migration: `profiles` + `jobs` tables, `job_status` enum, `updated_at` triggers, an `on_auth_user_created` trigger that auto-creates a profile row on signup, and RLS policies scoping every row to `auth.uid()`.
- `@supabase/ssr` clients: browser (`client.ts`), server (`server.ts`), and a `proxy.ts` (Next 16's renamed middleware) that refreshes the session and redirects unauthenticated users to `/login`.
- Magic-link login page (`/login`) → `signInWithOtp` with `emailRedirectTo` to `/auth/callback`, which exchanges the code for a session.
- Auth gate on `/` (server component reads the user; proxy enforces redirect) + a sign-out button.
- TypeScript domain types (`Job`, `Profile`, `KitData`, `JobStatus`) in `src/lib/types.ts`.
- `.env.local.example` documenting required env vars.

**Approach / notes**
- RLS does the security; the anon key is safe in the browser because policies block cross-user access.
- The `on_auth_user_created` trigger means a profile always exists after first sign-in — no race to create it in app code.
- Next 16 deprecated the `middleware` file convention; migrated to `proxy.ts` / `export function proxy`.
- The proxy refreshes tokens via `supabase.auth.getUser()` on every request and gates all non-auth routes.

**Files touched**
- `supabase/migrations/0001_init.sql`
- `src/lib/supabase/{client,server,middleware}.ts`, `src/proxy.ts`
- `src/lib/types.ts`
- `src/app/login/page.tsx`, `src/app/auth/callback/route.ts`
- `src/components/SignOutButton.tsx`, `src/app/page.tsx` (auth gate)
- `.env.local.example`

**Verification**
- `npm run build` clean (routes: `/` dynamic, `/login` static, `/auth/callback` dynamic, proxy active).
- End-to-end auth (magic-link round trip) requires a live Supabase project + env vars — see `docs/SETUP.md`. Pending user setup.

---

## Step 3 — Pipeline board with drag-and-drop + job CRUD

**What was built**
- Five-column board (Wishlist → Applied → Interviewing → Offer → Rejected), styled per the Linear system (subtle status dots, no full-color fills; Offer uses success green; Interviewing uses the lavender accent).
- Drag-and-drop via `@dnd-kit`: reorder within a column and move across columns, with a `DragOverlay` preview. Pointer sensor uses a 5px activation distance so a click opens a card while a drag moves it.
- Persistence: on drop, the affected source + destination columns are reindexed (`sort_order = index`) and written back to Supabase via `persistOrder` (batched updates).
- Job data layer (`src/lib/jobs.ts`): `fetchJobs`, `createJob`, `updateJob`, `deleteJob`, `persistOrder` using the browser Supabase client (RLS-protected; `createJob` stamps `user_id` from the session).
- Home page now server-fetches the user's jobs and renders the `<Board>` client component; shared `<AppHeader>` (logo, Board/Settings nav, email, theme toggle, sign out).
- Temporary "Add job" quick-add (inserts a "New role" wishlist card) — replaced by the full modal in Step 4.

**Approach / notes**
- Cross-container DnD uses the standard dnd-kit pattern: `findContainer` resolves whether a drag target is a column id (droppable) or a card id; `onDragOver` moves the card between columns in state; `onDragEnd` finalizes ordering and persists.
- `sourceContainer` ref captures the column the drag started in, so both source and destination get reindexed on drop.
- Empty columns are droppable (the column div is a `useDroppable` with the status as id), so cards can be dropped into empty lanes.

**Files touched**
- `src/lib/jobs.ts`
- `src/components/board/{Board,Column,JobCard}.tsx`
- `src/components/AppHeader.tsx`
- `src/app/page.tsx`

**Verification**
- `npm run build` clean.
- Interactive board verification (drag/reorder/persist) requires auth, which is gated on Supabase setup — bundled with Step 2 verification once env vars are in place.


