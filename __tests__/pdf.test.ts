import { renderPDF } from '../lib/renderPDF';
import { PDFDocument } from 'pdf-lib';
import type { SheetPDFProps } from '../components/SheetPDF';

describe('renderPDF', () => {
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

  it('returns a Buffer and PDF has exactly 1 page', async () => {
    const buf = await renderPDF(baseProps);
    expect(Buffer.isBuffer(buf)).toBe(true);
    const pdfDoc = await PDFDocument.load(buf);
    expect(pdfDoc.getPageCount()).toBe(1);
  });

  it('problems mode omits Back text; answers mode includes it', async () => {
    const bufProblems = await renderPDF({ ...baseProps, mode: 'problems' });
    const strProblems = bufProblems.toString('utf8');
    expect(strProblems).toContain('What is 1/2 + 1/4?');
    expect(strProblems).not.toContain('3/4');

    const bufAnswers = await renderPDF({ ...baseProps, mode: 'answers' });
    const strAnswers = bufAnswers.toString('utf8');
    expect(strAnswers).toContain('3/4');
    expect(strAnswers).toContain('0.75');
  });
}); 