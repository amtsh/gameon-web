-- Harden concurrent game joins and the API rate limiter.

create or replace function public.consume_api_rate_limit(
  p_bucket_key text,
  p_limit integer,
  p_window_seconds integer
)
returns table (allowed boolean, remaining integer, reset_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  now_at timestamptz := date_trunc('second', now());
  window_at timestamptz;
  count_now integer;
  reset_at_value timestamptz;
begin
  if p_limit < 1 or p_window_seconds < 1 then
    raise exception 'Invalid rate limit configuration';
  end if;

  insert into public.api_rate_limit_windows (
    bucket_key, window_started_at, request_count, updated_at
  )
  values (
    p_bucket_key, now_at, 1, now()
  )
  on conflict (bucket_key) do update
  set
    window_started_at = case
      when public.api_rate_limit_windows.window_started_at
        + make_interval(secs => p_window_seconds) <= now_at
      then excluded.window_started_at
      else public.api_rate_limit_windows.window_started_at
    end,
    request_count = case
      when public.api_rate_limit_windows.window_started_at
        + make_interval(secs => p_window_seconds) <= now_at
      then 1
      else public.api_rate_limit_windows.request_count + 1
    end,
    updated_at = now();

  select window_started_at, request_count
  into window_at, count_now
  from public.api_rate_limit_windows
  where bucket_key = p_bucket_key;

  reset_at_value := window_at + make_interval(secs => p_window_seconds);

  return query
  select
    count_now <= p_limit,
    greatest(p_limit - count_now, 0),
    reset_at_value;
end;
$$;

revoke all on function public.consume_api_rate_limit(text, integer, integer)
  from public, anon, authenticated;
grant execute on function public.consume_api_rate_limit(text, integer, integer) to service_role;

-- Serialize capacity decisions on the game row. This prevents two concurrent
-- requests from both seeing the same free spot and overfilling a game.
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

  select *
  into target
  from public.sport_events
  where id = new.event_id
  for update;

  if not found then
    raise exception 'Event not found';
  end if;

  if target.cancelled_at is not null then
    raise exception 'This game was cancelled';
  end if;

  if target.ends_at <= now() then
    raise exception 'Event has ended';
  end if;

  select count(*)::integer
  into current_count
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
  select *
  into req
  from public.event_join_requests
  where id = request_id
    and status in ('pending', 'waitlisted')
  for update;

  if not found then
    raise exception 'Join request not found or already handled';
  end if;

  select *
  into target
  from public.sport_events
  where id = req.event_id
    and host_id = auth.uid()
  for update;

  if not found then
    raise exception 'Not allowed to approve this request';
  end if;

  if target.cancelled_at is not null or target.ends_at <= now() then
    raise exception 'Game is no longer available';
  end if;

  select count(*)::integer
  into current_count
  from public.event_participants
  where event_id = req.event_id;

  if current_count >= target.capacity then
    raise exception 'Game is full';
  end if;

  update public.event_join_requests
  set status = 'approved', approved_at = now()
  where id = request_id;
end;
$$;

revoke all on function public.approve_join_request(uuid) from public, anon;
grant execute on function public.approve_join_request(uuid) to authenticated;
