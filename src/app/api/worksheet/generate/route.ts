import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { auth } from '@/auth';
import { isAllowedEmail, normalizeEmail } from '@/lib/access';
import { checkRateLimit } from '@/lib/rate-limit';
import { recordWorksheetDownload } from '@/lib/usage';
import { renderWorksheetPack, worksheetArtifactNames } from '@/lib/worksheet/pack';
import { WeeklyWorksheetManifestSchema } from '@/lib/worksheet/schema';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: Request) {
  const session = await auth();
  const email = session?.user?.email;
  if (!isAllowedEmail(email)) {
    return NextResponse.json({ error: 'Sign in with an approved school account.' }, { status: 401 });
  }
  const normalizedEmail = normalizeEmail(email as string);
  if (!checkRateLimit(`generate:${email}`, 10)) {
    return NextResponse.json({ error: 'Please wait a moment before downloading another pack.' }, { status: 429 });
  }

  try {
    const body = await request.json();
    const manifest = WeeklyWorksheetManifestSchema.parse(body.manifest);
    const generatedAt = new Date();
    const names = worksheetArtifactNames(manifest, generatedAt);
    const zip = await renderWorksheetPack(manifest, generatedAt);
    const tracking = await recordWorksheetDownload({
      manifest,
      userId: session?.user?.id || normalizedEmail,
      teacherEmail: normalizedEmail,
    });
    return new Response(new Uint8Array(zip), {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${names.completePackZip}"`,
        'Cache-Control': 'no-store',
        'X-Usage-Tracking': tracking.status,
        'X-Download-Filename': names.completePackZip,
      },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'The saved worksheet is not valid.' }, { status: 400 });
    }
    console.error('weekly_worksheet_pack_failed', error);
    return NextResponse.json(
      { error: 'The worksheet pack could not be rendered. Your settings have been preserved.' },
      { status: 500 },
    );
  }
}
