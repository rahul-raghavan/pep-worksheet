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
    const levels = topics.map(t => allQuestions.find(q => q.Topic === t)?.Difficulty || 1);
    const rows = [
      { topic: topics[0], count: 2, level: levels[0] },
      { topic: topics[1], count: 3, level: levels[1] },
    ];
    const { problems } = generateRows(rows, { seed: 'abc' });
    expect(problems.length).toBe(5);
    expect(problems.filter(q => q.Topic === topics[0]).length).toBe(2);
    expect(problems.filter(q => q.Topic === topics[1]).length).toBe(3);
  });

  it('enforces uniqueness across all topics/levels', () => {
    // Find a topic+level with 3 or fewer questions
    let found = false;
    for (const topic of Array.from(new Set(allQuestions.map(q => q.Topic)))) {
      for (const level of [1, 2, 3, 4, 5]) {
        const pool = allQuestions.filter(q => q.Topic === topic && q.Difficulty === level);
        if (pool.length > 1 && pool.length <= 3) {
          // Request more than available by splitting across rows
          const rows = [
            { topic, count: Math.floor(pool.length / 2) + 1, level },
            { topic, count: Math.ceil(pool.length / 2) + 1, level },
          ];
          expect(() => generateRows(rows, { seed: 'abc' })).toThrow(TooSmallPoolError);
          found = true;
          break;
        }
      }
      if (found) break;
    }
    if (!found) {
      // Fallback: forcibly test with a fake topic/level
      expect(() => generateRows([
        { topic: '__none__', count: 2, level: 1 },
        { topic: '__none__', count: 2, level: 1 },
      ], { seed: 'abc' })).toThrow(TooSmallPoolError);
    }
  });

  it('throws if any count < 1 or total > 25', () => {
    const topics = Array.from(new Set(allQuestions.map(q => q.Topic))).slice(0, 2);
    const levels = topics.map(t => allQuestions.find(q => q.Topic === t)?.Difficulty || 1);
    expect(() => generateRows([{ topic: topics[0], count: 0, level: levels[0] }], { seed: 'abc' })).toThrow();
    expect(() => generateRows([
      { topic: topics[0], count: 20, level: levels[0] },
      { topic: topics[1], count: 10, level: levels[1] },
    ], { seed: 'abc' })).toThrow();
  });

  it('is seed-deterministic and unique', () => {
    const topics = Array.from(new Set(allQuestions.map(q => q.Topic))).slice(0, 2);
    const levels = topics.map(t => allQuestions.find(q => q.Topic === t)?.Difficulty || 1);
    const rows = [
      { topic: topics[0], count: 2, level: levels[0] },
      { topic: topics[1], count: 2, level: levels[1] },
    ];
    const a = generateRows(rows, { seed: 'abc' });
    const b = generateRows(rows, { seed: 'abc' });
    const c = generateRows(rows, { seed: 'xyz' });
    expect(a.problems.map(q => q.id)).toEqual(b.problems.map(q => q.id));
    expect(a.problems.map(q => q.id)).not.toEqual(c.problems.map(q => q.id));
  });

  it('throws TooSmallPoolError for a specific topic+level', () => {
    // Find a topic+level with only 1 question
    let found = false;
    for (const q of allQuestions) {
      const matches = allQuestions.filter(
        (qq) => qq.Topic === q.Topic && qq.Difficulty === q.Difficulty
      );
      if (matches.length === 1) {
        const rows = [
          { topic: q.Topic, count: 2, level: q.Difficulty },
        ];
        expect(() => generateRows(rows, { seed: 'abc' })).toThrow(TooSmallPoolError);
        try {
          generateRows(rows, { seed: 'abc' });
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
      expect(() => generateRows([{ topic: '__none__', count: 2, level: 1 }], { seed: 'abc' })).toThrow(TooSmallPoolError);
    }
  });
}); 