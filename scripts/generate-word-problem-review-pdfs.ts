import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { composeWeeklyWorksheet } from '../src/lib/worksheet/compose';
import { renderPdfDocuments } from '../src/lib/worksheet/pdf';
import { renderAnswerKeyHtml, renderStudentHtml } from '../src/lib/worksheet/render';
import type { WeeklyWorksheetRecipe } from '../src/lib/worksheet/schema';

interface ReviewPaper {
  slug: string;
  recipe: WeeklyWorksheetRecipe;
}

const papers: ReviewPaper[] = [
  {
    slug: '05-word-problems-written-operations-10q',
    recipe: {
      schemaVersion: 'weekly-worksheet-recipe-v1',
      title: 'Weekly Mathematics Practice',
      groupLabel: 'Applied Operations Group',
      totalQuestions: 10,
      seed: 'review-word-problems-operations-2026-08',
      selections: [
        { skillId: 'written-add-subtract', band: 'core', style: 'applied', count: 2 },
        { skillId: 'long-multiplication', band: 'support', style: 'applied', count: 2 },
        { skillId: 'long-division', band: 'support', style: 'applied', count: 2 },
        { skillId: 'factors-multiples-primes', band: 'support', style: 'applied', count: 2 },
        { skillId: 'unit-time-conversion', band: 'core', style: 'applied', count: 2 },
      ],
    },
  },
  {
    slug: '06-word-problems-fractions-proportion-10q',
    recipe: {
      schemaVersion: 'weekly-worksheet-recipe-v1',
      title: 'Weekly Mathematics Practice',
      groupLabel: 'Applied Fractions Group',
      totalQuestions: 10,
      seed: 'review-word-problems-fractions-2026-08',
      selections: [
        { skillId: 'fraction-equivalence-order', band: 'core', style: 'applied', count: 1 },
        { skillId: 'fraction-add-subtract', band: 'core', style: 'applied', count: 2 },
        { skillId: 'fraction-multiply-divide', band: 'core', style: 'applied', count: 2 },
        { skillId: 'decimal-operations', band: 'core', style: 'applied', count: 2 },
        { skillId: 'ratio-percentage', band: 'core', style: 'applied', count: 2 },
        { skillId: 'data-averages', band: 'core', style: 'applied', count: 1 },
      ],
    },
  },
  {
    slug: '07-word-problems-mixed-application-10q',
    recipe: {
      schemaVersion: 'weekly-worksheet-recipe-v1',
      title: 'Weekly Mathematics Practice',
      groupLabel: 'Applied Mixed Group',
      totalQuestions: 10,
      seed: 'review-word-problems-mixed-2026-08',
      selections: [
        { skillId: 'place-value-rounding', band: 'core', style: 'applied', count: 2 },
        { skillId: 'perimeter-area', band: 'core', style: 'applied', count: 1 },
        { skillId: 'unit-time-conversion', band: 'stretch', style: 'applied', count: 2 },
        { skillId: 'integer-operations', band: 'core', style: 'applied', count: 2 },
        { skillId: 'intro-equations', band: 'core', style: 'applied', count: 2 },
        { skillId: 'data-averages', band: 'stretch', style: 'applied', count: 1 },
      ],
    },
  },
];

async function main() {
  const outputDirectory = path.join(process.cwd(), 'output', 'word-problem-review-pdfs');
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
      appliedQuestions: manifest.questions.filter((question) => question.kind !== 'direct').length,
      pageQuestionCounts: manifest.questionPages.map((page) => page.length),
    })),
    renderedDocuments: [...documents.keys()],
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
