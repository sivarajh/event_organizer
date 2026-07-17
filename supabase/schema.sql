-- Event Organizer — database schema
-- Run this once in your Supabase project: SQL Editor → paste → Run.
--
-- The app stores its whole state (name, days, people, sessions) as a single
-- shared JSON document in one row. This matches the "shared / global" model:
-- everyone who opens the app reads and writes the same plan.

create table if not exists public.event_state (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Row Level Security is on. Because this is an unauthenticated, shared plan,
-- we allow the anon role to read and write the single shared row.
alter table public.event_state enable row level security;

drop policy if exists "anon can read event_state" on public.event_state;
create policy "anon can read event_state"
  on public.event_state for select
  using (true);

drop policy if exists "anon can insert event_state" on public.event_state;
create policy "anon can insert event_state"
  on public.event_state for insert
  with check (true);

drop policy if exists "anon can update event_state" on public.event_state;
create policy "anon can update event_state"
  on public.event_state for update
  using (true)
  with check (true);
