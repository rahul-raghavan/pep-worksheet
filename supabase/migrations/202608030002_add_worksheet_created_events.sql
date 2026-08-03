alter table public.worksheet_download_events
  drop constraint if exists worksheet_download_events_event_type_check;

alter table public.worksheet_download_events
  add constraint worksheet_download_events_event_type_check
  check (event_type in (
    'weekly_worksheet_created',
    'weekly_worksheet_pack_downloaded'
  ));

comment on table public.worksheet_download_events is
  'Privacy-minimal successful worksheet creation and complete-pack download events. Contains no student data, group labels, or question content.';
