/** @jest-environment node */

import { composeWeeklyWorksheet } from '@/lib/worksheet/compose';
import { WORKSHEET_PRESETS } from '@/lib/worksheet/catalog';
import {
  describeProblemSet,
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
