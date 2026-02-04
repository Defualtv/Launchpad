import { describe, it, expect } from 'vitest';

// Analytics calculations and transformations
describe('Analytics System', () => {
  describe('Funnel Calculations', () => {
    const calculateFunnelMetrics = (data: {
      saved: number;
      applied: number;
      interviewing: number;
      offers: number;
      accepted: number;
    }) => {
      return {
        applicationRate: data.saved > 0 ? (data.applied / data.saved) * 100 : 0,
        interviewRate: data.applied > 0 ? (data.interviewing / data.applied) * 100 : 0,
        offerRate: data.interviewing > 0 ? (data.offers / data.interviewing) * 100 : 0,
        acceptanceRate: data.offers > 0 ? (data.accepted / data.offers) * 100 : 0,
        overallConversion: data.saved > 0 ? (data.accepted / data.saved) * 100 : 0,
      };
    };

    it('should calculate correct conversion rates', () => {
      const data = {
        saved: 100,
        applied: 80,
        interviewing: 20,
        offers: 5,
        accepted: 1,
      };

      const metrics = calculateFunnelMetrics(data);

      expect(metrics.applicationRate).toBe(80);
      expect(metrics.interviewRate).toBe(25);
      expect(metrics.offerRate).toBe(25);
      expect(metrics.acceptanceRate).toBe(20);
      expect(metrics.overallConversion).toBe(1);
    });

    it('should handle zero values without NaN', () => {
      const data = {
        saved: 0,
        applied: 0,
        interviewing: 0,
        offers: 0,
        accepted: 0,
      };

      const metrics = calculateFunnelMetrics(data);

      expect(metrics.applicationRate).toBe(0);
      expect(metrics.interviewRate).toBe(0);
      expect(isNaN(metrics.offerRate)).toBe(false);
    });

    it('should handle partial funnel data', () => {
      const data = {
        saved: 10,
        applied: 10,
        interviewing: 0,
        offers: 0,
        accepted: 0,
      };

      const metrics = calculateFunnelMetrics(data);

      expect(metrics.applicationRate).toBe(100);
      expect(metrics.interviewRate).toBe(0);
    });
  });

  describe('Score Distribution', () => {
    const calculateScoreDistribution = (scores: number[]) => {
      if (scores.length === 0) {
        return {
          min: 0,
          max: 0,
          average: 0,
          median: 0,
          distribution: [],
        };
      }

      const sorted = [...scores].sort((a, b) => a - b);
      const sum = scores.reduce((a, b) => a + b, 0);

      // Create 10-point buckets: 0-10, 10-20, etc.
      const distribution = Array(10).fill(0);
      for (const score of scores) {
        const bucket = Math.min(Math.floor(score / 10), 9);
        distribution[bucket]++;
      }

      return {
        min: sorted[0],
        max: sorted[sorted.length - 1],
        average: sum / scores.length,
        median: sorted[Math.floor(sorted.length / 2)],
        distribution,
      };
    };

    it('should calculate correct statistics', () => {
      const scores = [45, 55, 65, 75, 85];

      const stats = calculateScoreDistribution(scores);

      expect(stats.min).toBe(45);
      expect(stats.max).toBe(85);
      expect(stats.average).toBe(65);
      expect(stats.median).toBe(65);
    });

    it('should create correct distribution buckets', () => {
      const scores = [15, 25, 35, 55, 55, 75, 95];

      const stats = calculateScoreDistribution(scores);

      expect(stats.distribution[1]).toBe(1); // 10-20
      expect(stats.distribution[2]).toBe(1); // 20-30
      expect(stats.distribution[5]).toBe(2); // 50-60
      expect(stats.distribution[9]).toBe(1); // 90-100
    });

    it('should handle empty scores', () => {
      const stats = calculateScoreDistribution([]);

      expect(stats.average).toBe(0);
      expect(stats.distribution).toEqual([]);
    });
  });

  describe('Time-based Analytics', () => {
    const groupByWeek = (
      items: { createdAt: Date }[]
    ): Map<string, number> => {
      const weeks = new Map<string, number>();

      for (const item of items) {
        const date = new Date(item.createdAt);
        // Get Monday of the week
        const day = date.getDay();
        const diff = date.getDate() - day + (day === 0 ? -6 : 1);
        date.setDate(diff);
        date.setHours(0, 0, 0, 0);

        const weekKey = date.toISOString().split('T')[0];
        weeks.set(weekKey, (weeks.get(weekKey) || 0) + 1);
      }

      return weeks;
    };

    it('should group items by week', () => {
      const items = [
        { createdAt: new Date('2024-01-15') }, // Monday
        { createdAt: new Date('2024-01-16') }, // Tuesday
        { createdAt: new Date('2024-01-22') }, // Next Monday
        { createdAt: new Date('2024-01-23') }, // Next Tuesday
        { createdAt: new Date('2024-01-24') }, // Next Wednesday
      ];

      const grouped = groupByWeek(items);

      expect(grouped.get('2024-01-15')).toBe(2);
      expect(grouped.get('2024-01-22')).toBe(3);
    });
  });

  describe('Skill Analytics', () => {
    const analyzeSkillDemand = (
      jobs: { requirements?: string | null }[],
      userSkills: string[]
    ) => {
      const skillCounts = new Map<string, number>();
      const matchedSkills = new Set<string>();

      for (const job of jobs) {
        if (!job.requirements) continue;

        const reqLower = job.requirements.toLowerCase();
        for (const skill of userSkills) {
          if (reqLower.includes(skill.toLowerCase())) {
            skillCounts.set(skill, (skillCounts.get(skill) || 0) + 1);
            matchedSkills.add(skill);
          }
        }
      }

      return {
        mostDemanded: [...skillCounts.entries()]
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([skill]) => skill),
        matchedCount: matchedSkills.size,
        totalSkills: userSkills.length,
        coverageRate: (matchedSkills.size / userSkills.length) * 100,
      };
    };

    it('should identify most demanded skills', () => {
      const jobs = [
        { requirements: 'Must know TypeScript and React' },
        { requirements: 'Experience with TypeScript required' },
        { requirements: 'React and Node.js expertise' },
      ];
      const userSkills = ['TypeScript', 'React', 'Node.js', 'Python'];

      const analysis = analyzeSkillDemand(jobs, userSkills);

      expect(analysis.mostDemanded[0]).toBe('TypeScript');
      expect(analysis.mostDemanded[1]).toBe('React');
    });

    it('should calculate skill coverage', () => {
      const jobs = [
        { requirements: 'TypeScript and Python needed' },
      ];
      const userSkills = ['TypeScript', 'React', 'Python', 'Java'];

      const analysis = analyzeSkillDemand(jobs, userSkills);

      expect(analysis.matchedCount).toBe(2);
      expect(analysis.coverageRate).toBe(50);
    });

    it('should handle jobs without requirements', () => {
      const jobs = [
        { requirements: null },
        { requirements: undefined },
        { requirements: 'Python required' },
      ];
      const userSkills = ['Python', 'Java'];

      const analysis = analyzeSkillDemand(jobs, userSkills);

      expect(analysis.mostDemanded).toContain('Python');
    });
  });

  describe('Trend Calculations', () => {
    const calculateTrend = (
      current: number,
      previous: number
    ): { change: number; direction: 'up' | 'down' | 'stable' } => {
      if (previous === 0) {
        return {
          change: current > 0 ? 100 : 0,
          direction: current > 0 ? 'up' : 'stable',
        };
      }

      const change = ((current - previous) / previous) * 100;
      return {
        change: Math.abs(change),
        direction: change > 5 ? 'up' : change < -5 ? 'down' : 'stable',
      };
    };

    it('should detect upward trend', () => {
      const trend = calculateTrend(15, 10);

      expect(trend.direction).toBe('up');
      expect(trend.change).toBe(50);
    });

    it('should detect downward trend', () => {
      const trend = calculateTrend(5, 10);

      expect(trend.direction).toBe('down');
      expect(trend.change).toBe(50);
    });

    it('should detect stable trend', () => {
      const trend = calculateTrend(10, 10);

      expect(trend.direction).toBe('stable');
    });

    it('should handle zero previous value', () => {
      const trend = calculateTrend(10, 0);

      expect(trend.direction).toBe('up');
      expect(trend.change).toBe(100);
    });
  });
});
