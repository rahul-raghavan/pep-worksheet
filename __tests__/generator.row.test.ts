import { generateRows, TooSmallPoolError, Question } from '../lib/generate';
import fs from 'fs';
import path from 'path';

describe('generateRows()', () => {
  let allQuestions: Question[];
  beforeAll(() => {
    const file = path.join(process.cwd(), 'data', 'questions.json');
    allQuestions = JSON.parse(fs.readFileSync(file, 'utf8'));
  });

  it('returns correct count per topic and total', () => {
    const topics = Array.from(new Set(allQuestions.map(q => q.Topic))).slice(0, 2);
    const rows = [
      { topic: topics[0], count: 2 },
      { topic: topics[1], count: 3 },
    ];
    const minLevel = 1, maxLevel = 5;
    const { problems } = generateRows(rows, { minLevel, maxLevel, seed: 'abc' });
    expect(problems.length).toBe(5);
    expect(problems.filter(q => q.Topic === topics[0]).length).toBe(2);
    expect(problems.filter(q => q.Topic === topics[1]).length).toBe(3);
  });

  it('enforces uniqueness across all topics', () => {
    // Find a topic with 3 or fewer questions
    let found = false;
    for (const topic of Array.from(new Set(allQuestions.map(q => q.Topic)))) {
      const pool = allQuestions.filter(q => q.Topic === topic);
      if (pool.length > 1 && pool.length <= 3) {
        // Request more than available by splitting across rows
        const rows = [
          { topic, count: Math.floor(pool.length / 2) + 1 },
          { topic, count: Math.ceil(pool.length / 2) + 1 },
        ];
        const minLevel = 1, maxLevel = 5;
        expect(() => generateRows(rows, { minLevel, maxLevel, seed: 'abc' })).toThrow(TooSmallPoolError);
        found = true;
        break;
      }
    }
    if (!found) {
      // Fallback: forcibly test with a fake topic
      expect(() => generateRows([
        { topic: '__none__', count: 2 },
        { topic: '__none__', count: 2 },
      ], { minLevel: 1, maxLevel: 1 })).toThrow(TooSmallPoolError);
    }
  });

  it('throws if any count < 1 or total > 25', () => {
    const topics = Array.from(new Set(allQuestions.map(q => q.Topic))).slice(0, 2);
    expect(() => generateRows([{ topic: topics[0], count: 0 }], { minLevel: 1, maxLevel: 5 })).toThrow();
    expect(() => generateRows([
      { topic: topics[0], count: 20 },
      { topic: topics[1], count: 10 },
    ], { minLevel: 1, maxLevel: 5 })).toThrow();
  });

  it('is seed-deterministic and unique', () => {
    const topics = Array.from(new Set(allQuestions.map(q => q.Topic))).slice(0, 2);
    const rows = [
      { topic: topics[0], count: 2 },
      { topic: topics[1], count: 2 },
    ];
    const minLevel = 1, maxLevel = 5;
    const a = generateRows(rows, { minLevel, maxLevel, seed: 'abc' });
    const b = generateRows(rows, { minLevel, maxLevel, seed: 'abc' });
    const c = generateRows(rows, { minLevel, maxLevel, seed: 'xyz' });
    expect(a.problems.map(q => q.id)).toEqual(b.problems.map(q => q.id));
    expect(a.problems.map(q => q.id)).not.toEqual(c.problems.map(q => q.id));
  });

  it('throws TooSmallPoolError for a specific topic', () => {
    // Find a topic with only 1 question
    let found = false;
    for (const q of allQuestions) {
      const matches = allQuestions.filter(
        (qq) => qq.Topic === q.Topic && qq.Difficulty === q.Difficulty
      );
      if (matches.length === 1) {
        const rows = [
          { topic: q.Topic, count: 2 },
        ];
        expect(() => generateRows(rows, { minLevel: q.Difficulty, maxLevel: q.Difficulty })).toThrow(TooSmallPoolError);
        try {
          generateRows(rows, { minLevel: q.Difficulty, maxLevel: q.Difficulty });
        } catch (e) {
          if (e instanceof TooSmallPoolError) {
            expect(e.topic).toBe(q.Topic);
            expect(e.available).toBe(1);
            expect(e.requested).toBe(2);
          }
        }
        found = true;
        break;
      }
    }
    if (!found) {
      // Fallback: forcibly test the error
      expect(() => generateRows([{ topic: '__none__', count: 2 }], { minLevel: 1, maxLevel: 1 })).toThrow(TooSmallPoolError);
    }
  });
}); 