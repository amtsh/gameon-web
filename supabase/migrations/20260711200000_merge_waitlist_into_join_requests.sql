-- Step 2: replace the parallel event_waitlist table (duplicate columns,
-- 3 extra policies, an AFTER trigger that deleted its own row) with a
-- 'waitlisted' status on event_join_requests, and reduce the join flow to
-- two small triggers:
--
--   route_join_request      BEFORE INSERT  full → waitlisted,
--                                          auto_approve → approved
--   add_participant_on_approval AFTER INSERT/UPDATE  approved → participant
--
-- Approving, auto-approving, and waitlist promotion all become plain status
-- updates; participant bookkeeping happens in exactly one place.

-- ---------------------------------------------------------------------------
-- Carry over existing waitlist rows
-- ---------------------------------------------------------------------------

insert into public.event_join_requests
  (event_id, requester_id, requester_level, contact_method, contact_value, status, created_at)
select event_id, profile_id, requester_level, contact_method, contact_value, 'waitlisted', joined_at
from public.event_waitlist
on conflict (event_id, requester_id) do nothing;

-- ---------------------------------------------------------------------------
-- Drop the old machinery
-- ---------------------------------------------------------------------------

drop trigger if exists event_participants_promote_waitlist on public.event_participants;
drop function if exists public.promote_waitlist_on_participant_leave();

drop trigger if exists event_join_requests_maybe_auto_approve on public.event_join_requests;
drop function if exists public.maybe_auto_approve_join_request();

drop table public.event_waitlist;

-- ---------------------------------------------------------------------------
-- Route new requests: full game → waitlisted, auto-approve → approved
-- ---------------------------------------------------------------------------

create or replace function public.route_join_request()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target public.sport_events;
  current_count integer;
begin
  if new.status <> 'pending' then
    return new;
  end if;

  select * into target
  from public.sport_events
  where id = new.event_id;

  select count(*)::integer into current_count
  from public.event_participants
  where event_id = new.event_id;

  if current_count >= target.capacity then
    new.status := 'waitlisted';
  elsif target.auto_approve then
    new.status := 'approved';
    new.approved_at := now();
  end if;

  return new;
end;
$$;

revoke all on function public.route_join_request() from public, anon, authenticated;

create trigger event_join_requests_route
  before insert on public.event_join_requests
  for each row execute function public.route_join_request();

-- ---------------------------------------------------------------------------
-- Single place that turns an approval into a participant row
-- ---------------------------------------------------------------------------

create or replace function public.add_participant_on_approval()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'approved'
     and (tg_op = 'INSERT' or old.status is distinct from 'approved') then
    insert into public.event_participants (event_id, profile_id)
    values (new.event_id, new.requester_id)
    on conflict do nothing;
  end if;
  return new;
end;
$$;

revoke all on function public.add_participant_on_approval() from public, anon, authenticated;

create trigger event_join_requests_add_participant
  after insert or update of status on public.event_join_requests
  for each row execute function public.add_participant_on_approval();

-- ---------------------------------------------------------------------------
-- Approving is now just a status update
-- ---------------------------------------------------------------------------

create or replace function public.approve_join_request(request_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  req public.event_join_requests;
  target public.sport_events;
  current_count integer;
begin
  select * into req
  from public.event_join_requests
  where id = request_id
    and status in ('pending', 'waitlisted');

  if not found then
    raise exception 'Join request not found or already handled';
  end if;

  select * into target
  from public.sport_events
  where id = req.event_id
    and host_id = auth.uid();

  if not found then
    raise exception 'Not allowed to approve this request';
  end if;

  select count(*)::integer into current_count
  from public.event_participants
  where event_id = req.event_id;

  if current_count >= target.capacity then
    raise exception 'Game is full';
  end if;

  update public.event_join_requests
  set status = 'approved',
      approved_at = now()
  where id = request_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- When a participant leaves: clear their request, promote the next in line
-- ---------------------------------------------------------------------------

create or replace function public.on_participant_leave()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target public.sport_events;
  current_count integer;
begin
  -- Leaving voids the leaver's (approved) request so they can re-request.
  delete from public.event_join_requests
  where event_id = old.event_id
    and requester_id = old.profile_id;

  select * into target
  from public.sport_events
  where id = old.event_id
    and ends_at > now();

  if not found then
    return old;
  end if;

  select count(*)::integer into current_count
  from public.event_participants
  where event_id = old.event_id;

  if current_count >= target.capacity then
    return old;
  end if;

  -- Promote the longest-waiting request; the approval trigger adds the
  -- participant row.
  update public.event_join_requests
  set status = 'approved',
      approved_at = now()
  where id = (
    select id
    from public.event_join_requests
    where event_id = old.event_id
      and status = 'waitlisted'
    order by created_at asc
    limit 1
  );

  return old;
end;
$$;

revoke all on function public.on_participant_leave() from public, anon, authenticated;

create trigger event_participants_on_leave
  after delete on public.event_participants
  for each row execute function public.on_participant_leave();
