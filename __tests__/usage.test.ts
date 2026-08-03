/** @jest-environment node */

import { composeWeeklyWorksheet } from '@/lib/worksheet/compose';
import { WORKSHEET_PRESETS } from '@/lib/worksheet/catalog';
import {
  describeProblemSet,
  loadUsageReport,
  summarizeUsageEvents,
  type WorksheetDownloadEvent,
} from '@/lib/usage';

function manifest() {
  const preset = WORKSHEET_PRESETS[0];
  return composeWeeklyWorksheet({
    schemaVersion: 'weekly-worksheet-recipe-v1',
    title: 'Private title that must not be tracked',
    groupLabel: 'Student group that must not be tracked',
    startingPointId: preset.id,
    totalQuestions: preset.totalQuestions,
    selections: [...preset.selections],
    seed: 'usage-summary-test',
  });
}

function event(overrides: Partial<WorksheetDownloadEvent> = {}): WorksheetDownloadEvent {
  return {
    id: 'event-1',
    user_id: 'google-user-1',
    teacher_email: 'teacher@pepschoolv2.com',
    event_type: 'weekly_worksheet_pack_downloaded',
    tool_mode: 'weekly_mixed_review',
    manifest_id: 'manifest-1',
    starting_point_id: 'weekly-cumulative',
    total_questions: 12,
    skill_count: 2,
    skill_summary: [
      { skillId: 'written-add-subtract', skillName: 'Written addition & subtraction', questionCount: 7 },
      { skillId: 'long-division', skillName: 'Long division', questionCount: 5 },
    ],
    band_summary: { core: 9, support: 3 },
    style_summary: { direct: 6, applied: 6 },
    kind_summary: { direct: 6, applied: 6 },
    application_version: 'test',
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

describe('privacy-minimal worksheet usage reporting', () => {
  it('describes the problem set without worksheet or student-facing text', () => {
    const generated = manifest();
    const description = describeProblemSet(generated);
    const serialized = JSON.stringify(description);

    expect(description.startingPointId).toBe('manual-selection');
    expect(description.totalQuestions).toBe(12);
    expect(description.skillSummary).toHaveLength(12);
    expect(new Set(description.skillSummary.map((skill) => skill.familyName)).size).toBe(6);
    expect(Object.values(description.styleSummary).reduce((sum, count) => sum + count, 0)).toBe(12);
    expect(serialized).not.toContain(generated.recipe.title);
    expect(serialized).not.toContain(generated.recipe.groupLabel);
    expect(serialized).not.toContain(generated.seed);
    expect(description).not.toHaveProperty('questions');
    expect(description).not.toHaveProperty('answers');
    expect(description).not.toHaveProperty('groupLabel');
  });

  it('summarizes downloads by teacher and problem-set type', () => {
    const report = summarizeUsageEvents([
      event(),
      event({
        id: 'event-2',
        teacher_email: 'teacher@accelschool.in',
        starting_point_id: 'custom',
        total_questions: 10,
        skill_summary: [{ skillId: 'long-division', skillName: 'Long division', questionCount: 10 }],
        band_summary: { stretch: 10 },
        style_summary: { applied: 10 },
      }),
    ]);

    expect(report.status).toBe('connected');
    expect(report.totalDownloads).toBe(2);
    expect(report.activeTeachers).toBe(2);
    expect(report.teachers).toEqual(expect.arrayContaining([
      expect.objectContaining({ email: 'teacher@accelschool.in', downloads: 1, questions: 10 }),
      expect.objectContaining({ email: 'teacher@pepschoolv2.com', downloads: 1, questions: 12 }),
    ]));
    expect(report.skills[0]).toMatchObject({ id: 'long-division', downloads: 2, questions: 15 });
    expect(report.startingPoints).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'custom', downloads: 1 }),
      expect.objectContaining({ id: 'weekly-cumulative', downloads: 1 }),
    ]));
  });
});

describe('Supabase usage-tracking configuration', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.SUPABASE_SECRET_KEY;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    delete process.env.SUPABASE_ANON_KEY;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    process.env.SUPABASE_URL = 'https://example.supabase.co';
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    jest.restoreAllMocks();
  });

  it('rejects a legacy anon key without querying the private event table', async () => {
    const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
    process.env.SUPABASE_SERVICE_ROLE_KEY = `${encode({ alg: 'HS256' })}.${encode({ role: 'anon' })}.signature`;
    const fetchSpy = jest.spyOn(globalThis, 'fetch');

    const report = await loadUsageReport();

    expect(report.status).toBe('failed');
    expect(report.detail).toContain('public Supabase anon/publishable key');
    expect(report.detail).toContain('Do not grant this table to anon');
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('uses a new Supabase secret key without a Bearer header', async () => {
    process.env.SUPABASE_SECRET_KEY = 'sb_secret_server_only_test';
    const fetchSpy = jest.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify([]), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }));

    const report = await loadUsageReport();

    expect(report.status).toBe('connected');
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/rest/v1/worksheet_download_events'),
      expect.objectContaining({
        headers: { apikey: 'sb_secret_server_only_test' },
      }),
    );
  });
});
