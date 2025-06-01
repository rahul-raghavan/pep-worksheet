import { NextResponse } from 'next/server';
import { z } from 'zod';
import { generate, TooSmallPoolError } from '../../../../lib/generate';
import { auth } from '@/auth';

// Simple in-memory rate limiter (per user, per minute)
const rateLimitMap = new Map<string, { count: number; reset: number }>();
const RATE_LIMIT = 5;
const WINDOW_MS = 60 * 1000;

const WorksheetSchema = z.object({
  rows: z.array(z.object({
    topic: z.string().min(1),
    count: z.number().int().min(1),
    level: z.number().int().min(1).max(5),
  })).min(1),
  seed: z.string().optional(),
});

function isAllowedUser(email: string | undefined | null) {
  return !!email && (email.endsWith('@pepschoolv2.com') || email.endsWith('@accelschool.in') || email === 'rahul.glass@gmail.com');
}

export async function POST(req: Request) {
  const session = await auth();
  const email = session?.user?.email;
  if (typeof email !== 'string' || !isAllowedUser(email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // Rate limit
  const key = email;
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry || now > entry.reset) {
    rateLimitMap.set(key, { count: 1, reset: now + WINDOW_MS });
  } else if (entry.count >= RATE_LIMIT) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  } else {
    entry.count++;
    rateLimitMap.set(key, entry);
  }
  // Validate body
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const parse = WorksheetSchema.safeParse(body);
  if (!parse.success) {
    return NextResponse.json({ error: 'Invalid request', details: parse.error.errors }, { status: 400 });
  }
  try {
    const { problems, answers } = generate(
      parse.data.rows,
      {
        seed: parse.data.seed,
      }
    );
    return NextResponse.json({ problems, answers });
  } catch (e) {
    if (e instanceof TooSmallPoolError) {
      return NextResponse.json({ error: 'Too small pool', available: e.available, requested: e.requested }, { status: 422 });
    }
    return NextResponse.json({ error: 'Internal error', details: (e as Error).message }, { status: 500 });
  }
}

export async function GET() {
  return new NextResponse('Method Not Allowed', { status: 405 });
}

export async function PUT() { return GET(); }
export async function DELETE() { return GET(); }
export async function PATCH() { return GET(); }

export const dynamic = 'force-dynamic'; 