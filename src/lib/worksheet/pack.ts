import JSZip from 'jszip';
import { renderAnswerKeyHtml, renderStudentHtml } from './render';
import { renderPdfDocuments } from './pdf';
import type { WeeklyWorksheetManifest } from './schema';

export const STUDENT_FILENAME = 'PEP Weekly Mathematics Practice.pdf';
export const ANSWER_KEY_FILENAME = 'PEP Weekly Mathematics Practice - Answer Key.pdf';

export async function renderStudentPdf(manifest: WeeklyWorksheetManifest): Promise<Buffer> {
  const documents = await renderPdfDocuments([
    { name: STUDENT_FILENAME, html: renderStudentHtml(manifest) },
  ]);
  const pdf = documents.get(STUDENT_FILENAME);
  if (!pdf) throw new Error('The student worksheet PDF was not created.');
  return pdf;
}

export async function renderAnswerKeyPdf(manifest: WeeklyWorksheetManifest): Promise<Buffer> {
  const documents = await renderPdfDocuments([
    { name: ANSWER_KEY_FILENAME, html: renderAnswerKeyHtml(manifest) },
  ]);
  const pdf = documents.get(ANSWER_KEY_FILENAME);
  if (!pdf) throw new Error('The answer-key PDF was not created.');
  return pdf;
}

export async function renderWorksheetPack(manifest: WeeklyWorksheetManifest): Promise<Buffer> {
  const documents = await renderPdfDocuments([
    { name: STUDENT_FILENAME, html: renderStudentHtml(manifest) },
    { name: ANSWER_KEY_FILENAME, html: renderAnswerKeyHtml(manifest) },
  ]);
  const studentPdf = documents.get(STUDENT_FILENAME);
  const answerPdf = documents.get(ANSWER_KEY_FILENAME);
  if (!studentPdf || !answerPdf) throw new Error('The complete worksheet pack was not created.');

  const zip = new JSZip();
  zip.file(STUDENT_FILENAME, studentPdf);
  zip.file(ANSWER_KEY_FILENAME, answerPdf);
  zip.file('weekly-worksheet-recipe.json', JSON.stringify(manifest.recipe, null, 2));
  zip.file('weekly-worksheet-manifest.json', JSON.stringify(manifest, null, 2));
  return zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
}
