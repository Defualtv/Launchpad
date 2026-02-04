import { describe, it, expect } from 'vitest';

// Pipeline stage transitions and validation
describe('Pipeline System', () => {
  const VALID_STAGES = [
    'SAVED',
    'APPLYING',
    'APPLIED',
    'INTERVIEWING',
    'OFFER',
    'ACCEPTED',
    'REJECTED',
    'WITHDRAWN'
  ] as const;

  const STAGE_ORDER: Record<string, number> = {
    SAVED: 0,
    APPLYING: 1,
    APPLIED: 2,
    INTERVIEWING: 3,
    OFFER: 4,
    ACCEPTED: 5,
    REJECTED: 5,
    WITHDRAWN: 5,
  };

  describe('Stage Validation', () => {
    it('should recognize all valid stages', () => {
      for (const stage of VALID_STAGES) {
        expect(STAGE_ORDER[stage]).toBeDefined();
      }
    });

    it('should reject invalid stages', () => {
      const invalidStage = 'INVALID';
      expect(STAGE_ORDER[invalidStage]).toBeUndefined();
    });
  });

  describe('Stage Transitions', () => {
    const isValidTransition = (from: string, to: string): boolean => {
      // Terminal states can't transition further
      if (['ACCEPTED', 'REJECTED', 'WITHDRAWN'].includes(from)) {
        return false;
      }

      // Can withdraw from any non-terminal state
      if (to === 'WITHDRAWN') {
        return true;
      }

      // Can be rejected from any active state
      if (to === 'REJECTED') {
        return true;
      }

      // Normal forward progression
      return STAGE_ORDER[to] >= STAGE_ORDER[from];
    };

    it('should allow forward progression', () => {
      expect(isValidTransition('SAVED', 'APPLYING')).toBe(true);
      expect(isValidTransition('APPLIED', 'INTERVIEWING')).toBe(true);
      expect(isValidTransition('OFFER', 'ACCEPTED')).toBe(true);
    });

    it('should allow withdrawal from any active state', () => {
      expect(isValidTransition('SAVED', 'WITHDRAWN')).toBe(true);
      expect(isValidTransition('APPLYING', 'WITHDRAWN')).toBe(true);
      expect(isValidTransition('INTERVIEWING', 'WITHDRAWN')).toBe(true);
    });

    it('should allow rejection from any active state', () => {
      expect(isValidTransition('APPLIED', 'REJECTED')).toBe(true);
      expect(isValidTransition('INTERVIEWING', 'REJECTED')).toBe(true);
      expect(isValidTransition('OFFER', 'REJECTED')).toBe(true);
    });

    it('should prevent transitions from terminal states', () => {
      expect(isValidTransition('ACCEPTED', 'SAVED')).toBe(false);
      expect(isValidTransition('REJECTED', 'APPLYING')).toBe(false);
      expect(isValidTransition('WITHDRAWN', 'OFFER')).toBe(false);
    });

    it('should allow skipping stages', () => {
      expect(isValidTransition('SAVED', 'APPLIED')).toBe(true);
      expect(isValidTransition('APPLIED', 'OFFER')).toBe(true);
    });
  });

  describe('Pipeline Statistics', () => {
    const calculateStats = (items: { stage: string }[]) => {
      const stats = {
        total: items.length,
        active: 0,
        completed: 0,
        byStage: {} as Record<string, number>,
      };

      for (const item of items) {
        stats.byStage[item.stage] = (stats.byStage[item.stage] || 0) + 1;

        if (['ACCEPTED', 'REJECTED', 'WITHDRAWN'].includes(item.stage)) {
          stats.completed++;
        } else {
          stats.active++;
        }
      }

      return stats;
    };

    it('should count total items', () => {
      const items = [
        { stage: 'SAVED' },
        { stage: 'APPLIED' },
        { stage: 'INTERVIEWING' },
      ];

      const stats = calculateStats(items);

      expect(stats.total).toBe(3);
    });

    it('should separate active and completed', () => {
      const items = [
        { stage: 'SAVED' },
        { stage: 'APPLIED' },
        { stage: 'ACCEPTED' },
        { stage: 'REJECTED' },
      ];

      const stats = calculateStats(items);

      expect(stats.active).toBe(2);
      expect(stats.completed).toBe(2);
    });

    it('should count by stage', () => {
      const items = [
        { stage: 'APPLIED' },
        { stage: 'APPLIED' },
        { stage: 'INTERVIEWING' },
      ];

      const stats = calculateStats(items);

      expect(stats.byStage['APPLIED']).toBe(2);
      expect(stats.byStage['INTERVIEWING']).toBe(1);
    });
  });

  describe('Follow-up Date Calculations', () => {
    const calculateFollowUpDate = (
      stage: string,
      lastUpdated: Date
    ): Date | null => {
      const followUpDays: Record<string, number> = {
        APPLIED: 7,
        INTERVIEWING: 3,
        OFFER: 2,
      };

      const days = followUpDays[stage];
      if (!days) return null;

      const followUp = new Date(lastUpdated);
      followUp.setDate(followUp.getDate() + days);
      return followUp;
    };

    it('should calculate 7-day follow-up for applied', () => {
      const lastUpdated = new Date('2024-01-01');
      const followUp = calculateFollowUpDate('APPLIED', lastUpdated);

      expect(followUp?.toISOString().split('T')[0]).toBe('2024-01-08');
    });

    it('should calculate 3-day follow-up for interviewing', () => {
      const lastUpdated = new Date('2024-01-01');
      const followUp = calculateFollowUpDate('INTERVIEWING', lastUpdated);

      expect(followUp?.toISOString().split('T')[0]).toBe('2024-01-04');
    });

    it('should return null for saved stage', () => {
      const lastUpdated = new Date('2024-01-01');
      const followUp = calculateFollowUpDate('SAVED', lastUpdated);

      expect(followUp).toBeNull();
    });

    it('should return null for terminal stages', () => {
      const lastUpdated = new Date('2024-01-01');
      
      expect(calculateFollowUpDate('ACCEPTED', lastUpdated)).toBeNull();
      expect(calculateFollowUpDate('REJECTED', lastUpdated)).toBeNull();
      expect(calculateFollowUpDate('WITHDRAWN', lastUpdated)).toBeNull();
    });
  });
});
