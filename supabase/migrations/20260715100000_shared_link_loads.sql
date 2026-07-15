-- Append-only log of /g/[token] shared-link page loads, used by the
-- /monitor admin panel. Written only by the service-role admin client, so
-- RLS stays enabled with no policies (default deny for anon/authenticated).
create table public.shared_link_loads (
  id uuid primary key default gen_random_uuid(),
  share_token text not null,
  created_at timestamptz not null default now()
);

create index shared_link_loads_created_at_idx on public.shared_link_loads (created_at);

alter table public.shared_link_loads enable row level security;
