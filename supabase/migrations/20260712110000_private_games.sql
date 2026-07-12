-- Private games are visible on the home feed but can only be joined
-- through a shared link. The is_private flag is enforced in the app layer;
-- the DB column stores the host's intent.
alter table public.sport_events
  add column if not exists is_private boolean not null default false;
