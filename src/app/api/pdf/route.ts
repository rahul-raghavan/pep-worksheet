import { NextResponse } from 'next/server';
import { z } from 'zod';
import { renderPDF } from '../../../../lib/renderPDF';
import { auth } from '@/auth';
import type { SheetPDFProps } from '../../../../components/SheetPDF';

const PdfSchema = z.object({
  worksheetId: z.string().optional(),
  questions: z.array(z.object({
    id: z.string(),
    Topic: z.string(),
    Difficulty: z.number().int().min(1).max(5),
    Front: z.string(),
    Back: z.string(),
  })).min(1),
  mode: z.enum(['problems', 'answers']),
});

function isAllowedUser(email: string | undefined | null) {
  return !!email && (email.endsWith('@pepschoolv2.com') || email === 'rahul.glass@gmail.com');
}

export async function POST(req: Request) {
  const session = await auth();
  const email = session?.user?.email;
  if (typeof email !== 'string' || !isAllowedUser(email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const parse = PdfSchema.safeParse(body);
  if (!parse.success) {
    return NextResponse.json({ error: 'Invalid request', details: parse.error.errors }, { status: 400 });
  }
  const { questions, mode } = parse.data;
  const typedQuestions = questions.map(q => ({
    ...q,
    Difficulty: q.Difficulty as 1|2|3|4|5,
  }));
  const props: SheetPDFProps = {
    title: `PEP Schoolv2 | Problem Set | Name: ____`,
    generatedOn: new Date().toISOString(),
    questions: typedQuestions,
    mode,
  };
  try {
    const buffer = await renderPDF(props);
    const filename = `worksheet_${mode}.pdf`;
    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (e) {
    return NextResponse.json({ error: 'PDF generation failed', details: (e as Error).message }, { status: 500 });
  }
}

export async function GET() {
  return new NextResponse('Method Not Allowed', { status: 405 });
}

export async function PUT() { return GET(); }
export async function DELETE() { return GET(); }
export async function PATCH() { return GET(); }

export const dynamic = 'force-dynamic'; 