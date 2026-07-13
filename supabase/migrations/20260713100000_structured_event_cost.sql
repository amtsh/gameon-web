-- Structured event cost: amount, currency, and booking vs per-person mode.

create type public.cost_mode as enum ('total', 'per_person');

alter table public.sport_events
  add column cost_amount numeric(12, 2),
  add column cost_currency char(3),
  add column cost_mode public.cost_mode;

-- Backfill from legacy text values like "80 SEK", "20 EUR per person", "80 SEK total".
with parsed as (
  select
    id,
    regexp_match(
      trim(cost),
      '^(\d+(?:\.\d+)?)\s*([A-Za-z]{3})(?:\s+(total|per person))?$',
      'i'
    ) as parts
  from public.sport_events
  where trim(cost) <> ''
)
update public.sport_events e
set
  cost_amount = (p.parts)[1]::numeric,
  cost_currency = upper((p.parts)[2]),
  cost_mode = case
    when lower(coalesce((p.parts)[3], 'total')) = 'per person'
      then 'per_person'::public.cost_mode
    else 'total'::public.cost_mode
  end
from parsed p
where e.id = p.id
  and p.parts is not null;

alter table public.sport_events
  drop constraint if exists sport_events_cost_len;

alter table public.sport_events
  add constraint sport_events_cost_consistency check (
    (
      cost_amount is null
      and cost_currency is null
      and cost_mode is null
    )
    or (
      cost_amount is not null
      and cost_amount >= 0
      and cost_currency is not null
      and cost_mode is not null
    )
  ),
  add constraint sport_events_cost_currency_len
    check (cost_currency is null or char_length(cost_currency) = 3);

alter table public.sport_events
  drop column cost;

grant select (cost_amount, cost_currency, cost_mode)
  on public.sport_events to anon, authenticated;

drop function if exists public.get_sport_event_by_share_token(text);

create function public.get_sport_event_by_share_token(p_share_token text)
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
  share_token text
)
language sql
security definer
stable
set search_path = ''
as $$
  select
    e.id,
    e.host_id,
    e.sport,
    e.title,
    e.description,
    e.cost_amount,
    e.cost_currency,
    e.cost_mode,
    e.skill_level,
    e.capacity,
    e.attendee_count,
    e.starts_at,
    e.ends_at,
    e.venue_name,
    e.venue_address,
    e.venue_city,
    e.venue_country,
    e.venue_latitude,
    e.venue_longitude,
    e.created_at,
    e.auto_approve,
    e.is_private,
    e.share_token
  from public.sport_events e
  where e.share_token = trim(p_share_token)
    and e.ends_at > now()
    and e.cancelled_at is null
  limit 1;
$$;

revoke all on function public.get_sport_event_by_share_token(text) from public;
grant execute on function public.get_sport_event_by_share_token(text) to anon, authenticated;
