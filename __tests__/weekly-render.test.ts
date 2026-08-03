import { WORKSHEET_PRESETS } from '@/lib/worksheet/catalog';
import { composeWeeklyWorksheet } from '@/lib/worksheet/compose';
import { renderAnswerKeyHtml, renderStudentHtml } from '@/lib/worksheet/render';

function manifest() {
  const preset = WORKSHEET_PRESETS[2];
  return composeWeeklyWorksheet({
    schemaVersion: 'weekly-worksheet-recipe-v1',
    title: 'Weekly Mathematics Practice',
    groupLabel: 'Falcons',
    totalQuestions: preset.totalQuestions,
    selections: preset.selections.map((selection) => ({ ...selection })),
    seed: 'render-test',
  });
}

describe('weekly PDF HTML rendering', () => {
  it('renders exactly two explicit student pages with every question once', () => {
    const output = renderStudentHtml(manifest());
    expect((output.match(/<section class="page">/g) ?? [])).toHaveLength(2);
    expect((output.match(/class="question-number"/g) ?? [])).toHaveLength(12);
    expect(output).toContain('Page 1 of 2');
    expect(output).toContain('Page 2 of 2');
    expect(output).not.toContain('<svg');
    expect(output).not.toMatch(/Monday|Tuesday|Wednesday|Thursday|Friday/);
    expect(output).not.toContain('repeating-linear-gradient');
    expect(output).not.toContain('class="week-strip"');
    expect(output).not.toMatch(/#[0-9a-f]{6}/i);
  });

  it('renders conventional mathematics and a complete teacher key', () => {
    const source = manifest();
    const student = renderStudentHtml(source);
    const key = renderAnswerKeyHtml(source);
    expect(student).toContain('<math');
    expect((key.match(/class="answer-item"/g) ?? [])).toHaveLength(source.questions.length);
    expect(key).toContain('Teacher answer key');
  });
});
