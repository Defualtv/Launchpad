import { describe, it, expect } from 'vitest';
import { calculateScore, extractKeywords, estimateSeniority, extractSalary } from '@/lib/scoring';

describe('Scoring Engine', () => {
  describe('calculateScore', () => {
    it('should return a score between 0 and 100', () => {
      const profile = {
        desiredTitle: 'Software Engineer',
        desiredLocation: 'San Francisco',
        remotePreference: 'FLEXIBLE' as const,
        minSalary: 100000,
        maxSalary: 150000,
        targetSeniority: 'MID',
        skills: [
          { name: 'JavaScript', level: 'ADVANCED' as const, yearsExp: 5 },
          { name: 'React', level: 'ADVANCED' as const, yearsExp: 3 },
        ],
      };

      const job = {
        title: 'Senior Software Engineer',
        company: 'Tech Corp',
        location: 'San Francisco, CA',
        description: 'Looking for a software engineer with JavaScript and React experience.',
        salary: '$120,000 - $160,000',
        requirements: ['JavaScript', 'React', 'Node.js'],
      };

      const result = calculateScore(profile, job);

      expect(result.overall).toBeGreaterThanOrEqual(0);
      expect(result.overall).toBeLessThanOrEqual(100);
      expect(result.breakdown).toHaveProperty('skills');
      expect(result.breakdown).toHaveProperty('location');
      expect(result.breakdown).toHaveProperty('salary');
      expect(result.breakdown).toHaveProperty('seniority');
    });

    it('should score higher when more skills match', () => {
      const profileWithSkills = {
        desiredTitle: 'Developer',
        skills: [
          { name: 'JavaScript', level: 'ADVANCED' as const, yearsExp: 5 },
          { name: 'React', level: 'ADVANCED' as const, yearsExp: 3 },
          { name: 'TypeScript', level: 'INTERMEDIATE' as const, yearsExp: 2 },
        ],
      };

      const profileWithoutSkills = {
        desiredTitle: 'Developer',
        skills: [],
      };

      const job = {
        title: 'Frontend Developer',
        company: 'Company',
        description: 'Need JavaScript, React, and TypeScript expertise',
        requirements: ['JavaScript', 'React', 'TypeScript'],
      };

      const scoreWithSkills = calculateScore(profileWithSkills, job);
      const scoreWithoutSkills = calculateScore(profileWithoutSkills, job);

      expect(scoreWithSkills.overall).toBeGreaterThan(scoreWithoutSkills.overall);
      expect(scoreWithSkills.matchedSkills?.length).toBeGreaterThan(0);
    });

    it('should handle missing profile data gracefully', () => {
      const emptyProfile = {};
      const job = {
        title: 'Engineer',
        company: 'Company',
        description: 'A job',
        requirements: [],
      };

      const result = calculateScore(emptyProfile, job);

      expect(result.overall).toBeGreaterThanOrEqual(0);
      expect(typeof result.overall).toBe('number');
    });
  });

  describe('extractKeywords', () => {
    it('should extract programming languages', () => {
      const text = 'We need JavaScript, Python, and Java developers';
      const keywords = extractKeywords(text);

      expect(keywords).toContain('javascript');
      expect(keywords).toContain('python');
      expect(keywords).toContain('java');
    });

    it('should extract frameworks', () => {
      const text = 'Experience with React, Angular, and Vue.js required';
      const keywords = extractKeywords(text);

      expect(keywords).toContain('react');
      expect(keywords).toContain('angular');
      expect(keywords).toContain('vue');
    });

    it('should normalize keywords to lowercase', () => {
      const text = 'TYPESCRIPT and TypeScript should be the same';
      const keywords = extractKeywords(text);

      const tsCount = keywords.filter(k => k === 'typescript').length;
      expect(tsCount).toBe(1);
    });

    it('should handle empty text', () => {
      const keywords = extractKeywords('');
      expect(Array.isArray(keywords)).toBe(true);
    });
  });

  describe('estimateSeniority', () => {
    it('should detect intern level', () => {
      expect(estimateSeniority('Software Engineering Intern')).toBe('INTERN');
      expect(estimateSeniority('Summer Internship - Developer')).toBe('INTERN');
    });

    it('should detect entry level', () => {
      expect(estimateSeniority('Junior Developer')).toBe('ENTRY');
      expect(estimateSeniority('Entry Level Software Engineer')).toBe('ENTRY');
    });

    it('should detect senior level', () => {
      expect(estimateSeniority('Senior Software Engineer')).toBe('SENIOR');
      expect(estimateSeniority('Sr. Developer')).toBe('SENIOR');
    });

    it('should detect lead level', () => {
      expect(estimateSeniority('Tech Lead')).toBe('LEAD');
      expect(estimateSeniority('Engineering Lead')).toBe('LEAD');
    });

    it('should default to MID for unclear titles', () => {
      expect(estimateSeniority('Software Engineer')).toBe('MID');
      expect(estimateSeniority('Developer')).toBe('MID');
    });
  });

  describe('extractSalary', () => {
    it('should extract salary from formatted strings', () => {
      expect(extractSalary('$120,000 - $150,000')).toEqual({ min: 120000, max: 150000 });
      expect(extractSalary('$100k - $130k')).toEqual({ min: 100000, max: 130000 });
    });

    it('should handle single salary values', () => {
      expect(extractSalary('$120,000')).toEqual({ min: 120000, max: 120000 });
    });

    it('should extract salary from text', () => {
      const text = 'Salary range: $100,000 to $150,000 per year';
      expect(extractSalary(text)).toEqual({ min: 100000, max: 150000 });
    });

    it('should return null for invalid input', () => {
      expect(extractSalary('')).toBeNull();
      expect(extractSalary('competitive salary')).toBeNull();
    });
  });
});
