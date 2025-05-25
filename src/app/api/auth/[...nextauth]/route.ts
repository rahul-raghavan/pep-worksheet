import { GET, POST } from '@/auth';

// Debug: Log environment variables (will only show in server logs)
console.log('Auth Environment Check:', {
  hasClientId: !!process.env.GOOGLE_CLIENT_ID,
  hasClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
  clientIdLength: process.env.GOOGLE_CLIENT_ID?.length,
  clientSecretLength: process.env.GOOGLE_CLIENT_SECRET?.length,
});

export { GET, POST }; 