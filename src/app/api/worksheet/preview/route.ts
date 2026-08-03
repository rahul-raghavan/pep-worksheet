import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { auth } from '@/auth';
import { isAllowedEmail } from '@/lib/access';
import { checkRateLimit } from '@/lib/rate-limit';
import { renderStudentPdf, STUDENT_FILENAME } from '@/lib/worksheet/pack';
import { WeeklyWorksheetManifestSchema } from '@/lib/worksheet/schema';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: Request) {
  const session = await auth();
  const email = session?.user?.email;
  if (!isAllowedEmail(email)) {
    return NextResponse.json(
      { error: 'Sign in with an approved school account.' },
      { status: 401 },
    );
  }
  if (!checkRateLimit(`preview:${email}`, 15)) {
    return NextResponse.json(
      { error: 'Please wait a moment before opening another preview.' },
      { status: 429 },
    );
  }

  try {
    const body = await request.json();
    const manifest = WeeklyWorksheetManifestSchema.parse(body.manifest);
    const pdf = await renderStudentPdf(manifest);
    return new Response(new Uint8Array(pdf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${STUDENT_FILENAME}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'The saved worksheet is not valid.' }, { status: 400 });
    }
    console.error('weekly_worksheet_preview_failed', error);
    return NextResponse.json(
      { error: 'The PDF preview could not be rendered. Your settings have been preserved.' },
      { status: 500 },
    );
  }
}
