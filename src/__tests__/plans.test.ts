import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PlanLimits, checkFeatureAccess, getPlanLimits } from '@/lib/plans';

describe('Plan System', () => {
  describe('getPlanLimits', () => {
    it('should return free plan limits', () => {
      const limits = getPlanLimits('FREE');

      expect(limits).toEqual({
        maxJobs: 10,
        maxKitsPerMonth: 5,
        hasAdvancedScoring: false,
        hasAnalytics: false,
        hasPrioritySupport: false,
        hasCustomWeights: false,
        hasEmailReminders: false,
        hasWeeklySummary: false,
      });
    });

    it('should return pro plan limits', () => {
      const limits = getPlanLimits('PRO');

      expect(limits).toEqual({
        maxJobs: 50,
        maxKitsPerMonth: 25,
        hasAdvancedScoring: true,
        hasAnalytics: true,
        hasPrioritySupport: false,
        hasCustomWeights: true,
        hasEmailReminders: true,
        hasWeeklySummary: true,
      });
    });

    it('should return power plan limits', () => {
      const limits = getPlanLimits('POWER');

      expect(limits).toEqual({
        maxJobs: -1, // Unlimited
        maxKitsPerMonth: -1, // Unlimited
        hasAdvancedScoring: true,
        hasAnalytics: true,
        hasPrioritySupport: true,
        hasCustomWeights: true,
        hasEmailReminders: true,
        hasWeeklySummary: true,
      });
    });

    it('should default to free plan for unknown tier', () => {
      const limits = getPlanLimits('UNKNOWN' as any);

      expect(limits.maxJobs).toBe(10);
    });
  });

  describe('checkFeatureAccess', () => {
    it('should allow basic features on free plan', () => {
      const access = checkFeatureAccess('FREE', 'basicScoring');

      expect(access.allowed).toBe(true);
    });

    it('should deny advanced scoring on free plan', () => {
      const access = checkFeatureAccess('FREE', 'advancedScoring');

      expect(access.allowed).toBe(false);
      expect(access.requiredPlan).toBe('PRO');
    });

    it('should allow analytics on pro plan', () => {
      const access = checkFeatureAccess('PRO', 'analytics');

      expect(access.allowed).toBe(true);
    });

    it('should deny priority support on pro plan', () => {
      const access = checkFeatureAccess('PRO', 'prioritySupport');

      expect(access.allowed).toBe(false);
      expect(access.requiredPlan).toBe('POWER');
    });

    it('should allow all features on power plan', () => {
      const features = [
        'basicScoring',
        'advancedScoring',
        'analytics',
        'prioritySupport',
        'customWeights',
        'emailReminders'
      ];

      for (const feature of features) {
        const access = checkFeatureAccess('POWER', feature as any);
        expect(access.allowed).toBe(true);
      }
    });
  });

  describe('Job Limits', () => {
    it('should enforce job limit on free plan', () => {
      const limits = getPlanLimits('FREE');
      const currentJobs = 10;

      expect(currentJobs >= limits.maxJobs).toBe(true);
    });

    it('should not enforce limit when maxJobs is -1', () => {
      const limits = getPlanLimits('POWER');

      expect(limits.maxJobs).toBe(-1);
      // -1 means unlimited
    });
  });

  describe('Kit Generation Limits', () => {
    it('should enforce monthly kit limit on free plan', () => {
      const limits = getPlanLimits('FREE');
      const kitsThisMonth = 5;

      expect(kitsThisMonth >= limits.maxKitsPerMonth).toBe(true);
    });

    it('should allow more kits on pro plan', () => {
      const limits = getPlanLimits('PRO');

      expect(limits.maxKitsPerMonth).toBe(25);
    });
  });
});
