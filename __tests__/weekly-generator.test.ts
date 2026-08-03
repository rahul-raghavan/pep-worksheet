import { WORKSHEET_PRESETS, SKILL_CATALOG } from '@/lib/worksheet/catalog';
import {
  composeWeeklyWorksheet,
  LayoutCapacityError,
} from '@/lib/worksheet/compose';
import { generateDraftQuestion } from '@/lib/worksheet/generators';
import type { WeeklyWorksheetRecipe } from '@/lib/worksheet/schema';

function defaultRecipe(seed = 'weekly-test-seed'): WeeklyWorksheetRecipe {
  const preset = WORKSHEET_PRESETS[0];
  return {
    schemaVersion: 'weekly-worksheet-recipe-v1',
    title: 'Weekly Mathematics Practice',
    groupLabel: 'Blue Group',
    totalQuestions: preset.totalQuestions,
    selections: preset.selections.map((selection) => ({ ...selection })),
    seed,
  };
}

describe('weekly worksheet composer', () => {
  it('creates the default six-skill, twelve-question, two-page manifest', () => {
    const manifest = composeWeeklyWorksheet(defaultRecipe());
    expect(manifest.questions).toHaveLength(12);
    expect(manifest.recipe.selections).toHaveLength(6);
    expect(manifest.questionPages).toHaveLength(2);
    expect(manifest.questionPages.flat()).toHaveLength(12);
    for (const selection of manifest.recipe.selections) {
      expect(manifest.questions.filter((question) => question.familyId === selection.skillId)).toHaveLength(2);
    }
  });

  it('replays identically with the same seed and changes with a different seed', () => {
    const first = composeWeeklyWorksheet(defaultRecipe('same-seed'));
    const second = composeWeeklyWorksheet(defaultRecipe('same-seed'));
    const different = composeWeeklyWorksheet(defaultRecipe('different-seed'));
    expect(second).toEqual(first);
    expect(different.manifestId).not.toBe(first.manifestId);
    expect(different.questions.map((question) => question.fingerprint)).not.toEqual(
      first.questions.map((question) => question.fingerprint),
    );
  });

  it('does not repeat semantic fingerprints inside a worksheet', () => {
    const manifest = composeWeeklyWorksheet(defaultRecipe());
    const fingerprints = manifest.questions.map((question) => question.fingerprint);
    expect(new Set(fingerprints).size).toBe(fingerprints.length);
  });

  it('uses text-only geometry prompts and allows student drawing instructions', () => {
    const recipe = defaultRecipe('geometry-only-text');
    recipe.selections = [
      { skillId: 'angles', selectionType: 'family', band: 'support', style: 'applied', count: 4 },
      { skillId: 'lines-polygons', selectionType: 'family', band: 'support', style: 'applied', count: 4 },
    ];
    recipe.totalQuestions = 8;
    const manifest = composeWeeklyWorksheet(recipe);
    const promptText = manifest.questions.flatMap((question) => question.prompt.map((segment) => segment.value)).join(' ');
    expect(promptText).not.toMatch(/<svg|<path|diagram/i);
    expect(promptText).toMatch(/draw/i);
    expect(manifest.questions.some((question) => question.responseSpace === 'large')).toBe(true);
  });

  it('rejects a worksheet whose working-space requirements exceed two pages', () => {
    const recipe = defaultRecipe('too-large');
    recipe.selections = [
      { skillId: 'long-division', band: 'stretch', style: 'applied', count: 20 },
    ];
    recipe.totalQuestions = 20;
    expect(() => composeWeeklyWorksheet(recipe)).toThrow(LayoutCapacityError);
  });

  it('keeps written-operation practice substantial and word-problem meanings exact', () => {
    for (let index = 0; index < 100; index += 1) {
      const division = generateDraftQuestion({
        skillId: 'division-one-digit',
        band: 'support',
        style: 'direct',
        seed: `division-size-${index}`,
        occurrence: 0,
        attempt: 0,
      });
      expect(division.fingerprintPayload.dividend).toEqual(expect.any(Number));
      expect(division.fingerprintPayload.dividend as number).toBeGreaterThanOrEqual(1000);

      const integers = generateDraftQuestion({
        skillId: 'integer-addition-subtraction',
        band: 'support',
        style: 'direct',
        seed: `integer-depth-${index}`,
        occurrence: 0,
        attempt: 0,
      });
      expect(integers.fingerprintPayload).toHaveProperty('secondChange');
    }

    const decimalSubtraction = Array.from({ length: 50 }, (_, index) => generateDraftQuestion({
      skillId: 'decimal-subtraction',
      band: 'core',
      style: 'applied',
      seed: `decimal-context-${index}`,
      occurrence: 0,
      attempt: 0,
    })).find((draft) => draft.templateId === 'decimal-subtract-applied');
    expect(decimalSubtraction?.prompt.map((segment) => segment.value).join(' ')).toMatch(/had .* remained/i);

    const fractionSubtraction = Array.from({ length: 50 }, (_, index) => generateDraftQuestion({
      skillId: 'fraction-subtract-unlike',
      band: 'core',
      style: 'applied',
      seed: `fraction-context-${index}`,
      occurrence: 0,
      attempt: 0,
    })).find((draft) => draft.templateId === 'fraction-subtract-applied');
    expect(fractionSubtraction?.prompt.map((segment) => segment.value).join(' ')).toMatch(/another is .*difference/i);
  });

  it('generates 1,000 valid drafts for every registered skill', () => {
    for (const skill of SKILL_CATALOG) {
      for (let index = 0; index < 1000; index += 1) {
        const draft = generateDraftQuestion({
          skillId: skill.id,
          band: (['support', 'core', 'stretch'] as const)[index % 3],
          style: index % 2 === 0 ? 'direct' : 'applied',
          seed: `plugin-${skill.id}-${index}`,
          occurrence: index % 4,
          attempt: 0,
        });
        expect(draft.prompt.length).toBeGreaterThan(0);
        expect(draft.answer.length).toBeGreaterThan(0);
        expect(draft.answerText.length).toBeGreaterThan(0);
      }
    }
  }, 30_000);

  it('honours a precise target instead of switching to a related concept', () => {
    const recipe = defaultRecipe('precise-hcf');
    recipe.selections = [
      { skillId: 'hcf', selectionType: 'skill', band: 'core', style: 'mixed', count: 8 },
    ];
    recipe.totalQuestions = 8;
    const manifest = composeWeeklyWorksheet(recipe);
    expect(new Set(manifest.questions.map((question) => question.skillId))).toEqual(new Set(['hcf']));
    expect(manifest.questions.every((question) => question.templateId.startsWith('hcf-'))).toBe(true);
  });

  it('expands a mixed family deterministically across its precise targets', () => {
    const recipe = defaultRecipe('mixed-number-properties');
    recipe.selections = [
      { skillId: 'factors-multiples-primes', selectionType: 'family', band: 'core', style: 'direct', count: 8 },
    ];
    recipe.totalQuestions = 8;
    const first = composeWeeklyWorksheet(recipe);
    const second = composeWeeklyWorksheet(recipe);
    expect(second).toEqual(first);
    expect(new Set(first.questions.map((question) => question.skillId)).size).toBeGreaterThan(3);
    expect(first.questions.every((question) => question.familyId === 'factors-multiples-primes')).toBe(true);
  });
});
