-- ============================================================================
-- Stuart Softball League '26 — database schema
--
-- Run in the Supabase dashboard: SQL Editor -> New query -> Run.
-- Safe to re-run, and safe to run on a database that still has the original
-- single-table layout: existing signups are migrated into the roster, not lost.
--
-- Model
--   players       permanent roster. One row per human, ever. Holds the
--                 one-time season fee status. Survives every week reset.
--   signups       weekly check-in. One row per player per week. Cleared
--                 (logically) each week by rolling league_state.
--   league_state  single row naming the week currently open for check-ins.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- players — the permanent roster
-- ---------------------------------------------------------------------------
create table if not exists public.players (
  id         uuid        primary key default gen_random_uuid(),
  name       text        not null check (char_length(trim(name)) between 1 and 60),
  gender     text        not null check (gender in ('guy', 'girl')),
  paid       boolean     not null default false,
  paid_at    timestamptz,
  created_at timestamptz not null default now()
);

-- One roster entry per person, case- and whitespace-insensitive.
create unique index if not exists players_name_unique_idx
  on public.players (lower(trim(name)));

-- Keep paid_at consistent with paid without the app having to remember.
create or replace function public.sync_paid_at()
returns trigger language plpgsql as $$
begin
  if new.paid and not coalesce(old.paid, false) then
    new.paid_at := now();
  elsif not new.paid then
    new.paid_at := null;
  end if;
  return new;
end;
$$;

drop trigger if exists players_sync_paid_at on public.players;
create trigger players_sync_paid_at
  before insert or update of paid on public.players
  for each row execute function public.sync_paid_at();

-- ---------------------------------------------------------------------------
-- signups — weekly check-in
-- ---------------------------------------------------------------------------
create table if not exists public.signups (
  id         uuid        primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  week_id    text        not null
);

alter table public.signups
  add column if not exists player_id uuid references public.players(id) on delete cascade;

-- --- migration from the original layout ------------------------------------
-- Older databases have name/gender directly on signups. Move those people into
-- the roster and point their check-ins at the new rows. No-ops afterwards.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'signups' and column_name = 'name'
  ) then
    -- Earliest spelling of each name wins; gender comes from that same row.
    insert into public.players (name, gender, created_at)
    select distinct on (lower(trim(s.name)))
           trim(s.name), s.gender, min(s.created_at) over (partition by lower(trim(s.name)))
    from public.signups s
    where s.name is not null
    order by lower(trim(s.name)), s.created_at
    on conflict do nothing;

    execute $mig$
      update public.signups s
         set player_id = p.id
        from public.players p
       where p.name is not null
         and lower(trim(s.name)) = lower(trim(p.name))
         and s.player_id is null
    $mig$;
  end if;
end;
$$;

-- Drop orphans (check-ins we could not attribute) so the NOT NULL can apply.
delete from public.signups where player_id is null;

alter table public.signups alter column player_id set not null;

-- The old layout's columns are now redundant.
alter table public.signups drop column if exists name;
alter table public.signups drop column if exists gender;

-- Old uniqueness was (week_id, name); it is now (week_id, player_id).
drop index if exists public.signups_week_name_unique_idx;
create unique index if not exists signups_week_player_unique_idx
  on public.signups (week_id, player_id);

create index if not exists signups_week_id_created_at_idx
  on public.signups (week_id, created_at);

-- ---------------------------------------------------------------------------
-- league_state — which week is open
-- ---------------------------------------------------------------------------
create table if not exists public.league_state (
  id              smallint    primary key default 1,
  current_week_id text        not null,
  updated_at      timestamptz not null default now(),
  constraint league_state_single_row check (id = 1)
);

insert into public.league_state (id, current_week_id)
values (1, to_char(now(), 'IYYY"-W"IW'))
on conflict (id) do nothing;

create or replace function public.touch_league_state()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists league_state_touch on public.league_state;
create trigger league_state_touch
  before update on public.league_state
  for each row execute function public.touch_league_state();

-- ---------------------------------------------------------------------------
-- team_draws — the published teams for a week. The "final say".
--
-- One row per week. Generating teams on the admin page is free and changes
-- nothing here; only pressing Publish writes a row. Unpublishing flips the flag
-- rather than deleting, so the draw is still there if you change your mind.
--
-- `teams` is a snapshot (names included, not just ids) so the public page can
-- render it without any access to the roster table, and so history stays
-- accurate if someone is later renamed.
--
-- Shape:
--   [{ "name": "Team Green", "color": "green", "captain_id": "<uuid>",
--      "players": [{ "id": "<uuid>", "name": "...", "gender": "guy" }, ...] }, ...]
--
-- score_a / score_b are unused for now — room for W/L history later.
-- ---------------------------------------------------------------------------
create table if not exists public.team_draws (
  week_id      text        primary key,
  teams        jsonb       not null,
  drawn_at     timestamptz not null default now(),
  published    boolean     not null default false,
  published_at timestamptz,
  score_a      integer,
  score_b      integer,
  constraint team_draws_two_teams check (jsonb_array_length(teams) = 2)
);

