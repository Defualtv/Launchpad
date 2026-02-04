import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { z } from 'zod';

// Zod schemas for API validation
describe('API Validation Schemas', () => {
  describe('Profile Schema', () => {
    const profileSchema = z.object({
      headline: z.string().min(3).max(100).optional(),
      summary: z.string().max(2000).optional(),
      location: z.string().max(100).optional(),
      desiredSalaryMin: z.number().int().positive().optional().nullable(),
      desiredSalaryMax: z.number().int().positive().optional().nullable(),
      remotePreference: z.enum(['REMOTE', 'HYBRID', 'ONSITE', 'FLEXIBLE']).optional(),
      openToRelocate: z.boolean().optional(),
    });

    it('should accept valid profile data', () => {
      const data = {
        headline: 'Senior Software Engineer',
        summary: 'Experienced developer',
        location: 'San Francisco, CA',
        desiredSalaryMin: 150000,
        desiredSalaryMax: 200000,
        remotePreference: 'REMOTE',
        openToRelocate: false,
      };

      const result = profileSchema.safeParse(data);

      expect(result.success).toBe(true);
    });

    it('should reject invalid remote preference', () => {
      const data = {
        remotePreference: 'INVALID',
      };

      const result = profileSchema.safeParse(data);

      expect(result.success).toBe(false);
    });

    it('should reject headline that is too short', () => {
      const data = {
        headline: 'Hi',
      };

      const result = profileSchema.safeParse(data);

      expect(result.success).toBe(false);
    });

    it('should allow null salary values', () => {
      const data = {
        desiredSalaryMin: null,
        desiredSalaryMax: null,
      };

      const result = profileSchema.safeParse(data);

      expect(result.success).toBe(true);
    });
  });

  describe('Job Schema', () => {
    const jobSchema = z.object({
      title: z.string().min(2).max(200),
      company: z.string().min(1).max(200),
      description: z.string().max(10000).optional(),
      requirements: z.string().max(5000).optional(),
      url: z.string().url().optional().or(z.literal('')),
      location: z.string().max(200).optional(),
      salaryMin: z.number().int().positive().optional().nullable(),
      salaryMax: z.number().int().positive().optional().nullable(),
      jobType: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP']).optional(),
      remoteType: z.enum(['REMOTE', 'HYBRID', 'ONSITE']).optional(),
    });

    it('should accept valid job data', () => {
      const data = {
        title: 'Software Engineer',
        company: 'TechCorp',
        description: 'Build great software',
        url: 'https://example.com/jobs/123',
        jobType: 'FULL_TIME',
        remoteType: 'REMOTE',
      };

      const result = jobSchema.safeParse(data);

      expect(result.success).toBe(true);
    });

    it('should require title and company', () => {
      const data = {
        description: 'Some description',
      };

      const result = jobSchema.safeParse(data);

      expect(result.success).toBe(false);
    });

    it('should accept empty string URL', () => {
      const data = {
        title: 'Developer',
        company: 'StartupX',
        url: '',
      };

      const result = jobSchema.safeParse(data);

      expect(result.success).toBe(true);
    });

    it('should reject invalid URL', () => {
      const data = {
        title: 'Developer',
        company: 'StartupX',
        url: 'not-a-url',
      };

      const result = jobSchema.safeParse(data);

      expect(result.success).toBe(false);
    });
  });

  describe('Skill Schema', () => {
    const skillSchema = z.object({
      name: z.string().min(1).max(100),
      proficiency: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']),
      yearsOfExperience: z.number().int().min(0).max(50).optional(),
    });

    it('should accept valid skill data', () => {
      const data = {
        name: 'TypeScript',
        proficiency: 'EXPERT',
        yearsOfExperience: 5,
      };

      const result = skillSchema.safeParse(data);

      expect(result.success).toBe(true);
    });

    it('should reject invalid proficiency', () => {
      const data = {
        name: 'JavaScript',
        proficiency: 'MASTER',
      };

      const result = skillSchema.safeParse(data);

      expect(result.success).toBe(false);
    });

    it('should reject years over 50', () => {
      const data = {
        name: 'COBOL',
        proficiency: 'EXPERT',
        yearsOfExperience: 60,
      };

      const result = skillSchema.safeParse(data);

      expect(result.success).toBe(false);
    });
  });

  describe('Feedback Schema', () => {
    const feedbackSchema = z.object({
      jobId: z.string().uuid(),
      outcome: z.enum(['ACCEPTED', 'REJECTED', 'WITHDRAWN', 'GHOSTED']),
      primaryFactor: z.enum(['SKILLS', 'LOCATION', 'SALARY', 'SENIORITY', 'OTHER']).optional(),
      secondaryFactors: z.array(z.enum(['SKILLS', 'LOCATION', 'SALARY', 'SENIORITY', 'OTHER'])).optional(),
      notes: z.string().max(2000).optional(),
      interviewStages: z.number().int().min(0).max(20).optional(),
    });

    it('should accept valid feedback data', () => {
      const data = {
        jobId: '123e4567-e89b-12d3-a456-426614174000',
        outcome: 'ACCEPTED',
        primaryFactor: 'SKILLS',
        secondaryFactors: ['LOCATION'],
        notes: 'Great interview experience',
        interviewStages: 3,
      };

      const result = feedbackSchema.safeParse(data);

      expect(result.success).toBe(true);
    });

    it('should require jobId and outcome', () => {
      const data = {
        notes: 'Some feedback',
      };

      const result = feedbackSchema.safeParse(data);

      expect(result.success).toBe(false);
    });

    it('should validate UUID format', () => {
      const data = {
        jobId: 'not-a-uuid',
        outcome: 'ACCEPTED',
      };

      const result = feedbackSchema.safeParse(data);

      expect(result.success).toBe(false);
    });
  });

  describe('Pipeline Item Schema', () => {
    const pipelineItemSchema = z.object({
      jobId: z.string().uuid(),
      stage: z.enum([
        'SAVED',
        'APPLYING',
        'APPLIED',
        'INTERVIEWING',
        'OFFER',
        'ACCEPTED',
        'REJECTED',
        'WITHDRAWN'
      ]),
      notes: z.string().max(5000).optional(),
      followUpDate: z.string().datetime().optional().nullable(),
      priority: z.number().int().min(1).max(5).optional(),
    });

    it('should accept valid pipeline item', () => {
      const data = {
        jobId: '123e4567-e89b-12d3-a456-426614174000',
        stage: 'APPLIED',
        notes: 'Applied via company website',
        priority: 3,
      };

      const result = pipelineItemSchema.safeParse(data);

      expect(result.success).toBe(true);
    });

    it('should accept valid datetime for follow-up', () => {
      const data = {
        jobId: '123e4567-e89b-12d3-a456-426614174000',
        stage: 'INTERVIEWING',
        followUpDate: '2024-02-15T10:00:00Z',
      };

      const result = pipelineItemSchema.safeParse(data);

      expect(result.success).toBe(true);
    });

    it('should reject invalid stage', () => {
      const data = {
        jobId: '123e4567-e89b-12d3-a456-426614174000',
        stage: 'PENDING',
      };

      const result = pipelineItemSchema.safeParse(data);

      expect(result.success).toBe(false);
    });
  });
});
