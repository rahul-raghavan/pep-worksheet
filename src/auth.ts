import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import { isAllowedEmail } from '@/lib/access';

const googleProvider = Google({
  clientId: process.env.GOOGLE_CLIENT_ID || '',
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  authorization: {
    url: 'https://accounts.google.com/o/oauth2/v2/auth',
    params: {
      scope: 'openid email profile',
      prompt: 'consent',
      access_type: 'offline',
      response_type: 'code'
    }
  }
});

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  providers: [googleProvider],
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  trustHost: true,
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider === 'google') {
        const email = profile?.email;
        const emailVerified = (profile as { email_verified?: boolean } | undefined)?.email_verified;
        return emailVerified !== false && isAllowedEmail(email);
      }
      return false;
    },
    async session({ session, token }) {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.sub,
        },
      };
    },
  },
  pages: {
    signIn: '/sign-in',
  },
});
