import { fetchAndSyncQuestions } from '@/utils/syncQuestions';
import { auth } from '@/auth';
import { NextResponse } from 'next/server';

const SUPER_ADMINS = [
  'rahul.glass@gmail.com',
];

function isSuperAdmin(email: string | undefined | null) {
  return (
    !!email &&
    (email === 'rahul.glass@gmail.com' || email.endsWith('@pepschoolv2.com'))
  );
}

export async function POST(req: Request) {
  const session = await auth();
  const email = session?.user?.email;
  if (!isSuperAdmin(email)) {
    return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
  }
  try {
    const rows = await fetchAndSyncQuestions();
    return NextResponse.json({ ok: true, rows });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic'; 