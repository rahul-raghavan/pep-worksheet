import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { auth } from '@/auth';
import { isAllowedEmail } from '@/lib/access';
import { checkRateLimit } from '@/lib/rate-limit';
import {
  composeWeeklyWorksheet,
  LayoutCapacityError,
  VariantShortageError,
} from '@/lib/worksheet/compose';
import { WeeklyWorksheetRecipeSchema } from '@/lib/worksheet/schema';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: Request) {
  const session = await auth();
  const email = session?.user?.email;
  if (!isAllowedEmail(email)) {
    return NextResponse.json({ error: 'Sign in with an approved school account.' }, { status: 401 });
  }
  if (!checkRateLimit(`compose:${email}`, 30)) {
    return NextResponse.json({ error: 'Please wait a moment before creating another preview.' }, { status: 429 });
  }

  try {
    const recipe = WeeklyWorksheetRecipeSchema.parse(await request.json());
    const manifest = composeWeeklyWorksheet(recipe);
    return NextResponse.json({ manifest });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Check the worksheet settings and try again.', details: error.issues },
        { status: 400 },
      );
    }
    if (error instanceof LayoutCapacityError) {
      return NextResponse.json({ error: error.message }, { status: 422 });
    }
    if (error instanceof VariantShortageError) {
      return NextResponse.json(
        { error: error.message, skillId: error.skillId, requested: error.requested },
        { status: 422 },
      );
    }
    console.error('weekly_worksheet_compose_failed', error);
    return NextResponse.json({ error: 'The worksheet could not be created.' }, { status: 500 });
  }
}

export async function GET() {
  return new NextResponse('Method Not Allowed', { status: 405 });
}
