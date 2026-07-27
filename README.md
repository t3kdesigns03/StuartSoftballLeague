# Stuart Softball League '26

Weekly check-in + random team generator for an adult coed softball league.
Players add their name through Monday; the commissioner draws two balanced
teams for Tuesday's games.

- **Public page** (`/`) — signup form and a live list of who's playing
- **Admin page** (`/admin`) — password protected; generates teams, starts a new week

Built with Next.js 15 (App Router), TypeScript, Tailwind CSS v4, and Supabase.

---

## Setup

### 1. Install

```bash
npm install
```

### 2. Create the database tables

In the Supabase dashboard: **SQL Editor → New query**, paste the contents of
[`supabase/schema.sql`](supabase/schema.sql), and hit **Run**. It is safe to
re-run. This creates:

| Table | Purpose |
| --- | --- |
| `players` | **Permanent roster.** One row per human, ever. Holds the one-time season fee status (`paid`, `paid_at`). Never cleared by a week reset. |
| `signups` | Weekly check-in. One row per player per week, referencing `players`. |
| `league_state` | Single row tracking which `week_id` is currently open |

It also enables Row Level Security, adds the policies and grants the app needs,
creates the `check_in()` function and `signups_public` view, and turns on
realtime.

Running this on a database that still has the original single-table layout is
safe: existing signups are migrated into the roster rather than dropped, and
duplicate spellings of one person (`"casey Brooks"` / `"Casey Brooks"` /
`"  casey brooks "`) collapse into a single roster entry. The earliest spelling
wins, so fix any capitalisation directly in the `players` table afterwards.

### 3. Environment variables

```bash
cp .env.local.example .env.local
```

Fill in from **Supabase → Settings → API Keys**:

| Variable | Where to find it |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL, e.g. `https://xxxx.supabase.co` (no trailing path) |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | The **publishable** (anon) key — safe in the browser |
| `SUPABASE_SECRET_KEY` | The **secret** key. Server-only — the admin roster and payment tracking bypass RLS. Note the deliberate absence of a `NEXT_PUBLIC_` prefix: that prefix is what inlines a value into the browser bundle. |
| `ADMIN_PASSWORD` | Whatever you want to gate `/admin` with. **Required** — if unset, `/admin` locks itself and logs an error. There is no fallback default. |

> If your password contains `$`, quote it in `.env.local` (`ADMIN_PASSWORD='p$ss'`).
> `.env` files expand `$VAR` references, so an unquoted `$` can silently change
> the value locally while the host's dashboard stores it literally — the classic
> "works in prod, fails in dev" login bug.

### 4. Run

```bash
npm run dev
```

Open <http://localhost:3000>.

---

## How it works

### Team generation

`src/lib/teams.ts` splits the week's signups into exactly two teams:

1. Separate guys and girls
2. Shuffle each list (Fisher–Yates)
3. Deal alternately into Team Green / Team Gold
4. Pick a random captain on each team

The deal carries its parity between the two genders, so if the guys list is odd
and one side takes the extra guy, the girls deal starts on the other side. This
keeps **both** the gender split and the total roster size balanced to within one
player. Without that carry-over, two odd lists can both favour the same side and
leave the teams two players apart.

Re-running "Generate teams" re-draws from scratch — teams are not stored in the
database, so a re-draw is free.

### Season dues

The $20 fee is one-time, so `paid` lives on `players`, not on the weekly
check-in. Marking someone paid persists for the season and survives every week
reset. There is no online payment — the admin toggle is a manual ledger of who
has handed over cash.

The roster is permanent: everyone who has ever checked in stays listed, with a
count of weeks played. That is also what future history (teams, W/L, scores)
will hang off.

### Weeks

`league_state.current_week_id` decides which `week_id` new check-ins get.
**Start new week** rolls that value forward; it does **not** delete anything, so
past weeks stay in `signups` as history and the roster is untouched. Every open
browser picks up the change over realtime and clears its list without a refresh.

To look at past weeks:

```sql
select week_id, count(*), min(created_at)
from signups group by week_id order by 3 desc;
```

### Admin auth

There are no player accounts. `/admin` is gated by a single password checked
server-side in `src/app/api/admin/login/route.ts`. On success it sets a 12-hour
httpOnly cookie holding an HMAC derived from `ADMIN_PASSWORD` — the password
itself never reaches the browser, and changing the env var invalidates all
existing sessions.

This is deliberately lightweight. It keeps casual visitors out of the admin
page; it is not a hardened auth system.

**What the browser can and cannot do.** Anonymous visitors may read `signups`
(ids only), read `league_state`, read names through the `signups_public` view,
and call `check_in()`. They have no access to `players` at all — payment status
is neither readable nor writable from the browser. Rolling the week and toggling
payment go through `/api/admin/*`, which check the admin cookie and use the
secret key server-side.

