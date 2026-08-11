# Stuart Softball League '26

Weekly check-in + random team generator for an adult coed softball league.
Players check in through Tuesday 6 PM; the teams are decided at 6 PM and
posted for that night's games.

- **Public page** (`/`) — check-in form, live list of who's playing, countdown to the draw, and the published teams once they're up
- **Admin page** (`/admin`) — password protected; draws and publishes teams, tracks season dues, starts a new week

Built with Next.js 15 (App Router), TypeScript, Tailwind CSS v4, and Supabase.

> **Making changes?** Read [`CLAUDE.md`](CLAUDE.md) first. It records the
> failures this project has already hit — a leaked secret key, an admin page
> deployed with a default password, a migration that blanked the public page —
> and the guardrails that came out of them.

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
| `team_draws` | The published draw for a week. Visible publicly only when `published` is true. |
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

Re-running "Generate teams" re-draws from scratch and stores nothing, so a
re-draw is free.

### The Tuesday 6 PM lock

The public page shows a live preview that reshuffles every 8–12 seconds, with a
"Roll the dice" button on a 12-second cooldown. At **Tuesday 6:00 PM** it
stops moving and locks.

The locked draw is **deterministic**: it is regenerated from
`seededRand(lockSeed(week, roster))`, so every visitor's browser computes the
same teams, names, captains, batting orders and dugouts with no server call.
Freezing whatever random shuffle each browser happened to be showing would give
every person a different "official" answer.

Two things are needed for that, not one:

- a stable **seed** (week id + sorted player ids), and
- a canonical **input order** — `generateTeams` walks the array as given, and
  `created_at` ties are unordered in Postgres.

The locked roster is also **frozen to check-ins recorded before 6 PM**. Late
arrivals still appear in the signup list, they just don't disturb teams people
have already read.

### Auto-publish

`netlify/functions/auto-publish.mts` runs on a schedule and writes that same
draw to `team_draws` a few minutes after 6 PM, so the week becomes real history
and scores have something to attach to — without anyone pressing a button.

- It **never overrides a manual publish**. If you already pressed Publish, it
  exits.
- It is **idempotent** — running twice changes nothing.
- It produces a **byte-identical** draw to the one browsers locked, which
  `npm run test` asserts directly.
- Cron has no timezone and Iowa moves between CDT and CST. Tuesday 18:00 local
  is 23:00 UTC in summer but 00:00 UTC *Wednesday* in winter, so the schedule
  (`5 23,0 * * 2,3`) fires four times across both UTC days and each run exits
  immediately unless the local time is actually **Tuesday, hour 18**. Two of the
  four firings land on hour 18 of the wrong local day, which is why the guard
  checks weekday as well as hour.

### Publishing the draw

Generating is private. Nothing reaches the public page until you press
**Publish**, which writes the draw to `team_draws` as this week's final say. The
public page picks it up over realtime — no refresh needed.

- One row per week, upserted, so re-drawing and publishing again replaces the
  previous post rather than stacking up.
- **Pull it down** flips `published` to false rather than deleting, so the draw
  survives if you change your mind.
- RLS only returns rows where `published = true`. An unpublished draw is
  invisible to the browser, not merely hidden by the UI.
- The stored `teams` value is a *snapshot* including names, so the public page
  renders it without any access to the roster table.

`score_a` / `score_b` exist on the table and are unused — room for W/L history.

### The cutoff

`src/lib/cutoff.ts` computes time until **Tuesday 18:00** in `America/Chicago`,
handling CDT/CST automatically.

The cutoff is hard for the *preview* — it stops reshuffling and locks — but
deliberately soft for *you*. Check-in stays open past 6 PM, the admin can draw
and publish at any hour, and nothing about posting teams is gated on a clock.
A hard lock on the admin side would mean a wrong clock or a bad timezone could
leave you unable to post teams on game night, discovered at the worst possible
moment.

### Season dues

The $20 fee is one-time, so `paid` lives on `players`, not on the weekly
check-in. Marking someone paid persists for the season and survives every week
reset. There is no online payment — the admin toggle is a manual ledger of who
has handed over cash.

The roster is permanent: everyone who has ever checked in stays listed, with a
count of weeks played. That is also what future history (teams, W/L, scores)
will hang off.

### Bonus Ball (voluntary $5 pool)

An optional weekly side pool, presented as an ice-cream softball. Ships **off**
and is switched on from the admin dashboard the week the physical bonus balls
arrive.

