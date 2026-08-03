import seedrandom from 'seedrandom';

export interface SeededRandom {
  next(): number;
  int(min: number, max: number): number;
  bool(probability?: number): boolean;
  pick<T>(values: readonly T[]): T;
  shuffle<T>(values: readonly T[]): T[];
}

export function createSeededRandom(seed: string): SeededRandom {
  const random = seedrandom(seed);
  const next = () => random.quick();

  return {
    next,
    int(min, max) {
      return Math.floor(next() * (max - min + 1)) + min;
    },
    bool(probability = 0.5) {
      return next() < probability;
    },
    pick<T>(values: readonly T[]) {
      if (values.length === 0) throw new Error('Cannot pick from an empty list.');
      return values[Math.floor(next() * values.length)];
    },
    shuffle<T>(values: readonly T[]) {
      const result = [...values];
      for (let index = result.length - 1; index > 0; index -= 1) {
        const other = Math.floor(next() * (index + 1));
        [result[index], result[other]] = [result[other], result[index]];
      }
      return result;
    },
  };
}
