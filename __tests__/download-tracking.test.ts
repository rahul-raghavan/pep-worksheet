/** @jest-environment node */

jest.mock('@/auth', () => ({ auth: jest.fn() }));
jest.mock('@/lib/rate-limit', () => ({ checkRateLimit: jest.fn(() => true) }));
jest.mock('@/lib/worksheet/pack', () => ({ renderWorksheetPack: jest.fn() }));
jest.mock('@/lib/usage', () => ({ recordWorksheetDownload: jest.fn() }));

import { auth } from '@/auth';
import { POST } from '@/app/api/worksheet/generate/route';
import { recordWorksheetDownload } from '@/lib/usage';
import { composeWeeklyWorksheet } from '@/lib/worksheet/compose';
import { WORKSHEET_PRESETS } from '@/lib/worksheet/catalog';
import { renderWorksheetPack } from '@/lib/worksheet/pack';

const mockedAuth = auth as unknown as jest.Mock;
const mockedRender = renderWorksheetPack as jest.Mock;
const mockedRecord = recordWorksheetDownload as jest.Mock;

Object.defineProperty(globalThis.Response, 'json', {
  configurable: true,
  value: (body: unknown, init?: ResponseInit) => new Response(JSON.stringify(body), {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  }),
});

function generatedManifest() {
  const preset = WORKSHEET_PRESETS[0];
  return composeWeeklyWorksheet({
    schemaVersion: 'weekly-worksheet-recipe-v1',
    title: 'Weekly Mathematics Practice',
    startingPointId: preset.id,
    totalQuestions: preset.totalQuestions,
    selections: [...preset.selections],
    seed: 'download-route-test',
  });
}

function request() {
  return new Request('http://localhost/api/worksheet/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ manifest: generatedManifest() }),
  });
}

describe('successful download tracking', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    mockedAuth.mockResolvedValue({
      user: { id: 'google-user-1', email: 'Teacher@AccelSchool.in' },
      expires: '',
    });
    mockedRender.mockResolvedValue(Buffer.from('zip'));
    mockedRecord.mockResolvedValue({ status: 'recorded' });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('records one event after the complete pack has rendered', async () => {
    const response = await POST(request());

    expect(response.status).toBe(200);
    expect(mockedRender).toHaveBeenCalledTimes(1);
    expect(mockedRecord).toHaveBeenCalledTimes(1);
    expect(mockedRecord).toHaveBeenCalledWith(expect.objectContaining({
      userId: 'google-user-1',
      teacherEmail: 'teacher@accelschool.in',
    }));
    expect(response.headers.get('X-Usage-Tracking')).toBe('recorded');
    expect(mockedRender.mock.invocationCallOrder[0]).toBeLessThan(mockedRecord.mock.invocationCallOrder[0]);
  });

  it('does not record an event when pack rendering fails', async () => {
    mockedRender.mockRejectedValue(new Error('render failed'));
    const response = await POST(request());

    expect(response.status).toBe(500);
    expect(mockedRecord).not.toHaveBeenCalled();
  });

  it('still returns the completed pack when analytics is unavailable', async () => {
    mockedRecord.mockResolvedValue({ status: 'failed', detail: 'database unavailable' });
    const response = await POST(request());

    expect(response.status).toBe(200);
    expect(response.headers.get('X-Usage-Tracking')).toBe('failed');
  });
});