- **Opt-in only, $5 flat, one entry per person per week.** The one-entry rule is
  a unique index on `bonus_entries (week_id, player_id)`; the RPC's `on conflict
  do nothing` makes a double-tap a no-op rather than a second obligation.
- **The pool resets with the week.** Entries are keyed by `week_id`, so rolling
  the week just changes which week `bonus_pool()` reports on. Nothing is deleted;
  past pools stay as history.
- **Public total + names, through the RPC only.** When the feature is on,
  `bonus_pool(name)` returns the running total and the list of entrants to
  everyone. The `name` argument only sets a `member` flag so the UI can show a
  "you're in" badge — it doesn't gate what comes back. The `bonus_entries` table
  is still not anon-readable; the RPC is a shaped projection over it, so the data
  is exposed deliberately and nothing else on the table leaks.
- **Same double-lock as the roster.** The browser has no direct read or write on
  `bonus_entries`: RLS has no anon policy **and** the grant is revoked. The only
  ways in are the two `security definer` RPCs (`enter_bonus_ball`, `bonus_pool`)
  and the admin route using the secret key.
- **"Live" without a realtime leak.** Because `bonus_entries` isn't anon-readable
  it can't be subscribed to from the browser, so the pool polls every ~12s and
  refetches on tab focus for everyone while the feature is on. The flag itself
  flips live over the existing `league_state` realtime channel, so enabling it
  shows the pool everywhere without a refresh.
- **Identity with no accounts.** The name someone enters under is remembered in
  `localStorage` and sent so the server can flag `member` for the "you're in"
  badge. If the week has rolled, `member` comes back false and the badge clears —
  the pool itself is public, so it shows regardless.

#### Turning it on

1. Run `supabase/schema.sql` in the SQL editor if you haven't since this feature
   landed (adds `league_state.bonus_ball_enabled`, the `bonus_entries` table, and
   the two RPCs). Safe to re-run; it's an additive upgrade.
2. Deploy the code.
3. Go to `/admin`, find the **🍦 Bonus Ball** card, and flip the switch on. The
   teaser appears on the main page immediately for everyone; the opt-in appears
   on the signup form. Flip it off any time — entries are kept, just hidden.

The $5 amount is `BONUS_ENTRY_FEE` in `src/lib/types.ts`; the total is always
derived as `entries × $5`, never entered by hand.

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
and call `check_in()`, `enter_bonus_ball()` and `bonus_pool()`. They have no
access to `players` or `bonus_entries` at all — payment status and the raw
bonus-pool rows are neither readable nor writable from the browser. Rolling the
week, toggling payment, and flipping the Bonus Ball flag go through
`/api/admin/*`, which check the admin cookie and use the secret key server-side.

`players` **and** `bonus_entries` are each protected twice over: RLS has no anon
policy, *and* the grant is explicitly revoked. Supabase grants `anon` SELECT on
everything in `public` by default, so without that revoke, disabling RLS on the
table for even a moment would expose the data. Both locks are in `schema.sql`;
don't remove one assuming the other has it covered. The bonus-pool total and
names reach the browser only through `bonus_pool()` — a shaped projection over
the table. That data is public now, but the table itself still isn't readable.

---

## Project structure

```
src/
├── app/
│   ├── page.tsx                    Public signup page
│   ├── admin/page.tsx              Admin page (renders login or dashboard)
│   ├── api/admin/login/route.ts    Password check, sets/clears the cookie
│   ├── api/admin/players/route.ts  Roster read + paid toggle (admin only)
│   ├── api/admin/teams/route.ts    Publish / retract the draw (admin only)
│   ├── api/admin/week/route.ts     Start a new week (admin only)
│   ├── api/admin/bonus/route.ts    Bonus Ball flag + entrants (admin only)
│   ├── layout.tsx
│   └── globals.css                 Tailwind theme: cosmic neon tokens
├── components/
│   ├── SignupForm.tsx              Name + gender check-in form (+ bonus opt-in)
│   ├── BonusBallToggle.tsx         The $5 ice-cream opt-in on the form
│   ├── BonusBallPanel.tsx          Main-page teaser / participant-only pool
│   ├── BonusBallAdmin.tsx          Admin switch + entrant list
│   ├── PaymentRoster.tsx           Permanent roster + season dues toggles
│   ├── FinalDraw.tsx               Published teams on the public page
│   ├── PublishedTeamCard.tsx       One persisted team snapshot
│   ├── TeamPreview.tsx             Live preview, dice roll, 6 PM lock
│   ├── PreviewTeamCard.tsx         One preview team with Home/Away banner
│   ├── SignupList.tsx              Live "this week's signups" list
│   ├── AdminDashboard.tsx          Generate teams / start new week
│   ├── AdminLogin.tsx              Password gate
│   ├── TeamCard.tsx                One team, captain starred
│   ├── GenderBadge.tsx
│   ├── Header.tsx
│   └── SoftballIcon.tsx
├── hooks/
│   ├── useSignups.ts               Fetch + realtime subscription
│   ├── useBonusBall.ts             Flag, entrant identity, gated pool fetch
│   └── useTeamDraw.ts              Published draw + realtime subscription
└── lib/
    ├── supabase.ts                 Browser client (publishable key)
    ├── supabaseAdmin.ts            Server-only client (secret key)
    ├── teams.ts                    Shuffle + balanced deal + captains
    ├── week.ts                     Current week / start new week
    ├── cutoff.ts                   Tuesday 6 PM cutoff (America/Chicago)
    ├── teamNames.ts                Off-the-wall weekly team names
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
| Through Tuesday 6 PM | Players check in; the preview reshuffles live |
| Tuesday 18:00 | Teams lock. Auto-publish writes them to the database |
| Tuesday evening | Play ball at 6:30 |
| After Tuesday's game | Admin hits **Start new week** to open signups for next week |
