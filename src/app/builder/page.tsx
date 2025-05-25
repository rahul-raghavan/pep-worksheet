import { auth, signOut } from '@/auth';
import BuilderClient from './BuilderClient';

export default async function Builder() {
  const session = await auth();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="w-full max-w-xl space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Worksheet Builder</h1>
          <form
            action={async () => {
              'use server';
              await signOut();
            }}
          >
            <button className="text-sm text-gray-500 hover:text-gray-700">
              Sign out
            </button>
          </form>
        </div>
        <BuilderClient email={session?.user?.email || ''} />
      </div>
    </main>
  );
} 