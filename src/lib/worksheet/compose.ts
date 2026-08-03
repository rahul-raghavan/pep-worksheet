import { createHash } from 'crypto';
import {
  MATHEMATICS_PACK,
  MATH_PACK_INDEX,
  getFamily,
  getSkill,
  normalizeSelectionReference,
} from './catalog';
import { generateDraftQuestion } from './generators';
import { createSeededRandom } from './random';
import {
  WeeklyWorksheetManifestSchema,
  WeeklyWorksheetRecipeSchema,
  type GeneratedQuestion,
  type QuestionStyle,
  type ResponseSpace,
  type SkillSelection,
  type WeeklyWorksheetManifest,
  type WeeklyWorksheetRecipe,
} from './schema';

export const GENERATOR_VERSION = '2026.08.2';
export const LIBRARY_VERSION = MATHEMATICS_PACK.version;

const FIRST_PAGE_CAPACITY = 208;
const SECOND_PAGE_CAPACITY = 224;
const SPACE_COST: Record<ResponseSpace, number> = {
  compact: 18,
  standard: 28,
  large: 38,
};

export class LayoutCapacityError extends Error {
  constructor(
    public readonly requestedQuestions: number,
    public readonly estimatedSpace: number,
  ) {
    super(
      `These ${requestedQuestions} questions need more working space than two pages provide. Reduce the question count or choose fewer drawing and long-response questions.`,
    );
    Object.setPrototypeOf(this, LayoutCapacityError.prototype);
  }
}

export class VariantShortageError extends Error {
  constructor(public readonly skillId: string, public readonly requested: number) {
    super(`Could not create ${requested} distinct questions for ${getSkill(skillId).name}.`);
    Object.setPrototypeOf(this, VariantShortageError.prototype);
  }
}

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, nested]) => [key, stableValue(nested)]),
    );
  }
  return value;
}

function hash(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(stableValue(value))).digest('hex');
}

function buildPositionPlan(selections: SkillSelection[], seed: string): SkillSelection[] {
  const rng = createSeededRandom(`${seed}/position-plan`);
  const key = (selection: SkillSelection) => `${selection.selectionType}:${selection.skillId}`;
  const order = rng.shuffle([...selections].sort((left, right) => key(left).localeCompare(key(right))));
  const remaining = new Map(order.map((selection) => [key(selection), selection.count]));
  const plan: SkillSelection[] = [];

  while ([...remaining.values()].some((count) => count > 0)) {
    for (const selection of order) {
      const selectionKey = key(selection);
      const count = remaining.get(selectionKey) ?? 0;
      if (count > 0) {
        plan.push(selection);
        remaining.set(selectionKey, count - 1);
      }
    }
  }
  return plan;
}

function normalizeSelections(selections: SkillSelection[]): SkillSelection[] {
  const normalized = selections.map((selection) => {
    const reference = normalizeSelectionReference(selection.skillId, selection.selectionType);
    return { ...selection, skillId: reference.id, selectionType: reference.selectionType };
  });
  const keys = normalized.map((selection) => `${selection.selectionType}:${selection.skillId}`);
  if (new Set(keys).size !== keys.length) {
    throw new Error('Choose each skill or skill family only once.');
  }
  const selectedFamilies = new Set(
    normalized.filter((selection) => selection.selectionType === 'family').map((selection) => selection.skillId),
  );
  const overlap = normalized.find((selection) => (
    selection.selectionType === 'skill'
    && selectedFamilies.has(getSkill(selection.skillId).familyId)
  ));
  if (overlap) {
    throw new Error(`Choose either ${getFamily(getSkill(overlap.skillId).familyId).name} as a mix or its specific skills, not both.`);
  }
  return normalized;
}

function resolveTargetId(selection: SkillSelection, occurrence: number, seed: string): string {
  if (selection.selectionType === 'skill') return getSkill(selection.skillId).id;
  const family = getFamily(selection.skillId);
  const targets = createSeededRandom(`${seed}/family/${family.id}`)
    .shuffle([...family.targetIds].sort((left, right) => left.localeCompare(right)));
  return targets[occurrence % targets.length];
}

function effectiveStyle(style: QuestionStyle, occurrence: number, seed: string): 'direct' | 'applied' {
  if (style !== 'mixed') return style;
  const startsApplied = createSeededRandom(`${seed}/mixed-style`).bool();
  return (occurrence % 2 === 0) === startsApplied ? 'applied' : 'direct';
}

