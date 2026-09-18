import { z } from 'zod';

export const backgroundTopics = [
  'projects',
  'competitions',
  'research',
  'community',
  'goals',
] as const;
export const interestOptions = [
  'Building apps',
  'Artificial intelligence',
  'Design and creativity',
  'Science and discovery',
  'Helping people',
  'Business and startups',
] as const;
export const topicQuestions: Record<(typeof backgroundTopics)[number], string> = {
  projects:
    'Have you built anything? A website, a school project, a design or a small experiment all count. What did you personally do?',
  competitions:
    'Have you joined hackathons, olympiads, sports or other competitions? Tell me your role and the result, even if you did not win.',
  research:
    'Have you explored a question in depth, worked with a teacher or written a research project? What did you investigate?',
  community:
    'Have you helped others, volunteered, worked, led a club or taken care of family? What responsibility did you have?',
  goals: 'What would you like to learn or build next? What kind of problems matter to you?',
};
export const backgroundSchema = z
  .object({
    interests: z.array(z.string().trim().min(1).max(80)).max(8),
    enjoys: z.string().max(1000),
    answers: z
      .array(z.object({ topic: z.enum(backgroundTopics), text: z.string().max(2000) }).strict())
      .max(5)
      .refine((a) => new Set(a.map((x) => x.topic)).size === a.length),
    resume: z
      .object({
        bullets: z
          .array(
            z
              .object({
                text: z.string().trim().min(1).max(600),
                evidence: z.string().min(1).max(2000),
              })
              .strict(),
          )
          .max(8),
      })
      .strict()
      .optional(),
  })
  .strict();
export type Background = z.infer<typeof backgroundSchema>;
export const emptyBackground: Background = { interests: [], enjoys: '', answers: [] };
export function backgroundEvidence(b: Background) {
  return [b.enjoys, ...b.interests, ...b.answers.map((a) => a.text)].filter(Boolean);
}

export function planningInterest(b: Background, fallback: string) {
  const map: Record<string, string> = {
    'Building apps': 'Software engineering',
    'Artificial intelligence': 'Artificial intelligence',
    'Design and creativity': 'Human-computer interaction',
  };
  return b.interests.map((i) => map[i]).find(Boolean) || fallback;
}
