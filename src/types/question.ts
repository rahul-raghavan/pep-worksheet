import { z } from 'zod';

export const QuestionSchema = z.object({
  id: z.string().min(1),
  Topic: z.string().min(1),
  Difficulty: z.union([z.string(), z.number()]).transform(Number).refine((n) => Number.isInteger(n) && n >= 1 && n <= 5, {
    message: 'Difficulty must be an integer 1-5',
  }),
  Front: z.string().min(1),
  Back: z.string().min(1),
});

export type Question = z.infer<typeof QuestionSchema>; 