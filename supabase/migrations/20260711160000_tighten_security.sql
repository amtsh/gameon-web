-- Security tightening:
-- 1. Stop exposing full profile rows (contact info, postal code, home
--    coordinates) to other users and guests. Only id + name are public,
--    via a dedicated view.
-- 2. Stop exposing host contact info on publicly readable sport_events.
--    Contact is now only reachable through an authorization-checked RPC.
-- 3. Participants are no longer world-enumerable, and users can no longer
--    add themselves to any event bypassing the join-request approval flow.
-- 4. Length/bounds constraints so free-text fields can't be abused.

-- ---------------------------------------------------------------------------
-- 1. Profiles: public subset view instead of blanket row access
-- ---------------------------------------------------------------------------

drop policy if exists "profiles_select_authenticated" on public.profiles;
drop policy if exists "profiles_select_event_hosts" on public.profiles;

-- Owner-rights view intentionally bypasses profiles RLS but exposes ONLY
-- non-sensitive columns. Do not add columns without a privacy review.
create view public.public_profiles as
  select id, name
  from public.profiles;

comment on view public.public_profiles is
  'Public subset of profiles (display names for event cards). Never add contact/location columns.';

grant select on public.public_profiles to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 2. sport_events: hide host contact columns from direct reads
-- ---------------------------------------------------------------------------

revoke select on table public.sport_events from anon, authenticated;

grant select (
  id,
  host_id,
  sport,
  title,
  description,
  cost,
  skill_level,
  capacity,
  attendee_count,
  starts_at,
  ends_at,
  venue_name,
  venue_address,
  venue_city,
  venue_country,
  venue_latitude,
  venue_longitude,
  created_at
) on public.sport_events to anon, authenticated;

-- Host contact is only released to the host, approved participants, or
-- approved requesters — mirrors iOS hostContactInfoVisibleToApprovedParticipant.
create or replace function public.get_host_contact(target_event_id uuid)
returns table (method public.contact_method, value text)
language sql
security definer
set search_path = ''
as $$
  select e.host_contact_method, e.host_contact_value
  from public.sport_events e
  where e.id = target_event_id
    and e.host_contact_method is not null
    and e.host_contact_value is not null
    and (
      e.host_id = (select auth.uid())
      or exists (
        select 1
        from public.event_participants p
        where p.event_id = e.id
          and p.profile_id = (select auth.uid())
      )
      or exists (
        select 1
        from public.event_join_requests r
        where r.event_id = e.id
          and r.requester_id = (select auth.uid())
          and r.status = 'approved'
      )
    );
$$;

revoke all on function public.get_host_contact(uuid) from public, anon;
grant execute on function public.get_host_contact(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 3. Participants: no world enumeration, no self-service joins
-- ---------------------------------------------------------------------------

drop policy if exists "event_participants_select_authenticated" on public.event_participants;

create policy "event_participants_select_self_or_host"
  on public.event_participants for select
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

-- Previously any signed-in user could insert themselves into any event,
-- bypassing join-request approval and capacity. Only the host may add
-- themself ("fill your spot"); everyone else joins via the
-- approve_join_request() security-definer RPC.
drop policy if exists "event_participants_insert_self" on public.event_participants;

create policy "event_participants_insert_host_self"
  on public.event_participants for insert
  to authenticated
  with check (
    profile_id = (select auth.uid())
    and exists (
      select 1
      from public.sport_events e
      where e.id = event_participants.event_id
        and e.host_id = (select auth.uid())
    )
  );

-- ---------------------------------------------------------------------------
-- 4. Abuse limits on free-text and numeric fields
-- ---------------------------------------------------------------------------

alter table public.profiles
  add constraint profiles_name_len check (char_length(name) <= 80),
  add constraint profiles_contact_value_len
    check (contact_value is null or char_length(contact_value) <= 120),
  add constraint profiles_postal_code_len
    check (postal_code is null or char_length(postal_code) <= 16);

alter table public.sport_events
  add constraint sport_events_title_len check (char_length(title) <= 120),
  add constraint sport_events_description_len check (char_length(description) <= 2000),
  add constraint sport_events_cost_len check (char_length(cost) <= 60),
  add constraint sport_events_capacity_max check (capacity <= 500),
  add constraint sport_events_venue_name_len check (char_length(venue_name) <= 160),
  add constraint sport_events_venue_address_len
    check (venue_address is null or char_length(venue_address) <= 200),
  add constraint sport_events_venue_city_len
    check (venue_city is null or char_length(venue_city) <= 80),
  add constraint sport_events_host_contact_value_len
    check (host_contact_value is null or char_length(host_contact_value) <= 120),
  add constraint sport_events_venue_latitude_range
    check (venue_latitude between -90 and 90),
  add constraint sport_events_venue_longitude_range
    check (venue_longitude between -180 and 180);

alter table public.event_join_requests
  add constraint event_join_requests_contact_value_len
    check (char_length(contact_value) <= 120);

-- Keep the signup trigger compatible with the new name length constraint.
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
    left(
      coalesce(
        nullif(trim(new.raw_user_meta_data ->> 'name'), ''),
        nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
        'Player'
      ),
      80
    )
  );

  insert into public.sport_preferences (profile_id, sport)
  select new.id, s.sport
  from unnest(enum_range(null::public.sport_kind)) as s(sport);

  return new;
end;
$$;
