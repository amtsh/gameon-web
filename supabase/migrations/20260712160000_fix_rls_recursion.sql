-- Break RLS recursion between sport_events and event_participants policies.
-- Each policy was querying the other table, causing infinite recursion (42P17).

create or replace function public.is_event_participant(
  p_event_id uuid,
  p_profile_id uuid
)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1
    from public.event_participants p
    where p.event_id = p_event_id
      and p.profile_id = p_profile_id
  );
$$;

create or replace function public.has_event_join_request(
  p_event_id uuid,
  p_requester_id uuid
)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1
    from public.event_join_requests r
    where r.event_id = p_event_id
      and r.requester_id = p_requester_id
  );
$$;

create or replace function public.can_view_event_participants(p_event_id uuid)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1
    from public.sport_events e
    where e.id = p_event_id
      and e.ends_at > now()
      and (
        (
          e.cancelled_at is null
          and (
            not e.is_private
            or e.host_id = (select auth.uid())
            or public.is_event_participant(e.id, (select auth.uid()))
            or public.has_event_join_request(e.id, (select auth.uid()))
          )
        )
        or (
          e.cancelled_at is not null
          and (
            e.host_id = (select auth.uid())
            or public.is_event_participant(e.id, (select auth.uid()))
          )
        )
      )
  );
$$;

revoke all on function public.is_event_participant(uuid, uuid) from public;
revoke all on function public.has_event_join_request(uuid, uuid) from public;
revoke all on function public.can_view_event_participants(uuid) from public;

grant execute on function public.is_event_participant(uuid, uuid) to anon, authenticated;
grant execute on function public.has_event_join_request(uuid, uuid) to anon, authenticated;
grant execute on function public.can_view_event_participants(uuid) to anon, authenticated;

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
        or public.is_event_participant(id, (select auth.uid()))
        or public.has_event_join_request(id, (select auth.uid()))
      )
    )
    or (
      cancelled_at is not null
      and (
        host_id = (select auth.uid())
        or public.is_event_participant(id, (select auth.uid()))
      )
    )
  );

drop policy if exists "event_participants_select_discoverable" on public.event_participants;

create policy "event_participants_select_discoverable"
  on public.event_participants for select
  to anon, authenticated
  using (
    public.can_view_event_participants(event_id)
  );
