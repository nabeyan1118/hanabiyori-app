-- REVIEW DRAFT ONLY: do not apply automatically.
-- read_date is the server's JST calendar date; one completed reading day per terminal.
create table public.reading_events (
  id uuid primary key default gen_random_uuid(),
  terminal_id uuid not null,
  read_date date not null default (now() at time zone 'Asia/Tokyo')::date,
  created_at timestamptz not null default now(),
  constraint reading_events_terminal_date_unique unique (terminal_id, read_date)
);

alter table public.reading_events enable row level security;

-- Explicit grants override possible default privileges. Public clients cannot
-- SELECT/UPDATE/DELETE; aggregate reads are performed only via service_role.
revoke all on table public.reading_events from public, anon, authenticated;
grant insert (terminal_id) on public.reading_events to anon, authenticated;
grant select on public.reading_events to service_role;

create policy reading_events_insert_only
  on public.reading_events for insert
  to anon, authenticated
  with check (true);

-- No SELECT/UPDATE/DELETE policies. Never expose service_role to the browser.
-- No IP, user-agent, email, member ID, card contents, or reading text is stored.
