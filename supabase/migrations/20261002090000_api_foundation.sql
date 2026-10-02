-- GameOn API foundation: server-side rate limiting, idempotency, and fast discovery.

create table public.api_rate_limit_windows (
  bucket_key text primary key,
  window_started_at timestamptz not null,
  request_count integer not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.api_rate_limit_windows enable row level security;

create table public.api_idempotency_keys (
  user_id uuid not null references auth.users(id) on delete cascade,
  idempotency_key text not null,
  request_hash text not null,
  status_code integer,
  response_body jsonb,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '24 hours',
  primary key (user_id, idempotency_key)
);

alter table public.api_idempotency_keys enable row level security;

create index api_idempotency_keys_expires_at_idx
  on public.api_idempotency_keys (expires_at);

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
  current_window timestamptz := date_trunc('second', now());
  row_data public.api_rate_limit_windows;
  next_count integer;
  window_end timestamptz;
begin
  if p_limit < 1 or p_window_seconds < 1 then
    raise exception 'Invalid rate limit configuration';
  end if;

  select * into row_data
  from public.api_rate_limit_windows
  where bucket_key = p_bucket_key
  for update;

  if not found or row_data.window_started_at + make_interval(secs => p_window_seconds) <= current_window then
    next_count := 1;
    window_end := current_window + make_interval(secs => p_window_seconds);
    insert into public.api_rate_limit_windows (bucket_key, window_started_at, request_count, updated_at)
    values (p_bucket_key, current_window, 1, now())
    on conflict (bucket_key) do update set
      window_started_at = excluded.window_started_at,
      request_count = 1,
      updated_at = now();
  else
    next_count := row_data.request_count + 1;
    window_end := row_data.window_started_at + make_interval(secs => p_window_seconds);
    update public.api_rate_limit_windows
    set request_count = next_count, updated_at = now()
    where bucket_key = p_bucket_key;
  end if;

  return query
  select next_count <= p_limit, greatest(p_limit - next_count, 0), window_end;
end;
$$;

revoke all on function public.consume_api_rate_limit(text, integer, integer)
  from public, anon, authenticated;
grant execute on function public.consume_api_rate_limit(text, integer, integer) to service_role;

create or replace function public.cleanup_api_idempotency_keys()
returns integer
language sql
security definer
set search_path = ''
as $$
  with deleted as (
    delete from public.api_idempotency_keys
    where expires_at < now()
    returning 1
  )
  select count(*)::integer from deleted;
$$;

revoke all on function public.cleanup_api_idempotency_keys()
  from public, anon, authenticated;
grant execute on function public.cleanup_api_idempotency_keys() to service_role;

create or replace function public.discover_sport_events(
  p_sport public.sport_kind default null,
  p_skill_level public.skill_level default null,
  p_from timestamptz default now(),
  p_to timestamptz default null,
  p_latitude double precision default null,
  p_longitude double precision default null,
  p_radius_km double precision default null,
  p_cursor_starts_at timestamptz default null,
  p_cursor_id uuid default null,
  p_limit integer default 50
)
returns table (
  id uuid,
  host_id uuid,
  sport public.sport_kind,
  title text,
  description text,
  cost_amount numeric,
  cost_currency char(3),
  cost_mode public.cost_mode,
  skill_level public.skill_level,
  capacity integer,
  attendee_count integer,
  starts_at timestamptz,
  ends_at timestamptz,
  venue_name text,
  venue_address text,
  venue_city text,
  venue_country text,
  venue_latitude double precision,
  venue_longitude double precision,
  created_at timestamptz,
  auto_approve boolean,
  is_private boolean,
  distance_meters double precision
)
language sql
security definer
stable
set search_path = ''
as $$
  with candidates as (
    select
      e.*,
      case
        when p_latitude is null or p_longitude is null then null::double precision
        else 6371000.0 * 2.0 * asin(
          sqrt(
            power(sin(radians(e.venue_latitude - p_latitude) / 2.0), 2) +
            cos(radians(p_latitude)) * cos(radians(e.venue_latitude)) *
            power(sin(radians(e.venue_longitude - p_longitude) / 2.0), 2)
          )
        )
      end as calculated_distance
    from public.sport_events e
    where e.cancelled_at is null
      and not e.is_private
      and e.ends_at > now()
      and e.starts_at >= coalesce(p_from, now())
      and (p_to is null or e.starts_at < p_to)
      and (p_sport is null or e.sport = p_sport)
      and (p_skill_level is null or p_skill_level = 'any' or e.skill_level = 'any' or e.skill_level = p_skill_level)
      and (
        p_latitude is null or p_longitude is null or p_radius_km is null
        or (
          e.venue_latitude between p_latitude - (p_radius_km / 111.0)
            and p_latitude + (p_radius_km / 111.0)
          and e.venue_longitude between p_longitude - (p_radius_km / greatest(111.0 * cos(radians(p_latitude)), 0.01))
            and p_longitude + (p_radius_km / greatest(111.0 * cos(radians(p_latitude)), 0.01))
        )
      )
  )
  select
    c.id, c.host_id, c.sport, c.title, c.description,
    c.cost_amount, c.cost_currency, c.cost_mode, c.skill_level,
    c.capacity, c.attendee_count, c.starts_at, c.ends_at,
    c.venue_name, c.venue_address, c.venue_city, c.venue_country,
    c.venue_latitude, c.venue_longitude, c.created_at,
    c.auto_approve, c.is_private, c.calculated_distance
  from candidates c
  where (c.calculated_distance is null or c.calculated_distance <= coalesce(p_radius_km * 1000.0, c.calculated_distance))
    and (
      p_cursor_starts_at is null
      or c.starts_at > p_cursor_starts_at
      or (c.starts_at = p_cursor_starts_at and c.id > p_cursor_id)
    )
  order by c.starts_at asc, c.id asc
  limit least(greatest(coalesce(p_limit, 50), 1), 101);
$$;

revoke all on function public.discover_sport_events(
  public.sport_kind, public.skill_level, timestamptz, timestamptz,
  double precision, double precision, double precision, timestamptz, uuid, integer
) from public, anon, authenticated;
grant execute on function public.discover_sport_events(
  public.sport_kind, public.skill_level, timestamptz, timestamptz,
  double precision, double precision, double precision, timestamptz, uuid, integer
) to service_role;

create index if not exists sport_events_discovery_idx
  on public.sport_events (starts_at, id)
  where cancelled_at is null and is_private = false;
