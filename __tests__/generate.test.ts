import { generate, TooSmallPoolError, Question } from '../lib/generate';
import fs from 'fs';
import path from 'path';

describe('generate()', () => {
  let allQuestions: Question[];
  beforeAll(() => {
    const file = path.join(process.cwd(), 'data', 'questions.json');
    allQuestions = JSON.parse(fs.readFileSync(file, 'utf8'));
  });

  it('filters by topic & level correctly', () => {
    const topics = [allQuestions[0].Topic];
    const minLevel = allQuestions[0].Difficulty;
    const maxLevel = allQuestions[0].Difficulty;
    const result = generate({ topics, minLevel, maxLevel, count: 1 });
    expect(result.problems.length).toBe(1);
    expect(result.problems[0].Topic).toBe(topics[0]);
    expect(result.problems[0].Difficulty).toBe(minLevel);
  });

  it('returns exactly `count` unique ids', () => {
    const topics = Array.from(new Set(allQuestions.map(q => q.Topic))).slice(0, 2);
    const minLevel = 1;
    const maxLevel = 5;
    const count = 5;
    const result = generate({ topics, minLevel, maxLevel, count });
    const ids = result.problems.map(q => q.id);
    expect(new Set(ids).size).toBe(count);
  });

  it('same seed ⇒ identical id order; different seed ⇒ different order', () => {
    const topics = Array.from(new Set(allQuestions.map(q => q.Topic))).slice(0, 2);
    const minLevel = 1;
    const maxLevel = 5;
    const count = 5;
    const a = generate({ topics, minLevel, maxLevel, count, seed: 'abc' });
    const b = generate({ topics, minLevel, maxLevel, count, seed: 'abc' });
    const c = generate({ topics, minLevel, maxLevel, count, seed: 'xyz' });
    expect(a.problems.map(q => q.id)).toEqual(b.problems.map(q => q.id));
    expect(a.problems.map(q => q.id)).not.toEqual(c.problems.map(q => q.id));
  });

  it('pool smaller than count ⇒ TooSmallPoolError with correct numbers', () => {
    // Find a topic/level combo with only 1 question
    let found = false;
    for (const q of allQuestions) {
      const matches = allQuestions.filter(
        (qq) => qq.Topic === q.Topic && qq.Difficulty === q.Difficulty
      );
      if (matches.length === 1) {
        const topics = [q.Topic];
        const minLevel = q.Difficulty;
        const maxLevel = q.Difficulty;
        expect(() =>
          generate({ topics, minLevel, maxLevel, count: 2 })
        ).toThrow(TooSmallPoolError);
        try {
          generate({ topics, minLevel, maxLevel, count: 2 });
        } catch (e) {
          if (e instanceof TooSmallPoolError) {
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
      expect(() => generate({ topics: ['__none__'], minLevel: 1, maxLevel: 1, count: 2 })).toThrow(TooSmallPoolError);
    }
  });
}); 