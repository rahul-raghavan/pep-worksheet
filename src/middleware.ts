import { auth } from '@/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isAuthPage = req.nextUrl.pathname.startsWith('/sign-in');
  const isPublicPage = ['/'].includes(req.nextUrl.pathname);

  // Redirect authenticated users from auth pages
  if (isAuthPage && isLoggedIn) {
    return NextResponse.redirect(new URL('/builder', req.nextUrl));
  }

  // Redirect unauthenticated users to sign-in
  if (!isLoggedIn && !isPublicPage && !isAuthPage) {
    return NextResponse.redirect(new URL('/sign-in', req.nextUrl));
  }

  return NextResponse.next();
});

// Optionally configure middleware matcher
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}; 