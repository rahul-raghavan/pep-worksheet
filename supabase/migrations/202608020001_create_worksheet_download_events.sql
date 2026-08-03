create extension if not exists pgcrypto;

create table if not exists public.worksheet_download_events (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  teacher_email text not null,
  event_type text not null check (event_type = 'weekly_worksheet_pack_downloaded'),
  tool_mode text not null check (tool_mode = 'weekly_mixed_review'),
  manifest_id text not null,
  starting_point_id text not null default 'custom',
  total_questions smallint not null check (total_questions between 8 and 20),
  skill_count smallint not null check (skill_count between 1 and 8),
  skill_summary jsonb not null default '[]'::jsonb,
  band_summary jsonb not null default '{}'::jsonb,
  style_summary jsonb not null default '{}'::jsonb,
  kind_summary jsonb not null default '{}'::jsonb,
  application_version text not null,
  created_at timestamptz not null default now()
);

create index if not exists worksheet_download_events_created_at_idx
  on public.worksheet_download_events (created_at desc);

create index if not exists worksheet_download_events_teacher_email_idx
  on public.worksheet_download_events (teacher_email, created_at desc);

create index if not exists worksheet_download_events_manifest_id_idx
  on public.worksheet_download_events (manifest_id);

alter table public.worksheet_download_events enable row level security;

revoke all on table public.worksheet_download_events from anon, authenticated;
grant select, insert on table public.worksheet_download_events to service_role;

comment on table public.worksheet_download_events is
  'Privacy-minimal successful worksheet-pack generation events. Contains no student data or question content.';
