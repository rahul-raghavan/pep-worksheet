import { NextResponse } from 'next/server';
import { generate } from '../lib/generate';
import fs from 'fs';
import path from 'path';

// Helper to spin up a Next.js API route handler for integration testing
const worksheetRoute = require('../src/app/api/worksheet/route');

const VALID_EMAIL = 'teacher@pepschoolv2.com';
const RAHUL_EMAIL = 'rahul.glass@gmail.com';
const AUTH_HEADER = { cookie: 'next-auth.session-token=valid' };

// Mock auth() to simulate signed-in and signed-out users
jest.mock('../src/auth', () => ({
  auth: jest.fn(),
}));
const { auth } = require('../src/auth');

jest.spyOn(NextResponse, 'json').mockImplementation((data, init) => {
  return {
    json: async () => data,
    status: init?.status ?? 200,
  } as any;
});

// Helper to get a valid topic+level from the question bank
function getValidRow() {
  const file = path.join(process.cwd(), 'data', 'questions.json');
  const allQuestions = JSON.parse(fs.readFileSync(file, 'utf8'));
  const q = allQuestions[0];
  return { topic: q.Topic, count: 2, level: q.Difficulty };
}

describe('/api/worksheet', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('valid request returns arrays of equal length `count`', async () => {
    auth.mockResolvedValue({ user: { email: VALID_EMAIL } });
    const row = getValidRow();
    const body = {
      rows: [row],
      seed: 'test',
    };
    const req = new Request('http://localhost/api/worksheet', {
        method: 'POST',
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' },
      }) as any;
    const res = await worksheetRoute.POST(req);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.problems.length).toBe(row.count);
    expect(data.answers.length).toBe(row.count);
  });

  it('missing auth cookie ⇒ 401', async () => {
    auth.mockResolvedValue(null);
    const row = getValidRow();
    const body = {
      rows: [row],
    };
    const req = new Request('http://localhost/api/worksheet', {
        method: 'POST',
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' },
      }) as any;
    const res = await worksheetRoute.POST(req);
    expect(res.status).toBe(401);
  });

  it('bad body (e.g. empty rows) ⇒ 400', async () => {
    auth.mockResolvedValue({ user: { email: VALID_EMAIL } });
    const body = {
      rows: [],
    };
    const req = new Request('http://localhost/api/worksheet', {
        method: 'POST',
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' },
      }) as any;
    const res = await worksheetRoute.POST(req);
    expect(res.status).toBe(400);
  });

  it('TooSmallPoolError bubbles as 422 with error payload', async () => {
    auth.mockResolvedValue({ user: { email: VALID_EMAIL } });
    const body = {
      rows: [{ topic: '__none__', count: 2, level: 1 }],
    };
    const req = new Request('http://localhost/api/worksheet', {
        method: 'POST',
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' },
      }) as any;
    const res = await worksheetRoute.POST(req);
    const data = await res.json();
    expect(res.status).toBe(422);
    expect(data.error).toBe('Too small pool');
    expect(data.available).toBe(0);
    expect(data.requested).toBe(2);
  });
}); 