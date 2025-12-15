-- Create required extension for UUIDs if not already present
create extension if not exists "pgcrypto";

create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists notes_user_id_idx on public.notes (user_id);

alter table public.notes enable row level security;

-- RLS policies (note: when using the service_role key, RLS is bypassed)
drop policy if exists "Allow select own notes" on public.notes;
create policy "Allow select own notes"
on public.notes
for select
using (user_id = current_setting('request.jwt.claims.sub', true));

drop policy if exists "Allow insert own notes" on public.notes;
create policy "Allow insert own notes"
on public.notes
for insert
with check (user_id = current_setting('request.jwt.claims.sub', true));
