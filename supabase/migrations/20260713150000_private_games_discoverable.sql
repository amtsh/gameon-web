-- List private games in discovery (map + home sheet nearby sections).
-- Joining remains token-gated via request_to_join_sport_event and app checks.

drop policy if exists "sport_events_select_discoverable" on public.sport_events;

create policy "sport_events_select_discoverable"
  on public.sport_events for select
  to anon, authenticated
  using (
    cancelled_at is null
    or (
      cancelled_at is not null
      and (
        host_id = (select auth.uid())
        or public.is_event_participant(id, (select auth.uid()))
      )
    )
  );
