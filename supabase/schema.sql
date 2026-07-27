-- ============================================================================
-- Stuart Softball League '26 — database schema
-- Run this once in the Supabase dashboard: SQL Editor -> New query -> Run.
-- It is safe to re-run.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- signups: one row per player who signed up for a given week
-- ---------------------------------------------------------------------------
create table if not exists public.signups (
  id         uuid        primary key default gen_random_uuid(),
  name       text        not null check (char_length(trim(name)) between 1 and 60),
  gender     text        not null check (gender in ('guy', 'girl')),
  created_at timestamptz not null default now(),
  week_id    text        not null
);

create index if not exists signups_week_id_created_at_idx
  on public.signups (week_id, created_at);

-- Stop the same person signing up twice in one week (case-insensitive).
create unique index if not exists signups_week_name_unique_idx
  on public.signups (week_id, lower(trim(name)));

-- ---------------------------------------------------------------------------
-- league_state: single row holding which week is currently open for signups
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
returns trigger
language plpgsql
as $$
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
-- Row Level Security
--
-- There are no player accounts, so everything runs as the anonymous role.
-- Anyone may read signups and add themselves; nobody may edit or delete a
-- signup from the browser. "Start New Week" does not delete rows — it just
-- moves league_state.current_week_id forward, so old weeks stay as history.
-- ---------------------------------------------------------------------------
alter table public.signups      enable row level security;
alter table public.league_state enable row level security;

drop policy if exists "signups are readable by anyone"  on public.signups;
create policy "signups are readable by anyone"
  on public.signups for select
  to anon, authenticated
  using (true);

drop policy if exists "anyone can add a signup" on public.signups;
create policy "anyone can add a signup"
  on public.signups for insert
  to anon, authenticated
  with check (true);

drop policy if exists "league state is readable by anyone" on public.league_state;
create policy "league state is readable by anyone"
  on public.league_state for select
  to anon, authenticated
  using (true);

drop policy if exists "anyone can roll the week" on public.league_state;
create policy "anyone can roll the week"
  on public.league_state for update
  to anon, authenticated
  using (id = 1)
  with check (id = 1);

-- ---------------------------------------------------------------------------
-- Realtime: push inserts to the public page as they happen
-- ---------------------------------------------------------------------------
do $$
begin
  alter publication supabase_realtime add table public.signups;
exception
  when duplicate_object then null;
end;
$$;

do $$
begin
  alter publication supabase_realtime add table public.league_state;
exception
  when duplicate_object then null;
end;
$$;
