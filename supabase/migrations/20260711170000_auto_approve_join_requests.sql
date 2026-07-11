-- Let hosts opt an event into auto-approving join requests instead of
-- reviewing each one manually.

alter table public.sport_events
  add column auto_approve boolean not null default false;

grant select (auto_approve) on public.sport_events to anon, authenticated;

-- Runs after a join request lands as 'pending' and immediately approves it
-- (mirrors approve_join_request()) when the host has opted the event into
-- auto-approval. Security definer since requesters can't otherwise write
-- event_participants for themselves.
create or replace function public.maybe_auto_approve_join_request()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
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

revoke all on function public.maybe_auto_approve_join_request() from public, anon, authenticated;

create trigger event_join_requests_maybe_auto_approve
  after insert or update of status, event_id on public.event_join_requests
  for each row execute function public.maybe_auto_approve_join_request();
