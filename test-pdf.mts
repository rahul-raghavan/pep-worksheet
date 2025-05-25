import { pdf } from '@react-pdf/renderer';
import React from 'react';
import { SheetPDF } from './components/SheetPDF';

(async () => {
  const props = {
    title: 'Test',
    generatedOn: new Date().toISOString(),
    questions: [
      { id: '1', Topic: 'Test', Difficulty: 1, Front: 'Q1', Back: 'A1' }
    ],
    mode: 'problems' as const
  };
  const buffer = await pdf(React.createElement(SheetPDF, props)).toBuffer();
  import('fs').writeFileSync('test.pdf', buffer);
  console.log('PDF generated!');
})();