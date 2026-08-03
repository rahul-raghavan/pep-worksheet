import { z } from 'zod';
import { MarkingGuideSchema } from '../content-engine/schema';

export const BandSchema = z.enum(['support', 'core', 'stretch']);
export const QuestionStyleSchema = z.enum(['direct', 'applied', 'mixed']);
export const ResponseSpaceSchema = z.enum(['compact', 'standard', 'large']);
export const QuestionKindSchema = z.enum(['direct', 'applied', 'explanation', 'drawing']);

export const PromptSegmentSchema = z.object({
  type: z.enum(['text', 'math']),
  value: z.string().min(1),
});

export const SkillSelectionSchema = z.object({
  skillId: z.string().min(1),
  selectionType: z.enum(['family', 'skill']).default('skill'),
  band: BandSchema,
  style: QuestionStyleSchema,
  count: z.number().int().min(1).max(20),
});

// Keep the former upper bound only for parsing immutable sheets that teachers
// already downloaded. New composition uses WeeklyWorksheetRecipeSchema below.
const StoredWeeklyWorksheetRecipeSchema = z.object({
  schemaVersion: z.literal('weekly-worksheet-recipe-v1'),
  subjectPackId: z.string().min(1).default('pep-elementary-mathematics'),
  title: z.string().trim().min(1).max(80),
  groupLabel: z.string().trim().max(60).optional(),
  startingPointId: z.string().trim().min(1).max(60).optional(),
  totalQuestions: z.number().int().min(8).max(20),
  selections: z.array(SkillSelectionSchema).min(1).max(8),
  seed: z.string().min(1).max(120),
});

function validateRecipe(
  recipe: z.infer<typeof StoredWeeklyWorksheetRecipeSchema>,
  ctx: z.RefinementCtx,
) {
  const skillIds = recipe.selections.map((selection) => selection.skillId);
  if (new Set(skillIds).size !== skillIds.length) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['selections'],
      message: 'Choose each skill only once.',
    });
  }
  const allocated = recipe.selections.reduce((sum, selection) => sum + selection.count, 0);
  if (allocated !== recipe.totalQuestions) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['totalQuestions'],
      message: `Question counts add to ${allocated}, not ${recipe.totalQuestions}.`,
    });
  }
}

export const WeeklyWorksheetRecipeSchema = StoredWeeklyWorksheetRecipeSchema
  .extend({ totalQuestions: z.number().int().min(8).max(12) })
  .superRefine(validateRecipe);

const HistoricalWeeklyWorksheetRecipeSchema = StoredWeeklyWorksheetRecipeSchema
  .superRefine(validateRecipe);

export const GeneratedQuestionSchema = z.object({
  id: z.string().min(1),
  templateId: z.string().min(1),
  templateVersion: z.string().min(1),
  skillId: z.string().min(1),
  skillName: z.string().min(1),
  domain: z.string().min(1),
  subjectId: z.string().min(1).optional(),
  domainId: z.string().min(1).optional(),
  familyId: z.string().min(1).optional(),
  familyName: z.string().min(1).optional(),
  band: BandSchema,
  style: z.enum(['direct', 'applied']),
  kind: QuestionKindSchema,
  prompt: z.array(PromptSegmentSchema).min(1),
  answer: z.array(PromptSegmentSchema).min(1),
  answerText: z.string().min(1),
  markingGuide: MarkingGuideSchema.optional(),
  responseSpace: ResponseSpaceSchema,
  equipment: z.array(z.string()),
  fingerprint: z.string().min(1),
});

export const WeeklyWorksheetManifestSchema = z.object({
  schemaVersion: z.literal('weekly-worksheet-manifest-v1'),
  generatorVersion: z.string().min(1),
  libraryVersion: z.string().min(1),
  seed: z.string().min(1),
  manifestId: z.string().min(1),
  // Existing downloaded manifests remain reproducible even though new sheets
  // are now intentionally capped at twelve questions.
  recipe: HistoricalWeeklyWorksheetRecipeSchema,
  questions: z.array(GeneratedQuestionSchema).min(8).max(20),
  questionPages: z.tuple([z.array(z.string()).min(1), z.array(z.string()).min(1)]),
});

export type Band = z.infer<typeof BandSchema>;
export type QuestionStyle = z.infer<typeof QuestionStyleSchema>;
export type ResponseSpace = z.infer<typeof ResponseSpaceSchema>;
export type QuestionKind = z.infer<typeof QuestionKindSchema>;
export type PromptSegment = z.infer<typeof PromptSegmentSchema>;
export type SkillSelection = z.output<typeof SkillSelectionSchema>;
export type WeeklyWorksheetRecipe = z.input<typeof WeeklyWorksheetRecipeSchema>;
export type GeneratedQuestion = z.infer<typeof GeneratedQuestionSchema>;
export type WeeklyWorksheetManifest = z.infer<typeof WeeklyWorksheetManifestSchema>;
