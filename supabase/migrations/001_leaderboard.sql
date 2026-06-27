-- Bir Daha — gerçek leaderboard tablosu
-- Supabase SQL Editor'da veya CLI ile çalıştır

create table if not exists public.leaderboard_scores (
  id uuid primary key default gen_random_uuid(),
  player_id text not null,
  display_name text not null check (char_length(display_name) between 1 and 32),
  seed text not null,
  total_score integer not null check (total_score >= 0 and total_score <= 500000),
  rounds_completed integer not null check (rounds_completed between 1 and 15),
  flawless boolean not null default false,
  is_daily boolean not null default true,
  day_key date not null,
  week_key text not null,
  integrity_digest text not null,
  round_count integer not null default 0,
  client_version text,
  submitted_at timestamptz not null default now(),
  constraint leaderboard_scores_player_day_seed unique (player_id, seed, day_key)
);

create index if not exists leaderboard_scores_daily_idx
  on public.leaderboard_scores (day_key desc, seed, total_score desc);

create index if not exists leaderboard_scores_weekly_idx
  on public.leaderboard_scores (week_key, total_score desc);

create index if not exists leaderboard_scores_alltime_idx
  on public.leaderboard_scores (total_score desc);

create index if not exists leaderboard_scores_flawless_idx
  on public.leaderboard_scores (flawless, total_score desc)
  where flawless = true;

alter table public.leaderboard_scores enable row level security;

-- Herkes okuyabilir (anon key ile)
drop policy if exists "leaderboard_public_read" on public.leaderboard_scores;
create policy "leaderboard_public_read"
  on public.leaderboard_scores
  for select
  to anon, authenticated
  using (true);

-- Doğrudan insert yok — sadece Edge Function (service role) yazar
drop policy if exists "leaderboard_no_direct_insert" on public.leaderboard_scores;
create policy "leaderboard_no_direct_insert"
  on public.leaderboard_scores
  for insert
  to anon, authenticated
  with check (false);

drop policy if exists "leaderboard_no_direct_update" on public.leaderboard_scores;
create policy "leaderboard_no_direct_update"
  on public.leaderboard_scores
  for update
  to anon, authenticated
  using (false);

drop policy if exists "leaderboard_no_direct_delete" on public.leaderboard_scores;
create policy "leaderboard_no_direct_delete"
  on public.leaderboard_scores
  for delete
  to anon, authenticated
  using (false);

-- Run başlangıçları: "Oyna" veya "Serbest Mod" tuşuna basılan her yeni run burada sayılır.
-- Biten run'lar leaderboard_scores'a ayrıca yazılır; bu tablo skor tablosu değildir.
create table if not exists public.run_starts (
  id uuid primary key default gen_random_uuid(),
  player_id text not null,
  display_name text not null check (char_length(display_name) between 1 and 32),
  seed text not null,
  is_daily boolean not null default true,
  day_key date not null,
  started_at timestamptz not null default now()
);

create index if not exists run_starts_day_idx
  on public.run_starts (day_key desc, started_at desc);

create index if not exists run_starts_seed_idx
  on public.run_starts (seed, started_at desc);

alter table public.run_starts enable row level security;

drop policy if exists "run_starts_public_read" on public.run_starts;
create policy "run_starts_public_read"
  on public.run_starts
  for select
  to anon, authenticated
  using (true);

drop policy if exists "run_starts_public_insert" on public.run_starts;
drop policy if exists "run_starts_no_direct_insert" on public.run_starts;
create policy "run_starts_no_direct_insert"
  on public.run_starts
  for insert
  to anon, authenticated
  with check (false);

drop policy if exists "run_starts_no_direct_update" on public.run_starts;
create policy "run_starts_no_direct_update"
  on public.run_starts
  for update
  to anon, authenticated
  using (false);

drop policy if exists "run_starts_no_direct_delete" on public.run_starts;
create policy "run_starts_no_direct_delete"
  on public.run_starts
  for delete
  to anon, authenticated
  using (false);

-- Her periyotta oyuncu başına en iyi skoru DB tarafında tekilleştir.
-- Client'ın top-100 çekip sonradan dedupe yapması aynı oyuncunun çoklu skorlarıyla listeyi daraltıyordu.
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
    where
      case
        when p_period = 'daily' then is_daily = true and day_key = p_day_key and (p_seed is null or seed = p_seed)
        when p_period = 'weekly' then week_key = p_week_key
        when p_period = 'flawless' then flawless = true
        else true
      end
  ),
  ranked as (
    select
      s.*,
      row_number() over (
        partition by s.player_id
        order by s.total_score desc, s.submitted_at asc
      ) as rn
    from scoped s
  )
  select
    ranked.player_id,
    ranked.display_name,
    ranked.seed,
    ranked.total_score,
    ranked.rounds_completed,
    ranked.flawless,
    ranked.week_key,
    ranked.integrity_digest,
    ranked.submitted_at
  from ranked
  where rn = 1
  order by total_score desc, submitted_at asc
  limit greatest(1, least(coalesce(p_limit, 100), 500000));
$$;

create or replace function public.get_leaderboard_rank(
  p_period text,
  p_score integer,
  p_day_key date default null,
  p_week_key text default null,
  p_seed text default null
)
returns table (
  rank integer,
  total integer,
  percent integer
)
language sql
stable
security invoker
as $$
  with best as (
    select *
    from public.get_leaderboard_best(p_period, p_day_key, p_week_key, p_seed, 500000)
  ),
  counts as (
    select
      count(*)::integer as total_count,
      count(*) filter (where total_score > p_score)::integer as better_count
    from best
  )
  select
    (better_count + 1)::integer as rank,
    greatest(total_count, better_count + 1)::integer as total,
    greatest(1, round(((greatest(total_count, better_count + 1) - better_count)::numeric / greatest(total_count, better_count + 1)) * 100))::integer as percent
  from counts;
$$;

grant execute on function public.get_leaderboard_best(text, date, text, text, integer) to anon, authenticated;
grant execute on function public.get_leaderboard_rank(text, integer, date, text, text) to anon, authenticated;
