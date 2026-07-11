-- Allow anyone to browse upcoming games on the map and feed.
drop policy if exists "sport_events_select_authenticated" on public.sport_events;

create policy "sport_events_select_public"
  on public.sport_events for select
  to anon, authenticated
  using (true);

-- Guests need host display names on event cards.
create policy "profiles_select_event_hosts"
  on public.profiles for select
  to anon
  using (
    exists (
      select 1
      from public.sport_events e
      where e.host_id = profiles.id
    )
  );
