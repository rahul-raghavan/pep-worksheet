import { google } from 'googleapis';
import { QuestionSchema, Question } from '../types/question';
import fs from 'fs/promises';
import path from 'path';

const SHEET_ID = process.env.GOOGLE_SHEETS_ID;
const SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY?.replace(/\n/g, '\n');

if (!SHEET_ID || !SERVICE_ACCOUNT_EMAIL || !PRIVATE_KEY) {
  throw new Error('Missing Google Sheets env vars');
}

const questionsRange = 'A1:E'; // Assumes columns: id, Topic, Difficulty, Front, Back

export async function fetchAndSyncQuestions() {
  const auth = new google.auth.JWT({
    email: SERVICE_ACCOUNT_EMAIL,
    key: PRIVATE_KEY,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
  const sheets = google.sheets({ version: 'v4', auth });
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: questionsRange,
  });
  const rows = res.data.values;
  if (!rows || rows.length < 2) throw new Error('No data found in sheet');
  const [header, ...data] = rows;
  const required = ['id', 'Topic', 'Difficulty', 'Front', 'Back'];
  if (!required.every((col, i) => header[i] === col)) {
    throw new Error('Sheet header mismatch. Expected: ' + required.join(', '));
  }
  const parsed: Question[] = [];
  for (let i = 0; i < data.length; ++i) {
    const row = Object.fromEntries(header.map((h, j) => [h, data[i][j] ?? '']));
    const result = QuestionSchema.safeParse(row);
    if (!result.success) {
      throw new Error(`Row ${i + 2} failed validation: ${result.error}`);
    }
    parsed.push(result.data);
  }
  // Write to data/questions.json
  const outPath = path.join(process.cwd(), 'data', 'questions.json');
  await fs.writeFile(outPath, JSON.stringify(parsed, null, 2));
  return parsed.length;
} 