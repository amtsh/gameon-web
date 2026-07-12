-- Soft-cancel games instead of deleting them. Cancelled games stay visible to
-- hosts and joined players, but drop out of public discovery and invite links.

alter table public.sport_events
  add column if not exists cancelled_at timestamptz;

create index if not exists sport_events_cancelled_at_idx
  on public.sport_events (cancelled_at)
  where cancelled_at is not null;

grant select (cancelled_at) on public.sport_events to anon, authenticated;

drop policy if exists "sport_events_select_discoverable" on public.sport_events;

create policy "sport_events_select_discoverable"
  on public.sport_events for select
  to anon, authenticated
  using (
    (
      cancelled_at is null
      and (
        (not is_private)
        or host_id = (select auth.uid())
        or exists (
          select 1
          from public.event_participants p
          where p.event_id = sport_events.id
            and p.profile_id = (select auth.uid())
        )
        or exists (
          select 1
          from public.event_join_requests r
          where r.event_id = sport_events.id
            and r.requester_id = (select auth.uid())
        )
      )
    )
    or (
      cancelled_at is not null
      and (
        host_id = (select auth.uid())
        or exists (
          select 1
          from public.event_participants p
          where p.event_id = sport_events.id
            and p.profile_id = (select auth.uid())
        )
      )
    )
  );

create or replace function public.get_sport_event_by_share_token(p_share_token text)
returns table (
  id uuid,
  host_id uuid,
  sport public.sport_kind,
  title text,
  description text,
  cost text,
  skill_level public.skill_level,
  capacity integer,
  attendee_count integer,
  starts_at timestamptz,
  ends_at timestamptz,
  venue_name text,
  venue_address text,
  venue_city text,
  venue_country text,
  venue_latitude double precision,
  venue_longitude double precision,
  created_at timestamptz,
  auto_approve boolean,
  is_private boolean,
  share_token text
)
language sql
security definer
stable
set search_path = ''
as $$
  select
    e.id,
    e.host_id,
    e.sport,
    e.title,
    e.description,
    e.cost,
    e.skill_level,
    e.capacity,
    e.attendee_count,
    e.starts_at,
    e.ends_at,
    e.venue_name,
    e.venue_address,
    e.venue_city,
    e.venue_country,
    e.venue_latitude,
    e.venue_longitude,
    e.created_at,
    e.auto_approve,
    e.is_private,
    e.share_token
  from public.sport_events e
  where e.share_token = trim(p_share_token)
    and e.ends_at > now()
    and e.cancelled_at is null
  limit 1;
$$;

drop policy if exists "event_join_requests_insert_public" on public.event_join_requests;

create policy "event_join_requests_insert_public"
  on public.event_join_requests for insert
  to authenticated
  with check (
    requester_id = (select auth.uid())
    and exists (
      select 1
      from public.sport_events e
      where e.id = event_id
        and e.host_id <> (select auth.uid())
        and not e.is_private
        and e.cancelled_at is null
    )
  );

create or replace function public.request_to_join_sport_event(
  p_event_id uuid,
  p_share_token text,
  p_requester_level public.skill_level,
  p_contact_method public.contact_method,
  p_contact_value text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  target public.sport_events;
  uid uuid := (select auth.uid());
begin
  if uid is null then
    raise exception 'Sign in to join';
  end if;

  select * into target
  from public.sport_events
  where id = p_event_id;

  if not found then
    raise exception 'Event not found';
  end if;

  if target.cancelled_at is not null then
    raise exception 'This game was cancelled';
  end if;

  if target.host_id = uid then
    raise exception 'Host cannot join own event';
  end if;

  if target.ends_at <= now() then
    raise exception 'Event has ended';
  end if;

  if target.is_private then
    if p_share_token is null
      or trim(p_share_token) = ''
      or target.share_token is distinct from trim(p_share_token) then
      raise exception 'Private games require a valid invite link';
    end if;
  end if;

  insert into public.event_join_requests (
    event_id,
    requester_id,
    requester_level,
    contact_method,
    contact_value,
    status
  )
  values (
    p_event_id,
    uid,
    p_requester_level,
    p_contact_method,
    trim(p_contact_value),
    'pending'
  )
  on conflict (event_id, requester_id) do update set
    requester_level = excluded.requester_level,
    contact_method = excluded.contact_method,
    contact_value = excluded.contact_value;
end;
$$;

create or replace function public.get_sport_event_roster(
  p_event_id uuid,
  p_share_token text default null
)
returns table (
  profile_id uuid,
  name text,
  requester_level public.skill_level,
  is_host boolean
)
language plpgsql
security definer
stable
set search_path = ''
as $$
declare
  target public.sport_events;
  uid uuid := (select auth.uid());
begin
  select * into target
  from public.sport_events
  where id = p_event_id;

  if not found or target.ends_at <= now() then
    return;
  end if;

  if target.cancelled_at is not null then
    if uid = target.host_id
      or exists (
        select 1
        from public.event_participants p
        where p.event_id = p_event_id and p.profile_id = uid
      ) then
      null;
    else
      return;
    end if;
  end if;

  if target.is_private then
    if uid = target.host_id
      or exists (
        select 1
        from public.event_participants p
        where p.event_id = p_event_id and p.profile_id = uid
      )
      or exists (
        select 1
        from public.event_join_requests r
        where r.event_id = p_event_id and r.requester_id = uid
      ) then
      null;
    elsif p_share_token is null
      or trim(p_share_token) = ''
      or target.share_token is distinct from trim(p_share_token) then
      return;
    end if;
  end if;

  return query
  select
    p.profile_id,
    coalesce(pr.name, 'Player'),
    coalesce(
      j.requester_level,
      'beginner'::public.skill_level
    ),
    p.profile_id = target.host_id
  from public.event_participants p
  left join public.public_profiles pr on pr.id = p.profile_id
  left join public.event_join_requests j
    on j.event_id = p.event_id
    and j.requester_id = p.profile_id
    and j.status = 'approved'
  where p.event_id = p_event_id
  order by p.joined_at;
end;
$$;
