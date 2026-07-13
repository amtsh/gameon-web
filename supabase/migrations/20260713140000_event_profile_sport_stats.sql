-- Sport-scoped social stats for event detail and approved-player roster.
-- Counts are completed, non-cancelled games only (ends_at <= now()).

create or replace function public.can_view_event_social_stats(
  p_event_id uuid,
  p_share_token text default null
)
returns boolean
language plpgsql
security definer
stable
set search_path = ''
as $$
declare
  target public.sport_events;
  uid uuid := (select auth.uid());
begin
  select * into target
  from public.sport_events
  where id = p_event_id;

  if not found or target.ends_at <= now() then
    return false;
  end if;

  if target.cancelled_at is not null then
    return uid = target.host_id
      or public.is_event_participant(p_event_id, uid);
  end if;

  if target.is_private then
    if uid = target.host_id
      or public.is_event_participant(p_event_id, uid)
      or public.has_event_join_request(p_event_id, uid) then
      return true;
    end if;

    return p_share_token is not null
      and trim(p_share_token) <> ''
      and target.share_token = trim(p_share_token);
  end if;

  return true;
end;
$$;

create or replace function public.get_host_sport_games_hosted_count(
  p_event_id uuid,
  p_share_token text default null
)
returns integer
language plpgsql
security definer
stable
set search_path = ''
as $$
declare
  target public.sport_events;
begin
  if not public.can_view_event_social_stats(p_event_id, p_share_token) then
    return null;
  end if;

  select * into target
  from public.sport_events
  where id = p_event_id;

  return (
    select count(*)::integer
    from public.sport_events e
    where e.host_id = target.host_id
      and e.sport = target.sport
      and e.cancelled_at is null
      and e.ends_at <= now()
  );
end;
$$;

create or replace function public.get_sport_games_played_counts(
  p_event_id uuid,
  p_profile_ids uuid[],
  p_share_token text default null
)
returns table (
  profile_id uuid,
  games_played integer
)
language plpgsql
security definer
stable
set search_path = ''
as $$
declare
  target public.sport_events;
begin
  if not public.can_view_event_social_stats(p_event_id, p_share_token) then
    return;
  end if;

  select * into target
  from public.sport_events
  where id = p_event_id;

  return query
  select
    ids.profile_id,
    (
      select count(*)::integer
      from public.event_participants p
      inner join public.sport_events e on e.id = p.event_id
      where p.profile_id = ids.profile_id
        and e.sport = target.sport
        and e.cancelled_at is null
        and e.ends_at <= now()
    ) as games_played
  from unnest(p_profile_ids) as ids(profile_id);
end;
$$;

revoke all on function public.can_view_event_social_stats(uuid, text) from public;
revoke all on function public.get_host_sport_games_hosted_count(uuid, text) from public;
revoke all on function public.get_sport_games_played_counts(uuid, uuid[], text) from public;

grant execute on function public.can_view_event_social_stats(uuid, text) to anon, authenticated;
grant execute on function public.get_host_sport_games_hosted_count(uuid, text) to anon, authenticated;
grant execute on function public.get_sport_games_played_counts(uuid, uuid[], text) to anon, authenticated;
