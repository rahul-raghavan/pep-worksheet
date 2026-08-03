/** @jest-environment node */

import { isAllowedEmail, isPrivateAdminEmail } from '@/lib/access';

describe('school access controls', () => {
  const originalDomains = process.env.ALLOWED_EMAIL_DOMAINS;
  const originalEmails = process.env.ALLOWED_EMAILS;
  const originalAdmins = process.env.PRIVATE_ADMIN_EMAILS;

  beforeEach(() => {
    delete process.env.ALLOWED_EMAIL_DOMAINS;
    delete process.env.ALLOWED_EMAILS;
    delete process.env.PRIVATE_ADMIN_EMAILS;
  });

  afterAll(() => {
    process.env.ALLOWED_EMAIL_DOMAINS = originalDomains;
    process.env.ALLOWED_EMAILS = originalEmails;
    process.env.PRIVATE_ADMIN_EMAILS = originalAdmins;
  });

  it('allows both school domains and rejects personal accounts by default', () => {
    expect(isAllowedEmail('teacher@pepschoolv2.com')).toBe(true);
    expect(isAllowedEmail('teacher@accelschool.in')).toBe(true);
    expect(isAllowedEmail('teacher@gmail.com')).toBe(false);
    expect(isAllowedEmail('teacher@notaccelschool.in')).toBe(false);
  });

  it('restricts the private tracker to the configured administrator', () => {
    expect(isPrivateAdminEmail('rahul@pepschoolv2.com')).toBe(true);
    expect(isPrivateAdminEmail('teacher@pepschoolv2.com')).toBe(false);
    process.env.PRIVATE_ADMIN_EMAILS = 'leader@accelschool.in';
    expect(isPrivateAdminEmail('leader@accelschool.in')).toBe(true);
    expect(isPrivateAdminEmail('rahul@pepschoolv2.com')).toBe(false);
  });
});
