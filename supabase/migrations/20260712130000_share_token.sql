-- Human-readable share links for public and private games (e.g. brave-ladybug-90).
alter table public.sport_events
  add column if not exists share_token text;

create unique index if not exists sport_events_share_token_idx
  on public.sport_events (share_token)
  where share_token is not null;

alter table public.sport_events
  drop constraint if exists sport_events_share_token_format;

alter table public.sport_events
  add constraint sport_events_share_token_format
  check (
    share_token is null
    or share_token ~ '^[a-z]+-[a-z]+-[0-9]+$'
  );

grant select (share_token) on public.sport_events to anon, authenticated;
