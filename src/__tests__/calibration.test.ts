import { describe, it, expect } from 'vitest';
import { adjustWeights, calculateWeightChange } from '@/lib/calibration';

describe('Calibration System', () => {
  describe('adjustWeights', () => {
    const defaultWeights = {
      skillsWeight: 0.35,
      locationWeight: 0.25,
      salaryWeight: 0.25,
      seniorityWeight: 0.15,
    };

    it('should increase skills weight on skill-based acceptance', () => {
      const result = adjustWeights(
        defaultWeights,
        'ACCEPTED',
        'SKILLS',
        []
      );

      expect(result.skillsWeight).toBeGreaterThan(defaultWeights.skillsWeight);
    });

    it('should decrease skills weight on skill-based rejection', () => {
      const result = adjustWeights(
        defaultWeights,
        'REJECTED',
        'SKILLS',
        []
      );

      expect(result.skillsWeight).toBeLessThan(defaultWeights.skillsWeight);
    });

    it('should keep weights summing to 1', () => {
      const result = adjustWeights(
        defaultWeights,
        'ACCEPTED',
        'LOCATION',
        ['SALARY']
      );

      const sum =
        result.skillsWeight +
        result.locationWeight +
        result.salaryWeight +
        result.seniorityWeight;

      expect(sum).toBeCloseTo(1, 5);
    });

    it('should handle missing current weights', () => {
      const result = adjustWeights(
        undefined,
        'ACCEPTED',
        'SKILLS',
        []
      );

      expect(result).toHaveProperty('skillsWeight');
      expect(result).toHaveProperty('locationWeight');
      expect(result).toHaveProperty('salaryWeight');
      expect(result).toHaveProperty('seniorityWeight');
    });

    it('should apply secondary factor adjustments', () => {
      const result = adjustWeights(
        defaultWeights,
        'ACCEPTED',
        'SKILLS',
        ['LOCATION', 'SALARY']
      );

      // Primary factor should be adjusted more
      const primaryDelta = Math.abs(result.skillsWeight - defaultWeights.skillsWeight);
      
      expect(primaryDelta).toBeGreaterThan(0);
    });

    it('should handle withdrawn outcome', () => {
      const result = adjustWeights(
        defaultWeights,
        'WITHDRAWN',
        'SALARY',
        []
      );

      // Withdrawn should have less impact
      const salaryDelta = Math.abs(result.salaryWeight - defaultWeights.salaryWeight);
      
      expect(salaryDelta).toBeLessThan(0.05);
    });
  });

  describe('calculateWeightChange', () => {
    it('should return positive delta for accepted', () => {
      const delta = calculateWeightChange('ACCEPTED', true);
      expect(delta).toBeGreaterThan(0);
    });

    it('should return negative delta for rejected', () => {
      const delta = calculateWeightChange('REJECTED', true);
      expect(delta).toBeLessThan(0);
    });

    it('should return larger delta for primary factors', () => {
      const primaryDelta = calculateWeightChange('ACCEPTED', true);
      const secondaryDelta = calculateWeightChange('ACCEPTED', false);

      expect(Math.abs(primaryDelta)).toBeGreaterThan(Math.abs(secondaryDelta));
    });

    it('should return zero for ghosted', () => {
      const delta = calculateWeightChange('GHOSTED', true);
      expect(delta).toBe(0);
    });
  });
});
