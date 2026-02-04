import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mockGenerateResumeSummary, mockGenerateCoverLetter, mockGenerateInterviewQuestions } from '@/lib/ai';

// Mock the OpenAI module
vi.mock('openai', () => ({
  default: vi.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: vi.fn().mockResolvedValue({
          choices: [{ message: { content: 'Mock AI response' } }]
        })
      }
    }
  }))
}));

describe('AI Provider', () => {
  describe('mockGenerateResumeSummary', () => {
    it('should generate a resume summary', async () => {
      const profile = {
        headline: 'Senior Software Engineer',
        summary: 'Experienced developer with 10 years in fintech',
        skills: [
          { name: 'TypeScript', proficiency: 'EXPERT' },
          { name: 'React', proficiency: 'ADVANCED' }
        ]
      };
      const job = {
        title: 'Staff Engineer',
        company: 'TechCorp',
        description: 'Looking for a senior engineer'
      };

      const result = await mockGenerateResumeSummary(profile as any, job as any);

      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(50);
    });

    it('should include relevant skills in summary', async () => {
      const profile = {
        headline: 'Frontend Developer',
        summary: 'Building great UIs',
        skills: [
          { name: 'JavaScript', proficiency: 'EXPERT' },
          { name: 'CSS', proficiency: 'ADVANCED' }
        ]
      };
      const job = {
        title: 'UI Engineer',
        company: 'DesignCo',
        description: 'Frontend development position'
      };

      const result = await mockGenerateResumeSummary(profile as any, job as any);

      expect(result.toLowerCase()).toMatch(/javascript|css|frontend|ui/);
    });
  });

  describe('mockGenerateCoverLetter', () => {
    it('should generate a cover letter', async () => {
      const profile = {
        headline: 'Product Manager',
        summary: '5 years of product management',
        skills: [{ name: 'Product Strategy', proficiency: 'EXPERT' }],
        experiences: [
          {
            title: 'PM',
            company: 'StartupX',
            startDate: new Date('2020-01-01'),
            current: true,
            description: 'Led product development'
          }
        ]
      };
      const job = {
        title: 'Senior PM',
        company: 'BigTech',
        description: 'Product management role'
      };

      const result = await mockGenerateCoverLetter(profile as any, job as any);

      expect(result).toBeTruthy();
      expect(result.toLowerCase()).toContain('dear');
    });

    it('should mention the target company', async () => {
      const profile = {
        headline: 'Engineer',
        summary: 'Building things',
        skills: [],
        experiences: []
      };
      const job = {
        title: 'Engineer',
        company: 'Acme Inc',
        description: 'Engineering position'
      };

      const result = await mockGenerateCoverLetter(profile as any, job as any);

      expect(result).toContain('Acme Inc');
    });
  });

  describe('mockGenerateInterviewQuestions', () => {
    it('should generate interview questions', async () => {
      const profile = {
        skills: [{ name: 'Python', proficiency: 'EXPERT' }],
        experiences: [{ title: 'Backend Developer' }]
      };
      const job = {
        title: 'Backend Engineer',
        description: 'Backend development with Python'
      };

      const result = await mockGenerateInterviewQuestions(profile as any, job as any);

      expect(result).toBeTruthy();
      expect(Array.isArray(result) || typeof result === 'string').toBe(true);
    });

    it('should generate questions relevant to the role', async () => {
      const profile = {
        skills: [{ name: 'React', proficiency: 'ADVANCED' }],
        experiences: []
      };
      const job = {
        title: 'React Developer',
        description: 'Building React applications'
      };

      const result = await mockGenerateInterviewQuestions(profile as any, job as any);
      const resultStr = typeof result === 'string' ? result : result.join(' ');

      expect(resultStr.toLowerCase()).toMatch(/react|component|state|frontend/);
    });
  });
});
