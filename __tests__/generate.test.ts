import { generateRows, TooSmallPoolError, Question } from '../lib/generate';
import fs from 'fs';
import path from 'path';

describe('generateRows()', () => {
  let allQuestions: Question[];
  beforeAll(() => {
    const file = path.join(process.cwd(), 'data', 'questions.json');
    allQuestions = JSON.parse(fs.readFileSync(file, 'utf8'));
  });

  it('filters by topic & level correctly', () => {
    const topics = Array.from(new Set(allQuestions.map(q => q.Topic))).slice(0, 2);
    const levels = topics.map(t => allQuestions.find(q => q.Topic === t)?.Difficulty || 1);
    const result = generateRows([{ topic: topics[0], count: 1, level: levels[0] }], {});
    expect(result.problems.length).toBe(1);
    expect(result.problems[0].Topic).toBe(topics[0]);
    expect(result.problems[0].Difficulty).toBe(levels[0]);
  });

  it('returns exactly `count` unique ids', () => {
    const topics = Array.from(new Set(allQuestions.map(q => q.Topic))).slice(0, 2);
    const levels = topics.map(t => allQuestions.find(q => q.Topic === t)?.Difficulty || 1);
    const count = 5;
    const result = generateRows([{ topic: topics[0], count, level: levels[0] }], {});
    const ids = result.problems.map(q => q.id);
    expect(new Set(ids).size).toBe(count);
  });

  it('same seed ⇒ identical id order; different seed ⇒ different order', () => {
    const topics = Array.from(new Set(allQuestions.map(q => q.Topic))).slice(0, 2);
    const levels = topics.map(t => allQuestions.find(q => q.Topic === t)?.Difficulty || 1);
    const count = 5;
    const a = generateRows([{ topic: topics[0], count, level: levels[0] }], { seed: 'abc' });
    const b = generateRows([{ topic: topics[0], count, level: levels[0] }], { seed: 'abc' });
    const c = generateRows([{ topic: topics[0], count, level: levels[0] }], { seed: 'xyz' });
    expect(a.problems.map(q => q.id)).toEqual(b.problems.map(q => q.id));
    expect(a.problems.map(q => q.id)).not.toEqual(c.problems.map(q => q.id));
  });

  it('pool smaller than count ⇒ TooSmallPoolError with correct numbers', () => {
    // Find a topic+level combo with only 1 question
    let found = false;
    for (const q of allQuestions) {
      const matches = allQuestions.filter(
        (qq) => qq.Topic === q.Topic && qq.Difficulty === q.Difficulty
      );
      if (matches.length === 1) {
        expect(() => generateRows([{ topic: q.Topic, count: 2, level: q.Difficulty }], {})).toThrow(TooSmallPoolError);
        try {
          generateRows([{ topic: q.Topic, count: 2, level: q.Difficulty }], {});
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
      expect(() => generateRows([{ topic: '__none__', count: 2, level: 1 }], {})).toThrow(TooSmallPoolError);
    }
  });
}); 