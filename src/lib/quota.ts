import { prisma } from '@/lib/prisma';
import { SubscriptionStatus } from '@prisma/client';
import { getMonthKey } from '@/lib/utils';
import { getPlanLimits, checkAIGenerationLimit, checkJobLimit } from '@/lib/plans';
import { createError, ErrorCodes } from '@/lib/errors';

export interface QuotaStatus {
  aiGenerations: {
    used: number;
    limit: number;
    remaining: number;
    allowed: boolean;
  };
  jobs: {
    count: number;
    limit: number;
    remaining: number;
    allowed: boolean;
  };
}

export async function getQuotaStatus(userId: string, subscriptionStatus: SubscriptionStatus): Promise<QuotaStatus> {
  const monthKey = getMonthKey();
  const limits = getPlanLimits(subscriptionStatus);

  // Get current usage
  const [quotaUsage, jobCount] = await Promise.all([
    prisma.quotaUsage.findUnique({
      where: { userId_monthKey: { userId, monthKey } },
    }),
    prisma.job.count({
      where: { userId, archived: false },
    }),
  ]);

  const aiUsed = quotaUsage?.aiGenerationsUsed || 0;
  const aiCheck = checkAIGenerationLimit(subscriptionStatus, aiUsed);
  const jobAllowed = checkJobLimit(subscriptionStatus, jobCount);

  return {
    aiGenerations: {
      used: aiUsed,
      limit: limits.aiGenerationsPerMonth,
      remaining: aiCheck.remaining,
      allowed: aiCheck.allowed,
    },
    jobs: {
      count: jobCount,
      limit: limits.maxJobs,
      remaining: limits.maxJobs === Infinity ? Infinity : limits.maxJobs - jobCount,
      allowed: jobAllowed,
    },
  };
}

export async function checkAndIncrementAIUsage(
  userId: string,
  subscriptionStatus: SubscriptionStatus
): Promise<void> {
  const monthKey = getMonthKey();
  
  // Get current usage
  const quotaUsage = await prisma.quotaUsage.findUnique({
    where: { userId_monthKey: { userId, monthKey } },
  });

  const currentUsage = quotaUsage?.aiGenerationsUsed || 0;
  const { allowed, limit } = checkAIGenerationLimit(subscriptionStatus, currentUsage);

  if (!allowed) {
    throw createError(
      ErrorCodes.AI_GENERATION_LIMIT_EXCEEDED,
      `You've reached your limit of ${limit} AI generations this month. Upgrade your plan for more.`,
      403,
      { currentUsage, limit }
    );
  }

  // Increment usage
  await prisma.quotaUsage.upsert({
    where: { userId_monthKey: { userId, monthKey } },
    update: {
      aiGenerationsUsed: { increment: 1 },
      updatedAt: new Date(),
    },
    create: {
      userId,
      monthKey,
      aiGenerationsUsed: 1,
      jobsCreated: 0,
    },
  });
}

export async function checkJobCreationAllowed(
  userId: string,
  subscriptionStatus: SubscriptionStatus
): Promise<void> {
  const limits = getPlanLimits(subscriptionStatus);
  
  const jobCount = await prisma.job.count({
    where: { userId, archived: false },
  });

  if (!checkJobLimit(subscriptionStatus, jobCount)) {
    throw createError(
      ErrorCodes.JOB_LIMIT_EXCEEDED,
      `You've reached your limit of ${limits.maxJobs} tracked jobs. Upgrade your plan or archive some jobs.`,
      403,
      { currentCount: jobCount, limit: limits.maxJobs }
    );
  }
}

export async function incrementJobCount(userId: string): Promise<void> {
  const monthKey = getMonthKey();
  
  await prisma.quotaUsage.upsert({
    where: { userId_monthKey: { userId, monthKey } },
    update: {
      jobsCreated: { increment: 1 },
      updatedAt: new Date(),
    },
    create: {
      userId,
      monthKey,
      aiGenerationsUsed: 0,
      jobsCreated: 1,
    },
  });
}

// Rate limiting for API endpoints
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; remaining: number; resetAt: Date } {
  const now = Date.now();
  const record = rateLimitMap.get(key);

  if (!record || record.resetAt <= now) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetAt: new Date(now + windowMs),
    };
  }

  if (record.count >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: new Date(record.resetAt),
    };
  }

  record.count++;
  return {
    allowed: true,
    remaining: maxRequests - record.count,
    resetAt: new Date(record.resetAt),
  };
}

// Clean up old rate limit entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitMap.entries()) {
    if (record.resetAt <= now) {
      rateLimitMap.delete(key);
    }
  }
}, 60000); // Clean up every minute
