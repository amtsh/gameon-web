-- GameOn initial schema (mirrors iOS SwiftData models in GameOn/Core/Models)
-- https://supabase.com/docs/guides/database/postgres/row-level-security

-- ---------------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------------

create type public.sport_kind as enum (
  'badminton',
  'cricket',
  'football',
  'tennis',
  'running',
  'pickleball',
  'basketball',
  'volleyball',
  'cycling'
);

create type public.skill_level as enum (
  'any',
  'beginner',
  'intermediate',
  'advanced'
);

create type public.contact_method as enum (
  'whatsapp',
  'telegram'
);

create type public.location_mode as enum (
  'device_location',
  'postal_code'
);

create type public.join_request_status as enum (
  'pending',
  'approved'
);

-- ---------------------------------------------------------------------------
-- Profiles (1:1 with auth.users — replaces iOS UserProfile)
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null check (char_length(trim(name)) > 0),
  is_onboarding_complete boolean not null default false,
  location_mode public.location_mode not null default 'device_location',
  postal_code text,
  postal_latitude double precision,
  postal_longitude double precision,
  contact_method public.contact_method,
  contact_value text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'User profile; mirrors UserProfile.swift';

-- ---------------------------------------------------------------------------
-- Sport preferences (mirrors SportPreference.swift)
-- ---------------------------------------------------------------------------

create table public.sport_preferences (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  sport public.sport_kind not null,
  level public.skill_level not null default 'beginner',
  is_interested boolean not null default false,
  updated_at timestamptz not null default now(),
  unique (profile_id, sport)
);

create index sport_preferences_profile_id_idx on public.sport_preferences (profile_id);

-- ---------------------------------------------------------------------------
-- Sport events (mirrors SportEvent.swift; venue embedded as columns)
-- ---------------------------------------------------------------------------

create table public.sport_events (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references public.profiles (id) on delete cascade,
  sport public.sport_kind not null,
  title text not null check (char_length(trim(title)) > 0),
  description text not null default '',
  cost text not null default '',
  skill_level public.skill_level not null default 'any',
  capacity integer not null check (capacity >= 1),
  attendee_count integer not null default 0 check (attendee_count >= 0),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  host_contact_method public.contact_method,
  host_contact_value text,
  venue_name text not null check (char_length(trim(venue_name)) > 0),
  venue_address text,
  venue_city text,
  venue_country text,
  venue_latitude double precision not null,
  venue_longitude double precision not null,
  created_at timestamptz not null default now(),
  check (ends_at > starts_at),
  check (attendee_count <= capacity)
);

create index sport_events_starts_at_idx on public.sport_events (starts_at);
create index sport_events_host_id_idx on public.sport_events (host_id);
create index sport_events_sport_idx on public.sport_events (sport);
create index sport_events_location_idx on public.sport_events (venue_latitude, venue_longitude);

-- ---------------------------------------------------------------------------
-- Event participants (approved joins + host fill-your-spot)
-- ---------------------------------------------------------------------------

create table public.event_participants (
  event_id uuid not null references public.sport_events (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (event_id, profile_id)
);

create index event_participants_profile_id_idx on public.event_participants (profile_id);

-- ---------------------------------------------------------------------------
-- Join requests (mirrors EventJoinRequest.swift)
-- ---------------------------------------------------------------------------

create table public.event_join_requests (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.sport_events (id) on delete cascade,
  requester_id uuid not null references public.profiles (id) on delete cascade,
  requester_level public.skill_level not null default 'beginner',
  contact_method public.contact_method not null,
  contact_value text not null,
  status public.join_request_status not null default 'pending',
  created_at timestamptz not null default now(),
  approved_at timestamptz,
  unique (event_id, requester_id)
);

create index event_join_requests_event_id_idx on public.event_join_requests (event_id);
create index event_join_requests_requester_id_idx on public.event_join_requests (requester_id);

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger sport_preferences_set_updated_at
  before update on public.sport_preferences
  for each row execute function public.set_updated_at();

-- Bootstrap profile + default sport preferences on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, name)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'name'), ''), 'Player')
  );

  insert into public.sport_preferences (profile_id, sport)
  select new.id, s.sport
  from unnest(enum_range(null::public.sport_kind)) as s(sport);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Keep attendee_count in sync with participants
