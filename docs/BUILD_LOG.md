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

---

## Step 4 — Add Job modal + Card detail drawer

**What was built**
- `AddJobModal`: paste JD (required), optional URL, title/company (with ✦ Auto-extract calling `/api/parse-job`), pipeline column picker. Creates a job via `createJob` and appends it to the board without a page reload.
- `CardDrawer`: right-side slide-in drawer showing role, company, status badge, clickable posting URL, collapsible JD, and the **Generate Kit** button. Displays all four kit sections (Cover Letter, Resume Bullets, Interview Questions, Company Brief) each with a copy-to-clipboard button. Regenerate overwrites. Delete with confirm guard.
- `Modal`: reusable backdrop+panel component (Escape to close, click-outside to close).
- `Board` updated: temp quick-add replaced with real modal, `openJob` replaced by `setSelectedJob`; `handleJobCreated/Updated/Deleted` keep board state in sync without refetching.
- `ThemeToggle` hydration fix: `mounted` flag prevents server/client mismatch.

**Approach / notes**
- The drawer is a fixed `aside` with its own backdrop div — no portal needed since Next.js renders it at the body level naturally.
- Copy-to-clipboard flips "Copy" → "Copied!" for 2 s via local state; no library needed.
- Delete shows an inline confirm row rather than a disruptive modal.
- `handleJobUpdated` in Board also keeps `selectedJob` in sync so kit display refreshes immediately after generation.

**Files touched**
- `src/components/ui/Modal.tsx` (new)
- `src/components/board/AddJobModal.tsx` (new)
- `src/components/board/CardDrawer.tsx` (new)
- `src/components/board/Board.tsx` (updated)
- `src/components/ThemeToggle.tsx` (hydration fix)

**Verification**
- `npm run build` clean.
- Board verified in user's own browser (auth works, GET / returns 200). Modal and drawer visually pending sign-in; Gemini buttons pending Step 6.

---

## Step 5 — Settings / resume profile page

**What was built**
- `/settings` server page: fetches the user's profile row and passes it to `SettingsForm`.
- `SettingsForm` client component: full name input + large resume textarea (mono font, resizable) with character count. Saves via `saveProfile` (upsert to `profiles` table). Shows ✓ Saved confirmation for 2.5 s.
- `src/lib/profile.ts`: `getProfile` + `saveProfile` browser-client helpers.

**Files touched**
- `src/app/settings/page.tsx`, `src/app/settings/SettingsForm.tsx`, `src/lib/profile.ts`

**Verification**
- `npm run build` clean. Live verification pending sign-in.

---

## Step 6 — Gemini route handlers (Generate Kit + Parse Job)

**What was built**
- `/api/parse-job` (POST): validates Supabase session → sends pasted JD to `gemini-2.0-flash` → returns `{ title, company }`. Strips markdown fences from response. Powers the ✦ Auto-extract button in AddJobModal.
- `/api/generate-kit` (POST `{ jobId }`): validates session → re-reads job + profile from Supabase server-side (prompt can't be tampered via client) → one Gemini call with a structured JSON schema → returns and persists `KitData` (`coverLetter`, `resumeBullets[]`, `interviewQuestions[]`, `companyBrief`, `generatedAt`) to `jobs.kit`. Uses `responseMimeType: "application/json"` + `responseSchema` for reliable structured output.
- Both handlers return 401 for unauthenticated requests (Gemini credits protected).

**Security note**: `GEMINI_API_KEY` is only read in route handlers (server env), never in `NEXT_PUBLIC_*`. The prompt content is read from the DB server-side so a malicious client can't inject arbitrary text into the LLM call.

**Files touched**
- `src/app/api/parse-job/route.ts`, `src/app/api/generate-kit/route.ts`

**Verification**
- `npm run build` clean — all 7 routes compile (/, /login, /settings, /auth/callback, /api/generate-kit, /api/parse-job).
- End-to-end Gemini verification pending user sign-in + profile save + Generate Kit click.

---

## Step 7 — Polish: nav, responsive, empty state, animations

**What was built**
- **Active nav links** — `NavLinks` client component uses `usePathname` to highlight the current page (Board / Settings) with `bg-surface-2 text-ink` on the active item.
- **Mobile bottom nav** — a fixed bottom bar appears on `< sm` breakpoints with Board/Settings links (active-aware). Board and Settings pages use `pb-20 sm:pb-8` to avoid content being hidden under it.
- **Empty board state** — when zero jobs exist, shows a centered card with an icon, headline, subtext, and a primary "Add your first job" button above the column grid.
- **Column drop highlight** — "is over" state uses `border-primary/30 bg-surface-2` for a cleaner lavender-tinted highlight instead of opacity hacks.
- **Drawer slide-in** — `animate-in slide-in-from-right duration-200` (Tailwind v4 built-in) on the `<aside>`.
- **Modal entrance** — `animate-in fade-in zoom-in-95 duration-150` on the panel + auto-focus on first focusable input (50 ms delay to let the DOM settle).

**Files touched**
- `src/components/NavLinks.tsx` (new), `src/components/AppHeader.tsx`
- `src/components/board/Board.tsx` (empty state, mobile padding)
- `src/components/board/Column.tsx` (drop highlight)
- `src/components/board/CardDrawer.tsx` (slide-in)
- `src/components/ui/Modal.tsx` (entrance animation, auto-focus)
- `src/app/settings/page.tsx` (mobile padding)

**Verification**
- `npm run build` clean — all 7 routes compile.
- Active nav, empty state, and animations visible in user's browser.


