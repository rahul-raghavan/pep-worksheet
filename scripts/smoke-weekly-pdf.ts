import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { WORKSHEET_PRESETS } from '../src/lib/worksheet/catalog';
import { composeWeeklyWorksheet } from '../src/lib/worksheet/compose';
import { renderPdfDocuments } from '../src/lib/worksheet/pdf';
import { renderAnswerKeyHtml, renderStudentHtml } from '../src/lib/worksheet/render';
import { renderWorksheetPack } from '../src/lib/worksheet/pack';

async function main() {
  const preset = WORKSHEET_PRESETS[0];
  const manifest = composeWeeklyWorksheet({
    schemaVersion: 'weekly-worksheet-recipe-v1',
    title: 'Weekly Mathematics Practice',
    groupLabel: 'PDF Smoke Group',
    totalQuestions: preset.totalQuestions,
    selections: preset.selections.map((selection) => ({ ...selection })),
    seed: 'weekly-pdf-smoke-2026-08',
  });

  const outputDirectory = path.join(process.cwd(), 'output', 'pdf');
  await mkdir(outputDirectory, { recursive: true });

  const documents = await renderPdfDocuments([
    { name: 'student', html: renderStudentHtml(manifest) },
    { name: 'answers', html: renderAnswerKeyHtml(manifest) },
    { name: 'student-replay', html: renderStudentHtml(manifest) },
  ]);

  await writeFile(
    path.join(outputDirectory, 'weekly-practice-student.pdf'),
    documents.get('student')!,
  );
  await writeFile(
    path.join(outputDirectory, 'weekly-practice-answer-key.pdf'),
    documents.get('answers')!,
  );
  await writeFile(
    path.join(outputDirectory, 'weekly-practice-student-replay.pdf'),
    documents.get('student-replay')!,
  );
  await writeFile(
    path.join(outputDirectory, 'weekly-practice-pack.zip'),
    await renderWorksheetPack(manifest),
  );
  await writeFile(
    path.join(outputDirectory, 'weekly-practice-manifest.json'),
    JSON.stringify(manifest, null, 2),
  );

  console.log(
    JSON.stringify(
      {
        manifestId: manifest.manifestId,
        questions: manifest.questions.length,
        pageQuestionCounts: manifest.questionPages.map((page) => page.length),
        outputDirectory,
        renderedDocuments: [...documents.keys()],
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
