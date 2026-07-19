-- Oyuncu geri bildirimleri. Ziyaretçiler tabloyu doğrudan okuyamaz veya yazamaz;
-- kayıtlar yalnızca submit-feedback Edge Function üzerinden service role ile eklenir.

create table if not exists public.feedback_submissions (
  id uuid primary key default gen_random_uuid(),
  player_id text not null check (char_length(player_id) between 1 and 80),
  category text not null check (category in ('bug', 'balance', 'suggestion', 'other')),
  message text not null check (char_length(message) between 10 and 2000),
  contact text check (contact is null or char_length(contact) <= 160),
  screen text not null check (char_length(screen) between 1 and 40),
  phase text check (phase is null or char_length(phase) <= 40),
  round integer check (round is null or round between 1 and 15),
  seed text check (seed is null or char_length(seed) <= 80),
  client_version text check (client_version is null or char_length(client_version) <= 40),
  platform text check (platform is null or char_length(platform) <= 200),
  status text not null default 'new' check (status in ('new', 'reviewing', 'planned', 'resolved', 'closed')),
  admin_note text check (admin_note is null or char_length(admin_note) <= 4000),
  created_at timestamptz not null default now()
);

create index if not exists feedback_submissions_inbox_idx
  on public.feedback_submissions (status, created_at desc);

create index if not exists feedback_submissions_player_rate_idx
  on public.feedback_submissions (player_id, created_at desc);

alter table public.feedback_submissions enable row level security;

-- RLS'de bilerek public policy yok: anon/authenticated için varsayılan davranış deny.
revoke all on public.feedback_submissions from anon, authenticated;
grant select, insert, update, delete on public.feedback_submissions to service_role;

comment on table public.feedback_submissions is
  'Bir Daha oyuncularından Edge Function üzerinden gelen özel geri bildirim kutusu.';
comment on column public.feedback_submissions.contact is
  'Oyuncunun yalnızca yanıt almak isterse bıraktığı e-posta veya kullanıcı adı.';
comment on column public.feedback_submissions.admin_note is
  'Supabase Table Editor içinden ekip notu.';