create or replace function public.sync_event_attendee_count()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_event_id uuid;
  next_count integer;
begin
  target_event_id := coalesce(new.event_id, old.event_id);

  select count(*)::integer
  into next_count
  from public.event_participants
  where event_id = target_event_id;

  update public.sport_events
  set attendee_count = next_count
  where id = target_event_id;

  return coalesce(new, old);
end;
$$;

create trigger event_participants_sync_attendee_count
  after insert or delete on public.event_participants
  for each row execute function public.sync_event_attendee_count();

-- Trigger-only functions should not be callable via PostgREST RPC
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.sync_event_attendee_count() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.sport_preferences enable row level security;
alter table public.sport_events enable row level security;
alter table public.event_participants enable row level security;
alter table public.event_join_requests enable row level security;

-- Profiles: own row only
create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using (id = (select auth.uid()));

create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- Sport preferences: own rows only
create policy "sport_preferences_select_own"
  on public.sport_preferences for select
  to authenticated
  using (profile_id = (select auth.uid()));

create policy "sport_preferences_insert_own"
  on public.sport_preferences for insert
  to authenticated
  with check (profile_id = (select auth.uid()));

create policy "sport_preferences_update_own"
  on public.sport_preferences for update
  to authenticated
  using (profile_id = (select auth.uid()))
  with check (profile_id = (select auth.uid()));

create policy "sport_preferences_delete_own"
  on public.sport_preferences for delete
  to authenticated
  using (profile_id = (select auth.uid()));

-- Events: readable by everyone; writable by host
create policy "sport_events_select_public"
  on public.sport_events for select
  to anon, authenticated
  using (true);

create policy "sport_events_insert_host"
  on public.sport_events for insert
  to authenticated
  with check (host_id = (select auth.uid()));

create policy "sport_events_update_host"
  on public.sport_events for update
  to authenticated
  using (host_id = (select auth.uid()))
  with check (host_id = (select auth.uid()));

create policy "sport_events_delete_host"
  on public.sport_events for delete
  to authenticated
  using (host_id = (select auth.uid()));

-- Participants: visible to authenticated; insert own; host can manage
create policy "event_participants_select_authenticated"
  on public.event_participants for select
  to authenticated
  using (true);

create policy "event_participants_insert_self"
  on public.event_participants for insert
  to authenticated
  with check (profile_id = (select auth.uid()));

create policy "event_participants_delete_self_or_host"
  on public.event_participants for delete
  to authenticated
  using (
    profile_id = (select auth.uid())
    or exists (
      select 1
      from public.sport_events e
      where e.id = event_participants.event_id
        and e.host_id = (select auth.uid())
    )
  );

-- Join requests
create policy "event_join_requests_select_involved"
  on public.event_join_requests for select
  to authenticated
  using (
    requester_id = (select auth.uid())
    or exists (
      select 1
      from public.sport_events e
      where e.id = event_join_requests.event_id
        and e.host_id = (select auth.uid())
    )
  );

create policy "event_join_requests_insert_self"
  on public.event_join_requests for insert
  to authenticated
  with check (
    requester_id = (select auth.uid())
    and not exists (
      select 1
      from public.sport_events e
      where e.id = event_id
        and e.host_id = (select auth.uid())
    )
  );

create policy "event_join_requests_update_host"
  on public.event_join_requests for update
  to authenticated
  using (
    exists (
      select 1
      from public.sport_events e
      where e.id = event_join_requests.event_id
        and e.host_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1
      from public.sport_events e
      where e.id = event_join_requests.event_id
        and e.host_id = (select auth.uid())
    )
  );

create policy "event_join_requests_delete_self"
  on public.event_join_requests for delete
  to authenticated
  using (requester_id = (select auth.uid()));
