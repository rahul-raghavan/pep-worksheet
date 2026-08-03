import { WORKSHEET_PRESETS } from '@/lib/worksheet/catalog';
import { composeWeeklyWorksheet } from '@/lib/worksheet/compose';
import { loadWorksheetHistory, saveWorksheetHistory } from '@/lib/worksheet/history';

describe('chronological worksheet history', () => {
  beforeEach(() => window.localStorage.clear());

  it('stores the immutable worksheet for exact reprint and keeps newest first', () => {
    const preset = WORKSHEET_PRESETS[0];
    const make = (seed: string) =>
      composeWeeklyWorksheet({
        schemaVersion: 'weekly-worksheet-recipe-v1',
        title: 'Weekly Mathematics Practice',
        totalQuestions: 12,
        selections: preset.selections.map((selection) => ({ ...selection })),
        seed,
      });
    const first = make('history-one');
    const second = make('history-two');
    saveWorksheetHistory(first);
    saveWorksheetHistory(second);
    const history = loadWorksheetHistory();
    expect(history).toHaveLength(2);
    expect(history[0].manifest).toEqual(second);
    expect(history[1].manifest).toEqual(first);
  });
});
