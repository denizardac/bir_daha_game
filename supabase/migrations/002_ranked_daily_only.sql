-- Public rankings are competitive Daily Seed runs only.
-- Free Mode remains personal progression/practice and must never enter ranked scopes.
create or replace function public.get_leaderboard_best(
  p_period text,
  p_day_key date default null,
  p_week_key text default null,
  p_seed text default null,
  p_limit integer default 100
)
returns table (
  player_id text,
  display_name text,
  seed text,
  total_score integer,
  rounds_completed integer,
  flawless boolean,
  week_key text,
  integrity_digest text,
  submitted_at timestamptz
)
language sql
stable
security invoker
as $$
  with scoped as (
    select *
    from public.leaderboard_scores
    where is_daily = true
      and case
        when p_period = 'daily' then day_key = p_day_key and (p_seed is null or seed = p_seed)
        when p_period = 'weekly' then week_key = p_week_key
        when p_period = 'flawless' then flawless = true
        else true
      end
  ),
  ranked as (
    select s.*, row_number() over (
      partition by s.player_id
      order by s.total_score desc, s.submitted_at asc
    ) as rn
    from scoped s
  )
  select
    ranked.player_id, ranked.display_name, ranked.seed, ranked.total_score,
    ranked.rounds_completed, ranked.flawless, ranked.week_key,
    ranked.integrity_digest, ranked.submitted_at
  from ranked
  where rn = 1
  order by total_score desc, submitted_at asc
  limit greatest(1, least(coalesce(p_limit, 100), 500000));
$$;

create index if not exists leaderboard_scores_ranked_weekly_idx
  on public.leaderboard_scores (week_key, total_score desc)
  where is_daily = true;

create index if not exists leaderboard_scores_ranked_alltime_idx
  on public.leaderboard_scores (total_score desc)
  where is_daily = true;
