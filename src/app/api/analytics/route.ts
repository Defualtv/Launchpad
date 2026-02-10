import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { errorResponse, successResponse, createError, ErrorCodes } from '@/lib/errors';
import { startOfWeek, startOfMonth, subWeeks, subMonths } from 'date-fns';

// GET /api/analytics - Get user analytics
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return errorResponse(createError(ErrorCodes.UNAUTHORIZED, 'Unauthorized', 401));
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'month'; // week, month, all

    const now = new Date();
    let startDate: Date | undefined;
    
    switch (period) {
      case 'week':
        startDate = subWeeks(now, 1);
        break;
      case 'month':
        startDate = subMonths(now, 1);
        break;
      case '3months':
        startDate = subMonths(now, 3);
        break;
      default:
        startDate = undefined;
    }

    const dateFilter = startDate ? { createdAt: { gte: startDate } } : {};

    // Get jobs stats
    const [totalJobs, jobsThisPeriod, avgScore] = await Promise.all([
      prisma.job.count({
        where: { userId: session.user.id },
      }),
      prisma.job.count({
        where: {
          userId: session.user.id,
          ...dateFilter,
        },
      }),
      prisma.jobScore.aggregate({
        where: {
          job: { userId: session.user.id },
          ...dateFilter,
        },
        _avg: { overallScore: true },
      }),
    ]);

    // Pipeline stats
    const pipelineStats = await prisma.pipelineItem.groupBy({
      by: ['stage'],
      where: {
        job: { userId: session.user.id },
      },
      _count: true,
    });

    const pipelineByStage = pipelineStats.reduce(
      (acc, item) => {
        acc[item.stage] = item._count;
        return acc;
      },
      {} as Record<string, number>
    );

    // Applications over time
    const applicationsOverTime = await prisma.pipelineItem.groupBy({
      by: ['createdAt'],
      where: {
        job: { userId: session.user.id },
        ...(startDate && { createdAt: { gte: startDate } }),
      },
      _count: true,
    });

    // Feedback stats
    const feedbackStats = await prisma.feedback.groupBy({
      by: ['outcome'],
      where: {
        job: { userId: session.user.id },
        ...dateFilter,
      },
      _count: true,
    });

    const feedbackByOutcome = feedbackStats.reduce(
      (acc, item) => {
        acc[item.outcome] = item._count;
        return acc;
      },
      {} as Record<string, number>
    );

    // Score distribution
    const scores = await prisma.jobScore.findMany({
      where: {
        job: { userId: session.user.id },
        ...dateFilter,
      },
      select: { overallScore: true },
    });

    const scoreDistribution = {
      '90-100': scores.filter((s) => s.overallScore >= 90).length,
      '80-89': scores.filter((s) => s.overallScore >= 80 && s.overallScore < 90).length,
      '70-79': scores.filter((s) => s.overallScore >= 70 && s.overallScore < 80).length,
      '60-69': scores.filter((s) => s.overallScore >= 60 && s.overallScore < 70).length,
      'below-60': scores.filter((s) => s.overallScore < 60).length,
    };

    // AI usage stats
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const quotaUsage = await prisma.quotaUsage.findUnique({
      where: {
        userId_monthKey: {
          userId: session.user.id,
          monthKey: currentMonth,
        },
      },
    });

    // Kit generation stats
    const kitsGenerated = await prisma.applicationKit.count({
      where: {
        job: { userId: session.user.id },
        ...dateFilter,
      },
    });

    // Top skills in saved jobs
    const allScores = await prisma.jobScore.findMany({
      where: {
        job: { userId: session.user.id },
      },
      select: {
        breakdownJson: true,
      },
    });

    const skillFrequency: Record<string, { matched: number; missing: number }> = {};
    allScores.forEach((score) => {
      try {
        const breakdown = JSON.parse(score.breakdownJson);
        const matchedSkills = breakdown.matchedSkills || [];
        const missingSkills = breakdown.missingSkills || [];
        
        (matchedSkills as string[]).forEach((skill: string) => {
          if (!skillFrequency[skill]) skillFrequency[skill] = { matched: 0, missing: 0 };
          skillFrequency[skill].matched++;
        });
        (missingSkills as string[]).forEach((skill: string) => {
          if (!skillFrequency[skill]) skillFrequency[skill] = { matched: 0, missing: 0 };
          skillFrequency[skill].missing++;
        });
      } catch {
        // Skip scores with invalid JSON
      }
    });

    const topMatchedSkills = Object.entries(skillFrequency)
      .sort((a, b) => b[1].matched - a[1].matched)
      .slice(0, 10)
      .map(([skill, counts]) => ({ skill, ...counts }));

    const topMissingSkills = Object.entries(skillFrequency)
      .sort((a, b) => b[1].missing - a[1].missing)
      .slice(0, 10)
      .map(([skill, counts]) => ({ skill, ...counts }));

    // Response rate
    const appliedCount = pipelineByStage['APPLIED'] || 0;
    const interviewCount = pipelineByStage['INTERVIEWING'] || 0;
    const offerCount = pipelineByStage['OFFER'] || 0;
    const rejectedCount = pipelineByStage['REJECTED'] || 0;

    const responseRate = appliedCount > 0
      ? ((interviewCount + offerCount + rejectedCount) / appliedCount) * 100
      : 0;

    const interviewRate = appliedCount > 0
      ? ((interviewCount + offerCount) / appliedCount) * 100
      : 0;

    const offerRate = (interviewCount + offerCount) > 0
      ? (offerCount / (interviewCount + offerCount)) * 100
      : 0;

    return successResponse({
      period,
      overview: {
        totalJobs,
        jobsThisPeriod,
        avgScore: avgScore._avg.overallScore?.toFixed(1) || '0',
        kitsGenerated,
      },
      pipeline: {
        byStage: pipelineByStage,
        responseRate: responseRate.toFixed(1),
        interviewRate: interviewRate.toFixed(1),
        offerRate: offerRate.toFixed(1),
      },
      scores: {
        distribution: scoreDistribution,
      },
      feedback: {
        byOutcome: feedbackByOutcome,
      },
      skills: {
        topMatched: topMatchedSkills,
        topMissing: topMissingSkills,
      },
      usage: {
        aiGenerations: {
          used: quotaUsage?.aiGenerationsUsed || 0,
          monthKey: quotaUsage?.monthKey || currentMonth,
        },
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
