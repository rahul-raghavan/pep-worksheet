import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';

// For development only - in production, use environment variable
const AUTH_SECRET = 'Ju29iap95D8UiynYOFFs7MCAMzTsNAIlU20L8A7NeyA=';

// Debug: Log environment variables
console.log('Auth Config:', {
  hasClientId: !!process.env.GOOGLE_CLIENT_ID,
  hasClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
  clientIdLength: process.env.GOOGLE_CLIENT_ID?.length,
  clientSecretLength: process.env.GOOGLE_CLIENT_SECRET?.length,
});

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
  secret: AUTH_SECRET,
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider === 'google') {
        const email = profile?.email;
        return (
          email?.endsWith('@pepschoolv2.com') || email === 'rahul.glass@gmail.com'
        );
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