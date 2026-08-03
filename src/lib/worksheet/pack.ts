import JSZip from 'jszip';
import { renderAnswerKeyHtml, renderStudentHtml } from './render';
import { renderPdfDocuments } from './pdf';
import type { WeeklyWorksheetManifest } from './schema';

const PRODUCT_FILENAME = 'PEP Weekly Mathematics Practice';

function dateInIndia(date: Date): string {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value;
  return `${value('year')}-${value('month')}-${value('day')}`;
}

function safeFilenamePart(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
    .slice(0, 48)
    .replace(/-+$/g, '');
}

export interface WorksheetArtifactNames {
  stem: string;
  studentPdf: string;
  answerKeyPdf: string;
  recipeJson: string;
  manifestJson: string;
  completePackZip: string;
}

export function worksheetArtifactNames(
  manifest: WeeklyWorksheetManifest,
  generatedAt = new Date(),
): WorksheetArtifactNames {
  const group = manifest.recipe.groupLabel ? safeFilenamePart(manifest.recipe.groupLabel) : '';
  const stem = [PRODUCT_FILENAME, group, dateInIndia(generatedAt)].filter(Boolean).join(' - ');
  return {
    stem,
    studentPdf: `${stem}.pdf`,
    answerKeyPdf: `${stem} - Answer Key.pdf`,
    recipeJson: `${stem} - Recipe.json`,
    manifestJson: `${stem} - Manifest.json`,
    completePackZip: `${stem} - Complete Pack.zip`,
  };
}

export async function renderStudentPdf(
  manifest: WeeklyWorksheetManifest,
  generatedAt = new Date(),
): Promise<Buffer> {
  const names = worksheetArtifactNames(manifest, generatedAt);
  const documents = await renderPdfDocuments([
    { name: names.studentPdf, html: renderStudentHtml(manifest) },
  ]);
  const pdf = documents.get(names.studentPdf);
  if (!pdf) throw new Error('The student worksheet PDF was not created.');
  return pdf;
}

export async function renderAnswerKeyPdf(
  manifest: WeeklyWorksheetManifest,
  generatedAt = new Date(),
): Promise<Buffer> {
  const names = worksheetArtifactNames(manifest, generatedAt);
  const documents = await renderPdfDocuments([
    { name: names.answerKeyPdf, html: renderAnswerKeyHtml(manifest) },
  ]);
  const pdf = documents.get(names.answerKeyPdf);
  if (!pdf) throw new Error('The answer-key PDF was not created.');
  return pdf;
}

export async function renderWorksheetPack(
  manifest: WeeklyWorksheetManifest,
  generatedAt = new Date(),
): Promise<Buffer> {
  const names = worksheetArtifactNames(manifest, generatedAt);
  const documents = await renderPdfDocuments([
    { name: names.studentPdf, html: renderStudentHtml(manifest) },
    { name: names.answerKeyPdf, html: renderAnswerKeyHtml(manifest) },
  ]);
  const studentPdf = documents.get(names.studentPdf);
  const answerPdf = documents.get(names.answerKeyPdf);
  if (!studentPdf || !answerPdf) throw new Error('The complete worksheet pack was not created.');

  const zip = new JSZip();
  zip.file(names.studentPdf, studentPdf);
  zip.file(names.answerKeyPdf, answerPdf);
  zip.file(names.recipeJson, JSON.stringify(manifest.recipe, null, 2));
  zip.file(names.manifestJson, JSON.stringify(manifest, null, 2));
  return zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
}
