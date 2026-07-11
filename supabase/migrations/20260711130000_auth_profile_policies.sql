-- Host names need to be readable by signed-in users listing events.
create policy "profiles_select_authenticated"
  on public.profiles for select
  to authenticated
  using (true);

-- Guests can read names of users who host visible events.
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

-- Google OAuth supplies full_name in user metadata.
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
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'name'), ''),
      nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
      'Player'
    )
  );

  insert into public.sport_preferences (profile_id, sport)
  select new.id, s.sport
  from unnest(enum_range(null::public.sport_kind)) as s(sport);

  return new;
end;
$$;
