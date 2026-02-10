import { FeedbackFactor, FeedbackOutcome, UserScoringWeights } from '@prisma/client';
import { prisma } from '@/lib/prisma';

const LEARNING_RATE = 0.1;
const MIN_WEIGHT = 0.3;
const MAX_WEIGHT = 2.5;
const MAX_BIAS = 15;
const MIN_BIAS = -15;

interface FeedbackData {
  outcome: FeedbackOutcome;
  accuracy: number;
  factor: FeedbackFactor | null;
}

/**
 * Update user scoring weights based on feedback
 * This implements a simple gradient-based calibration
 */
export async function updateWeights(
  userId: string,
  feedback: FeedbackData
): Promise<UserScoringWeights> {
  // Get current weights
  let weights = await prisma.userScoringWeights.findUnique({
    where: { userId },
  });

  if (!weights) {
    weights = await prisma.userScoringWeights.create({
      data: { userId },
    });
  }

  // Calculate adjustment direction based on outcome
  // Positive outcome (Interview/Offer) with low accuracy = score was too low
  // Negative outcome (Rejected/Ghosted) with low accuracy = score was too high
  const isPositiveOutcome = feedback.outcome === 'INTERVIEW' || feedback.outcome === 'OFFER';
  const accuracyError = 5 - feedback.accuracy; // 5 is perfect, so error = 5 - actual
  
  // Determine adjustment direction
  // If positive outcome but accuracy low -> our score was too pessimistic -> increase bias
  // If negative outcome but accuracy low -> our score was too optimistic -> decrease bias
  const biasAdjustment = isPositiveOutcome ? accuracyError * LEARNING_RATE * 2 : -accuracyError * LEARNING_RATE * 2;

  // Adjust specific weight based on factor
  const updates: Partial<UserScoringWeights> = {
    bias: Math.max(MIN_BIAS, Math.min(MAX_BIAS, weights.bias + biasAdjustment)),
  };

  if (feedback.factor) {
    // If the factor mattered and outcome was positive, increase its weight
    // If the factor mattered and outcome was negative, decrease its weight
    const factorAdjustment = isPositiveOutcome ? LEARNING_RATE : -LEARNING_RATE;
    
    switch (feedback.factor) {
      case 'SKILLS':
        updates.wSkills = clamp(weights.wSkills + factorAdjustment);
        break;
      case 'LOCATION':
        updates.wLocation = clamp(weights.wLocation + factorAdjustment);
        break;
      case 'SENIORITY':
        updates.wSeniorityPenalty = clamp(weights.wSeniorityPenalty + factorAdjustment);
        break;
      case 'SALARY':
        updates.wSalary = clamp(weights.wSalary + factorAdjustment);
        break;
      case 'COMPANY_FIT':
        // No specific weight for company fit, adjust bias more
        updates.bias = clamp(weights.bias + factorAdjustment * 5, MIN_BIAS, MAX_BIAS);
        break;
    }
  }

  // Update weights in database
  const updatedWeights = await prisma.userScoringWeights.update({
    where: { userId },
    data: {
      ...updates,
      updatedAt: new Date(),
    },
  });

  return updatedWeights;
}

function clamp(value: number, min = MIN_WEIGHT, max = MAX_WEIGHT): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Reset user weights to defaults
 */
export async function resetWeights(userId: string): Promise<UserScoringWeights> {
  return await prisma.userScoringWeights.upsert({
    where: { userId },
    update: {
      wSkills: 1.0,
      wLocation: 1.0,
      wSeniorityPenalty: 1.0,
      wMustHaveGap: 1.0,
      wNiceHaveGap: 0.5,
      wSalary: 0.5,
      bias: 0.0,
      updatedAt: new Date(),
    },
    create: {
      userId,
      wSkills: 1.0,
      wLocation: 1.0,
      wSeniorityPenalty: 1.0,
      wMustHaveGap: 1.0,
      wNiceHaveGap: 0.5,
      wSalary: 0.5,
      bias: 0.0,
    },
  });
}

/**
 * Get human-readable weight labels
 */
export function getWeightLabels(): Record<string, string> {
  return {
    wSkills: 'Skills Match Weight',
    wLocation: 'Location Weight',
    wSeniorityPenalty: 'Seniority Mismatch Penalty',
    wMustHaveGap: 'Must-Have Skills Gap Penalty',
    wNiceHaveGap: 'Nice-to-Have Skills Weight',
    wSalary: 'Salary Fit Weight',
    bias: 'Score Adjustment',
  };
}

/**
 * Get weight description
 */
export function getWeightDescription(key: string): string {
  const descriptions: Record<string, string> = {
    wSkills: 'How much skill matches affect your score (higher = more important)',
    wLocation: 'How much location/remote preference affects your score',
    wSeniorityPenalty: 'Penalty for seniority level mismatches',
    wMustHaveGap: 'Penalty for missing must-have skills',
    wNiceHaveGap: 'Weight for nice-to-have skill matches',
    wSalary: 'How much salary alignment affects your score',
    bias: 'Overall adjustment to your scores based on past feedback',
  };
  return descriptions[key] || '';
}

// Alias for backward compatibility
export const adjustWeights = updateWeights;
