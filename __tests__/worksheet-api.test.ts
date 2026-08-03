/** @jest-environment node */

import { WORKSHEET_PRESETS } from '@/lib/worksheet/catalog';

jest.mock('@/auth', () => ({ auth: jest.fn() }));

import { auth } from '@/auth';
import { POST } from '@/app/api/worksheet/route';

const mockedAuth = auth as unknown as jest.Mock;

Object.defineProperty(globalThis.Response, 'json', {
  configurable: true,
  value: (body: unknown, init?: ResponseInit) => new Response(JSON.stringify(body), {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  }),
});

function request() {
  const preset = WORKSHEET_PRESETS[0];
  return new Request('http://localhost/api/worksheet', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      schemaVersion: 'weekly-worksheet-recipe-v1',
      title: 'Weekly Mathematics Practice',
      totalQuestions: 12,
      selections: preset.selections,
      seed: 'api-test',
    }),
  });
}

describe('/api/worksheet', () => {
  it('returns a manifest for an allowed teacher', async () => {
    mockedAuth.mockResolvedValue({ user: { email: 'teacher@pepschoolv2.com' }, expires: '' });
    const response = await POST(request());
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.manifest.questions).toHaveLength(12);
  });

  it('rejects an unauthenticated request', async () => {
    mockedAuth.mockResolvedValue(null);
    const response = await POST(request());
    expect(response.status).toBe(401);
  });
});
