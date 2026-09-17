import { z } from 'zod';
import type { Profile } from './types';
const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine(
    (v) => !Number.isNaN(Date.parse(v)) && new Date(v).toISOString().slice(0, 10) === v,
    'Invalid date',
  )
  .nullable();
const score = z.number().min(0).max(9).multipleOf(0.5).nullable();
const testStatus = z.enum(['MISSING', 'PLANNED', 'VALID']);
export const profileSchema = z
  .object({
    personal_plan: z
      .array(
        z
          .object({
            id: z.string().min(1).max(80),
            title: z.string().trim().min(1).max(120),
            kind: z.enum(['STUDY', 'ACTIVITY']),
            due: date,
            notes: z.string().max(1000),
            complete: z.boolean(),
          })
          .strict(),
      )
      .max(40)
      .optional(),
    name: z.string().trim().min(1).max(60),
    age: z.number().int().min(10).max(100),
    citizenship: z.string().min(1).max(80),
    applicant_type: z.string().max(60),
    intake: z.string().regex(/^FALL_20\d\d$/),
    major: z.string().max(80),
    countries: z.array(z.string().max(40)).max(10),
    country_locks: z.array(z.string().max(40)).max(10),
    geography_flexible: z.boolean(),
    financial_flexibility: z.boolean(),
    budget_hard: z.boolean(),
    curriculum: z.string().max(80),
    raw_grade: z.string().max(40),
    raw_scale: z.string().max(40),
    ib_total: z.number().min(0).max(45).nullable(),
    math_aa_hl: z.number().min(0).max(7).nullable(),
    english_a: z.boolean().nullable(),
    ib_diploma: z.boolean().nullable(),
    ib_courses: z.number().int().min(0).max(10).nullable(),
    hl_courses: z.number().int().min(0).max(10).nullable(),
    academics_completed: z.boolean(),
    senior_english: z.boolean().nullable(),
    aif: z.boolean(),
    documents_ready: z.boolean().default(false),
    documents_by_program: z.record(z.string().max(60), z.boolean()).optional(),
    ielts: z.object({
      status: testStatus,
      overall: score,
      reading: score,
      writing: score,
      listening: score,
      speaking: score,
      date,
    }),
    sat: z.object({
      status: testStatus,
      score: z.number().int().min(400).max(1600).nullable(),
      date,
    }),
    act: z.object({ status: testStatus, score: z.number().int().min(1).max(36).nullable(), date }),
    det: z.number().min(10).max(160).nullable(),
    toefl: z.object({
      score: z.number().min(0).max(120).nullable(),
      writing: z.number().min(0).max(30).nullable(),
      speaking: z.number().min(0).max(30).nullable(),
      date,
    }),
    budgets: z.object({
      USD: z.number().min(0).max(10000000).nullable(),
      CAD: z.number().min(0).max(10000000).nullable(),
      GBP: z.number().min(0).max(10000000).nullable(),
    }),
    interest: z.string().max(80),
    expected_score_date: date,
    shortlist: z.array(z.string().max(60)).max(12),
    completed: z.array(z.string().max(120)).max(100),
  })
  .strict()
  .superRefine((p, ctx) => {
    const bands = [p.ielts.reading, p.ielts.writing, p.ielts.listening, p.ielts.speaking];
    if (
      p.ielts.overall !== null &&
      bands.every((v) => v !== null) &&
      Math.round(bands.reduce<number>((sum, v) => sum + (v ?? 0), 0) / 2) / 2 !== p.ielts.overall
    )
      ctx.addIssue({
        code: 'custom',
        path: ['ielts'],
        message:
          'IELTS overall does not match the four bands. Check the scores on your result report.',
      });
    if (
      p.curriculum === 'IB' &&
      p.raw_scale.trim() === '45' &&
      /^\d+(\.\d+)?$/.test(p.raw_grade.trim()) &&
      p.ib_total !== null &&
      Number(p.raw_grade) !== p.ib_total
    )
      ctx.addIssue({
        code: 'custom',
        path: ['ib_total'],
        message: 'Your original grade out of 45 and IB total must match.',
      });
    if (new Set(p.personal_plan?.map((t) => t.id)).size !== (p.personal_plan?.length ?? 0))
      ctx.addIssue({
        code: 'custom',
        path: ['personal_plan'],
        message: 'Personal plan items must have unique identifiers.',
      });
    if (p.hl_courses !== null && p.ib_courses !== null && p.hl_courses > p.ib_courses)
      ctx.addIssue({
        code: 'custom',
        path: ['hl_courses'],
        message: 'HL courses cannot exceed the total number of IB courses.',
      });
    for (const key of ['sat', 'act'] as const)
      if (p[key].status === 'VALID' && (p[key].score === null || p[key].date === null))
        ctx.addIssue({
          code: 'custom',
          path: [key],
          message: 'A valid test needs its score and date.',
        });
    if (p.ielts.status === 'VALID' && (p.ielts.overall === null || p.ielts.date === null))
      ctx.addIssue({
        code: 'custom',
        path: ['ielts'],
        message: 'Enter the IELTS score and test date.',
      });
  });
export const demoProfile: Profile = {
  name: 'Aruzhan',
  age: 17,
  citizenship: 'Kazakhstan',
  applicant_type: 'FIRST_YEAR_INTERNATIONAL',
  intake: 'FALL_2027',
  major: 'Computer Science',
  countries: ['US', 'Canada'],
  country_locks: [],
  geography_flexible: true,
  financial_flexibility: false,
  budget_hard: true,
  curriculum: 'IB',
  raw_grade: '42',
  raw_scale: '45',
  ib_total: 42,
  math_aa_hl: 7,
  english_a: true,
  ib_diploma: true,
  ib_courses: 6,
  hl_courses: 3,
  academics_completed: false,
  senior_english: true,
  aif: false,
  documents_ready: false,
  ielts: {
    status: 'VALID',
    overall: 6,
    reading: 6,
    writing: 6,
    listening: 6,
    speaking: 6,
    date: '2026-08-15',
  },
  sat: { status: 'PLANNED', score: null, date: null },
  act: { status: 'MISSING', score: null, date: null },
  det: null,
  toefl: { score: null, writing: null, speaking: null, date: null },
  budgets: { USD: 100000, CAD: 110000, GBP: 60000 },
  interest: 'Exploring CS',
  expected_score_date: '2026-11-20',
  shortlist: ['waterloo', 'uw', 'ubc'],
  completed: [],
};
// Additional profile values (bands/date/course counts) are explicitly synthetic demo assumptions.
export const blankProfile: Profile = {
  ...demoProfile,
  name: '',
  expected_score_date: null,
  raw_grade: '',
  raw_scale: '',
  ib_total: null,
  math_aa_hl: null,
  english_a: null,
  ib_diploma: null,
  ib_courses: null,
  hl_courses: null,
  senior_english: null,
  ielts: {
    status: 'MISSING',
    overall: null,
    reading: null,
    writing: null,
    listening: null,
    speaking: null,
    date: null,
  },
  sat: { status: 'MISSING', score: null, date: null },
  budgets: { USD: null, CAD: null, GBP: null },
  shortlist: [],
};
