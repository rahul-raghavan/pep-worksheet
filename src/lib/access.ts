const DEFAULT_DOMAINS = ['pepschoolv2.com', 'accelschool.in'];
const DEFAULT_EMAILS: string[] = [];
const DEFAULT_PRIVATE_ADMIN_EMAILS = ['rahul@pepschoolv2.com'];

function configuredList(value: string | undefined, fallback: string[]): string[] {
  const configured = value
    ?.split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
  return configured && configured.length > 0 ? configured : fallback;
}

export function isAllowedEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const normalized = normalizeEmail(email);
  const domains = configuredList(process.env.ALLOWED_EMAIL_DOMAINS, DEFAULT_DOMAINS);
  const emails = configuredList(process.env.ALLOWED_EMAILS, DEFAULT_EMAILS);
  const domain = normalized.split('@')[1] ?? '';
  return emails.includes(normalized) || domains.includes(domain);
}

export function isPrivateAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const admins = configuredList(process.env.PRIVATE_ADMIN_EMAILS, DEFAULT_PRIVATE_ADMIN_EMAILS);
  return admins.includes(normalizeEmail(email));
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