function assignPages(questions: GeneratedQuestion[]): [string[], string[]] {
  const costs = questions.map((question) => SPACE_COST[question.responseSpace]);
  const estimatedSpace = costs.reduce((sum, cost) => sum + cost, 0);
  let best: { split: number; balance: number } | null = null;

  for (let split = 1; split < questions.length; split += 1) {
    const first = costs.slice(0, split).reduce((sum, cost) => sum + cost, 0);
    const second = estimatedSpace - first;
    if (first <= FIRST_PAGE_CAPACITY && second <= SECOND_PAGE_CAPACITY) {
      const balance = Math.abs(first - second);
      if (!best || balance < best.balance) best = { split, balance };
    }
  }

  if (!best) throw new LayoutCapacityError(questions.length, estimatedSpace);

  return [
    questions.slice(0, best.split).map((question) => question.id),
    questions.slice(best.split).map((question) => question.id),
  ];
}

export function composeWeeklyWorksheet(input: WeeklyWorksheetRecipe): WeeklyWorksheetManifest {
  const parsedRecipe = WeeklyWorksheetRecipeSchema.parse(input);
  const recipe = {
    ...parsedRecipe,
    subjectPackId: MATHEMATICS_PACK.id,
    selections: normalizeSelections(parsedRecipe.selections),
  };
  recipe.selections.forEach((selection) => {
    if (selection.selectionType === 'family') getFamily(selection.skillId);
    else getSkill(selection.skillId);
  });

  const positionPlan = buildPositionPlan(recipe.selections, recipe.seed);
  const occurrences = new Map<string, number>();
  const fingerprints = new Set<string>();
  const questions: GeneratedQuestion[] = [];

  positionPlan.forEach((selection, position) => {
    const selectionKey = `${selection.selectionType}:${selection.skillId}`;
    const occurrence = occurrences.get(selectionKey) ?? 0;
    occurrences.set(selectionKey, occurrence + 1);
    const style = effectiveStyle(selection.style, occurrence, `${recipe.seed}/${selectionKey}`);
    const targetId = resolveTargetId(selection, occurrence, recipe.seed);
    const skill = getSkill(targetId);
    const family = getFamily(skill.familyId);
    const domain = MATH_PACK_INDEX.domainsById.get(family.domainId);
    if (!domain) throw new Error(`Unknown mathematics area: ${family.domainId}`);
    let generated: GeneratedQuestion | null = null;

    for (let attempt = 0; attempt < 100 && !generated; attempt += 1) {
      const draft = generateDraftQuestion({
        skillId: targetId,
        band: selection.band,
        style,
        seed: recipe.seed,
        occurrence,
        attempt,
      });
      const fingerprint = hash({
        skillId: targetId,
        templateId: draft.templateId,
        payload: draft.fingerprintPayload,
      });
      if (fingerprints.has(fingerprint)) continue;
      fingerprints.add(fingerprint);
      generated = {
        id: `q-${hash({ seed: recipe.seed, position, fingerprint }).slice(0, 16)}`,
        templateId: draft.templateId,
        templateVersion: '1',
        skillId: targetId,
        skillName: skill.name,
        domain: domain.name,
        subjectId: MATHEMATICS_PACK.id,
        domainId: domain.id,
        familyId: family.id,
        familyName: family.name,
        band: selection.band,
        style,
        kind: draft.kind,
        prompt: draft.prompt,
        answer: draft.answer,
        answerText: draft.answerText,
        markingGuide: {
          type: 'exact',
          answer: draft.answer,
          answerText: draft.answerText,
        },
        responseSpace: draft.responseSpace,
        equipment: draft.equipment,
        fingerprint,
      };
    }

    if (!generated) throw new VariantShortageError(targetId, selection.count);
    questions.push(generated);
  });

  const questionPages = assignPages(questions);
  const manifestId = `weekly-${hash({
    recipe,
    generatorVersion: GENERATOR_VERSION,
    libraryVersion: LIBRARY_VERSION,
    fingerprints: questions.map((question) => question.fingerprint),
    questionPages,
  }).slice(0, 20)}`;

  return WeeklyWorksheetManifestSchema.parse({
    schemaVersion: 'weekly-worksheet-manifest-v1',
    generatorVersion: GENERATOR_VERSION,
    libraryVersion: LIBRARY_VERSION,
    seed: recipe.seed,
    manifestId,
    recipe,
    questions,
    questionPages,
  });
}
