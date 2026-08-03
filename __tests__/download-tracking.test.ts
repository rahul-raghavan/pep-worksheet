/** @jest-environment node */

jest.mock('@/auth', () => ({ auth: jest.fn() }));
jest.mock('@/lib/rate-limit', () => ({ checkRateLimit: jest.fn(() => true) }));
jest.mock('@/lib/worksheet/pack', () => {
  const actual = jest.requireActual('@/lib/worksheet/pack');
  return { ...actual, renderStudentPdf: jest.fn(), renderWorksheetPack: jest.fn() };
});
jest.mock('@/lib/usage', () => ({
  recordWorksheetCreated: jest.fn(),
  recordWorksheetDownload: jest.fn(),
}));

import { auth } from '@/auth';
import { POST as generatePack } from '@/app/api/worksheet/generate/route';
import { POST as previewStudentPdf } from '@/app/api/worksheet/preview/route';
import { recordWorksheetCreated, recordWorksheetDownload } from '@/lib/usage';
import { composeWeeklyWorksheet } from '@/lib/worksheet/compose';
import { WORKSHEET_PRESETS } from '@/lib/worksheet/catalog';
import { renderStudentPdf, renderWorksheetPack } from '@/lib/worksheet/pack';

const mockedAuth = auth as unknown as jest.Mock;
const mockedRenderPack = renderWorksheetPack as jest.Mock;
const mockedRenderStudent = renderStudentPdf as jest.Mock;
const mockedRecordCreated = recordWorksheetCreated as jest.Mock;
const mockedRecordDownload = recordWorksheetDownload as jest.Mock;

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
    groupLabel: 'Blue Jays / 4A',
    startingPointId: preset.id,
    totalQuestions: preset.totalQuestions,
    selections: [...preset.selections],
    seed: 'download-route-test',
  });
}

function request(path: 'generate' | 'preview') {
  return new Request(`http://localhost/api/worksheet/${path}`, {
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
    mockedRenderPack.mockResolvedValue(Buffer.from('zip'));
    mockedRenderStudent.mockResolvedValue(Buffer.from('pdf'));
    mockedRecordCreated.mockResolvedValue({ status: 'recorded' });
    mockedRecordDownload.mockResolvedValue({ status: 'recorded' });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('records one event after the complete pack has rendered', async () => {
    const response = await generatePack(request('generate'));

    expect(response.status).toBe(200);
    expect(mockedRenderPack).toHaveBeenCalledTimes(1);
    expect(mockedRecordDownload).toHaveBeenCalledTimes(1);
    expect(mockedRecordDownload).toHaveBeenCalledWith(expect.objectContaining({
      userId: 'google-user-1',
      teacherEmail: 'teacher@accelschool.in',
    }));
    expect(response.headers.get('X-Usage-Tracking')).toBe('recorded');
    expect(response.headers.get('X-Download-Filename')).toMatch(
      /^PEP Weekly Mathematics Practice - Blue-Jays-4A - \d{4}-\d{2}-\d{2} - Complete Pack\.zip$/,
    );
    expect(mockedRenderPack.mock.invocationCallOrder[0]).toBeLessThan(mockedRecordDownload.mock.invocationCallOrder[0]);
  });

  it('records a worksheet-created event after the student PDF preview renders', async () => {
    const response = await previewStudentPdf(request('preview'));

    expect(response.status).toBe(200);
    expect(mockedRenderStudent).toHaveBeenCalledTimes(1);
    expect(mockedRecordCreated).toHaveBeenCalledWith(expect.objectContaining({
      userId: 'google-user-1',
      teacherEmail: 'teacher@accelschool.in',
    }));
    expect(response.headers.get('Content-Disposition')).toMatch(
      /^inline; filename="PEP Weekly Mathematics Practice - Blue-Jays-4A - \d{4}-\d{2}-\d{2}\.pdf"$/,
    );
    expect(response.headers.get('X-Download-Filename')).toMatch(
      /^PEP Weekly Mathematics Practice - Blue-Jays-4A - \d{4}-\d{2}-\d{2}\.pdf$/,
    );
    expect(mockedRenderStudent.mock.invocationCallOrder[0]).toBeLessThan(mockedRecordCreated.mock.invocationCallOrder[0]);
  });

  it('does not record an event when pack rendering fails', async () => {
    mockedRenderPack.mockRejectedValue(new Error('render failed'));
    const response = await generatePack(request('generate'));

    expect(response.status).toBe(500);
    expect(mockedRecordDownload).not.toHaveBeenCalled();
  });

  it('still returns the completed pack when analytics is unavailable', async () => {
    mockedRecordDownload.mockResolvedValue({ status: 'failed', detail: 'database unavailable' });
    const response = await generatePack(request('generate'));

    expect(response.status).toBe(200);
    expect(response.headers.get('X-Usage-Tracking')).toBe('failed');
  });
});
