import { renderPDF } from '../lib/renderPDF';
import { PDFDocument } from 'pdf-lib';
import type { SheetPDFProps } from '../components/SheetPDF';

(async () => {
  const questions = [
    {
      id: 'q1',
      Topic: 'Fractions',
      Difficulty: 2 as 2,
      Front: 'What is 1/2 + 1/4?',
      Back: '3/4',
    },
    {
      id: 'q2',
      Topic: 'Decimals',
      Difficulty: 3 as 3,
      Front: '0.5 + 0.25 = ?',
      Back: '0.75',
    },
  ];
  const baseProps: SheetPDFProps = {
    title: 'PEP Schoolv2 | Problem Set | Name: ____',
    generatedOn: '2025-05-25T10:00:00.000Z',
    questions,
    mode: 'problems',
  };

  // Test: returns a Buffer and PDF has exactly 1 page
  const buf = await renderPDF(baseProps);
  if (!Buffer.isBuffer(buf)) throw new Error('Not a Buffer');
  const pdfDoc = await PDFDocument.load(buf);
  if (pdfDoc.getPageCount() !== 1) throw new Error('PDF is not single page');
  console.log('PDF single page test: PASS');

  // Test: problems mode omits Back text; answers mode includes it
  const strProblems = buf.toString('utf8');
  if (!strProblems.includes('What is 1/2 + 1/4?')) throw new Error('Front missing in problems');
  if (strProblems.includes('3/4')) throw new Error('Back should not be in problems');

  const bufAnswers = await renderPDF({ ...baseProps, mode: 'answers' });
  const strAnswers = bufAnswers.toString('utf8');
  if (!strAnswers.includes('3/4') || !strAnswers.includes('0.75')) throw new Error('Back missing in answers');
  console.log('PDF content test: PASS');
})(); 