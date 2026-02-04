import { z } from 'zod';
import { RemotePreference, SeniorityLevel, SkillLevel, JobType, PipelineStage, FeedbackOutcome, FeedbackFactor } from '@prisma/client';

// Auth schemas
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
});

// Profile schemas
export const profileSchema = z.object({
  headline: z.string().max(200).optional(),
  summary: z.string().max(5000).optional(),
  location: z.string().max(200).optional(),
  remotePreference: z.nativeEnum(RemotePreference).optional(),
  targetRole: z.string().max(200).optional(),
  targetSeniority: z.nativeEnum(SeniorityLevel).optional().nullable(),
  salaryMin: z.number().int().positive().optional().nullable(),
  salaryMax: z.number().int().positive().optional().nullable(),
  cvText: z.string().max(50000).optional(),
});

export const experienceSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, 'Title is required').max(200),
  company: z.string().min(1, 'Company is required').max(200),
  location: z.string().max(200).optional(),
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date()).optional().nullable(),
  current: z.boolean().optional(),
  description: z.string().max(5000).optional(),
  highlights: z.array(z.string()).optional(),
});

export const educationSchema = z.object({
  id: z.string().optional(),
  institution: z.string().min(1, 'Institution is required').max(200),
  degree: z.string().max(200).optional(),
  field: z.string().max(200).optional(),
  startDate: z.string().or(z.date()).optional().nullable(),
  endDate: z.string().or(z.date()).optional().nullable(),
  gpa: z.number().min(0).max(5).optional().nullable(),
  highlights: z.array(z.string()).optional(),
});

export const skillSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Skill name is required').max(100),
  level: z.nativeEnum(SkillLevel).optional(),
  yearsExp: z.number().min(0).max(50).optional().nullable(),
});

// Job schemas
export const jobCreateSchema = z.object({
  title: z.string().min(1, 'Job title is required').max(200),
  company: z.string().min(1, 'Company is required').max(200),
  url: z.string().url().optional().nullable().or(z.literal('')),
  location: z.string().max(200).optional(),
  jobType: z.nativeEnum(JobType).optional(),
  remoteType: z.nativeEnum(RemotePreference).optional(),
  seniorityEstimate: z.nativeEnum(SeniorityLevel).optional().nullable(),
  salaryMin: z.number().int().positive().optional().nullable(),
  salaryMax: z.number().int().positive().optional().nullable(),
  salaryCurrency: z.string().max(10).optional(),
  descriptionRaw: z.string().min(1, 'Job description is required').max(50000),
});

export const jobUpdateSchema = jobCreateSchema.partial();

export const jobUrlParseSchema = z.object({
  url: z.string().url('Invalid URL'),
  description: z.string().max(50000).optional(),
});

export const jobDescriptionSchema = z.object({
  description: z.string().min(10, 'Description is too short').max(50000),
});

// Pipeline schemas
export const pipelineUpdateSchema = z.object({
  stage: z.nativeEnum(PipelineStage).optional(),
  nextActionAt: z.string().optional().nullable(),
  notes: z.string().max(10000).optional(),
});

// Feedback schemas
export const feedbackSchema = z.object({
  jobId: z.string().min(1),
  outcome: z.nativeEnum(FeedbackOutcome),
  accuracy: z.number().int().min(1).max(5),
  factor: z.nativeEnum(FeedbackFactor).optional().nullable(),
  note: z.string().max(1000).optional(),
});

// Contact schemas
export const contactSchema = z.object({
  id: z.string().optional(),
  jobId: z.string().min(1),
  name: z.string().min(1, 'Name is required').max(200),
  role: z.string().max(200).optional(),
  email: z.string().email().optional().nullable().or(z.literal('')),
  phone: z.string().max(50).optional(),
  linkedin: z.string().url().optional().nullable().or(z.literal('')),
  notes: z.string().max(5000).optional(),
});

// Application kit schemas
export const kitGenerateSchema = z.object({
  jobId: z.string().min(1),
  tone: z.enum(['professional', 'friendly', 'confident']).optional(),
  type: z.enum(['resume', 'cover', 'qa', 'all']).optional(),
});

// Event tracking schema
export const eventTrackSchema = z.object({
  jobId: z.string().optional(),
  kitId: z.string().optional(),
  assetType: z.enum(['RESUME_BULLETS', 'COVER_SHORT', 'COVER_LONG', 'QA_PACK', 'SCORE']),
  eventType: z.enum(['VIEW', 'COPY', 'USE', 'EDIT', 'EXPORT', 'GENERATE']),
  variant: z.string().optional(),
  durationMs: z.number().int().optional(),
  metadata: z.record(z.unknown()).optional(),
});

// Scoring weights schema
export const scoringWeightsSchema = z.object({
  wSkills: z.number().min(0).max(3),
  wLocation: z.number().min(0).max(3),
  wSeniorityPenalty: z.number().min(0).max(3),
  wMustHaveGap: z.number().min(0).max(3),
  wNiceHaveGap: z.number().min(0).max(3),
  wSalary: z.number().min(0).max(3),
  bias: z.number().min(-20).max(20),
});

// Settings schemas
export const emailPreferencesSchema = z.object({
  emailReminders: z.boolean(),
  emailWeeklySummary: z.boolean(),
});

// Pagination schema
export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

// Search/filter schema
export const jobFilterSchema = z.object({
  search: z.string().optional(),
  stage: z.nativeEnum(PipelineStage).optional(),
  archived: z.boolean().optional(),
  minScore: z.number().int().min(0).max(100).optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
export type ExperienceInput = z.infer<typeof experienceSchema>;
export type EducationInput = z.infer<typeof educationSchema>;
export type SkillInput = z.infer<typeof skillSchema>;
export type JobCreateInput = z.infer<typeof jobCreateSchema>;
export type JobUpdateInput = z.infer<typeof jobUpdateSchema>;
export type PipelineUpdateInput = z.infer<typeof pipelineUpdateSchema>;
export type FeedbackInput = z.infer<typeof feedbackSchema>;
export type ContactInput = z.infer<typeof contactSchema>;
export type KitGenerateInput = z.infer<typeof kitGenerateSchema>;
export type EventTrackInput = z.infer<typeof eventTrackSchema>;
export type ScoringWeightsInput = z.infer<typeof scoringWeightsSchema>;
export type EmailPreferencesInput = z.infer<typeof emailPreferencesSchema>;
export type JobFilterInput = z.infer<typeof jobFilterSchema>;
