/** @jest-environment node */

jest.mock('@/lib/worksheet/pdf', () => ({
  renderPdfDocuments: jest.fn(async (documents: Array<{ name: string }>) => new Map(
    documents.map((document) => [document.name, Buffer.from('%PDF-1.4 test')]),
  )),
}));

import JSZip from 'jszip';
import { composeWeeklyWorksheet } from '@/lib/worksheet/compose';
import { WORKSHEET_PRESETS } from '@/lib/worksheet/catalog';
import { renderWorksheetPack, worksheetArtifactNames } from '@/lib/worksheet/pack';

function manifest(groupLabel?: string) {
  const preset = WORKSHEET_PRESETS[0];
  return composeWeeklyWorksheet({
    schemaVersion: 'weekly-worksheet-recipe-v1',
    title: 'Weekly Mathematics Practice',
    groupLabel,
    totalQuestions: preset.totalQuestions,
    selections: preset.selections.map((selection) => ({ ...selection })),
    seed: `pack-filename-${groupLabel ?? 'no-group'}`,
  });
}

describe('worksheet artifact filenames', () => {
  const generatedAt = new Date('2026-08-02T20:00:00.000Z');

  it('includes the optional group and the generation date in safe filenames', () => {
    const names = worksheetArtifactNames(manifest('Grade 4 / Blue Jays'), generatedAt);

    expect(names.studentPdf).toBe('PEP Weekly Mathematics Practice - Grade-4-Blue-Jays - 2026-08-03.pdf');
    expect(names.answerKeyPdf).toBe('PEP Weekly Mathematics Practice - Grade-4-Blue-Jays - 2026-08-03 - Answer Key.pdf');
    expect(names.completePackZip).toBe('PEP Weekly Mathematics Practice - Grade-4-Blue-Jays - 2026-08-03 - Complete Pack.zip');
  });

  it('uses the date without leaving an empty group separator', () => {
    const names = worksheetArtifactNames(manifest(), generatedAt);

    expect(names.studentPdf).toBe('PEP Weekly Mathematics Practice - 2026-08-03.pdf');
  });

  it('uses the same clear stem for every file inside the complete pack', async () => {
    const source = manifest('Grade 4 / Blue Jays');
    const names = worksheetArtifactNames(source, generatedAt);
    const zip = await JSZip.loadAsync(await renderWorksheetPack(source, generatedAt));

    expect(Object.keys(zip.files).sort()).toEqual([
      names.answerKeyPdf,
      names.manifestJson,
      names.recipeJson,
      names.studentPdf,
    ].sort());
  });
});
