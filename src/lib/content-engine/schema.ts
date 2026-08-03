import { z } from 'zod';

export const ContentBlockSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('text'), value: z.string().min(1) }),
  z.object({ type: z.literal('math'), value: z.string().min(1) }),
  z.object({ type: z.literal('instruction'), value: z.string().min(1) }),
  z.object({ type: z.literal('passage'), value: z.string().min(1), title: z.string().optional() }),
  z.object({
    type: z.literal('table'),
    headers: z.array(z.string()),
    rows: z.array(z.array(z.string())),
  }),
]);

export const ExactMarkingGuideSchema = z.object({
  type: z.literal('exact'),
  answer: z.array(ContentBlockSchema).min(1),
  answerText: z.string().min(1),
});

export const AcceptedAnswersMarkingGuideSchema = z.object({
  type: z.literal('accepted_answers'),
  acceptedAnswers: z.array(z.string().min(1)).min(1),
  guidance: z.string().optional(),
});

export const ModelAnswerMarkingGuideSchema = z.object({
  type: z.literal('model_answer'),
  modelAnswer: z.array(ContentBlockSchema).min(1),
  markingPoints: z.array(z.string().min(1)).default([]),
});

export const RubricMarkingGuideSchema = z.object({
  type: z.literal('rubric'),
  criteria: z.array(z.object({ label: z.string().min(1), marks: z.number().int().positive() })).min(1),
  modelAnswer: z.array(ContentBlockSchema).optional(),
});

export const TeacherReviewMarkingGuideSchema = z.object({
  type: z.literal('teacher_review'),
  guidance: z.string().min(1),
});

export const MarkingGuideSchema = z.discriminatedUnion('type', [
  ExactMarkingGuideSchema,
  AcceptedAnswersMarkingGuideSchema,
  ModelAnswerMarkingGuideSchema,
  RubricMarkingGuideSchema,
  TeacherReviewMarkingGuideSchema,
]);

export type ContentBlock = z.infer<typeof ContentBlockSchema>;
export type MarkingGuide = z.infer<typeof MarkingGuideSchema>;