create or replace function public.sync_published_at()
returns trigger language plpgsql as $$
begin
  if new.published and not coalesce(old.published, false) then
    new.published_at := now();
  elsif not new.published then
    new.published_at := null;
  end if;
  return new;
end;
$$;

drop trigger if exists team_draws_sync_published_at on public.team_draws;
create trigger team_draws_sync_published_at
  before insert or update of published on public.team_draws
  for each row execute function public.sync_published_at();

-- ---------------------------------------------------------------------------
-- check_in() — the only write the public page is allowed to make
--
-- Find-or-create the player, then record their check-in for the open week.
-- SECURITY DEFINER so the browser never needs write access to either table,
-- and so find-or-create is atomic rather than a read-then-write race.
-- ---------------------------------------------------------------------------
create or replace function public.check_in(p_name text, p_gender text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name   text := trim(p_name);
  v_week   text;
  v_player uuid;
begin
  if v_name is null or char_length(v_name) = 0 or char_length(v_name) > 60 then
    raise exception 'invalid name' using errcode = '22000';
  end if;
  if p_gender not in ('guy', 'girl') then
    raise exception 'invalid gender' using errcode = '22000';
  end if;

  select current_week_id into v_week from public.league_state where id = 1;

  insert into public.players (name, gender)
  values (v_name, p_gender)
  on conflict (lower(trim(name))) do update
    set gender = excluded.gender          -- lets someone correct their own entry
  returning id into v_player;

  insert into public.signups (player_id, week_id)
  values (v_player, v_week)
  on conflict (week_id, player_id) do nothing;
end;
$$;

revoke all on function public.check_in(text, text) from public;
grant execute on function public.check_in(text, text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Row Level Security
--
-- There are no player accounts. Everything from the browser runs as `anon`, so
-- anon gets the narrowest possible surface:
--   - may read signups (ids only — no names, no payment info)
--   - may read league_state (to know which week is open)
--   - may call check_in()
--   - may NOT touch players directly, so payment status is neither readable
--     nor writable from the browser
-- Admin reads and writes go through server routes using the secret key, which
-- bypasses RLS. See src/lib/supabaseAdmin.ts.
-- ---------------------------------------------------------------------------
alter table public.players      enable row level security;
alter table public.signups      enable row level security;
alter table public.league_state enable row level security;
alter table public.team_draws   enable row level security;

-- Explicit table grants. Supabase grants anon SELECT on everything in `public`
-- by default, which would include the roster; RLS is what actually stops that
-- read today. Revoking outright means payment data stays private even if RLS is
-- ever disabled on the table by accident — two independent locks, not one.
grant usage on schema public to anon, authenticated;

revoke all on public.players from anon, authenticated;

grant select on public.signups      to anon, authenticated;
grant select on public.league_state to anon, authenticated;
grant select on public.team_draws   to anon, authenticated;

-- players: deliberately no anon policies. RLS denies by default.
drop policy if exists "anyone can add a signup"    on public.signups;
drop policy if exists "signups are readable by anyone" on public.signups;
create policy "signups are readable by anyone"
  on public.signups for select to anon, authenticated using (true);

drop policy if exists "league state is readable by anyone" on public.league_state;
create policy "league state is readable by anyone"
  on public.league_state for select to anon, authenticated using (true);

-- Rolling the week is an admin action now; it goes through the server route.
drop policy if exists "anyone can roll the week" on public.league_state;

-- Draws are visible only once published. An unpublished draw — one the admin
-- has saved but not released — stays invisible to the browser.
drop policy if exists "published draws are readable by anyone" on public.team_draws;
create policy "published draws are readable by anyone"
  on public.team_draws for select
  to anon, authenticated
  using (published = true);

-- ---------------------------------------------------------------------------
-- signups_public — names for the public "this week" list, without exposing
-- the roster table (and therefore without exposing `paid`).
--
-- A view owned by the definer reads its base tables with the owner's rights,
-- so this projects exactly the columns the public page needs and nothing else.
-- ---------------------------------------------------------------------------
create or replace view public.signups_public as
  select s.id,
         s.week_id,
         s.created_at,
         s.player_id,
         p.name,
         p.gender
    from public.signups s
    join public.players p on p.id = s.player_id;

grant select on public.signups_public to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Realtime: the public page subscribes to signups/league_state and refetches
-- from the view when something changes.
-- ---------------------------------------------------------------------------
do $$ begin
  alter publication supabase_realtime add table public.signups;
exception when duplicate_object then null; end $$;

do $$ begin
  alter publication supabase_realtime add table public.league_state;
exception when duplicate_object then null; end $$;

do $$ begin
  alter publication supabase_realtime add table public.team_draws;
exception when duplicate_object then null; end $$;
