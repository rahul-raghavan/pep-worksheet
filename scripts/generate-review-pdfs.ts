import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { WORKSHEET_PRESETS } from '../src/lib/worksheet/catalog';
import { composeWeeklyWorksheet } from '../src/lib/worksheet/compose';
import { renderPdfDocuments } from '../src/lib/worksheet/pdf';
import { renderAnswerKeyHtml, renderStudentHtml } from '../src/lib/worksheet/render';
import type { WeeklyWorksheetRecipe } from '../src/lib/worksheet/schema';

interface ReviewPaper {
  slug: string;
  recipe: WeeklyWorksheetRecipe;
}

const fractionsPreset = WORKSHEET_PRESETS.find((preset) => preset.id === 'fractions-decimals');
if (!fractionsPreset) throw new Error('The fractions and decimals preset is missing.');

const papers: ReviewPaper[] = [
  {
    slug: '01-support-written-methods-8q',
    recipe: {
      schemaVersion: 'weekly-worksheet-recipe-v1',
      title: 'Weekly Mathematics Practice',
      groupLabel: 'Support Group',
      totalQuestions: 8,
      seed: 'review-support-written-methods-2026-08',
      selections: [
        { skillId: 'written-add-subtract', band: 'support', style: 'direct', count: 2 },
        { skillId: 'long-multiplication', band: 'support', style: 'direct', count: 2 },
        { skillId: 'long-division', band: 'support', style: 'direct', count: 2 },
        { skillId: 'factors-multiples-primes', band: 'support', style: 'mixed', count: 2 },
      ],
    },
  },
  {
    slug: '02-fractions-decimals-core-12q',
    recipe: {
      schemaVersion: 'weekly-worksheet-recipe-v1',
      title: 'Weekly Mathematics Practice',
      groupLabel: 'Fractions Group',
      totalQuestions: fractionsPreset.totalQuestions,
      seed: 'review-fractions-decimals-2026-08',
      selections: fractionsPreset.selections.map((selection) => ({ ...selection })),
    },
  },
  {
    slug: '03-geometry-measurement-mixed-10q',
    recipe: {
      schemaVersion: 'weekly-worksheet-recipe-v1',
      title: 'Weekly Mathematics Practice',
      groupLabel: 'Geometry Group',
      totalQuestions: 10,
      seed: 'review-geometry-measurement-2026-08',
      selections: [
        { skillId: 'perimeter-area', band: 'core', style: 'applied', count: 2 },
        { skillId: 'angle-facts', band: 'support', style: 'mixed', count: 2 },
        { skillId: 'lines-polygons', band: 'support', style: 'mixed', count: 2 },
        { skillId: 'unit-time-conversion', band: 'core', style: 'mixed', count: 2 },
        { skillId: 'data-averages', band: 'core', style: 'applied', count: 2 },
      ],
    },
  },
  {
    slug: '04-broad-stretch-direct-16q',
    recipe: {
      schemaVersion: 'weekly-worksheet-recipe-v1',
      title: 'Weekly Mathematics Practice',
      groupLabel: 'Extension Group',
      totalQuestions: 16,
      seed: 'review-broad-stretch-2026-08',
      selections: [
        { skillId: 'place-value-rounding', band: 'stretch', style: 'direct', count: 2 },
        { skillId: 'prime-factor-hcf-lcm', band: 'stretch', style: 'direct', count: 2 },
        { skillId: 'powers-roots', band: 'stretch', style: 'direct', count: 2 },
        { skillId: 'fraction-add-subtract', band: 'stretch', style: 'direct', count: 2 },
        { skillId: 'decimal-operations', band: 'stretch', style: 'direct', count: 2 },
        { skillId: 'scientific-notation', band: 'stretch', style: 'direct', count: 2 },
        { skillId: 'integer-operations', band: 'stretch', style: 'direct', count: 2 },
        { skillId: 'intro-equations', band: 'stretch', style: 'direct', count: 2 },
      ],
    },
  },
];

async function main() {
  const outputDirectory = path.join(process.cwd(), 'output', 'review-pdfs');
  await mkdir(outputDirectory, { recursive: true });

  const manifests = papers.map((paper) => ({
    ...paper,
    manifest: composeWeeklyWorksheet(paper.recipe),
  }));
  const documents = await renderPdfDocuments(manifests.flatMap(({ slug, manifest }) => [
    { name: `${slug}-student`, html: renderStudentHtml(manifest) },
    { name: `${slug}-answer-key`, html: renderAnswerKeyHtml(manifest) },
  ]));

  for (const { slug, manifest } of manifests) {
    await writeFile(path.join(outputDirectory, `${slug}.pdf`), documents.get(`${slug}-student`)!);
    await writeFile(path.join(outputDirectory, `${slug}-answer-key.pdf`), documents.get(`${slug}-answer-key`)!);
    await writeFile(path.join(outputDirectory, `${slug}-manifest.json`), JSON.stringify(manifest, null, 2));
  }

  console.log(JSON.stringify({
    outputDirectory,
    papers: manifests.map(({ slug, manifest }) => ({
      slug,
      manifestId: manifest.manifestId,
      questions: manifest.questions.length,
      pageQuestionCounts: manifest.questionPages.map((page) => page.length),
    })),
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
