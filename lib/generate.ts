import fs from 'fs';
import path from 'path';
import seedrandom from 'seedrandom';

export interface Question {
  id: string;
  Topic: string;
  Difficulty: 1 | 2 | 3 | 4 | 5;
  Front: string;
  Back: string;
}

export interface GenerateOptions {
  topics: string[];
  minLevel: 1 | 2 | 3 | 4 | 5;
  maxLevel: 1 | 2 | 3 | 4 | 5;
  count: number;
  seed?: string;
}

export class TooSmallPoolError extends Error {
  available: number;
  requested: number;
  constructor(available: number, requested: number) {
    super(`Pool too small: available=${available}, requested=${requested}`);
    this.available = available;
    this.requested = requested;
    Object.setPrototypeOf(this, TooSmallPoolError.prototype);
  }
}

function getQuestions(): Question[] {
  const file = path.join(process.cwd(), 'data', 'questions.json');
  const raw = fs.readFileSync(file, 'utf8');
  return JSON.parse(raw);
}

export function generate(opts: GenerateOptions): { problems: Question[]; answers: Question[] } {
  const { topics, minLevel, maxLevel, count, seed } = opts;
  const all = getQuestions();
  const filtered = all.filter(
    (q) =>
      topics.includes(q.Topic) &&
      q.Difficulty >= minLevel &&
      q.Difficulty <= maxLevel
  );
  if (filtered.length < count) {
    throw new TooSmallPoolError(filtered.length, count);
  }
  // Deterministic shuffle/sample
  const rng = seedrandom(seed || undefined);
  const indices = filtered.map((_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  const chosen = indices.slice(0, count).map((i) => filtered[i]);
  // Uniqueness enforced by sampling without replacement
  return {
    problems: chosen,
    answers: chosen,
  };
} 