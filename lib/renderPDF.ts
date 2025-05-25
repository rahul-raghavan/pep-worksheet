import React from 'react';
import { pdf } from '@react-pdf/renderer';
import { SheetPDF, SheetPDFProps } from '../components/SheetPDF';

export async function renderPDF(props: SheetPDFProps): Promise<Buffer> {
  const instance = pdf(React.createElement(SheetPDF, props));
  // @ts-ignore: toBuffer returns a Node.js Buffer
  const buffer: Buffer = await instance.toBuffer();
  return buffer;
} 