`players` is protected twice over: RLS has no anon policy, *and* the grant is
explicitly revoked. Supabase grants `anon` SELECT on everything in `public` by
default, so without that revoke, disabling RLS on the table for even a moment
would expose the roster. Both locks are in `schema.sql`; don't remove one
assuming the other has it covered.

---

## Project structure

```
src/
├── app/
│   ├── page.tsx                    Public signup page
│   ├── admin/page.tsx              Admin page (renders login or dashboard)
│   ├── api/admin/login/route.ts    Password check, sets/clears the cookie
│   ├── api/admin/players/route.ts  Roster read + paid toggle (admin only)
│   ├── api/admin/week/route.ts     Start a new week (admin only)
│   ├── layout.tsx
│   └── globals.css                 Tailwind theme: cosmic neon tokens
├── components/
│   ├── SignupForm.tsx              Name + gender check-in form
│   ├── PaymentRoster.tsx           Permanent roster + season dues toggles
│   ├── SignupList.tsx              Live "this week's signups" list
│   ├── AdminDashboard.tsx          Generate teams / start new week
│   ├── AdminLogin.tsx              Password gate
│   ├── TeamCard.tsx                One team, captain starred
│   ├── GenderBadge.tsx
│   ├── Header.tsx
│   └── SoftballIcon.tsx
├── hooks/
│   └── useSignups.ts               Fetch + realtime subscription
└── lib/
    ├── supabase.ts                 Browser client (publishable key)
    ├── supabaseAdmin.ts            Server-only client (secret key)
    ├── teams.ts                    Shuffle + balanced deal + captains
    ├── week.ts                     Current week / start new week
    ├── adminAuth.ts                Cookie + password verification
    ├── types.ts
    └── database.types.ts
```

---

## Scripts

```bash
npm run dev        # local dev server
npm run build      # production build
npm run typecheck  # tsc --noEmit
npm run lint       # eslint
npm run test       # 20k random rosters against the balance invariants
```

`npm run test` checks that no player is lost or duplicated, team sizes stay
within one, each gender stays within one, captains are on their own team, and
neither team is empty.

---

## Deploying to Netlify

1. Push to <https://github.com/t3kdesigns03/StuartSoftballLeague>
2. In Netlify: **Add new site → Import an existing project**, pick the repo.
   `netlify.toml` supplies the build command and the Next.js plugin.
3. **Site configuration → Environment variables** — add all four:
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`,
   `SUPABASE_SECRET_KEY`, `ADMIN_PASSWORD`. **Check the spelling carefully** — a typo'd key is not an
   error, it just makes the variable undefined, and `/admin` will lock itself.
   (The two `NEXT_PUBLIC_*` values are inlined at build time, so redeploy after
   changing them. `ADMIN_PASSWORD` is read per-request and takes effect
   immediately.)
4. **Domain management → Add a domain** → `ssl.t3kdesigns.app`, then point a
   `CNAME` at the Netlify site. Netlify issues the TLS certificate automatically.

The `@netlify/plugin-nextjs` plugin is installed by Netlify during the build —
it does not need to be in `package.json`.

### Secrets scanning

Netlify scans both repo files and build output for the values of your env vars
and fails the build on a match. `NEXT_PUBLIC_*` values are *supposed* to be in
the bundle — the browser can't reach Supabase without them — so `netlify.toml`
declares those two keys via `SECRETS_SCAN_OMIT_KEYS`.

`ADMIN_PASSWORD` is deliberately left out of that list. It is server-only, so if
it ever turns up in the client bundle the scanner should stop the deploy. Keep
it that way.

Also keep real values out of `.env.local.example` — the scanner reads committed
files, not just build output.

> **The omission is by key *name*, not by value.** It silences the scanner for
> whatever happens to be stored under those names. If a privileged key is pasted
> into `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, Netlify will not warn you.
>
> This is not hypothetical — it happened on the first production deploy. A
> `sb_secret_...` key went into that variable, shipped to every visitor in the
> JS bundle, and the build was green. The only symptom was a 401 on the realtime
> socket.
>
> `src/lib/supabase.ts` now validates the key's shape and throws at build time
> on a `sb_secret_...` key or a JWT decoding to `service_role`. That check is the
> compensating control for the scanner omission. Don't delete one without the
> other.

**If a secret key ever reaches the bundle:** revoke it in Supabase first — it is
public the moment it is served, and rotating is the only fix. Replacing the env
var and redeploying does not un-publish it.

---

## Weekly routine

| When | What |
| --- | --- |
| Through Monday | Players sign up at the public page |
| Monday night | Admin opens `/admin`, hits **Generate teams**, shares the result |
| After Tuesday's game | Admin hits **Start new week** to open signups for next week |
