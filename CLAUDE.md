# SSL26 — working notes

Context for anyone (human or agent) making changes to this repo. The README
explains what the app *does*; this file records what has already gone wrong and
the rules that came out of it. Read it before touching the schema or deploying.

---

## The deploy order that matters

Code and database are coupled. Ship in this order, every time:

1. Run `supabase/schema.sql` in the Supabase SQL Editor
2. Then push / deploy

**Both have burned this project.** See the incident log below.

---

## Incident log

Real failures, what caused them, and the rule each one produced. Don't undo
these guardrails without understanding why they exist.

### 1. Secret key served to the public internet

The Supabase **secret** key was pasted into `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
in Netlify. `NEXT_PUBLIC_*` is inlined into the browser bundle, so it shipped to
every visitor. RLS-bypassing key, publicly readable. The build was green; the
only symptom was a 401 on the realtime socket.

Worse: `netlify.toml` had just added `SECRETS_SCAN_OMIT_KEYS` for that variable
— legitimately, since a publishable key *must* appear in the bundle — which
silenced the exact scanner that would have caught it.

- **Rule:** `src/lib/supabase.ts` validates the key shape and **fails the build**
  on `sb_secret_*` or a JWT decoding to `service_role`. Do not remove it. It is
  the compensating control for the scanner omission.
- **Rule:** `SECRETS_SCAN_OMIT_KEYS` omits by *key name*, not by value. Anything
  stored under an omitted name is invisible to the scanner.
- **Rule:** a leaked key is compromised the moment it is served. Revoke first;
  swapping the env var and redeploying does not un-publish it.

### 2. Admin page deployed wide open

The Netlify variable was spelled `ADMIN_PASSORD`. `process.env.ADMIN_PASSWORD`
was therefore undefined, and the code fell back to a hardcoded default that was
published in the README and in git history. Green build, no warning.

- **Rule:** `src/lib/adminAuth.ts` has **no fallback password**. Unset means
  `/admin` locks itself and logs why. Fail closed, loudly.
- A typo'd env var name is not an error to any host — it just silently produces
  `undefined`. Check spelling when auth misbehaves.

### 3. `CREATE OR REPLACE VIEW` cannot insert a column

Adding `partner_name` in the middle of `signups_public`'s column list failed
with `42P16: cannot change name of view column "name" to "partner_name"`.
Replace can only *append*; a mid-list addition reads as renaming.

The test suite missed it because it dropped the whole schema first — so it only
ever tested a *fresh create* plus re-running the *new* definition.

- **Rule:** views are `DROP VIEW IF EXISTS` then `CREATE`, never
  `CREATE OR REPLACE`. Column order is then free to change.
- **Rule:** migration tests must start from the **previous** schema, not from an
  empty database. Idempotency and upgradability are different properties;
  testing one does not test the other.

### 4. A migration-dependent deploy blanked the public page

The new code named `partner_name` in its `select()`. PostgREST rejects the
*entire* query with a 400 when you name a column that doesn't exist, so the
signup list went to zero rather than degrading.

- **Rule:** `useSignups` and `useTeamDraw` use `select("*")` and default missing
  columns, so a deploy landing ahead of its migration shows stale data rather
  than no data. Don't "tidy" these into explicit column lists.

### 5. 92 MB of canvas for a background

The starfield used three full-width DOM canvases at `devicePixelRatio` 2 —
enough to get a tab evicted on a mid-range phone, which is most of this
league's traffic.

- **Rule:** `CosmicBackground.tsx` paints **one** offscreen tile, hands it over
  as a repeating CSS background, and discards the canvas (~9 MB). CSS repeats on
  both axes, so it covers any viewport for free.
- Seamless scroll needs *identical* tiles scrolled by exactly one tile height.
  The distance is driven by `--star-tile` so the CSS and the component can't
  drift apart.

### 6. Google Fonts broke the build

`next/font` fetches at build time and a failed fetch is a hard build failure.

- **Rule:** system font stack only. No build-time network dependencies.

### 7. README was UTF-16

Inherited from the repo's original file. Broke `grep`, diffs and GitHub
rendering. All text files are UTF-8.

---

## Domain rules that are easy to get wrong

- **Team balance parity.** `teams.ts` carries deal parity between genders. If
  the guys list is odd and one side takes the extra guy, the girls deal starts
  on the other side. Without it, two odd lists both favour the same side and
  leave teams *two* apart. 15 guys + 1 girl deals 9v7 without the carry.
- **Pairs require mutual confirmation.** Both people must name each other. A
  one-sided request is ignored. Otherwise one person can drag another onto a
  team, and chains (A→B, B→C) glue three people together and break the split.
- **Pairs beat balance.** The flyer promises couples stay together, so they are
  never split — teams may come out 2+ apart. The admin shows a warning. With no
  couples, the original ≤1 guarantee still holds exactly; that is asserted in
  the tests.
- **Batting order** spreads the minority gender evenly through the majority
  (rule 11 wants alternation "as much as possible"). Guy-guy-girl is acceptable
  when counts force it. Not optimised beyond even spacing — deliberately.
- **The cutoff is soft.** Tuesday 12:00 `America/Chicago`. It changes UI
  emphasis and nothing else. Never hard-lock publishing on a clock: a wrong
  timezone or a dead clock would leave the commissioner unable to post teams on
  game night, discovered at the worst possible moment.
- **Start New Week deletes nothing.** It rolls `league_state.current_week_id`.
  Past weeks stay as history; the permanent roster and paid flags are untouched.

---

## Access model

The browser holds only the publishable key. It may:

- read `signups` (ids only), `league_state`, and `signups_public` (names)
- call `check_in(name, gender, partner)`

It may **not** touch `players` at all — payment data is neither readable nor
writable from the browser. `players` is protected twice: RLS has no anon policy
**and** the grant is explicitly revoked, because Supabase grants `anon` SELECT
on everything in `public` by default. Don't remove one assuming the other covers
it.

Everything privileged goes through `/api/admin/*`, which check the admin cookie
and use the secret key server-side. `src/lib/supabaseAdmin.ts` imports
`server-only` so a client component importing it fails the build.

> Note: `server-only` only fires if the import is actually *used* — an unused
> import gets elided before the check runs. Test it with a real call.

---

## Verifying changes

```bash
npm run typecheck
npm run lint
npm run build
npm run test        # pairing, balance, batting order invariants
```

`npm run test` covers ~8k random rosters plus edge cases. Add to it rather than
replacing it when changing `teams.ts`.

For SQL changes there is no npm script — spin up a real Postgres and test the
**upgrade path from the current production schema**:

```bash
pip install pgserver --break-system-packages
# build a DB shaped like production, then run schema.sql against it twice
```

Do not test schema changes by dropping the schema first. That is how incident 3
got through.

Note: the mounted project directory is slow. `eslint` and `next build` can time
out there; copy the source to a local dir with its own `node_modules` if so.

---

## Environment variables

| Variable | Where | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | build | No trailing `/rest/v1/` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | build | Inlined into the bundle by design |
| `SUPABASE_SECRET_KEY` | server | **Never** with a `NEXT_PUBLIC_` prefix |
| `ADMIN_PASSWORD` | server | Required; read per-request; no default |

`NEXT_PUBLIC_*` values are baked in at build time — redeploy after changing
them. `ADMIN_PASSWORD` takes effect immediately and invalidates existing
sessions when changed.

Quote passwords containing `$` in `.env.local` — `.env` files expand `$VAR`,
while host dashboards store the value literally. Classic "works in prod, fails
in dev".

---

## Still open

- **The waiver has not been reviewed by a lawyer.** It names the City of Stuart
  and their field. Confirm whether the city requires its own form.
- `/rules` rule 1 assumes a single 6:30 PM slot; the 2022 doc had two.
- No UI for browsing past weeks — history is in the database, SQL only.
- Subs are not modelled.
- No "late to the party" list, though `signups.created_at` has what's needed.
