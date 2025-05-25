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

export interface GenerateRowsOptions {
  minLevel: 1 | 2 | 3 | 4 | 5;
  maxLevel: 1 | 2 | 3 | 4 | 5;
  seed?: string;
}

export class TooSmallPoolError extends Error {
  topic: string;
  available: number;
  requested: number;
  constructor(topic: string, available: number, requested: number) {
    super(`Pool too small for topic '${topic}': available=${available}, requested=${requested}`);
    this.topic = topic;
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

export function generateRows(
  rows: { topic: string; count: number }[],
  opts: GenerateRowsOptions
): { problems: Question[]; answers: Question[] } {
  if (!Array.isArray(rows) || rows.length === 0) throw new Error('rows required');
  for (const r of rows) {
    if (typeof r.count !== 'number' || r.count < 1) throw new Error('Each count must be ≥1');
  }
  const total = rows.reduce((sum, r) => sum + r.count, 0);
  if (total > 25) throw new Error('Total count must be ≤25');
  const { minLevel, maxLevel, seed } = opts;
  const all = getQuestions();
  const rng = seedrandom(seed || undefined);
  // Pre-check: for each topic, sum total requested and check pool size
  const topicCounts = new Map<string, number>();
  for (const { topic, count } of rows) {
    topicCounts.set(topic, (topicCounts.get(topic) || 0) + count);
  }
  for (const [topic, count] of topicCounts.entries()) {
    const pool = all.filter(
      (q) =>
        q.Topic === topic &&
        q.Difficulty >= minLevel &&
        q.Difficulty <= maxLevel
    );
    if (pool.length < count) {
      throw new TooSmallPoolError(topic, pool.length, count);
    }
  }
  // Now sample, enforcing uniqueness across all rows
  const chosen: Question[] = [];
  const usedIds = new Set<string>();
  for (const { topic, count } of rows) {
    const pool = all.filter(
      (q) =>
        q.Topic === topic &&
        q.Difficulty >= minLevel &&
        q.Difficulty <= maxLevel &&
        !usedIds.has(q.id)
    );
    // No need to check pool.length < count here; pre-checked above
    // Deterministic shuffle/sample for this topic
    const indices = pool.map((_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    const selected = indices.slice(0, count).map((i) => pool[i]);
    selected.forEach(q => usedIds.add(q.id));
    chosen.push(...selected);
  }
  return {
    problems: chosen,
    answers: chosen,
  };
}

// Export generateRows as generate for backward compatibility
export const generate = generateRows; 