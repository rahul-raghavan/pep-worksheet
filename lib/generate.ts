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
  rows: { topic: string; count: number; level: number }[],
  opts: GenerateRowsOptions
): { problems: Question[]; answers: Question[] } {
  if (!Array.isArray(rows) || rows.length === 0) throw new Error('rows required');
  for (const r of rows) {
    if (typeof r.count !== 'number' || r.count < 1) throw new Error('Each count must be ≥1');
    if (typeof r.level !== 'number' || r.level < 1 || r.level > 5) throw new Error('Each level must be 1-5');
  }
  const total = rows.reduce((sum, r) => sum + r.count, 0);
  if (total > 25) throw new Error('Total count must be ≤25');
  const { seed } = opts;
  const all = getQuestions();
  const rng = seedrandom(seed || undefined);
  // Pre-check: for each topic+level, sum total requested and check pool size
  const topicLevelCounts = new Map<string, number>();
  for (const { topic, count, level } of rows) {
    const key = `${topic}||${level}`;
    topicLevelCounts.set(key, (topicLevelCounts.get(key) || 0) + count);
  }
  for (const [key, count] of topicLevelCounts.entries()) {
    const [topic, levelStr] = key.split('||');
    const level = Number(levelStr);
    const pool = all.filter(
      (q) =>
        q.Topic === topic &&
        q.Difficulty === level
    );
    if (pool.length < count) {
      throw new TooSmallPoolError(topic, pool.length, count);
    }
  }
  // Now sample, enforcing uniqueness across all rows
  const chosen: Question[] = [];
  const usedIds = new Set<string>();
  for (const { topic, count, level } of rows) {
    const pool = all.filter(
      (q) =>
        q.Topic === topic &&
        q.Difficulty === level &&
        !usedIds.has(q.id)
    );
    // No need to check pool.length < count here; pre-checked above
    // Deterministic shuffle/sample for this topic+level
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