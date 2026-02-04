import { SubscriptionStatus } from '@prisma/client';

export type PlanType = 'FREE' | 'PRO' | 'POWER';

export interface PlanLimits {
  maxJobs: number;
  aiGenerationsPerMonth: number;
  hasReminders: boolean;
  hasAnalytics: boolean;
  hasAdvancedCalibration: boolean;
  hasWeeklySummary: boolean;
}

export interface PlanInfo {
  name: string;
  price: number;
  priceId: string | null;
  description: string;
  limits: PlanLimits;
  features: string[];
}

export const PLANS: Record<PlanType, PlanInfo> = {
  FREE: {
    name: 'Free',
    price: 0,
    priceId: null,
    description: 'Get started with basic job tracking',
    limits: {
      maxJobs: 25,
      aiGenerationsPerMonth: 5,
      hasReminders: false,
      hasAnalytics: false,
      hasAdvancedCalibration: false,
      hasWeeklySummary: false,
    },
    features: [
      'Track up to 25 jobs',
      '5 AI generations per month',
      'Basic match scoring',
      'Pipeline tracking (Kanban & List)',
      'Job keyword extraction',
    ],
  },
  PRO: {
    name: 'Pro',
    price: 19,
    priceId: process.env.STRIPE_PRICE_ID_PRO || '',
    description: 'For active job seekers',
    limits: {
      maxJobs: Infinity,
      aiGenerationsPerMonth: 60,
      hasReminders: true,
      hasAnalytics: true,
      hasAdvancedCalibration: false,
      hasWeeklySummary: false,
    },
    features: [
      'Unlimited jobs',
      '60 AI generations per month',
      'Enhanced match scoring',
      'Email reminders',
      'Analytics dashboard',
      'Contact management',
      'Priority support',
    ],
  },
  POWER: {
    name: 'Power',
    price: 39,
    priceId: process.env.STRIPE_PRICE_ID_POWER || '',
    description: 'For power users and career changers',
    limits: {
      maxJobs: Infinity,
      aiGenerationsPerMonth: 200,
      hasReminders: true,
      hasAnalytics: true,
      hasAdvancedCalibration: true,
      hasWeeklySummary: true,
    },
    features: [
      'Everything in Pro',
      '200 AI generations per month',
      'Advanced score calibration',
      'Weekly summary emails',
      'A/B testing insights',
      'Skill gap analysis',
      'Export all data',
    ],
  },
};

export function getPlanFromStatus(status: SubscriptionStatus): PlanType {
  switch (status) {
    case SubscriptionStatus.POWER:
      return 'POWER';
    case SubscriptionStatus.PRO:
      return 'PRO';
    case SubscriptionStatus.PAST_DUE:
      return 'PRO'; // Maintain access while past due, but show warning
    default:
      return 'FREE';
  }
}

export function getPlanLimits(status: SubscriptionStatus): PlanLimits {
  const planType = getPlanFromStatus(status);
  return PLANS[planType].limits;
}

export function canAccessFeature(
  status: SubscriptionStatus,
  feature: keyof Omit<PlanLimits, 'maxJobs' | 'aiGenerationsPerMonth'>
): boolean {
  const limits = getPlanLimits(status);
  return limits[feature];
}

export function checkJobLimit(status: SubscriptionStatus, currentJobCount: number): boolean {
  const limits = getPlanLimits(status);
  return currentJobCount < limits.maxJobs;
}

export function checkAIGenerationLimit(
  status: SubscriptionStatus,
  currentUsage: number
): { allowed: boolean; remaining: number; limit: number } {
  const limits = getPlanLimits(status);
  const remaining = Math.max(0, limits.aiGenerationsPerMonth - currentUsage);
  return {
    allowed: currentUsage < limits.aiGenerationsPerMonth,
    remaining,
    limit: limits.aiGenerationsPerMonth,
  };
}

export function getUpgradePlan(currentStatus: SubscriptionStatus): PlanType | null {
  switch (currentStatus) {
    case SubscriptionStatus.FREE:
    case SubscriptionStatus.CANCELED:
      return 'PRO';
    case SubscriptionStatus.PRO:
    case SubscriptionStatus.PAST_DUE:
      return 'POWER';
    default:
      return null;
  }
}

export const PLAN_FEATURES_COMPARISON = [
  { feature: 'Jobs tracked', free: '25', pro: 'Unlimited', power: 'Unlimited' },
  { feature: 'AI generations/month', free: '5', pro: '60', power: '200' },
  { feature: 'Match scoring', free: 'Basic', pro: 'Enhanced', power: 'Advanced' },
  { feature: 'Pipeline tracking', free: '✓', pro: '✓', power: '✓' },
  { feature: 'Email reminders', free: '—', pro: '✓', power: '✓' },
  { feature: 'Analytics', free: '—', pro: '✓', power: '✓' },
  { feature: 'Weekly summary', free: '—', pro: '—', power: '✓' },
  { feature: 'Score calibration', free: '—', pro: '—', power: '✓' },
  { feature: 'A/B testing insights', free: '—', pro: '—', power: '✓' },
];
