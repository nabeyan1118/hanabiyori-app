-- REVIEW DRAFT ONLY: do not apply automatically.
create table public.member_lookup_log (
  email text not null,
  ip text not null,
  at timestamptz not null default now()
);

create index member_lookup_log_email_at on public.member_lookup_log (email, at);
create index member_lookup_log_ip_at on public.member_lookup_log (ip, at);

alter table public.member_lookup_log enable row level security;

-- Lookups and rate-limit logs are handled only by the server service_role.
revoke all on table public.member_lookup_log from public, anon, authenticated;
grant select, insert on public.member_lookup_log to service_role;

-- No public policies. Never expose service_role to the browser.
