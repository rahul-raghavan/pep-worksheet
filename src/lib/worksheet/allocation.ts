export function allocateQuestionCounts(total: number, skillIds: string[]): Record<string, number> {
  if (skillIds.length === 0) return {};
  const base = Math.floor(total / skillIds.length);
  const remainder = total % skillIds.length;
  return Object.fromEntries(
    skillIds.map((skillId, index) => [skillId, base + (index < remainder ? 1 : 0)]),
  );
}
