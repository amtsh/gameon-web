-- Host approval must add the requester as a participant atomically.
create or replace function public.approve_join_request(request_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  req public.event_join_requests;
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

  update public.event_join_requests
  set status = 'approved',
      approved_at = now()
  where id = request_id;

  insert into public.event_participants (event_id, profile_id)
  values (req.event_id, req.requester_id)
  on conflict do nothing;
end;
$$;

revoke all on function public.approve_join_request(uuid) from public, anon;
grant execute on function public.approve_join_request(uuid) to authenticated;
