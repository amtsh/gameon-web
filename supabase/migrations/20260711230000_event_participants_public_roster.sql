-- Allow anyone viewing an upcoming game to see its player roster.
-- attendee_count on sport_events is already public; this aligns
-- event_participants reads with the "See players" UI.
--
-- Skill levels come from a dedicated view — never expose join-request
-- contact info to non-host viewers.

create policy "event_participants_select_upcoming"
  on public.event_participants for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.sport_events e
      where e.id = event_participants.event_id
        and e.ends_at > now()
    )
  );

create view public.event_player_levels as
  select
    j.event_id,
    j.requester_id as profile_id,
    j.requester_level
  from public.event_join_requests j
  inner join public.sport_events e on e.id = j.event_id
  where j.status = 'approved'
    and e.ends_at > now();

comment on view public.event_player_levels is
  'Approved player skill levels for upcoming games. No contact info.';

grant select on public.event_player_levels to anon, authenticated;
