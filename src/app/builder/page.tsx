import { auth, signOut } from '@/auth';
import { isPrivateAdminEmail } from '@/lib/access';
import BuilderClient from './BuilderClient';

export default async function Builder() {
  const session = await auth();
  const canViewUsage = isPrivateAdminEmail(session?.user?.email);

  return (
    <main className="app-page">
      <header className="app-header">
        <a className="brand-lockup" href="/builder" aria-label="PEP Worksheet Generator home">
          <span className="brand-mark">P</span>
          <span><strong>PEP Worksheet Generator</strong><small>Elementary mathematics</small></span>
        </a>
        <nav className="app-header-actions" aria-label="Account">
          {canViewUsage && <a href="/admin/usage">Download tracker</a>}
          <form
            action={async () => {
              'use server';
              await signOut();
            }}
          >
            <button className="sign-out-button">Sign out</button>
          </form>
        </nav>
      </header>
      <BuilderClient email={session?.user?.email || ''} />
    </main>
  );
}
