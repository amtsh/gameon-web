-- Waitlist for full games. First in line is auto-promoted when a spot opens.

create table public.event_waitlist (
  event_id uuid not null references public.sport_events (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  requester_level public.skill_level not null default 'beginner',
  contact_method public.contact_method not null,
  contact_value text not null,
  joined_at timestamptz not null default now(),
  primary key (event_id, profile_id)
);

create index event_waitlist_event_id_idx on public.event_waitlist (event_id);
create index event_waitlist_profile_id_idx on public.event_waitlist (profile_id);

alter table public.event_waitlist enable row level security;

create policy "event_waitlist_select_self_or_host"
  on public.event_waitlist for select
  to authenticated
  using (
    profile_id = (select auth.uid())
    or exists (
      select 1
      from public.sport_events e
      where e.id = event_waitlist.event_id
        and e.host_id = (select auth.uid())
    )
  );

create policy "event_waitlist_insert_self"
  on public.event_waitlist for insert
  to authenticated
  with check (
    profile_id = (select auth.uid())
    and not exists (
      select 1
      from public.sport_events e
      where e.id = event_id
        and e.host_id = (select auth.uid())
    )
    and not exists (
      select 1
      from public.event_participants p
      where p.event_id = event_waitlist.event_id
        and p.profile_id = (select auth.uid())
    )
    and exists (
      select 1
      from public.sport_events e
      where e.id = event_id
        and e.ends_at > now()
        and e.attendee_count >= e.capacity
    )
  );

create policy "event_waitlist_delete_self_or_host"
  on public.event_waitlist for delete
  to authenticated
  using (
    profile_id = (select auth.uid())
    or exists (
      select 1
      from public.sport_events e
      where e.id = event_waitlist.event_id
        and e.host_id = (select auth.uid())
    )
  );

alter table public.event_waitlist
  add constraint event_waitlist_contact_value_len
    check (char_length(contact_value) <= 120);

-- Promote the longest-waiting player when a participant leaves and a spot opens.
create or replace function public.promote_waitlist_on_participant_leave()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  next_wait public.event_waitlist;
  current_count integer;
  event_capacity integer;
begin
  select count(*)::integer
  into current_count
  from public.event_participants
  where event_id = old.event_id;

  select capacity
  into event_capacity
  from public.sport_events
  where id = old.event_id
    and ends_at > now();

  if event_capacity is null or current_count >= event_capacity then
    return old;
  end if;

  select *
  into next_wait
  from public.event_waitlist
  where event_id = old.event_id
  order by joined_at asc
  limit 1;

  if not found then
    return old;
  end if;

  insert into public.event_participants (event_id, profile_id)
  values (next_wait.event_id, next_wait.profile_id)
  on conflict do nothing;

  delete from public.event_waitlist
  where event_id = next_wait.event_id
    and profile_id = next_wait.profile_id;

  return old;
end;
$$;

revoke all on function public.promote_waitlist_on_participant_leave() from public, anon, authenticated;

create trigger event_participants_promote_waitlist
  after delete on public.event_participants
  for each row execute function public.promote_waitlist_on_participant_leave();

-- Do not approve into a full game; auto-approve should waitlist instead.
create or replace function public.approve_join_request(request_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  req public.event_join_requests;
  event_capacity integer;
  current_count integer;
begin
  select *
  into req
  from public.event_join_requests
  where id = request_id
    and status = 'pending';

  if not found then
    raise exception 'Join request not found or already handled';
  end if;

  if not exists (
    select 1
    from public.sport_events e
    where e.id = req.event_id
      and e.host_id = auth.uid()
  ) then
    raise exception 'Not allowed to approve this request';
  end if;

  select capacity
  into event_capacity
  from public.sport_events
  where id = req.event_id;

  select count(*)::integer
  into current_count
  from public.event_participants
  where event_id = req.event_id;

  if current_count >= event_capacity then
    raise exception 'Game is full';
  end if;

  update public.event_join_requests
  set status = 'approved',
      approved_at = now()
  where id = request_id;

  insert into public.event_participants (event_id, profile_id)
  values (req.event_id, req.requester_id)
  on conflict do nothing;
end;
$$;

create or replace function public.maybe_auto_approve_join_request()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  event_capacity integer;
  current_count integer;
begin
  if new.status <> 'pending' then
    return new;
  end if;

  if not exists (
    select 1
    from public.sport_events e
    where e.id = new.event_id
      and e.auto_approve = true
  ) then
    return new;
  end if;

  select capacity
  into event_capacity
  from public.sport_events
  where id = new.event_id;

  select count(*)::integer
  into current_count
  from public.event_participants
  where event_id = new.event_id;

  if current_count >= event_capacity then
    insert into public.event_waitlist (
      event_id,
      profile_id,
      requester_level,
      contact_method,
      contact_value
    )
    values (
      new.event_id,
      new.requester_id,
      new.requester_level,
      new.contact_method,
      new.contact_value
    )
    on conflict (event_id, profile_id) do update
      set requester_level = excluded.requester_level,
          contact_method = excluded.contact_method,
          contact_value = excluded.contact_value;

    delete from public.event_join_requests
    where id = new.id;

    return null;
  end if;

  update public.event_join_requests
  set status = 'approved',
      approved_at = now()
  where id = new.id;

  insert into public.event_participants (event_id, profile_id)
  values (new.event_id, new.requester_id)
  on conflict do nothing;

  return new;
end;
$$;
